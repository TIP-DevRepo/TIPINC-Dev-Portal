const PRIORITY_COLORS = {
  High: { color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
  Medium: { color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
  Low: { color: '#22c55e', bg: '#f0fdf4', border: '#bbf7d0' }
}

const CATEGORY_ICONS = {
  'New Feature': '✦',
  'Bug / Fix': '⚠',
  'UI Update': '◈',
  'Stats / Reporting': '▦',
  'Workflow Change': '⟳'
}

export default function RequestCard({ request, developers = [], apps = [], onClick, onContextMenu }) {
  const priority = PRIORITY_COLORS[request.priority] || PRIORITY_COLORS.Medium
  const assignedDev = developers.find(d => d.user_id === request.assigned_dev_id)
  const app = apps.find(a => a.id === request.app_id)

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div
      onClick={() => onClick && onClick(request)}
      onContextMenu={(e) => {
        e.preventDefault()
        onContextMenu && onContextMenu(e, request)
      }}
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '10px',
        padding: '14px',
        cursor: 'pointer',
        transition: 'box-shadow 0.15s, transform 0.1s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)'
        e.currentTarget.style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {/* Top Row — Category + Priority */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px'
      }}>
        <span style={{
          fontSize: '11px',
          color: '#6b7280',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          {CATEGORY_ICONS[request.category]} {request.category}
        </span>
        <span style={{
          fontSize: '10px',
          fontWeight: '700',
          padding: '2px 8px',
          borderRadius: '99px',
          backgroundColor: priority.bg,
          color: priority.color,
          border: `1px solid ${priority.border}`
        }}>
          {request.priority}
        </span>
      </div>

      {/* Title */}
      <p style={{
        fontSize: '13px',
        fontWeight: '700',
        color: '#111827',
        margin: '0 0 6px',
        lineHeight: '1.4',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden'
      }}>
        {request.title}
      </p>

      {/* Description Preview */}
      {request.description ? (
        <p style={{
          fontSize: '12px',
          color: '#6b7280',
          margin: '0 0 12px',
          lineHeight: '1.5',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {request.description}
        </p>
      ) : (
        <p style={{
          fontSize: '12px',
          color: '#d1d5db',
          margin: '0 0 12px',
          fontStyle: 'italic'
        }}>
          No description provided
        </p>
      )}

      {/* Divider */}
      <div style={{ height: '1px', backgroundColor: '#f3f4f6', marginBottom: '10px' }} />

      {/* App Badge */}
      {app && (
        <div style={{ marginBottom: '8px' }}>
          <span style={{
            fontSize: '10px',
            fontWeight: '600',
            color: '#6366f1',
            backgroundColor: '#6366f110',
            padding: '2px 8px',
            borderRadius: '4px'
          }}>
            {app.name}
          </span>
        </div>
      )}

      {/* Bottom Row — Assigned Dev + Date */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        {/* Assigned Dev or Unassigned */}
        {assignedDev ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              backgroundColor: assignedDev.role === 'SeniorDeveloper' ? '#f59e0b' : '#6366f1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '10px',
              fontWeight: '700',
              flexShrink: 0
            }}>
              {assignedDev.user_name?.[0] || assignedDev.user_email[0].toUpperCase()}
            </div>
            <span style={{ fontSize: '11px', color: '#374151', fontWeight: '600' }}>
              {assignedDev.user_name || assignedDev.user_email}
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              border: '1.5px dashed #d1d5db',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <span style={{ fontSize: '10px', color: '#d1d5db' }}>?</span>
            </div>
            <span style={{ fontSize: '11px', color: '#d1d5db', fontStyle: 'italic' }}>
              Unassigned
            </span>
          </div>
        )}

        {/* Date */}
        <span style={{ fontSize: '11px', color: '#9ca3af' }}>
          {formatDate(request.submitted_at)}
        </span>
      </div>
    </div>
  )
}