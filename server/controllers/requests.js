import pool from '../utils/db.js'

export async function getAllRequests(req, res) {
  try {
    const { app_id, status, category } = req.query
    let query = 'SELECT * FROM requests WHERE 1=1'
    const params = []

    if (app_id) {
      params.push(app_id)
      query += ` AND app_id = $${params.length}`
    }
    if (status) {
      params.push(status)
      query += ` AND status = $${params.length}`
    }
    if (category) {
      params.push(category)
      query += ` AND category = $${params.length}`
    }

    query += ' ORDER BY submitted_at DESC'
    const result = await pool.query(query, params)
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch requests', detail: err.message })
  }
}

export async function getRequestById(req, res) {
  try {
    const { id } = req.params
    const result = await pool.query('SELECT * FROM requests WHERE id = $1', [id])
    if (result.rows.length === 0) return res.status(404).json({ error: 'Request not found' })
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch request', detail: err.message })
  }
}

export async function createRequest(req, res) {
  try {
    const { app_id, client_id, location_id, user_id, category, priority, title, description } = req.body

    if (!app_id || !client_id || !category || !title) {
      return res.status(400).json({ error: 'app_id, client_id, category, and title are required' })
    }

    const locId = location_id && location_id !== 'null' ? location_id : null
    const usrId = user_id && user_id !== 'null' ? user_id : null

    // Write the request to the database
    const result = await pool.query(
      `INSERT INTO requests (app_id, client_id, location_id, user_id, category, priority, title, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [app_id, client_id, locId, usrId, category, priority || 'Medium', title, description]
    )

    const newRequest = result.rows[0]

    // Write to audit log
    await pool.query(
      `INSERT INTO audit_log (actor_id, actor_email, action, target_type, target_id, metadata, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        user_id || 'anonymous',
        null,
        'REQUEST_SUBMITTED',
        'request',
        newRequest.id,
        JSON.stringify({ category, priority, title, app_id, client_id }),
        req.ip
      ]
    )

    res.status(201).json(newRequest)
  } catch (err) {
    console.error('CREATE REQUEST ERROR:', err.message)
    res.status(500).json({ error: 'Failed to create request', detail: err.message })
  }
}

export async function updateRequestStatus(req, res) {
  try {
    const { id } = req.params
    const { status, assigned_dev_id, rejection_note } = req.body

    const validStatuses = ['Incoming', 'In Review', 'In Progress', 'Pending Approval', 'Deployed', 'Rejected']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' })
    }

    const result = await pool.query(
      `UPDATE requests SET status = $1, assigned_dev_id = COALESCE($2, assigned_dev_id),
       rejection_note = COALESCE($3, rejection_note), updated_at = now()
       WHERE id = $4 RETURNING *`,
      [status, assigned_dev_id, rejection_note, id]
    )

    if (result.rows.length === 0) return res.status(404).json({ error: 'Request not found' })

    const updated = result.rows[0]

    // Write status change to audit log
    await pool.query(
      `INSERT INTO audit_log (actor_id, action, target_type, target_id, metadata, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        assigned_dev_id || 'system',
        'REQUEST_STATUS_UPDATED',
        'request',
        id,
        JSON.stringify({ status, rejection_note }),
        req.ip
      ]
    )

    res.json(updated)
  } catch (err) {
    res.status(500).json({ error: 'Failed to update request', detail: err.message })
  }
}