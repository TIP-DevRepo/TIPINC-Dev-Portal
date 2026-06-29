import pool from '../utils/db.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import speakeasy from 'speakeasy'
import qrcode from 'qrcode'
import crypto from 'crypto'
import { sendInviteEmail } from '../utils/email.js'

const JWT_SECRET = process.env.JWT_SECRET || 'tipinc-dev-portal-secret'
const SESSION_HOURS = 24 * 365

// Login with email + password
export async function login(req, res) {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    const result = await pool.query(
      'SELECT * FROM portal_users WHERE email = $1 AND is_active = true',
      [email.toLowerCase()]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const user = result.rows[0]
    const passwordMatch = await bcrypt.compare(password, user.password_hash)

    if (!passwordMatch) {
      await pool.query(
        `INSERT INTO audit_log (actor_id, actor_email, action, target_type, target_id, metadata, ip_address)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [user.id, email, 'LOGIN_FAILED', 'portal_user', user.id, JSON.stringify({ reason: 'wrong_password' }), req.ip]
      )
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // If MFA is enabled, return a partial token
    if (user.mfa_enabled) {
      const mfaToken = jwt.sign(
        { userId: user.id, mfaPending: true },
        JWT_SECRET,
        { expiresIn: '5m' }
      )
      return res.json({ mfaRequired: true, mfaToken })
    }

    // Create session
    const session = await createSession(user.id, req.ip)

    await pool.query(
      'UPDATE portal_users SET last_login = now() WHERE id = $1',
      [user.id]
    )

    await pool.query(
      `INSERT INTO audit_log (actor_id, actor_email, action, target_type, target_id, metadata, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [user.id, email, 'LOGIN_SUCCESS', 'portal_user', user.id, JSON.stringify({}), req.ip]
    )

    res.json({
      token: session.token,
      user: sanitizeUser(user),
      mustChangePassword: user.must_change_password
    })
  } catch (err) {
    console.error('LOGIN ERROR:', err.message)
    res.status(500).json({ error: 'Login failed', detail: err.message })
  }
}

// Verify MFA code
export async function verifyMfa(req, res) {
  try {
    const { mfaToken, code } = req.body

    let decoded
    try {
      decoded = jwt.verify(mfaToken, JWT_SECRET)
    } catch {
      return res.status(401).json({ error: 'Invalid or expired MFA token' })
    }

    if (!decoded.mfaPending) {
      return res.status(401).json({ error: 'Invalid MFA token' })
    }

    const result = await pool.query(
      'SELECT * FROM portal_users WHERE id = $1',
      [decoded.userId]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' })
    }

    const user = result.rows[0]

    const verified = speakeasy.totp.verify({
      secret: user.mfa_secret,
      encoding: 'base32',
      token: code,
      window: 1
    })

    if (!verified) {
      // Check backup codes
      const backupResult = await pool.query(
        'SELECT * FROM mfa_backup_codes WHERE user_id = $1 AND code = $2 AND used = false',
        [user.id, code]
      )

      if (backupResult.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid verification code' })
      }

      await pool.query(
        'UPDATE mfa_backup_codes SET used = true WHERE id = $1',
        [backupResult.rows[0].id]
      )
    }

    const session = await createSession(user.id, req.ip)

    await pool.query(
      'UPDATE portal_users SET last_login = now() WHERE id = $1',
      [user.id]
    )

    res.json({
      token: session.token,
      user: sanitizeUser(user),
      mustChangePassword: user.must_change_password
    })
  } catch (err) {
    res.status(500).json({ error: 'MFA verification failed', detail: err.message })
  }
}

// Setup MFA — generate secret and QR code
export async function setupMfa(req, res) {
  try {
    const userId = req.portalUser.id

    const secret = speakeasy.generateSecret({
      name: `TIPINC Dev Portal (${req.portalUser.email})`
    })

    await pool.query(
      'UPDATE portal_users SET mfa_secret = $1 WHERE id = $2',
      [secret.base32, userId]
    )

    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url)

    res.json({ secret: secret.base32, qrCode: qrCodeUrl })
  } catch (err) {
    res.status(500).json({ error: 'Failed to setup MFA', detail: err.message })
  }
}

// Enable MFA after verifying code
export async function enableMfa(req, res) {
  try {
    const { code } = req.body
    const user = req.portalUser

    const verified = speakeasy.totp.verify({
      secret: user.mfa_secret,
      encoding: 'base32',
      token: code,
      window: 1
    })

    if (!verified) {
      return res.status(400).json({ error: 'Invalid verification code' })
    }

    // Generate backup codes
    const backupCodes = Array.from({ length: 8 }, () =>
      crypto.randomBytes(4).toString('hex').toUpperCase()
    )

    await pool.query(
      'UPDATE portal_users SET mfa_enabled = true WHERE id = $1',
      [user.id]
    )

    for (const code of backupCodes) {
      await pool.query(
        'INSERT INTO mfa_backup_codes (user_id, code) VALUES ($1, $2)',
        [user.id, code]
      )
    }

    await pool.query(
      `INSERT INTO audit_log (actor_id, action, target_type, target_id, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [user.id, 'MFA_ENABLED', 'portal_user', user.id, JSON.stringify({ email: user.email })]
    )

    res.json({ success: true, backupCodes })
  } catch (err) {
    res.status(500).json({ error: 'Failed to enable MFA', detail: err.message })
  }
}

// Get current user
export async function getMe(req, res) {
  res.json({ user: sanitizeUser(req.portalUser) })
}

// Change password
export async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body
    const user = req.portalUser

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' })
    }

    if (!user.must_change_password) {
      const match = await bcrypt.compare(currentPassword, user.password_hash)
      if (!match) {
        return res.status(401).json({ error: 'Current password is incorrect' })
      }
    }

    const hash = await bcrypt.hash(newPassword, 12)
    await pool.query(
      'UPDATE portal_users SET password_hash = $1, must_change_password = false WHERE id = $2',
      [hash, user.id]
    )

    await pool.query(
      `INSERT INTO audit_log (actor_id, action, target_type, target_id, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [user.id, 'PASSWORD_CHANGED', 'portal_user', user.id, JSON.stringify({ email: user.email })]
    )

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to change password', detail: err.message })
  }
}

// Logout
export async function logout(req, res) {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (token) {
      await pool.query('DELETE FROM portal_sessions WHERE token = $1', [token])
    }
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Logout failed' })
  }
}

// --- Admin functions (Senior Dev only) ---

// Invite a new user
export async function inviteUser(req, res) {
  try {
    const { email, name, role } = req.body
    if (!email) return res.status(400).json({ error: 'Email is required' })

    // Generate temporary password
    const tempPassword = crypto.randomBytes(8).toString('hex')
    const hash = await bcrypt.hash(tempPassword, 12)

    const result = await pool.query(
      `INSERT INTO portal_users (email, name, role, password_hash, must_change_password, invited_by)
       VALUES ($1, $2, $3, $4, true, $5)
       ON CONFLICT (email) DO NOTHING
       RETURNING *`,
      [email.toLowerCase(), name, role || 'Developer', hash, req.portalUser?.id || 'system']
    )

    if (result.rows.length === 0) {
      return res.status(409).json({ error: 'A user with this email already exists' })
    }

    // Also add to dev_roles for portal access
    await pool.query(
      `INSERT INTO dev_roles (user_id, user_email, user_name, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id) DO NOTHING`,
      [result.rows[0].id, email.toLowerCase(), name, role || 'Developer']
    )

    await pool.query(
      `INSERT INTO audit_log (actor_id, action, target_type, target_id, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.portalUser?.id || 'system', 'USER_INVITED', 'portal_user', result.rows[0].id, JSON.stringify({ email, role })]
    )

    // Send invite email
    await sendInviteEmail({
      to: email.toLowerCase(),
      name,
      tempPassword,
      role: role || 'Developer'
    })

    res.status(201).json({
      user: sanitizeUser(result.rows[0]),
      tempPassword
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to invite user', detail: err.message })
  }
}

// Get all users
export async function getAllUsers(req, res) {
  try {
    const result = await pool.query(
      'SELECT * FROM portal_users ORDER BY created_at DESC'
    )
    res.json(result.rows.map(sanitizeUser))
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users', detail: err.message })
  }
}

// Reset a user's password
export async function resetUserPassword(req, res) {
  try {
    const { userId } = req.params
    const tempPassword = crypto.randomBytes(8).toString('hex')
    const hash = await bcrypt.hash(tempPassword, 12)

    await pool.query(
      'UPDATE portal_users SET password_hash = $1, must_change_password = true WHERE id = $2',
      [hash, userId]
    )

    await pool.query(
      `INSERT INTO audit_log (actor_id, action, target_type, target_id, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.portalUser?.id || 'system', 'PASSWORD_RESET', 'portal_user', userId, JSON.stringify({})]
    )

    res.json({ tempPassword })
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset password', detail: err.message })
  }
}

// Reset a user's MFA
export async function resetUserMfa(req, res) {
  try {
    const { userId } = req.params

    await pool.query(
      'UPDATE portal_users SET mfa_enabled = false, mfa_secret = null WHERE id = $1',
      [userId]
    )

    await pool.query(
      'DELETE FROM mfa_backup_codes WHERE user_id = $1',
      [userId]
    )

    await pool.query(
      `INSERT INTO audit_log (actor_id, action, target_type, target_id, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.portalUser?.id || 'system', 'MFA_RESET', 'portal_user', userId, JSON.stringify({})]
    )

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset MFA', detail: err.message })
  }
}

// Deactivate user
export async function deactivateUser(req, res) {
  try {
    const { userId } = req.params

    await pool.query('DELETE FROM portal_users WHERE id = $1', [userId])
    await pool.query('DELETE FROM portal_sessions WHERE user_id = $1', [userId])
    await pool.query('DELETE FROM dev_roles WHERE user_id = $1', [userId])
    await pool.query('DELETE FROM app_assignments WHERE user_id = $1', [userId])

    await pool.query(
      `INSERT INTO audit_log (actor_id, action, target_type, target_id, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.portalUser?.id || 'system', 'USER_DELETED', 'portal_user', userId, JSON.stringify({})]
    )

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user', detail: err.message })
  }
}

// --- Helpers ---

async function createSession(userId, ipAddress) {
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + SESSION_HOURS * 60 * 60 * 1000)

  await pool.query(
    `INSERT INTO portal_sessions (user_id, token, expires_at, ip_address)
     VALUES ($1, $2, $3, $4)`,
    [userId, token, expiresAt, ipAddress]
  )

  return { token, expiresAt }
}

function sanitizeUser(user) {
  const { password_hash, mfa_secret, ...safe } = user
  return safe
}