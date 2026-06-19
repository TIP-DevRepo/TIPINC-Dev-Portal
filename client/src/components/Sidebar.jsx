import { useState } from 'react'

const NAV_ITEMS = [
  {
    id: 'board',
    label: 'Kanban Board',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="18" rx="1"/>
        <rect x="14" y="3" width="7" height="10" rx="1"/>
        <rect x="14" y="17" width="7" height="4" rx="1"/>
      </svg>
    )
  },
  {
    id: 'versions',
    label: 'Version History',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    )
  },
  {
    id: 'audit',
    label: 'Audit Log',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    )
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
      </svg>
    )
  }
]

export default function Sidebar({ activePage, onNavigate }) {
  return (
    <div style={{
      width: '220px',
      minWidth: '220px',
      backgroundColor: '#1a1d27',
      borderRight: '1px solid #2d3148',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0
    }}>
      {/* Logo */}
      <div style={{
        padding: '20px 20px 16px',
        borderBottom: '1px solid #2d3148'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            backgroundColor: '#6366f1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="18" rx="1"/>
              <rect x="14" y="3" width="7" height="10" rx="1"/>
            </svg>
          </div>
          <div>
            <p style={{ fontSize: '13px', fontWeight: '700', color: '#ffffff', margin: 0, lineHeight: 1.2 }}>
              TIPINC
            </p>
            <p style={{ fontSize: '11px', color: '#6b7280', margin: 0, lineHeight: 1.2 }}>
              Dev Portal
            </p>
          </div>
        </div>
      </div>

      {/* Nav Items */}
      <nav style={{ flex: 1, padding: '12px 10px' }}>
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => !item.disabled && onNavigate && onNavigate(item.id)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '9px 12px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activePage === item.id ? '#6366f115' : 'transparent',
              color: item.disabled
                ? '#3d4468'
                : activePage === item.id
                ? '#6366f1'
                : '#9ca3af',
              fontSize: '13px',
              fontWeight: '600',
              cursor: item.disabled ? 'default' : 'pointer',
              textAlign: 'left',
              marginBottom: '2px',
              transition: 'all 0.15s'
            }}
          >
            {item.icon}
            {item.label}
            {item.disabled && (
              <span style={{
                marginLeft: 'auto',
                fontSize: '10px',
                color: '#3d4468',
                fontWeight: '600',
                backgroundColor: '#2d3148',
                padding: '2px 6px',
                borderRadius: '4px'
              }}>
                Soon
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div style={{
        padding: '16px 20px',
        borderTop: '1px solid #2d3148'
      }}>
        <span style={{
          fontSize: '11px',
          color: '#3d4468',
          fontWeight: '600'
        }}>
          v0.2.05
        </span>
      </div>
    </div>
  )
}