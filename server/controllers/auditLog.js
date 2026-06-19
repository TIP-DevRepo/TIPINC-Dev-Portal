import pool from '../utils/db.js'

export async function getAuditLog(req, res) {
  try {
    const { limit = 100, offset = 0, action, actor_id } = req.query
    let query = 'SELECT * FROM audit_log WHERE 1=1'
    const params = []

    if (action) {
      params.push(action)
      query += ` AND action = $${params.length}`
    }
    if (actor_id) {
      params.push(actor_id)
      query += ` AND actor_id = $${params.length}`
    }

    query += ` ORDER BY logged_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(parseInt(limit), parseInt(offset))

    const result = await pool.query(query, params)

    const countResult = await pool.query('SELECT COUNT(*) FROM audit_log')
    const total = parseInt(countResult.rows[0].count)

    res.json({ entries: result.rows, total, limit: parseInt(limit), offset: parseInt(offset) })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch audit log', detail: err.message })
  }
}