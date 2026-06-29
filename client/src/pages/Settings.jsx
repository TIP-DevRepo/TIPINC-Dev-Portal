import { useState, useEffect } from 'react'
import { getApps } from '../utils/api'
import { useAuth } from '../context/AuthContext'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const SECTION_STYLE = {
  backgroundColor: '#1a1d27',
  border: '1px solid #2d3148',
  borderRadius: '12px',
  padding: '24px',
  marginBottom: '24px'
}

const LABEL_STYLE = {
  fontSize: '11px',
  fontWeight: '700',
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: '16px',
  display: 'block'
}

const INPUT_STYLE = {
  backgroundColor: '#2d3148',
  border: '1px solid #3d4468',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '13px',
  padding: '8px 12px',
  outline: 'none',
  fontFamily: 'Inter, system-ui, sans-serif'
}

const BTN_PRIMARY = {
  backgroundColor: '#6366f1',
  border: 'none',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '13px',
  fontWeight: '600',
  padding: '8px 16px',
  cursor: 'pointer',
  fontFamily: 'Inter, system-ui, sans-serif'
}

const BTN_DANGER = {
  backgroundColor: 'transparent',
  border: '1px solid #ef444440',
  borderRadius: '8px',
  color: '#ef4444',
  fontSize: '12px',
  fontWeight: '600',
  padding: '5px 10px',
  cursor: 'pointer',
  fontFamily: 'Inter, system-ui, sans-serif'
}

const BTN_SECONDARY = {
  backgroundColor: 'transparent',
  border: '1px solid #3d4468',
  borderRadius: '8px',
  color: '#9ca3af',
  fontSize: '12px',
  fontWeight: '600',
  padding: '5px 10px',
  cursor: 'pointer',
  fontFamily: 'Inter, system-ui, sans-serif'
}

function UserManagement({ portalToken, apps }) {
  const authHeader = portalToken ? { 'Authorization': `Bearer ${portalToken}` } : {}
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [inviteForm, setInviteForm] = useState({ email: '', name: '', role: 'Developer', app_ids: [] })
  const [inviteResult, setInviteResult] = useState(null)
  const [inviteError, setInviteError] = useState(null)
  const [editingAccessUser, setEditingAccessUser] = useState(null)
  const [userAssignments, setUserAssignments] = useState([])

  useEffect(() => {
    if (portalToken) fetchUsers()
  }, [portalToken])

  async function fetchUsers() {
    try {
      const res = await fetch(`${API}/api/auth/users`, { headers: authHeader })
      if (!res.ok) return
      const data = await res.json()
      setUsers(data)
    } catch (err) {
      console.error('Failed to fetch users:', err)
    } finally {
      setLoading(false)
    }
  }

  async function fetchUserAssignments(userId) {
    try {
      const res = await fetch(`${API}/api/app-assignments/${userId}`)
      if (!res.ok) return []
      return await res.json()
    } catch {
      return []
    }
  }

  async function handleEditAccess(user) {
    const assignments = await fetchUserAssignments(user.id)
    setUserAssignments(assignments.map(a => a.app_id))
    setEditingAccessUser(user)
  }

  async function handleToggleAppAccess(userId, appId, currentlyAssigned) {
    try {
      if (currentlyAssigned) {
        await fetch(`${API}/api/app-assignments`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json', ...authHeader },
          body: JSON.stringify({ user_id: userId, app_id: appId })
        })
        setUserAssignments(prev => prev.filter(id => id !== appId))
      } else {
        await fetch(`${API}/api/app-assignments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeader },
          body: JSON.stringify({ user_id: userId, app_id: appId, assigned_by: 'admin' })
        })
        setUserAssignments(prev => [...prev, appId])
      }
    } catch (err) {
      console.error('Failed to toggle app access:', err)
    }
  }

  async function handleInvite(e) {
    e.preventDefault()
    setInviteError(null)
    setInviteResult(null)
    try {
      const res = await fetch(`${API}/api/auth/users/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({ email: inviteForm.email, name: inviteForm.name, role: inviteForm.role })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      // Assign selected apps
      for (const appId of inviteForm.app_ids) {
        await fetch(`${API}/api/app-assignments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeader },
          body: JSON.stringify({ user_id: data.user.id, app_id: appId, assigned_by: 'admin' })
        })
      }

      setInviteResult(data)
      setInviteForm({ email: '', name: '', role: 'Developer', app_ids: [] })
      fetchUsers()
    } catch (err) {
      setInviteError(err.message)
    }
  }

  async function handleResetPassword(userId) {
    if (!window.confirm("Reset this user's password?")) return
    try {
      const res = await fetch(`${API}/api/auth/users/${userId}/reset-password`, {
        method: 'PATCH',
        headers: authHeader
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      alert(`Temporary password: ${data.tempPassword}\n\nShare this with the user — they will be required to change it on next login.`)
    } catch (err) {
      alert('Failed to reset password: ' + err.message)
    }
  }

  async function handleResetMfa(userId) {
    if (!window.confirm('Reset MFA for this user?')) return
    try {
      await fetch(`${API}/api/auth/users/${userId}/reset-mfa`, { method: 'PATCH', headers: authHeader })
      fetchUsers()
    } catch (err) {
      console.error('Failed to reset MFA:', err)
    }
  }

  async function handleDeactivate(userId) {
    if (!window.confirm('Permanently delete this user? This cannot be undone.')) return
    try {
      await fetch(`${API}/api/auth/users/${userId}/deactivate`, { method: 'PATCH', headers: authHeader })
      fetchUsers()
    } catch (err) {
      console.error('Failed to delete user:', err)
    }
  }

  return (
    <div>
      {/* User List */}
      {loading ? (
        <p style={{ fontSize: '13px', color: '#6b7280' }}>Loading users...</p>
      ) : users.length === 0 ? (
        <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '20px' }}>No portal users yet.</p>
      ) : (
        <div style={{ marginBottom: '24px' }}>
          {users.map(u => (
            <div key={u.id} style={{ marginBottom: '8px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                backgroundColor: '#0f1117',
                borderRadius: editingAccessUser?.id === u.id ? '8px 8px 0 0' : '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    backgroundColor: u.role === 'SeniorDeveloper' ? '#f59e0b' : '#6366f1',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: '14px', fontWeight: '700'
                  }}>
                    {(u.name || u.email)[0].toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: '#ffffff', margin: 0 }}>
                      {u.name || u.email}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                      <span style={{ fontSize: '11px', color: '#6b7280' }}>{u.email}</span>
                      <span style={{ fontSize: '10px', color: '#6b7280' }}>·</span>
                      <span style={{ fontSize: '11px', color: u.role === 'SeniorDeveloper' ? '#f59e0b' : '#6366f1' }}>
                        {u.role}
                      </span>
                      {u.mfa_enabled && (
                        <>
                          <span style={{ fontSize: '10px', color: '#6b7280' }}>·</span>
                          <span style={{ fontSize: '10px', color: '#16a34a', fontWeight: '700' }}>MFA ✓</span>
                        </>
                      )}
                      {!u.is_active && (
                        <span style={{ fontSize: '10px', color: '#ef4444', fontWeight: '700' }}>Inactive</span>
                      )}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => editingAccessUser?.id === u.id ? setEditingAccessUser(null) : handleEditAccess(u)}
                    style={{ ...BTN_SECONDARY, fontSize: '11px', padding: '4px 8px' }}
                  >
                    {editingAccessUser?.id === u.id ? 'Done' : 'App Access'}
                  </button>
                  <button
                    onClick={() => handleResetPassword(u.id)}
                    style={{ ...BTN_DANGER, fontSize: '11px', padding: '4px 8px' }}
                  >
                    Reset PW
                  </button>
                  {u.mfa_enabled && (
                    <button
                      onClick={() => handleResetMfa(u.id)}
                      style={{ ...BTN_DANGER, fontSize: '11px', padding: '4px 8px' }}
                    >
                      Reset MFA
                    </button>
                  )}
                  {u.is_active && (
                    <button
                      onClick={() => handleDeactivate(u.id)}
                      style={{ ...BTN_DANGER, fontSize: '11px', padding: '4px 8px' }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>

              {/* App Access Editor */}
              {editingAccessUser?.id === u.id && (
                <div style={{
                  backgroundColor: '#0a0d14',
                  border: '1px solid #2d3148',
                  borderTop: 'none',
                  borderRadius: '0 0 8px 8px',
                  padding: '14px 16px'
                }}>
                  <p style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    App Access
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {apps.map(app => {
                      const assigned = userAssignments.includes(app.id)
                      return (
                        <div
                          key={app.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 12px',
                            backgroundColor: assigned ? '#6366f110' : '#1a1d27',
                            border: `1px solid ${assigned ? '#6366f140' : '#2d3148'}`,
                            borderRadius: '6px'
                          }}
                        >
                          <span style={{ fontSize: '13px', color: '#e2e8f0' }}>{app.name}</span>
                          <button
                            onClick={() => handleToggleAppAccess(u.id, app.id, assigned)}
                            style={{
                              fontSize: '11px',
                              fontWeight: '700',
                              padding: '3px 10px',
                              borderRadius: '6px',
                              border: 'none',
                              backgroundColor: assigned ? '#ef444420' : '#6366f120',
                              color: assigned ? '#ef4444' : '#6366f1',
                              cursor: 'pointer'
                            }}
                          >
                            {assigned ? 'Revoke' : 'Grant'}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Invite Form */}
      <div style={{ borderTop: '1px solid #2d3148', paddingTop: '20px' }}>
        <p style={{ fontSize: '13px', fontWeight: '600', color: '#9ca3af', marginBottom: '12px' }}>
          Invite New Developer
        </p>
        <form onSubmit={handleInvite}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
            <input
              placeholder="Email"
              value={inviteForm.email}
              onChange={e => setInviteForm(p => ({ ...p, email: e.target.value }))}
              style={{ ...INPUT_STYLE, width: '100%', boxSizing: 'border-box' }}
              required
              type="email"
            />
            <input
              placeholder="Display name"
              value={inviteForm.name}
              onChange={e => setInviteForm(p => ({ ...p, name: e.target.value }))}
              style={{ ...INPUT_STYLE, width: '100%', boxSizing: 'border-box' }}
            />
          </div>
          <select
            value={inviteForm.role}
            onChange={e => setInviteForm(p => ({ ...p, role: e.target.value }))}
            style={{ ...INPUT_STYLE, width: '100%', boxSizing: 'border-box', marginBottom: '10px' }}
          >
            <option value="Developer">Developer</option>
            <option value="SeniorDeveloper">Senior Developer</option>
          </select>

          {/* App Access on Invite */}
          <p style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', margin: '0 0 8px' }}>
            App Access
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
            {apps.map(app => {
              const selected = inviteForm.app_ids.includes(app.id)
              return (
                <div
                  key={app.id}
                  onClick={() => setInviteForm(p => ({
                    ...p,
                    app_ids: selected
                      ? p.app_ids.filter(id => id !== app.id)
                      : [...p.app_ids, app.id]
                  }))}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    backgroundColor: selected ? '#6366f115' : '#0f1117',
                    border: `1px solid ${selected ? '#6366f1' : '#2d3148'}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{
                    width: '16px', height: '16px', borderRadius: '4px',
                    border: `2px solid ${selected ? '#6366f1' : '#3d4468'}`,
                    backgroundColor: selected ? '#6366f1' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {selected && <span style={{ color: '#fff', fontSize: '10px' }}>✓</span>}
                  </div>
                  <span style={{ fontSize: '13px', color: '#e2e8f0' }}>{app.name}</span>
                </div>
              )
            })}
          </div>

          {inviteError && <p style={{ fontSize: '12px', color: '#ef4444', marginBottom: '8px' }}>{inviteError}</p>}
          {inviteResult && (
            <div style={{
              backgroundColor: '#0f1117',
              border: '1px solid #16a34a40',
              borderRadius: '8px',
              padding: '12px 14px',
              marginBottom: '10px'
            }}>
              <p style={{ fontSize: '12px', color: '#16a34a', fontWeight: '700', margin: '0 0 4px' }}>
                User invited successfully!
              </p>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
                Temporary password: <code style={{ color: '#6366f1' }}>{inviteResult.tempPassword}</code>
              </p>
              <p style={{ fontSize: '11px', color: '#6b7280', margin: '4px 0 0' }}>
                Share this with the user — they must change it on first login.
              </p>
            </div>
          )}
          <button type="submit" style={BTN_PRIMARY}>Invite Developer</button>
        </form>
      </div>
    </div>
  )
}

export default function Settings() {
  const { portalToken } = useAuth()
  const AUTH_HEADER = portalToken ? { 'Authorization': `Bearer ${portalToken}` } : {}
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchApps()
  }, [])

  async function fetchApps() {
    try {
      const res = await fetch(`${API}/api/apps`)
      if (!res.ok) return
      const data = await res.json()
      setApps(data)
    } catch (err) {
      console.error('Failed to fetch apps:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '40px', color: '#6b7280', fontFamily: 'Inter, system-ui, sans-serif' }}>
        Loading settings...
      </div>
    )
  }

  return (
    <div style={{
      flex: 1,
      padding: '32px',
      fontFamily: 'Inter, system-ui, sans-serif',
      color: '#ffffff',
      overflowY: 'auto',
      maxWidth: '800px'
    }}>
      <h1 style={{ fontSize: '22px', fontWeight: '700', margin: '0 0 6px' }}>Settings</h1>
      <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '32px' }}>
        Manage portal users and app access. Senior Developer access only.
      </p>

      {/* User Management */}
      <div style={SECTION_STYLE}>
        <span style={LABEL_STYLE}>Developers & Access</span>
        <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '20px' }}>
          Invite developers, manage app access, reset passwords and MFA.
        </p>
        <UserManagement portalToken={portalToken} apps={apps} />
      </div>
    </div>
  )
}