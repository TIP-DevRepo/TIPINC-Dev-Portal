import { useState, useEffect } from 'react'
import { getChangelogsByApp } from '../utils/api'

const defaultTheme = {
  primaryColor: '#3b82f6',
  backgroundColor: '#ffffff',
  surfaceColor: '#f9fafb',
  borderColor: '#e5e7eb',
  textColor: '#111827',
  mutedTextColor: '#6b7280',
  fontFamily: 'Inter, system-ui, sans-serif',
  borderRadius: '12px'
}

export default function WhatsNew({ theme = {}, context = {} }) {
  const t = { ...defaultTheme, ...theme }
  const { appId, appName } = context

  const [changelogs, setChangelogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    if (!appId) return
    fetchChangelogs()
  }, [appId])

  async function fetchChangelogs() {
    try {
      setLoading(true)
      setError(null)
      const data = await getChangelogsByApp(appId)
      setChangelogs(data)
    } catch (err) {
      setError('Failed to load updates')
    } finally {
      setLoading(false)
    }
  }

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const styles = {
    wrapper: {
      backgroundColor: t.backgroundColor,
      fontFamily: t.fontFamily,
      color: t.textColor,
      borderRadius: t.borderRadius,
      padding: '24px',
      maxWidth: '520px',
      width: '100%',
      boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
      boxSizing: 'border-box'
    }
  }

  return (
    <div style={styles.wrapper}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>
            What's New
          </h2>
          <p style={{ fontSize: '13px', color: t.mutedTextColor, margin: '2px 0 0' }}>
            {appName ? `Latest updates for ${appName}` : 'Latest updates'}
          </p>
        </div>
        <button
          onClick={fetchChangelogs}
          style={{
            fontSize: '12px',
            color: t.primaryColor,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontFamily: t.fontFamily,
            fontWeight: '600'
          }}
        >
          ↻ Refresh
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <p style={{ textAlign: 'center', color: t.mutedTextColor, fontSize: '14px', padding: '32px 0' }}>
          Loading updates...
        </p>
      )}

      {/* Error */}
      {error && (
        <p style={{ textAlign: 'center', color: '#ef4444', fontSize: '14px', padding: '32px 0' }}>
          {error}
        </p>
      )}

      {/* Empty */}
      {!loading && !error && changelogs.length === 0 && (
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <p style={{ fontSize: '32px', marginBottom: '8px' }}>🎉</p>
          <p style={{ color: t.mutedTextColor, fontSize: '14px' }}>
            No updates yet — check back soon!
          </p>
        </div>
      )}

      {/* Changelog Entries */}
      {!loading && !error && changelogs.map((entry, index) => (
        <div
          key={entry.id}
          style={{
            borderBottom: index < changelogs.length - 1 ? `1px solid ${t.borderColor}` : 'none',
            paddingBottom: index < changelogs.length - 1 ? '16px' : 0,
            marginBottom: index < changelogs.length - 1 ? '16px' : 0
          }}
        >
          {/* Version + Date */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontSize: '12px',
                fontWeight: '700',
                color: t.primaryColor,
                backgroundColor: `${t.primaryColor}15`,
                padding: '2px 10px',
                borderRadius: '99px',
                fontFamily: 'monospace'
              }}>
                {entry.version}
              </span>
              {index === 0 && (
                <span style={{
                  fontSize: '10px',
                  fontWeight: '700',
                  color: '#16a34a',
                  backgroundColor: '#f0fdf4',
                  padding: '2px 8px',
                  borderRadius: '99px'
                }}>
                  Latest
                </span>
              )}
            </div>
            <span style={{ fontSize: '12px', color: t.mutedTextColor }}>
              {formatDate(entry.deployed_at)}
            </span>
          </div>

          {/* Summary */}
          <p style={{
            fontSize: '14px',
            color: t.textColor,
            lineHeight: '1.6',
            margin: '0 0 8px',
            display: expanded === entry.id ? 'block' : '-webkit-box',
            WebkitLineClamp: expanded === entry.id ? 'unset' : 3,
            WebkitBoxOrient: 'vertical',
            overflow: expanded === entry.id ? 'visible' : 'hidden'
          }}>
            {entry.client_summary}
          </p>

          {/* Read More */}
          {entry.client_summary?.length > 150 && (
            <button
              onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}
              style={{
                fontSize: '12px',
                fontWeight: '600',
                color: t.primaryColor,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                fontFamily: t.fontFamily
              }}
            >
              {expanded === entry.id ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>
      ))}
    </div>
  )
}