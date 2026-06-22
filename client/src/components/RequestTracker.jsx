import { useState, useEffect, useRef } from 'react'
import { getRequestsByClient, getNotesByRequest } from '../utils/api'

const defaultTheme = {
  primaryColor: '#3b82f6',
  backgroundColor: '#ffffff',
  surfaceColor: '#f8fafc',
  borderColor: '#e2e8f0',
  textColor: '#0f172a',
  mutedTextColor: '#64748b',
  fontFamily: 'Inter, system-ui, sans-serif',
  borderRadius: '16px'
}

const STATUS_CONFIG = {
  'Incoming':         { label: 'Submitted',    color: '#64748b', bg: '#f1f5f9', step: 1 },
  'In Review':        { label: 'Submitted',    color: '#64748b', bg: '#f1f5f9', step: 1 },
  'In Progress':      { label: 'In progress',  color: '#7c3aed', bg: '#f5f3ff', step: 2 },
  'Pending Approval': { label: 'In progress',  color: '#7c3aed', bg: '#f5f3ff', step: 2 },
  'Deployed':         { label: 'Deployed',     color: '#16a34a', bg: '#f0fdf4', step: 3 },
  'Rejected':         { label: 'Not approved', color: '#dc2626', bg: '#fef2f2', step: 0 }
}

const CATEGORY_ICONS = {
  'New Feature': '✦', 'Bug / Fix': '⚠', 'UI Update': '◈',
  'Stats / Reporting': '▦', 'Workflow Change': '⟳'
}

const FILTERS = ['All', 'Submitted', 'In progress', 'Deployed']

function ProgressDots({ step }) {
  const steps = [
    { label: 'Submitted', s: 1 },
    { label: 'In progress', s: 2 },
    { label: 'Deployed', s: 3 }
  ]
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      {steps.map((st, i) => (
        <div key={st.label} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{
            width: step === 0 ? '6px' : step >= st.s ? '8px' : '6px',
            height: step === 0 ? '6px' : step >= st.s ? '8px' : '6px',
            borderRadius: '50%',
            backgroundColor: step === 0 ? '#dc2626' : step >= st.s ? '#16a34a' : '#e2e8f0',
            transition: 'all 0.2s'
          }} />
          {i < steps.length - 1 && (
            <div style={{ width: '16px', height: '2px', backgroundColor: step > st.s ? '#16a34a' : '#e2e8f0', borderRadius: '99px' }} />
          )}
        </div>
      ))}
    </div>
  )
}

function RequestCard({ request, theme: t }) {
  const [expanded, setExpanded] = useState(false)
  const [notes, setNotes] = useState([])
  const config = STATUS_CONFIG[request.status] || STATUS_CONFIG['Incoming']

  useEffect(() => {
    if (expanded && notes.length === 0) fetchNotes()
  }, [expanded])

  async function fetchNotes() {
    try {
      const data = await getNotesByRequest(request.id)
      setNotes(data.filter(n => !n.is_private))
    } catch (err) {
      console.error('Failed to fetch notes:', err)
    }
  }

  function formatDate(d) {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      style={{
        backgroundColor: t.surfaceColor,
        border: `1px solid ${t.borderColor}`,
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '8px',
        cursor: 'pointer',
        transition: 'box-shadow 0.15s'
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: '11px', color: t.mutedTextColor, fontWeight: '500' }}>
            {CATEGORY_ICONS[request.category]} {request.category}
          </span>
          <p style={{
            fontSize: '14px', fontWeight: '600', color: t.textColor,
            margin: '3px 0 8px', overflow: 'hidden', textOverflow: 'ellipsis',
            whiteSpace: expanded ? 'normal' : 'nowrap'
          }}>
            {request.title}
          </p>
          <ProgressDots step={config.step} />
        </div>
        <span style={{
          fontSize: '11px', fontWeight: '700', padding: '3px 10px',
          borderRadius: '99px', backgroundColor: config.bg, color: config.color,
          whiteSpace: 'nowrap', flexShrink: 0
        }}>
          {config.label}
        </span>
      </div>

      {expanded && (
        <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: `1px solid ${t.borderColor}` }}>
          {request.description && (
            <p style={{ fontSize: '13px', color: t.mutedTextColor, margin: '0 0 10px', lineHeight: '1.5' }}>
              {request.description}
            </p>
          )}
          {request.rejection_note && (
            <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 12px', marginBottom: '10px' }}>
              <p style={{ fontSize: '11px', fontWeight: '700', color: '#dc2626', margin: '0 0 3px' }}>Not approved</p>
              <p style={{ fontSize: '12px', color: '#dc2626', margin: 0 }}>{request.rejection_note}</p>
            </div>
          )}

          {/* Public Notes */}
          {notes.length > 0 && (
            <div style={{ marginBottom: '10px' }}>
              <p style={{ fontSize: '11px', fontWeight: '700', color: t.mutedTextColor, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Notes from the team
              </p>
              {notes.map(note => (
                <div key={note.id} style={{
                  backgroundColor: t.backgroundColor,
                  border: `1px solid ${t.borderColor}`,
                  borderRadius: '8px',
                  padding: '10px 12px',
                  marginBottom: '6px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: t.textColor }}>
                      {note.author_name}
                    </span>
                    <span style={{ fontSize: '11px', color: t.mutedTextColor }}>
                      {new Date(note.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: t.mutedTextColor, margin: 0, lineHeight: '1.5' }}>
                    {note.content}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', color: t.mutedTextColor }}>Priority: <strong>{request.priority}</strong></span>
            <span style={{ fontSize: '12px', color: t.mutedTextColor }}>{formatDate(request.submitted_at)}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default function RequestTracker({ theme = {}, context = {} }) {
  const t = { ...defaultTheme, ...theme }
  const { clientId } = context
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('All')
  const [lastUpdated, setLastUpdated] = useState(null)

  useEffect(() => {
    if (!clientId) return
    fetchRequests()
    const interval = setInterval(fetchRequests, 30000)
    return () => clearInterval(interval)
  }, [clientId])

  async function fetchRequests() {
    try {
      setError(null)
      const data = await getRequestsByClient(clientId)
      setRequests(data)
      setLastUpdated(new Date())
    } catch {
      setError('Failed to load requests')
    } finally {
      setLoading(false)
    }
  }

  const filtered = requests.filter(r => {
    if (filter === 'All') return true
    return STATUS_CONFIG[r.status]?.label === filter
  })

  return (
    <div style={{ backgroundColor: t.backgroundColor, fontFamily: t.fontFamily, borderRadius: t.borderRadius, padding: '24px', maxWidth: '520px', width: '100%', boxSizing: 'border-box' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: t.textColor, margin: '0 0 2px' }}>Your requests</h2>
          <p style={{ fontSize: '12px', color: t.mutedTextColor, margin: 0 }}>
            {requests.length} total
            {lastUpdated && ` · Updated ${lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`}
          </p>
        </div>
        <button onClick={fetchRequests} style={{ fontSize: '12px', color: t.primaryColor, background: 'none', border: 'none', cursor: 'pointer', fontFamily: t.fontFamily, fontWeight: '600', padding: 0 }}>
          ↻ Refresh
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              fontSize: '12px', fontWeight: '600', padding: '5px 12px',
              borderRadius: '99px',
              border: `1.5px solid ${filter === f ? t.primaryColor : t.borderColor}`,
              backgroundColor: filter === f ? `${t.primaryColor}10` : 'transparent',
              color: filter === f ? t.primaryColor : t.mutedTextColor,
              cursor: 'pointer', fontFamily: t.fontFamily
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {loading && <p style={{ textAlign: 'center', color: t.mutedTextColor, fontSize: '14px', padding: '24px 0' }}>Loading...</p>}
      {error && <p style={{ textAlign: 'center', color: '#ef4444', fontSize: '14px', padding: '24px 0' }}>{error}</p>}
      {!loading && !error && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <p style={{ fontSize: '24px', margin: '0 0 8px' }}>📭</p>
          <p style={{ color: t.mutedTextColor, fontSize: '14px', margin: 0 }}>
            {filter === 'All' ? 'No requests yet. Submit one to get started.' : `No ${filter.toLowerCase()} requests.`}
          </p>
        </div>
      )}
      {!loading && !error && filtered.map(r => (
        <RequestCard key={r.id} request={r} theme={t} />
      ))}
    </div>
  )
}