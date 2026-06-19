import pool from '../utils/db.js'
import { getNextVersion } from '../utils/versioning.js'

export async function createDeployment(req, res) {
  try {
    const {
      app_id,
      request_ids,
      update_type,
      internal_notes,
      client_summary,
      dev_id,
      approved_by
    } = req.body

    if (!app_id || !request_ids?.length || !internal_notes || !client_summary) {
      return res.status(400).json({
        error: 'app_id, request_ids, internal_notes, and client_summary are required'
      })
    }

    const validUpdateTypes = ['patch', 'minor', 'major']
    const updateType = validUpdateTypes.includes(update_type) ? update_type : 'patch'

    // Generate version number
    const versionNumber = await getNextVersion(app_id, updateType)

    // Create changelog entry
    const changelog = await pool.query(
      `INSERT INTO changelogs (app_id, version, dev_id, approved_by, internal_notes, client_summary)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [app_id, versionNumber, dev_id || 'system', approved_by || 'system', internal_notes, client_summary]
    )

    const changelogEntry = changelog.rows[0]

    // Create version record
    await pool.query(
      `INSERT INTO versions (app_id, version_number, label, changelog_id)
       VALUES ($1, $2, $3, $4)`,
      [app_id, versionNumber, updateType, changelogEntry.id]
    )

    // Move all selected requests to Deployed and link to changelog
    for (const requestId of request_ids) {
      await pool.query(
        `UPDATE requests SET 
         status = 'Deployed', 
         rejection_note = NULL,
         updated_at = now()
         WHERE id = $1`,
        [requestId]
      )
    }

    // Log to audit log
    await pool.query(
      `INSERT INTO audit_log (actor_id, action, target_type, target_id, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        approved_by || 'system',
        'DEPLOYMENT_CREATED',
        'changelog',
        changelogEntry.id,
        JSON.stringify({ versionNumber, updateType, request_ids, app_id })
      ]
    )

    res.status(201).json({
      changelog: changelogEntry,
      version: versionNumber,
      deployedRequests: request_ids.length
    })
  } catch (err) {
    console.error('CREATE DEPLOYMENT ERROR:', err.message)
    res.status(500).json({ error: 'Failed to create deployment', detail: err.message })
  }
}

export async function getChangelogs(req, res) {
  try {
    const { app_id } = req.query
    let query = 'SELECT * FROM changelogs'
    const params = []

    if (app_id) {
      params.push(app_id)
      query += ` WHERE app_id = $${params.length}`
    }

    query += ' ORDER BY deployed_at DESC'
    const result = await pool.query(query, params)
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch changelogs', detail: err.message })
  }
}

export async function getVersionHistory(req, res) {
  try {
    const { app_id } = req.query
    let query = `SELECT v.*, a.name as app_name FROM versions v
                 JOIN apps a ON v.app_id = a.id`
    const params = []

    if (app_id) {
      params.push(app_id)
      query += ` WHERE v.app_id = $${params.length}`
    }

    query += ' ORDER BY v.created_at DESC'
    const result = await pool.query(query, params)
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch version history', detail: err.message })
  }
}