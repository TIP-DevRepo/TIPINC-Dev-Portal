import pool from '../utils/db.js'
import { createNotification } from './notifications.js'

export async function getAllRequests(req, res) {
  try {
    const { app_id, status, category } = req.query
    let query
    let params = []

    if (req.user) {
      query = `SELECT r.* FROM requests r
               INNER JOIN app_assignments aa ON r.app_id = aa.app_id
               WHERE aa.user_id = $1`
      params.push(req.user.id)

      if (app_id) {
        params.push(app_id)
        query += ` AND r.app_id = $${params.length}`
      }
      if (status) {
        params.push(status)
        query += ` AND r.status = $${params.length}`
      }
      if (category) {
        params.push(category)
        query += ` AND r.category = $${params.length}`
      }
    } else {
      query = 'SELECT * FROM requests WHERE 1=1'

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
    }

    query += ' ORDER BY submitted_at DESC'
    const result = await pool.query(query, params)
    res.json(result.rows)
  } catch (err) {
    console.error('GET REQUESTS ERROR:', err.message)
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

    const result = await pool.query(
      `INSERT INTO requests (app_id, client_id, location_id, user_id, category, priority, title, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [app_id, client_id, locId, usrId, category, priority || 'Medium', title, description]
    )

    const newRequest = result.rows[0]

    // Audit log
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

    // Notify all devs assigned to this app
    const devResult = await pool.query(
      `SELECT dr.user_id FROM dev_roles dr
       INNER JOIN app_assignments aa ON dr.user_id = aa.user_id
       WHERE aa.app_id = $1`,
      [app_id]
    )
    for (const dev of devResult.rows) {
      await createNotification(
        dev.user_id,
        'NEW_REQUEST',
        'New request submitted',
        `${category}: ${title}`,
        newRequest.id
      )
    }

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
       rejection_note = CASE WHEN $1 = 'Deployed' THEN NULL ELSE COALESCE($3, rejection_note) END,
       updated_at = now()
       WHERE id = $4 RETURNING *`,
      [status, assigned_dev_id, rejection_note, id]
    )

    if (result.rows.length === 0) return res.status(404).json({ error: 'Request not found' })

    const updated = result.rows[0]

    // Audit log
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

    // Notify Senior Devs when card hits Pending Approval
    if (status === 'Pending Approval') {
      const seniorDevs = await pool.query(
        `SELECT user_id FROM dev_roles WHERE role = 'SeniorDeveloper'`
      )
      for (const dev of seniorDevs.rows) {
        await createNotification(
          dev.user_id,
          'PENDING_APPROVAL',
          'Card ready for approval',
          `A request is waiting for your review`,
          id
        )
      }
    }

    res.json(updated)
  } catch (err) {
    res.status(500).json({ error: 'Failed to update request', detail: err.message })
  }
}

export async function assignRequest(req, res) {
  try {
    const { id } = req.params
    const { assigned_dev_id, assigned_dev_name } = req.body

    if (!assigned_dev_id) {
      return res.status(400).json({ error: 'assigned_dev_id is required' })
    }

    const result = await pool.query(
      `UPDATE requests SET assigned_dev_id = $1, updated_at = now()
       WHERE id = $2 RETURNING *`,
      [assigned_dev_id, id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' })
    }

    // Audit log
    await pool.query(
      `INSERT INTO audit_log (actor_id, action, target_type, target_id, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        assigned_dev_id,
        'REQUEST_ASSIGNED',
        'request',
        id,
        JSON.stringify({ assigned_dev_id, assigned_dev_name })
      ]
    )

    // Notify the assigned dev
    await createNotification(
      assigned_dev_id,
      'ASSIGNED',
      'You have been assigned a request',
      `A request has been assigned to you`,
      id
    )

    res.json(result.rows[0])
  } catch (err) {
    console.error('ASSIGN REQUEST ERROR:', err.message)
    res.status(500).json({ error: 'Failed to assign request', detail: err.message })
  }
}

export async function deleteRequest(req, res) {
  try {
    const { id } = req.params

    const result = await pool.query(
      'DELETE FROM requests WHERE id = $1 RETURNING *',
      [id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' })
    }

    await pool.query(
      `INSERT INTO audit_log (actor_id, action, target_type, target_id, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      ['system', 'REQUEST_DELETED', 'request', id, JSON.stringify({ id })]
    )

    res.json({ message: 'Request deleted' })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete request', detail: err.message })
  }
}