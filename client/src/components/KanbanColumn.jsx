import { useState } from 'react'

const COLUMN_COLORS = {
  'Incoming': { accent: '#6b7280', bg: '#f9fafb', badge: '#e5e7eb', badgeText: '#374151' },
  'In Review': { accent: '#3b82f6', bg: '#eff6ff', badge: '#dbeafe', badgeText: '#1d4ed8' },
  'In Progress': { accent: '#9333ea', bg: '#faf5ff', badge: '#f3e8ff', badgeText: '#7e22ce' },
  'Pending Approval': { accent: '#f59e0b', bg: '#fffbeb', badge: '#fef3c7', badgeText: '#b45309' },
  'Deployed': { accent: '#16a34a', bg: '#f0fdf4', badge: '#dcfce7', badgeText: '#15803d' }
}

const CATEGORIES = ['New Feature', 'Bug / Fix', 'UI Update', 'Stats / Reporting', 'Workflow Change']
const CATEGORY_ICONS = {
  'New Feature': '✦',
  'Bug / Fix': '⚠',
  'UI Update': '◈',
  'Stats / Reporting': '▦',
  'Workflow Change': '⟳'
}
const PRIORITY_ORDER = { 'High': 1, 'Medium': 2, 'Low': 3 }

function ToggleSwitch({ value, onChange, accent }) {
  const isCat = value === 'category'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
      <span style={{
        fontSize: '11px',
        fontWeight: '600',
        color: !isCat ? accent : '#9ca3af',
        transition: 'color 0.2s'
      }}>
        Priority
      </span>
      <div
        onClick={() => onChange(isCat ? 'priority' : 'category')}
        style={{
          width: '36px',
          height: '19px',
          borderRadius: '99px',
          backgroundColor: accent,
          position: 'relative',
          cursor: 'pointer',
          flexShrink: 0
        }}
      >
        <div style={{
          width: '15px',
          height: '15px',
          borderRadius: '50%',
          backgroundColor: '#ffffff',
          position: 'absolute',
          top: '2px',
          left: isCat ? '19px' : '2px',
          transition: 'left 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
        }} />
      </div>
      <span style={{
        fontSize: '11px',
        fontWeight: '600',
        color: isCat ? accent : '#9ca3af',
        transition: 'color 0.2s'
      }}>
        Category
      </span>
    </div>
  )
}

export default function KanbanColumn({ title, cards = [], totalCards, renderCard, onDrop }) {
  const colors = COLUMN_COLORS[title] || COLUMN_COLORS['Incoming']
  const isIncoming = title === 'Incoming'

  const [sortBy, setSortBy] = useState('priority')
  const [sortDir, setSortDir] = useState('asc')

  function toggleDir() {
    setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')
  }

  function getSortedCards(cardsToSort) {
    return [...cardsToSort].sort((a, b) => {
      let comparison = 0
      if (sortBy === 'priority') {
        comparison = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
      }
      if (sortBy === 'category') {
        comparison = a.category.localeCompare(b.category)
      }
      return sortDir === 'asc' ? comparison : -comparison
    })
  }

  function getGroupedCards(cardsToGroup) {
    const orderedCats = sortDir === 'asc' ? CATEGORIES : [...CATEGORIES].reverse()
    const groups = {}
    orderedCats.forEach(cat => {
      const catCards = cardsToGroup.filter(c => c.category === cat)
      if (catCards.length > 0) groups[cat] = catCards
    })
    return groups
  }

  const showGrouped = sortBy === 'category'
  const sortedCards = getSortedCards(cards)
  const groupedCards = showGrouped ? getGroupedCards(cards) : null

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
          {totalCards !== undefined && totalCards !== cards.length
            ? `${cards.length}/${totalCards}`
            : cards.length}
        </span>
      </div>

      {/* Sort Controls */}
      <div style={{
        padding: '8px 12px',
        borderBottom: `1px solid ${colors.accent}20`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.bg
      }}>
        <ToggleSwitch
          value={sortBy}
          onChange={(val) => setSortBy(val)}
          accent={colors.accent}
        />
        <button
          onClick={toggleDir}
          style={{
            background: 'none',
            border: `1.5px solid ${colors.accent}`,
            borderRadius: '6px',
            color: colors.accent,
            fontSize: '13px',
            fontWeight: '700',
            width: '28px',
            height: '28px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s'
          }}
        >
          {sortDir === 'asc' ? '↑' : '↓'}
        </button>
      </div>

      {/* Cards Container */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          e.currentTarget.style.backgroundColor = `${colors.accent}15`
        }}
        onDragLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent'
        }}
        onDrop={(e) => {
          e.preventDefault()
          e.currentTarget.style.backgroundColor = 'transparent'
          const requestId = e.dataTransfer.getData('requestId')
          if (requestId && onDrop) onDrop(requestId, title)
        }}
        style={{
          flex: 1,
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          minHeight: '200px',
          maxHeight: 'calc(100vh - 280px)',
          overflowY: 'auto',
          transition: 'background-color 0.15s',
          borderRadius: '0 0 12px 12px'
        }}
      >
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
        ) : groupedCards ? (
          Object.entries(groupedCards).map(([category, catCards]) => (
            <div key={category}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '6px',
                marginTop: '4px'
              }}>
                <span style={{ fontSize: '11px', color: '#6b7280' }}>
                  {CATEGORY_ICONS[category]}
                </span>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  {category}
                </span>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }} />
                <span style={{ fontSize: '10px', color: '#9ca3af', fontWeight: '600' }}>
                  {catCards.length}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '8px' }}>
                {catCards.map(card => renderCard && renderCard(card))}
              </div>
            </div>
          ))
        ) : (
          sortedCards.map(card => renderCard && renderCard(card))
        )}
      </div>
    </div>
  )
}