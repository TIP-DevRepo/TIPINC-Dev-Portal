import { useState, useEffect } from 'react'
import { assignRequest, getDevelopers, unassignRequest } from '../utils/api'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const PRIORITY_COLORS = {
  High: { color: '#ef4444', bg: '#fef2f2' },
  Medium: { color: '#f59e0b', bg: '#fffbeb' },
  Low: { color: '#22c55e', bg: '#f0fdf4' }
}

const CATEGORY_ICONS = {
  'New Feature': '✦',
  'Bug / Fix': '⚠',
  'UI Update': '◈',
  'Stats / Reporting': '▦',
  'Workflow Change': '⟳'
}

export default function RequestModal({ request, onClose, onUpdate }) {
  if (!request) return null

  const priority = PRIORITY_COLORS[request.priority] || PRIORITY_COLORS.Medium
  const [developers, setDevelopers] = useState([])
  const [assigning, setAssigning] = useState(false)
  const [assignError, setAssignError] = useState(null)
  const [assigned, setAssigned] = useState(request.assigned_dev_id || null)
  const [notes, setNotes] = useState([])
  const [newNote, setNewNote] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [addingNote, setAddingNote] = useState(false)

  useEffect(() => {
    fetchDevelopers()
    fetchNotes()
  }, [])

  async function fetchDevelopers() {
    try {
      const data = await getDevelopers()
      setDevelopers(data)
    } catch (err) {
      console.error('Failed to fetch developers:', err)
    }
  }

  async function fetchNotes() {
    try {
      const res = await fetch(`${API}/api/notes/${request.id}`)
      const data = await res.json()
      setNotes(data)
    } catch (err) {
      console.error('Failed to fetch notes:', err)
    }
  }

  async function handleAssign(devId, devName) {
    try {
      setAssigning(true)
      setAssignError(null)
      const updated = await assignRequest(request.id, devId, devName)
      setAssigned(devId)
      if (onUpdate) onUpdate(updated)
    } catch (err) {
      setAssignError('Failed to assign developer')
    } finally {
      setAssigning(false)
    }
  }

  async function handleUnassign() {
    try {
      const updated = await unassignRequest(request.id)
      setAssigned(null)
      if (onUpdate) onUpdate(updated)
    } catch (err) {
      console.error('Failed to unassign:', err)
    }
  }

  async function handleAddNote() {
    if (!newNote.trim()) return
    try {
      setAddingNote(true)
      const res = await fetch(`${API}/api/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_id: request.id,
          author_id: 'dev-001',
          author_name: 'Louis',
          content: newNote,
          is_private: isPrivate
        })
      })
      const note = await res.json()
      setNotes(prev => [...prev, note])
      setNewNote('')
    } catch (err) {
      console.error('Failed to add note:', err)
    } finally {
      setAddingNote(false)
    }
  }

  async function handleDeleteNote(id) {
    await fetch(`${API}/api/notes/${id}`, { method: 'DELETE' })
    setNotes(prev => prev.filter(n => n.id !== id))
  }

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const assignedDev = developers.find(d => d.user_id === assigned)

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 100
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '28px',
        width: '100%',
        maxWidth: '500px',
        zIndex: 101,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        maxHeight: '85vh',
        overflowY: 'auto'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div style={{ flex: 1, paddingRight: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', color: '#6b7280' }}>
                {CATEGORY_ICONS[request.category]} {request.category}
              </span>
              <span style={{
                fontSize: '11px',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: '99px',
                backgroundColor: priority.bg,
                color: priority.color
              }}>
                {request.priority}
              </span>
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', margin: 0 }}>
              {request.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              color: '#9ca3af',
              cursor: 'pointer',
              padding: '0',
              lineHeight: 1,
              flexShrink: 0
            }}
          >
            ✕
          </button>
        </div>

        {/* Description */}
        {request.description && (
          <div style={{ marginBottom: '20px' }}>
            <p style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Description
            </p>
            <p style={{ fontSize: '14px', color: '#374151', lineHeight: '1.6', margin: 0 }}>
              {request.description}
            </p>
          </div>
        )}

        {/* Rejection Note */}
        {request.rejection_note && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '10px',
            padding: '14px',
            marginBottom: '20px'
          }}>
            <p style={{ fontSize: '12px', fontWeight: '700', color: '#dc2626', marginBottom: '4px' }}>
              Rejection Note
            </p>
            <p style={{ fontSize: '13px', color: '#dc2626', margin: 0 }}>
              {request.rejection_note}
            </p>
          </div>
        )}

        {/* Dev Assignment */}
        <div style={{
          backgroundColor: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '10px',
          padding: '16px',
          marginBottom: '20px'
        }}>
          <p style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Assigned Developer
          </p>

          {assignedDev ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: assignedDev.role === 'SeniorDeveloper' ? '#f59e0b' : '#6366f1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: '700'
                }}>
                  {assignedDev.user_name?.[0] || assignedDev.user_email[0].toUpperCase()}
                </div>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: '600', color: '#111827', margin: 0 }}>
                    {assignedDev.user_name || assignedDev.user_email}
                  </p>
                  <p style={{ fontSize: '11px', color: '#6b7280', margin: 0 }}>
                    {assignedDev.role}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setAssigned(null)}
                  style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    background: 'none',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    cursor: 'pointer'
                  }}
                >
                  Change
                </button>
                <button
                  onClick={handleUnassign}
                  style={{
                    fontSize: '12px',
                    color: '#ef4444',
                    background: 'none',
                    border: '1px solid #fecaca',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    cursor: 'pointer'
                  }}
                >
                  Unassign
                </button>
              </div>
            </div>
          ) : (
            <div>
              {developers.length === 0 ? (
                <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>
                  No developers have been assigned roles yet.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {developers.map(dev => (
                    <button
                      key={dev.user_id}
                      onClick={() => handleAssign(dev.user_id, dev.user_name || dev.user_email)}
                      disabled={assigning}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 12px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        width: '100%',
                        opacity: assigning ? 0.6 : 1
                      }}
                    >
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: dev.role === 'SeniorDeveloper' ? '#f59e0b' : '#6366f1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: '12px',
                        fontWeight: '700',
                        flexShrink: 0
                      }}>
                        {dev.user_name?.[0] || dev.user_email[0].toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: '600', color: '#111827', margin: 0 }}>
                          {dev.user_name || dev.user_email}
                        </p>
                        <p style={{ fontSize: '11px', color: '#6b7280', margin: 0 }}>
                          {dev.role}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {assignError && (
                <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '8px' }}>
                  {assignError}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Notes */}
        <div style={{
          backgroundColor: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '10px',
          padding: '16px',
          marginBottom: '20px'
        }}>
          <p style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Notes
          </p>

          {notes.length === 0 ? (
            <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '12px' }}>No notes yet.</p>
          ) : (
            <div style={{ marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {notes.map(note => (
                <div key={note.id} style={{
                  backgroundColor: note.is_private ? '#fffbeb' : '#ffffff',
                  border: `1px solid ${note.is_private ? '#fde68a' : '#e5e7eb'}`,
                  borderRadius: '8px',
                  padding: '10px 12px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: '#374151' }}>
                        {note.author_name}
                      </span>
                      {note.is_private && (
                        <span style={{ fontSize: '10px', fontWeight: '700', color: '#b45309', backgroundColor: '#fef3c7', padding: '1px 6px', borderRadius: '99px' }}>
                          Private
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                        {new Date(note.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '14px', padding: 0 }}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  <p style={{ fontSize: '13px', color: '#374151', margin: 0, lineHeight: '1.5' }}>
                    {note.content}
                  </p>
                </div>
              ))}
            </div>
          )}

          <textarea
            value={newNote}
            onChange={e => setNewNote(e.target.value)}
            placeholder="Add a note..."
            rows={2}
            style={{
              width: '100%',
              padding: '8px 10px',
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '13px',
              color: '#111827',
              resize: 'none',
              outline: 'none',
              boxSizing: 'border-box',
              fontFamily: 'Inter, system-ui, sans-serif',
              marginBottom: '8px'
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={e => setIsPrivate(e.target.checked)}
              />
              <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Private (dev only)</span>
            </label>
            <button
              onClick={handleAddNote}
              disabled={addingNote || !newNote.trim()}
              style={{
                padding: '6px 14px',
                backgroundColor: '#6366f1',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: addingNote || !newNote.trim() ? 'default' : 'pointer',
                opacity: addingNote || !newNote.trim() ? 0.6 : 1,
                fontFamily: 'Inter, system-ui, sans-serif'
              }}
            >
              Add note
            </button>
          </div>
        </div>

        {/* Details Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          backgroundColor: '#f9fafb',
          borderRadius: '10px',
          padding: '16px'
        }}>
          {[
            { label: 'Status', value: request.status },
            { label: 'Priority', value: request.priority },
            { label: 'Submitted', value: formatDate(request.submitted_at) },
            { label: 'Last Updated', value: formatDate(request.updated_at) }
          ].map(({ label, value }) => (
            <div key={label}>
              <p style={{ fontSize: '11px', fontWeight: '600', color: '#9ca3af', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {label}
              </p>
              <p style={{ fontSize: '13px', color: '#111827', fontWeight: '500', margin: 0 }}>
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}