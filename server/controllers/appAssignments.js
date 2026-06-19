import pool from '../utils/db.js'

export async function getAssignmentsByUser(req, res) {
  try {
    const { userId } = req.params
    const result = await pool.query(
      `SELECT aa.*, a.name as app_name, a.description as app_description
       FROM app_assignments aa
       JOIN apps a ON aa.app_id = a.id
       WHERE aa.user_id = $1`,
      [userId]
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch assignments', detail: err.message })
  }
}

export async function assignUserToApp(req, res) {
  try {
    const { user_id, app_id, assigned_by } = req.body
    if (!user_id || !app_id) {
      return res.status(400).json({ error: 'user_id and app_id are required' })
    }

    const result = await pool.query(
      `INSERT INTO app_assignments (user_id, app_id, assigned_by)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, app_id) DO NOTHING
       RETURNING *`,
      [user_id, app_id, assigned_by || 'system']
    )

    await pool.query(
      `INSERT INTO audit_log (actor_id, action, target_type, target_id, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        assigned_by || 'system',
        'APP_ACCESS_GRANTED',
        'app_assignment',
        app_id,
        JSON.stringify({ user_id, app_id })
      ]
    )

    res.status(201).json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Failed to assign user to app', detail: err.message })
  }
}

export async function removeUserFromApp(req, res) {
  try {
    const { user_id, app_id } = req.body
    if (!user_id || !app_id) {
      return res.status(400).json({ error: 'user_id and app_id are required' })
    }

    await pool.query(
      'DELETE FROM app_assignments WHERE user_id = $1 AND app_id = $2',
      [user_id, app_id]
    )

    await pool.query(
      `INSERT INTO audit_log (actor_id, action, target_type, target_id, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        'system',
        'APP_ACCESS_REVOKED',
        'app_assignment',
        app_id,
        JSON.stringify({ user_id, app_id })
      ]
    )

    res.json({ message: 'Access revoked' })
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove user from app', detail: err.message })
  }
}

export async function getAllAssignments(req, res) {
  try {
    const result = await pool.query(
      `SELECT aa.*, a.name as app_name
       FROM app_assignments aa
       JOIN apps a ON aa.app_id = a.id
       ORDER BY a.name ASC`
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch assignments', detail: err.message })
  }
}