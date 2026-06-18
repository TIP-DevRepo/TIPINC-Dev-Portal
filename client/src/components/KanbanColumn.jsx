const COLUMN_COLORS = {
  'Incoming': { accent: '#6b7280', bg: '#f9fafb', badge: '#e5e7eb', badgeText: '#374151' },
  'In Review': { accent: '#3b82f6', bg: '#eff6ff', badge: '#dbeafe', badgeText: '#1d4ed8' },
  'In Progress': { accent: '#9333ea', bg: '#faf5ff', badge: '#f3e8ff', badgeText: '#7e22ce' },
  'Pending Approval': { accent: '#f59e0b', bg: '#fffbeb', badge: '#fef3c7', badgeText: '#b45309' },
  'Deployed': { accent: '#16a34a', bg: '#f0fdf4', badge: '#dcfce7', badgeText: '#15803d' }
}

export default function KanbanColumn({ title, cards = [], children }) {
  const colors = COLUMN_COLORS[title] || COLUMN_COLORS['Incoming']

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minWidth: '280px',
      maxWidth: '280px',
      backgroundColor: colors.bg,
      borderRadius: '12px',
      overflow: 'hidden',
      border: `1px solid ${colors.accent}30`
    }}>
      {/* Column Header */}
      <div style={{
        padding: '14px 16px',
        borderBottom: `2px solid ${colors.accent}30`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.bg
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: colors.accent
          }} />
          <span style={{
            fontSize: '13px',
            fontWeight: '700',
            color: '#111827',
            letterSpacing: '0.02em'
          }}>
            {title}
          </span>
        </div>
        <span style={{
          fontSize: '12px',
          fontWeight: '700',
          padding: '2px 8px',
          borderRadius: '99px',
          backgroundColor: colors.badge,
          color: colors.badgeText
        }}>
          {cards.length}
        </span>
      </div>

      {/* Cards Container */}
      <div style={{
        flex: 1,
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        minHeight: '200px',
        maxHeight: 'calc(100vh - 220px)',
        overflowY: 'auto'
      }}>
        {cards.length === 0 ? (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px 0'
          }}>
            <p style={{ fontSize: '12px', color: '#9ca3af', textAlign: 'center' }}>
              No requests here
            </p>
          </div>
        ) : children}
      </div>
    </div>
  )
}