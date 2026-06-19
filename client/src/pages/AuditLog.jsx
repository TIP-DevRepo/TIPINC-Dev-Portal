import { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const ACTION_CONFIG = {
  REQUEST_SUBMITTED:      { color: '#3b82f6', icon: '📝' },
  REQUEST_STATUS_UPDATED: { color: '#6366f1', icon: '↗' },
  REQUEST_ASSIGNED:       { color: '#8b5cf6', icon: '👤' },
  REQUEST_DELETED:        { color: '#ef4444', icon: '🗑' },
  DEPLOYMENT_CREATED:     { color: '#16a34a', icon: '🚀' },
  ROLE_ASSIGNED:          { color: '#f59e0b', icon: '🔑' },
  ROLE_REMOVED:           { color: '#ef4444', icon: '🔒' },
  APP_ACCESS_GRANTED:     { color: '#16a34a', icon: '✓' },
  APP_ACCESS_REVOKED:     { color: '#ef4444', icon: '✕' },
  PRIORITY_FLAG_ENABLED:  { color: '#f59e0b', icon: '⚑' },
  PRIORITY_FLAG_DISABLED: { color: '#6b7280', icon: '⚑' },
}

const ACTION_FILTERS = [
  'All',
  'REQUEST_SUBMITTED',
  'REQUEST_STATUS_UPDATED',
  'REQUEST_ASSIGNED',
  'REQUEST_DELETED',
  'DEPLOYMENT_CREATED',
  'ROLE_ASSIGNED',
  'ROLE_REMOVED',
  'APP_ACCESS_GRANTED',
  'APP_ACCESS_REVOKED'
]

const PAGE_SIZE = 25

function getDescription(entry) {
  const m = entry.metadata || {}
  const actor = entry.actor_email || entry.actor_id || 'System'

  switch (entry.action) {
    case 'REQUEST_SUBMITTED':
      return {
        what: `New ${m.category || 'request'} submitted`,
        detail: m.title ? `"${m.title}"` : null,
        by: actor,
        priority: m.priority
      }
    case 'REQUEST_STATUS_UPDATED':
      return {
        what: `Request moved to ${m.status || 'new status'}`,
        detail: m.rejection_note ? `Rejection note: "${m.rejection_note}"` : null,
        by: actor
      }
    case 'REQUEST_ASSIGNED':
      return {
        what: `Request assigned to developer`,
        detail: m.assigned_dev_name || m.assigned_dev_id || null,
        by: actor
      }
    case 'REQUEST_DELETED':
      return {
        what: `Request permanently deleted`,
        detail: null,
        by: actor
      }
    case 'DEPLOYMENT_CREATED':
      return {
        what: `Deployment created`,
        detail: `${m.versionNumber || ''} · ${m.updateType || 'patch'} update · ${m.request_ids?.length || 0} request${m.request_ids?.length !== 1 ? 's' : ''} deployed`,
        by: actor
      }
    case 'ROLE_ASSIGNED':
      return {
        what: `Role assigned`,
        detail: `${m.user_email || m.user_id || 'User'} → ${m.role || 'Developer'}`,
        by: actor
      }
    case 'ROLE_REMOVED':
      return {
        what: `Developer role removed`,
        detail: m.user_id || null,
        by: actor
      }
    case 'APP_ACCESS_GRANTED':
      return {
        what: `App access granted`,
        detail: `User ${m.user_id || ''} → App ${m.app_id?.slice(0, 8) || ''}...`,
        by: actor
      }
    case 'APP_ACCESS_REVOKED':
      return {
        what: `App access revoked`,
        detail: `User ${m.user_id || ''} removed from app`,
        by: actor
      }
    case 'PRIORITY_FLAG_ENABLED':
      return {
        what: `Priority flag enabled`,
        detail: `User ${m.userId || ''} will now auto-submit as High priority`,
        by: actor
      }
    case 'PRIORITY_FLAG_DISABLED':
      return {
        what: `Priority flag disabled`,
        detail: null,
        by: actor
      }
    default:
      return {
        what: entry.action.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase()),
        detail: null,
        by: actor
      }
  }
}

function getActionLabel(action) {
  const labels = {
    REQUEST_SUBMITTED: 'Submitted',
    REQUEST_STATUS_UPDATED: 'Status Update',
    REQUEST_ASSIGNED: 'Assignment',
    REQUEST_DELETED: 'Deleted',
    DEPLOYMENT_CREATED: 'Deployment',
    ROLE_ASSIGNED: 'Role Change',
    ROLE_REMOVED: 'Role Removed',
    APP_ACCESS_GRANTED: 'Access Granted',
    APP_ACCESS_REVOKED: 'Access Revoked',
    PRIORITY_FLAG_ENABLED: 'Priority Flag On',
    PRIORITY_FLAG_DISABLED: 'Priority Flag Off',
  }
  return labels[action] || action
}

export default function AuditLog() {
  const [entries, setEntries] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [filterAction, setFilterAction] = useState('All')
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    fetchLog()
  }, [page, filterAction])

  async function fetchLog() {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE
      })
      if (filterAction !== 'All') params.append('action', filterAction)
      const res = await fetch(`${API}/api/audit-log?${params}`)
      const data = await res.json()
      setEntries(data.entries)
      setTotal(data.total)
    } catch (err) {
      console.error('Failed to fetch audit log:', err)
    } finally {
      setLoading(false)
    }
  }

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div style={{
      flex: 1,
      padding: '32px',
      fontFamily: 'Inter, system-ui, sans-serif',
      color: '#ffffff',
      overflowY: 'auto'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '700', margin: 0 }}>Audit Log</h1>
          <span style={{
            fontSize: '11px',
            fontWeight: '700',
            color: '#16a34a',
            border: '1px solid #16a34a40',
            padding: '2px 8px',
            borderRadius: '99px'
          }}>
            Tamper-proof
          </span>
        </div>
        <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
          {total.toLocaleString()} total entries — read only
        </p>
      </div>

      {/* Action Filter */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {ACTION_FILTERS.map(action => {
          const config = ACTION_CONFIG[action] || { color: '#6366f1' }
          const isActive = filterAction === action
          return (
            <button
              key={action}
              onClick={() => { setFilterAction(action); setPage(0) }}
              style={{
                fontSize: '11px',
                fontWeight: '600',
                padding: '4px 10px',
                borderRadius: '99px',
                border: `1.5px solid ${isActive ? config.color : '#2d3148'}`,
                backgroundColor: isActive ? `${config.color}20` : 'transparent',
                color: isActive ? config.color : '#6b7280',
                cursor: 'pointer'
              }}
            >
              {action === 'All' ? 'All' : getActionLabel(action)}
            </button>
          )
        })}
      </div>

      {/* Log Entries */}
      <div style={{
        backgroundColor: '#1a1d27',
        border: '1px solid #2d3148',
        borderRadius: '12px',
        overflow: 'hidden'
      }}>
        {loading && (
          <div style={{ padding: '32px', textAlign: 'center', color: '#6b7280' }}>
            Loading audit log...
          </div>
        )}

        {!loading && entries.length === 0 && (
          <div style={{ padding: '32px', textAlign: 'center', color: '#6b7280' }}>
            No entries found
          </div>
        )}

        {!loading && entries.map((entry, index) => {
          const config = ACTION_CONFIG[entry.action] || { color: '#6b7280', icon: '•' }
          const desc = getDescription(entry)
          const isExpanded = expandedId === entry.id
          const isLast = index === entries.length - 1

          return (
            <div key={entry.id}>
              <div
                onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '14px 20px',
                  borderBottom: isLast && !isExpanded ? 'none' : '1px solid #2d314830',
                  cursor: 'pointer',
                  backgroundColor: isExpanded ? '#0f111740' : 'transparent',
                  transition: 'background-color 0.1s'
                }}
                onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.backgroundColor = '#0f111730' }}
                onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                {/* Icon */}
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: `${config.color}15`,
                  border: `1px solid ${config.color}30`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  flexShrink: 0
                }}>
                  {config.icon}
                </div>

                {/* Main Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                    <span style={{
                      fontSize: '13px',
                      fontWeight: '700',
                      color: '#ffffff'
                    }}>
                      {desc.what}
                    </span>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: '700',
                      color: config.color,
                      backgroundColor: `${config.color}15`,
                      padding: '1px 7px',
                      borderRadius: '99px'
                    }}>
                      {getActionLabel(entry.action)}
                    </span>
                    {desc.priority && (
                      <span style={{
                        fontSize: '10px',
                        fontWeight: '700',
                        color: desc.priority === 'High' ? '#ef4444' : desc.priority === 'Medium' ? '#f59e0b' : '#22c55e',
                        backgroundColor: desc.priority === 'High' ? '#fef2f2' : desc.priority === 'Medium' ? '#fffbeb' : '#f0fdf4',
                        padding: '1px 7px',
                        borderRadius: '99px'
                      }}>
                        {desc.priority}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>
                      By <strong style={{ color: '#9ca3af' }}>{desc.by}</strong>
                    </span>
                    {desc.detail && (
                      <>
                        <span style={{ color: '#3d4468' }}>·</span>
                        <span style={{ fontSize: '12px', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {desc.detail}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Timestamp */}
                <span style={{ fontSize: '11px', color: '#3d4468', whiteSpace: 'nowrap', fontFamily: 'monospace', flexShrink: 0 }}>
                  {formatDate(entry.logged_at)}
                </span>
              </div>

              {/* Expanded Raw Data */}
              {isExpanded && (
                <div style={{
                  padding: '16px 20px',
                  backgroundColor: '#0f1117',
                  borderBottom: isLast ? 'none' : '1px solid #2d3148'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    {[
                      { label: 'Actor ID', value: entry.actor_id || 'system' },
                      { label: 'Target', value: `${entry.target_type} · ${entry.target_id || 'N/A'}` },
                      { label: 'IP Address', value: entry.ip_address || 'N/A' }
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 3px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {label}
                        </p>
                        <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0, fontFamily: 'monospace', wordBreak: 'break-all' }}>
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Raw Metadata
                  </p>
                  <pre style={{
                    fontSize: '12px',
                    color: '#9ca3af',
                    backgroundColor: '#1a1d27',
                    borderRadius: '8px',
                    padding: '12px',
                    margin: 0,
                    overflowX: 'auto',
                    fontFamily: 'monospace',
                    lineHeight: '1.5'
                  }}>
                    {JSON.stringify(entry.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px' }}>
          <span style={{ fontSize: '13px', color: '#6b7280' }}>
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total.toLocaleString()} entries
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              style={{
                padding: '6px 14px',
                backgroundColor: '#2d3148',
                border: '1px solid #3d4468',
                borderRadius: '8px',
                color: page === 0 ? '#3d4468' : '#ffffff',
                fontSize: '13px',
                cursor: page === 0 ? 'default' : 'pointer'
              }}
            >
              ← Prev
            </button>
            <span style={{ padding: '6px 14px', color: '#6b7280', fontSize: '13px' }}>
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              style={{
                padding: '6px 14px',
                backgroundColor: '#2d3148',
                border: '1px solid #3d4468',
                borderRadius: '8px',
                color: page >= totalPages - 1 ? '#3d4468' : '#ffffff',
                fontSize: '13px',
                cursor: page >= totalPages - 1 ? 'default' : 'pointer'
              }}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}