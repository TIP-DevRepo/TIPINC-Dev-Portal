import { useEffect, useRef, useState } from 'react'

const COLUMNS = ['Incoming', 'In Review', 'In Progress', 'Pending Approval', 'Deployed']

const MENU_ITEM_STYLE = {
  width: '100%',
  padding: '8px 14px',
  fontSize: '13px',
  fontWeight: '500',
  color: '#e2e8f0',
  backgroundColor: 'transparent',
  border: 'none',
  cursor: 'pointer',
  textAlign: 'left',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '8px',
  borderRadius: '6px',
  transition: 'background-color 0.1s'
}

export default function ContextMenu({
  x, y, request, developers, onClose,
  onAssign, onMove, onDelete
}) {
  const menuRef = useRef(null)
  const [activeSubmenu, setActiveSubmenu] = useState(null)
  const [menuPos, setMenuPos] = useState({ x, y })

  useEffect(() => {
    // Adjust position if menu goes off screen
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect()
      const newX = x + rect.width > window.innerWidth ? x - rect.width : x
      const newY = y + rect.height > window.innerHeight ? y - rect.height : y
      setMenuPos({ x: newX, y: newY })
    }
  }, [x, y])

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose()
      }
    }
    function handleEscape(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  const availableColumns = COLUMNS.filter(c => c !== request.status)

  function MenuItem({ icon, label, onClick, danger, hasSubmenu, submenuId }) {
    const isActive = activeSubmenu === submenuId
    return (
      <button
        onClick={onClick}
        onMouseEnter={() => submenuId ? setActiveSubmenu(submenuId) : setActiveSubmenu(null)}
        style={{
          ...MENU_ITEM_STYLE,
          color: danger ? '#f87171' : '#e2e8f0',
          backgroundColor: isActive ? '#2d3148' : 'transparent'
        }}
        onMouseOver={e => { if (!isActive) e.currentTarget.style.backgroundColor = '#2d3148' }}
        onMouseOut={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent' }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px' }}>{icon}</span>
          {label}
        </span>
        {hasSubmenu && <span style={{ color: '#6b7280', fontSize: '12px' }}>›</span>}
      </button>
    )
  }

  function Divider() {
    return <div style={{ height: '1px', backgroundColor: '#2d3148', margin: '4px 0' }} />
  }

  function SubMenu({ children }) {
    return (
      <div style={{
        padding: '4px',
        maxHeight: '200px',
        overflowY: 'auto'
      }}>
        {children}
      </div>
    )
  }

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        top: menuPos.y,
        left: menuPos.x,
        backgroundColor: '#1a1d27',
        border: '1px solid #2d3148',
        borderRadius: '10px',
        padding: '4px',
        minWidth: '200px',
        zIndex: 200,
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
      }}
    >
      {/* Request Title */}
      <div style={{
        padding: '8px 14px 6px',
        borderBottom: '1px solid #2d3148',
        marginBottom: '4px'
      }}>
        <p style={{
          fontSize: '11px',
          fontWeight: '700',
          color: '#6b7280',
          margin: 0,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {request.title}
        </p>
      </div>

      {/* Assign To */}
      <MenuItem
        icon="👤"
        label="Assign to..."
        hasSubmenu
        submenuId="assign"
        onClick={() => setActiveSubmenu(activeSubmenu === 'assign' ? null : 'assign')}
      />

      {activeSubmenu === 'assign' && (
        <SubMenu>
          {developers.length === 0 ? (
            <p style={{ fontSize: '12px', color: '#6b7280', padding: '6px 14px', margin: 0 }}>
              No developers available
            </p>
          ) : (
            developers.map(dev => (
              <button
                key={dev.user_id}
                onClick={() => { onAssign(request.id, dev.user_id, dev.user_name || dev.user_email); onClose() }}
                style={{
                  ...MENU_ITEM_STYLE,
                  padding: '6px 14px',
                  fontSize: '12px'
                }}
                onMouseOver={e => e.currentTarget.style.backgroundColor = '#2d3148'}
                onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    backgroundColor: dev.role === 'SeniorDeveloper' ? '#f59e0b' : '#6366f1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '10px',
                    fontWeight: '700',
                    flexShrink: 0
                  }}>
                    {dev.user_name?.[0] || dev.user_email[0].toUpperCase()}
                  </div>
                  <span>{dev.user_name || dev.user_email}</span>
                </span>
                {request.assigned_dev_id === dev.user_id && (
                  <span style={{ color: '#6366f1', fontSize: '12px' }}>✓</span>
                )}
              </button>
            ))
          )}
        </SubMenu>
      )}

      {/* Move To */}
      <MenuItem
        icon="↗"
        label="Move to..."
        hasSubmenu
        submenuId="move"
        onClick={() => setActiveSubmenu(activeSubmenu === 'move' ? null : 'move')}
      />

      {activeSubmenu === 'move' && (
        <SubMenu>
          {availableColumns.map(col => (
            <button
              key={col}
              onClick={() => { onMove(request.id, col); onClose() }}
              style={{
                ...MENU_ITEM_STYLE,
                padding: '6px 14px',
                fontSize: '12px'
              }}
              onMouseOver={e => e.currentTarget.style.backgroundColor = '#2d3148'}
              onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              {col}
            </button>
          ))}
        </SubMenu>
      )}

      <Divider />

      {/* Copy ID */}
      <MenuItem
        icon="📋"
        label="Copy request ID"
        onClick={() => {
          navigator.clipboard.writeText(request.id)
          onClose()
        }}
      />

      <Divider />

      {/* Delete */}
      <MenuItem
        icon="🗑"
        label="Delete request"
        danger
        onClick={() => { onDelete(request.id); onClose() }}
      />
    </div>
  )
}