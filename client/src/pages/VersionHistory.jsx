import { useState, useEffect } from 'react'
import { getVersionHistory, getChangelogs, getApps } from '../utils/api'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const UPDATE_TYPE_COLORS = {
  major: { color: '#ef4444', bg: '#fef2f2', label: 'Major' },
  minor: { color: '#6366f1', bg: '#eef2ff', label: 'Minor' },
  patch: { color: '#16a34a', bg: '#f0fdf4', label: 'Patch' }
}

export default function VersionHistory({ selectedApp }) {
  const [versions, setVersions] = useState([])
  const [changelogs, setChangelogs] = useState([])
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [filterApp, setFilterApp] = useState(selectedApp || 'all')

  useEffect(() => {
    fetchAll()
  }, [filterApp])

  async function fetchAll() {
    try {
      setLoading(true)
      const [versionData, changelogData, appData] = await Promise.all([
        getVersionHistory(filterApp !== 'all' ? filterApp : null),
        getChangelogs(filterApp !== 'all' ? filterApp : null),
        getApps()
      ])
      setVersions(versionData)
      setChangelogs(changelogData)
      setApps(appData)
    } catch (err) {
      console.error('Failed to fetch version history:', err)
    } finally {
      setLoading(false)
    }
  }

  function getChangelogForVersion(changelogId) {
    return changelogs.find(c => c.id === changelogId)
  }

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const typeConfig = (label) => UPDATE_TYPE_COLORS[label] || UPDATE_TYPE_COLORS.patch

  return (
    <div style={{
      flex: 1,
      padding: '32px',
      fontFamily: 'Inter, system-ui, sans-serif',
      color: '#ffffff',
      overflowY: 'auto'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', margin: '0 0 4px' }}>Version History</h1>
          <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
            {versions.length} deployment{versions.length !== 1 ? 's' : ''} recorded
          </p>
        </div>

        {/* App Filter */}
        <select
          value={filterApp}
          onChange={e => setFilterApp(e.target.value)}
          style={{
            backgroundColor: '#2d3148',
            border: '1px solid #3d4468',
            borderRadius: '8px',
            color: '#ffffff',
            fontSize: '13px',
            fontWeight: '600',
            padding: '8px 14px',
            cursor: 'pointer',
            outline: 'none'
          }}
        >
          <option value="all">All Apps</option>
          {apps.map(app => (
            <option key={app.id} value={app.id}>{app.name}</option>
          ))}
        </select>
      </div>

      {loading && (
        <p style={{ color: '#6b7280', fontSize: '14px' }}>Loading version history...</p>
      )}

      {!loading && versions.length === 0 && (
        <div style={{
          backgroundColor: '#1a1d27',
          border: '1px solid #2d3148',
          borderRadius: '12px',
          padding: '48px',
          textAlign: 'center'
        }}>
          <p style={{ fontSize: '32px', marginBottom: '8px' }}>🚀</p>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>
            No deployments yet. Create your first deployment from the Kanban board.
          </p>
        </div>
      )}

      {/* Version Timeline */}
      {!loading && versions.length > 0 && (
        <div style={{ position: 'relative' }}>
          {/* Timeline Line */}
          <div style={{
            position: 'absolute',
            left: '19px',
            top: '12px',
            bottom: '12px',
            width: '2px',
            backgroundColor: '#2d3148'
          }} />

          {versions.map((version, index) => {
            const changelog = getChangelogForVersion(version.changelog_id)
            const isExpanded = expanded === version.id
            const type = typeConfig(version.label)

            return (
              <div
                key={version.id}
                style={{
                  display: 'flex',
                  gap: '20px',
                  marginBottom: '16px',
                  position: 'relative'
                }}
              >
                {/* Timeline Dot */}
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: '#1a1d27',
                  border: `2px solid ${index === 0 ? '#6366f1' : '#2d3148'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  zIndex: 1
                }}>
                  <span style={{ fontSize: '14px' }}>
                    {index === 0 ? '🚀' : '📦'}
                  </span>
                </div>

                {/* Version Card */}
                <div style={{
                  flex: 1,
                  backgroundColor: '#1a1d27',
                  border: `1px solid ${index === 0 ? '#6366f140' : '#2d3148'}`,
                  borderRadius: '12px',
                  padding: '16px 20px',
                  marginBottom: '4px'
                }}>
                  {/* Top Row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        fontSize: '15px',
                        fontWeight: '700',
                        color: '#ffffff',
                        fontFamily: 'monospace'
                      }}>
                        {version.version_number}
                      </span>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: '700',
                        padding: '2px 8px',
                        borderRadius: '99px',
                        backgroundColor: type.bg,
                        color: type.color
                      }}>
                        {type.label}
                      </span>
                      {index === 0 && (
                        <span style={{
                          fontSize: '10px',
                          fontWeight: '700',
                          padding: '2px 8px',
                          borderRadius: '99px',
                          backgroundColor: '#6366f120',
                          color: '#6366f1'
                        }}>
                          Latest
                        </span>
                      )}
                      <span style={{
                        fontSize: '11px',
                        fontWeight: '600',
                        color: '#6366f1',
                        backgroundColor: '#6366f110',
                        padding: '2px 8px',
                        borderRadius: '4px'
                      }}>
                        {version.app_name}
                      </span>
                    </div>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>
                      {formatDate(version.created_at)}
                    </span>
                  </div>

                  {/* Client Summary */}
                  {changelog && (
                    <p style={{
                      fontSize: '13px',
                      color: '#9ca3af',
                      margin: '0 0 12px',
                      lineHeight: '1.5'
                    }}>
                      {changelog.client_summary}
                    </p>
                  )}

                  {/* Expand Button */}
                  <button
                    onClick={() => setExpanded(isExpanded ? null : version.id)}
                    style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#6b7280',
                      background: 'none',
                      border: '1px solid #2d3148',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      cursor: 'pointer',
                      fontFamily: 'Inter, system-ui, sans-serif'
                    }}
                  >
                    {isExpanded ? '▲ Hide details' : '▼ View details'}
                  </button>

                  {/* Expanded Details */}
                  {isExpanded && changelog && (
                    <div style={{
                      marginTop: '16px',
                      paddingTop: '16px',
                      borderTop: '1px solid #2d3148'
                    }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                        {[
                          { label: 'Developer', value: changelog.dev_id },
                          { label: 'Approved By', value: changelog.approved_by },
                          { label: 'Deployed', value: formatDate(changelog.deployed_at) },
                          { label: 'Version', value: changelog.version }
                        ].map(({ label, value }) => (
                          <div key={label}>
                            <p style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              {label}
                            </p>
                            <p style={{ fontSize: '13px', color: '#e2e8f0', fontWeight: '500', margin: 0 }}>
                              {value}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Internal Notes */}
                      <div style={{
                        backgroundColor: '#0f1117',
                        borderRadius: '8px',
                        padding: '12px 14px'
                      }}>
                        <p style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Internal Notes
                        </p>
                        <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0, lineHeight: '1.5' }}>
                          {changelog.internal_notes}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}