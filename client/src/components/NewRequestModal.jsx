import { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const CATEGORIES = ['New Feature', 'Bug / Fix', 'UI Update', 'Stats / Reporting', 'Workflow Change']
const PRIORITIES = ['Low', 'Medium', 'High']
const STATUSES = ['Incoming', 'In Review', 'In Progress', 'Pending Approval']

export default function NewRequestModal({ apps: initialApps, onClose, onCreated }) {
  const [apps, setApps] = useState(initialApps || [])
  const [clients, setClients] = useState([])
  const [form, setForm] = useState({
    app_id: initialApps[0]?.id || '',
    client_id: '',
    category: '',
    priority: 'Medium',
    title: '',
    description: '',
    status: 'Incoming'
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  // New app/client inline states
  const [showNewApp, setShowNewApp] = useState(false)
  const [showNewClient, setShowNewClient] = useState(false)
  const [newAppName, setNewAppName] = useState('')
  const [newClientName, setNewClientName] = useState('')
  const [savingApp, setSavingApp] = useState(false)
  const [savingClient, setSavingClient] = useState(false)

  useEffect(() => {
    fetchClients()
  }, [])

  async function fetchClients() {
    try {
      const res = await fetch(`${API}/api/clients`)
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setClients(Array.isArray(data) ? data : [])
      if (data.length > 0) setForm(p => ({ ...p, client_id: data[0].id }))
    } catch (err) {
      console.error('Failed to fetch clients:', err)
      setClients([])
    }
  }

  async function handleAddApp(e) {
    e.preventDefault()
    if (!newAppName.trim()) return
    try {
      setSavingApp(true)
      const res = await fetch(`${API}/api/apps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newAppName.trim() })
      })
      if (!res.ok) throw new Error('Failed to create app')
      const newApp = await res.json()
      setApps(prev => [...prev, newApp])
      setForm(p => ({ ...p, app_id: newApp.id }))
      setNewAppName('')
      setShowNewApp(false)
    } catch (err) {
      console.error('Failed to add app:', err)
    } finally {
      setSavingApp(false)
    }
  }

  async function handleAddClient(e) {
    e.preventDefault()
    if (!newClientName.trim()) return
    try {
      setSavingClient(true)
      const res = await fetch(`${API}/api/clients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newClientName.trim() })
      })
      if (!res.ok) throw new Error('Failed to create client')
      const newClient = await res.json()
      setClients(prev => [...prev, newClient])
      setForm(p => ({ ...p, client_id: newClient.id }))
      setNewClientName('')
      setShowNewClient(false)
    } catch (err) {
      console.error('Failed to add client:', err)
    } finally {
      setSavingClient(false)
    }
  }

  function validate() {
    const e = {}
    if (!form.app_id) e.app_id = 'Required'
    if (!form.client_id) e.client_id = 'Required'
    if (!form.category) e.category = 'Required'
    if (!form.title.trim()) e.title = 'Required'
    return e
  }

  async function handleSubmit() {
    const v = validate()
    if (Object.keys(v).length > 0) { setErrors(v); return }
    try {
      setSubmitting(true)
      setError(null)
      const res = await fetch(`${API}/api/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, user_id: null })
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to create request')
      }
      const newRequest = await res.json()

      if (form.status !== 'Incoming') {
        await fetch(`${API}/api/requests/${newRequest.id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: form.status })
        })
      }

      if (onCreated) onCreated()
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '9px 12px',
    backgroundColor: '#0f1117',
    border: '1px solid #2d3148',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'Inter, system-ui, sans-serif'
  }

  const labelStyle = {
    display: 'block',
    fontSize: '11px',
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '6px'
  }

  const fieldStyle = { marginBottom: '16px' }

  const addNewStyle = {
    fontSize: '11px',
    fontWeight: '600',
    color: '#6366f1',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '2px 0',
    marginTop: '4px',
    fontFamily: 'Inter, system-ui, sans-serif'
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 200 }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: '#1a1d27',
        border: '1px solid #2d3148',
        borderRadius: '16px',
        padding: '28px',
        width: '100%',
        maxWidth: '480px',
        zIndex: 201,
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        maxHeight: '85vh',
        overflowY: 'auto'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff', margin: 0 }}>New Request</h2>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0' }}>Manually create a request card</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: '20px', cursor: 'pointer' }}>✕</button>
        </div>

        {/* App + Client */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div>
            <label style={labelStyle}>App <span style={{ color: '#ef4444' }}>*</span></label>
            {!showNewApp ? (
              <>
                <select
                  value={form.app_id}
                  onChange={e => setForm(p => ({ ...p, app_id: e.target.value }))}
                  style={inputStyle}
                >
                  <option value="">Select app...</option>
                  {apps.map(app => <option key={app.id} value={app.id}>{app.name}</option>)}
                </select>
                <button style={addNewStyle} onClick={() => setShowNewApp(true)}>+ Add new app</button>
              </>
            ) : (
              <form onSubmit={handleAddApp}>
                <input
                  autoFocus
                  placeholder="App name"
                  value={newAppName}
                  onChange={e => setNewAppName(e.target.value)}
                  style={{ ...inputStyle, marginBottom: '4px' }}
                />
                <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                  <button type="submit" disabled={savingApp} style={{ fontSize: '11px', fontWeight: '600', padding: '4px 10px', backgroundColor: '#6366f1', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                    {savingApp ? 'Saving...' : 'Save'}
                  </button>
                  <button type="button" onClick={() => { setShowNewApp(false); setNewAppName('') }} style={{ fontSize: '11px', fontWeight: '600', padding: '4px 10px', backgroundColor: 'transparent', color: '#6b7280', border: '1px solid #2d3148', borderRadius: '6px', cursor: 'pointer' }}>
                    Cancel
                  </button>
                </div>
              </form>
            )}
            {errors.app_id && <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>{errors.app_id}</p>}
          </div>

          <div>
            <label style={labelStyle}>Client <span style={{ color: '#ef4444' }}>*</span></label>
            {!showNewClient ? (
              <>
                <select
                  value={form.client_id}
                  onChange={e => setForm(p => ({ ...p, client_id: e.target.value }))}
                  style={inputStyle}
                >
                  <option value="">Select client...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button style={addNewStyle} onClick={() => setShowNewClient(true)}>+ Add new client</button>
              </>
            ) : (
              <form onSubmit={handleAddClient}>
                <input
                  autoFocus
                  placeholder="Client name"
                  value={newClientName}
                  onChange={e => setNewClientName(e.target.value)}
                  style={{ ...inputStyle, marginBottom: '4px' }}
                />
                <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                  <button type="submit" disabled={savingClient} style={{ fontSize: '11px', fontWeight: '600', padding: '4px 10px', backgroundColor: '#6366f1', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                    {savingClient ? 'Saving...' : 'Save'}
                  </button>
                  <button type="button" onClick={() => { setShowNewClient(false); setNewClientName('') }} style={{ fontSize: '11px', fontWeight: '600', padding: '4px 10px', backgroundColor: 'transparent', color: '#6b7280', border: '1px solid #2d3148', borderRadius: '6px', cursor: 'pointer' }}>
                    Cancel
                  </button>
                </div>
              </form>
            )}
            {errors.client_id && <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>{errors.client_id}</p>}
          </div>
        </div>

        {/* Category */}
        <div style={fieldStyle}>
          <label style={labelStyle}>Category <span style={{ color: '#ef4444' }}>*</span></label>
          <select
            value={form.category}
            onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
            style={{ ...inputStyle, borderColor: errors.category ? '#ef4444' : '#2d3148' }}
          >
            <option value="">Select category...</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {errors.category && <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>{errors.category}</p>}
        </div>

        {/* Priority */}
        <div style={fieldStyle}>
          <label style={labelStyle}>Priority</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {PRIORITIES.map(p => (
              <button
                key={p}
                onClick={() => setForm(prev => ({ ...prev, priority: p }))}
                style={{
                  flex: 1, padding: '8px', borderRadius: '8px',
                  border: `1.5px solid ${form.priority === p ? '#6366f1' : '#2d3148'}`,
                  backgroundColor: form.priority === p ? '#6366f120' : 'transparent',
                  color: form.priority === p ? '#6366f1' : '#6b7280',
                  fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                  fontFamily: 'Inter, system-ui, sans-serif'
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div style={fieldStyle}>
          <label style={labelStyle}>Title <span style={{ color: '#ef4444' }}>*</span></label>
          <input
            type="text"
            value={form.title}
            onChange={e => { setForm(p => ({ ...p, title: e.target.value })); setErrors(p => ({ ...p, title: undefined })) }}
            placeholder="Brief summary of the request"
            style={{ ...inputStyle, borderColor: errors.title ? '#ef4444' : '#2d3148' }}
          />
          {errors.title && <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>{errors.title}</p>}
        </div>

        {/* Description */}
        <div style={fieldStyle}>
          <label style={labelStyle}>Description <span style={{ fontSize: '11px', fontWeight: '400', color: '#6b7280' }}>(optional)</span></label>
          <textarea
            value={form.description}
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            placeholder="Additional details..."
            rows={3}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.5' }}
          />
        </div>

        {/* Initial Status */}
        <div style={fieldStyle}>
          <label style={labelStyle}>Place in column</label>
          <select
            value={form.status}
            onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
            style={inputStyle}
          >
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {error && <p style={{ fontSize: '12px', color: '#ef4444', marginBottom: '12px' }}>{error}</p>}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '10px', backgroundColor: 'transparent',
              border: '1px solid #2d3148', borderRadius: '8px', color: '#6b7280',
              fontSize: '13px', fontWeight: '600', cursor: 'pointer',
              fontFamily: 'Inter, system-ui, sans-serif'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              flex: 2, padding: '10px', backgroundColor: '#6366f1',
              border: 'none', borderRadius: '8px', color: '#ffffff',
              fontSize: '13px', fontWeight: '700',
              cursor: submitting ? 'default' : 'pointer',
              opacity: submitting ? 0.7 : 1,
              fontFamily: 'Inter, system-ui, sans-serif'
            }}
          >
            {submitting ? 'Creating...' : 'Create Request'}
          </button>
        </div>
      </div>
    </>
  )
}