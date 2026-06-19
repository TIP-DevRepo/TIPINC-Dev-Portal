import { useState } from 'react'
import RequestForm from './RequestForm'
import RequestTracker from './RequestTracker'
import WhatsNew from './WhatsNew'

export default function TIPINCWidget({ theme = {}, context = {}, defaultTab = 'form' }) {
  const [activeTab, setActiveTab] = useState(defaultTab)

  const t = {
    primaryColor: '#3b82f6',
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    textColor: '#111827',
    mutedTextColor: '#6b7280',
    fontFamily: 'Inter, system-ui, sans-serif',
    borderRadius: '12px',
    ...theme
  }

  const tabs = [
    { id: 'form', label: 'Submit a Request' },
    { id: 'tracker', label: 'My Requests' },
    { id: 'whats-new', label: "What's New" }
  ]

  return (
    <div style={{
      fontFamily: t.fontFamily,
      width: '100%',
      maxWidth: '520px'
    }}>
      {/* Tab Bar */}
      <div style={{
        display: 'flex',
        borderBottom: `2px solid ${t.borderColor}`,
        backgroundColor: t.backgroundColor,
        borderRadius: `${t.borderRadius} ${t.borderRadius} 0 0`,
        overflow: 'hidden'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: '14px 10px',
              fontSize: '13px',
              fontWeight: '600',
              border: 'none',
              borderBottom: `2px solid ${activeTab === tab.id ? t.primaryColor : 'transparent'}`,
              backgroundColor: activeTab === tab.id ? `${t.primaryColor}08` : t.backgroundColor,
              color: activeTab === tab.id ? t.primaryColor : t.mutedTextColor,
              cursor: 'pointer',
              fontFamily: t.fontFamily,
              transition: 'all 0.15s',
              marginBottom: '-2px'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ borderRadius: `0 0 ${t.borderRadius} ${t.borderRadius}`, overflow: 'hidden' }}>
        {activeTab === 'form' && (
          <RequestForm
            theme={{ ...theme, borderRadius: `0 0 ${t.borderRadius} ${t.borderRadius}` }}
            context={context}
            onSubmit={() => setActiveTab('tracker')}
          />
        )}
        {activeTab === 'tracker' && (
          <RequestTracker
            theme={{ ...theme, borderRadius: `0 0 ${t.borderRadius} ${t.borderRadius}` }}
            context={context}
          />
        )}
        {activeTab === 'whats-new' && (
          <WhatsNew
            theme={{ ...theme, borderRadius: `0 0 ${t.borderRadius} ${t.borderRadius}` }}
            context={context}
          />
        )}
      </div>
    </div>
  )
}