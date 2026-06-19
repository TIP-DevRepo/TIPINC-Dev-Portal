import { useState } from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const UPDATE_TYPES = [
  { value: 'patch', label: 'Patch', description: 'Bug fixes and minor tweaks', example: 'v1.0.01 → v1.0.02' },
  { value: 'minor', label: 'Minor', description: 'New features or significant changes', example: 'v1.0.01 → v1.1.00' },
  { value: 'major', label: 'Major', description: 'Full release or major overhaul', example: 'v1.0.01 → v2.0.00' }
]

export default function DeploymentModal({ requests, appId, onClose, onDeployed }) {
  const [selectedIds, setSelectedIds] = useState(requests.map(r => r.id))
  const [updateType, setUpdateType] = useState('patch')
  const [internalNotes, setInternalNotes] = useState('')
  const [clientSummary, setClientSummary] = useState('')
  const [deploying, setDeploying] = useState(false)
  const [error, setError] = useState(null)
  const [rejectingId, setRejectingId] = useState(null)
  const [rejectionNotes, setRejectionNotes] = useState({})

  function toggleRequest(id) {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  async function handleDeploy() {
    if (selectedIds.length === 0) {
      setError('Select at least one request to deploy')
      return
    }
    if (!internalNotes.trim()) {
      setError('Internal notes are required')
      return
    }
    if (!clientSummary.trim()) {
      setError('Client-facing summary is required')
      return
    }

    try {
      setDeploying(true)
      setError(null)

      const res = await fetch(`${API}/api/deployments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app_id: appId,
          request_ids: selectedIds,
          update_type: updateType,
          internal_notes: internalNotes,
          client_summary: clientSummary,
          dev_id: 'dev-001',
          approved_by: 'dev-001'
        })
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Deployment failed')
      }

      const data = await res.json()
      if (onDeployed) onDeployed(data)
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setDeploying(false)
    }
  }

  async function handleReject(requestId) {
    const note = rejectionNotes[requestId]
    if (!note?.trim()) {
      setError('A rejection note is required')
      return
    }
    try {
      const res = await fetch(`${API}/api/requests/${requestId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'In Progress', rejection_note: note })
      })
      if (!res.ok) throw new Error('Failed to reject request')
      // Remove from list
      if (onDeployed) onDeployed({ rejected: true })
      onClose()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          zIndex: 200
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: '#1a1d27',
        border: '1px solid #2d3148',
        borderRadius: '16px',
        padding: '28px',
        width: '100%',
        maxWidth: '560px',
        zIndex: 201,
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        maxHeight: '85vh',
        overflowY: 'auto'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff', margin: 0 }}>
              Create Deployment
            </h2>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0' }}>
              Bundle and deploy Pending Approval requests
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#6b7280',
              fontSize: '20px',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        {/* Request Selection */}
        <div style={{ marginBottom: '24px' }}>
          <p style={{
            fontSize: '11px',
            fontWeight: '700',
            color: '#6b7280',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '10px'
          }}>
            Include in Deployment ({selectedIds.length} selected)
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {requests.map(request => (
              <div key={request.id}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 14px',
                    backgroundColor: selectedIds.includes(request.id) ? '#6366f115' : '#0f1117',
                    border: `1px solid ${rejectingId === request.id ? '#ef4444' : selectedIds.includes(request.id) ? '#6366f1' : '#2d3148'}`,
                    borderRadius: rejectingId === request.id ? '8px 8px 0 0' : '8px',
                    transition: 'all 0.15s'
                  }}
                >
                  {/* Checkbox */}
                  <div
                    onClick={() => rejectingId !== request.id && toggleRequest(request.id)}
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '4px',
                      border: `2px solid ${selectedIds.includes(request.id) ? '#6366f1' : '#3d4468'}`,
                      backgroundColor: selectedIds.includes(request.id) ? '#6366f1' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      cursor: rejectingId !== request.id ? 'pointer' : 'default'
                    }}
                  >
                    {selectedIds.includes(request.id) && (
                      <span style={{ color: '#fff', fontSize: '11px', fontWeight: '700' }}>✓</span>
                    )}
                  </div>

                  {/* Request Info */}
                  <div
                    style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
                    onClick={() => rejectingId !== request.id && toggleRequest(request.id)}
                  >
                    <p style={{ fontSize: '13px', fontWeight: '600', color: '#ffffff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {request.title}
                    </p>
                    <p style={{ fontSize: '11px', color: '#6b7280', margin: 0 }}>
                      {request.category}
                    </p>
                  </div>

                  {/* Reject Button */}
                  <button
                    onClick={() => {
                      setRejectingId(rejectingId === request.id ? null : request.id)
                      setSelectedIds(prev => prev.filter(id => id !== request.id))
                      setError(null)
                    }}
                    style={{
                      fontSize: '11px',
                      fontWeight: '600',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: '1px solid #ef444440',
                      backgroundColor: rejectingId === request.id ? '#ef444420' : 'transparent',
                      color: '#ef4444',
                      cursor: 'pointer',
                      flexShrink: 0
                    }}
                  >
                    {rejectingId === request.id ? 'Cancel' : 'Reject'}
                  </button>
                </div>

                {/* Rejection Note Input */}
                {rejectingId === request.id && (
                  <div style={{
                    backgroundColor: '#1a0a0a',
                    border: '1px solid #ef4444',
                    borderTop: 'none',
                    borderRadius: '0 0 8px 8px',
                    padding: '12px 14px'
                  }}>
                    <input
                      type="text"
                      placeholder="Rejection note (required)..."
                      value={rejectionNotes[request.id] || ''}
                      onChange={e => setRejectionNotes(prev => ({ ...prev, [request.id]: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '7px 10px',
                        backgroundColor: '#0f1117',
                        border: '1px solid #ef444440',
                        borderRadius: '6px',
                        color: '#ffffff',
                        fontSize: '12px',
                        outline: 'none',
                        boxSizing: 'border-box',
                        fontFamily: 'Inter, system-ui, sans-serif',
                        marginBottom: '8px'
                      }}
                    />
                    <button
                      onClick={() => handleReject(request.id)}
                      style={{
                        fontSize: '12px',
                        fontWeight: '700',
                        padding: '6px 14px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: '#ef4444',
                        color: '#ffffff',
                        cursor: 'pointer',
                        fontFamily: 'Inter, system-ui, sans-serif'
                      }}
                    >
                      Confirm Rejection
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Update Type */}
        <div style={{ marginBottom: '24px' }}>
          <p style={{
            fontSize: '11px',
            fontWeight: '700',
            color: '#6b7280',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '10px'
          }}>
            Update Type
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {UPDATE_TYPES.map(type => (
              <div
                key={type.value}
                onClick={() => setUpdateType(type.value)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  backgroundColor: updateType === type.value ? '#6366f115' : '#0f1117',
                  border: `1px solid ${updateType === type.value ? '#6366f1' : '#2d3148'}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    border: `2px solid ${updateType === type.value ? '#6366f1' : '#3d4468'}`,
                    backgroundColor: updateType === type.value ? '#6366f1' : 'transparent',
                    flexShrink: 0
                  }} />
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: '#ffffff', margin: 0 }}>
                      {type.label}
                    </p>
                    <p style={{ fontSize: '11px', color: '#6b7280', margin: 0 }}>
                      {type.description}
                    </p>
                  </div>
                </div>
                <span style={{
                  fontSize: '11px',
                  color: '#6b7280',
                  fontFamily: 'monospace',
                  backgroundColor: '#2d3148',
                  padding: '2px 8px',
                  borderRadius: '4px'
                }}>
                  {type.example}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Internal Notes */}
        <div style={{ marginBottom: '16px' }}>
          <p style={{
            fontSize: '11px',
            fontWeight: '700',
            color: '#6b7280',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '8px'
          }}>
            Internal Notes
          </p>
          <textarea
            value={internalNotes}
            onChange={e => setInternalNotes(e.target.value)}
            placeholder="Technical description of what was changed..."
            rows={3}
            style={{
              width: '100%',
              padding: '10px 12px',
              backgroundColor: '#0f1117',
              border: '1px solid #2d3148',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '13px',
              resize: 'vertical',
              outline: 'none',
              boxSizing: 'border-box',
              fontFamily: 'Inter, system-ui, sans-serif'
            }}
          />
        </div>

        {/* Client Summary */}
        <div style={{ marginBottom: '24px' }}>
          <p style={{
            fontSize: '11px',
            fontWeight: '700',
            color: '#6b7280',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '8px'
          }}>
            Client-Facing Summary (What's New)
          </p>
          <textarea
            value={clientSummary}
            onChange={e => setClientSummary(e.target.value)}
            placeholder="Plain-language summary shown to clients in the app..."
            rows={3}
            style={{
              width: '100%',
              padding: '10px 12px',
              backgroundColor: '#0f1117',
              border: '1px solid #2d3148',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '13px',
              resize: 'vertical',
              outline: 'none',
              boxSizing: 'border-box',
              fontFamily: 'Inter, system-ui, sans-serif'
            }}
          />
        </div>

        {error && (
          <p style={{ fontSize: '12px', color: '#ef4444', marginBottom: '16px' }}>
            {error}
          </p>
        )}

        {/* Deploy Button */}
        <button
          onClick={handleDeploy}
          disabled={deploying}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#16a34a',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '700',
            cursor: deploying ? 'default' : 'pointer',
            opacity: deploying ? 0.7 : 1,
            fontFamily: 'Inter, system-ui, sans-serif'
          }}
        >
          {deploying ? 'Deploying...' : `🚀 Deploy ${selectedIds.length} Request${selectedIds.length !== 1 ? 's' : ''}`}
        </button>
      </div>
    </>
  )
}