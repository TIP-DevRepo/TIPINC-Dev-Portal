import pool from '../utils/db.js'

export async function getNextVersion(appId, updateType = 'patch') {
  try {
    const result = await pool.query(
      `SELECT version_number FROM versions 
       WHERE app_id = $1 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [appId]
    )

    let major = 0, minor = 0, patch = 0

    if (result.rows.length > 0) {
      const last = result.rows[0].version_number
      const parts = last.replace('v', '').split('.')
      major = parseInt(parts[0]) || 0
      minor = parseInt(parts[1]) || 0
      patch = parseInt(parts[2]) || 0
    }

    if (updateType === 'major') {
      major += 1
      minor = 0
      patch = 0
    } else if (updateType === 'minor') {
      minor += 1
      patch = 0
    } else {
      patch += 1
    }

    const patchStr = patch.toString().padStart(2, '0')
    return `v${major}.${minor}.${patchStr}`
  } catch (err) {
    throw new Error(`Failed to generate version number: ${err.message}`)
  }
}