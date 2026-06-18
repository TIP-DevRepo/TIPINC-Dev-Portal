import { useState, useEffect } from 'react'
import KanbanColumn from '../components/KanbanColumn'
import { getApps, getRequests } from '../utils/api'

const COLUMNS = ['Incoming', 'In Review', 'In Progress', 'Pending Approval', 'Deployed']

export default function KanbanBoard() {
  const [apps, setApps] = useState([])
  const [requests, setRequests] = useState([])
  const [selectedApp, setSelectedApp] = useState(
    sessionStorage.getItem('selectedApp') || 'all'
  )
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchApps()
    fetchRequests()
  }, [])

  useEffect(() => {
    fetchRequests()
  }, [selectedApp])

  async function fetchApps() {
    try {
      const data = await getApps()
      setApps(data)
    } catch (err) {
      console.error('Failed to fetch apps:', err)
    }
  }

  async function fetchRequests() {
    try {
      setLoading(true)
      const filters = selectedApp !== 'all' ? { app_id: selectedApp } : {}
      const data = await getRequests(filters)
      setRequests(data)
    } catch (err) {
      console.error('Failed to fetch requests:', err)
    } finally {
      setLoading(false)
    }
  }

  function handleAppSelect(appId) {
    setSelectedApp(appId)
    sessionStorage.setItem('selectedApp', appId)
  }

  function getCardsByStatus(status) {
    return requests.filter(r => r.status === status)
  }

  const selectedAppName = apps.find(a => a.id === selectedApp)?.name || 'All Apps'

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0f1117',
      fontFamily: 'Inter, system-ui, sans-serif',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Top Bar */}
      <div style={{
        backgroundColor: '#1a1d27',
        borderBottom: '1px solid #2d3148',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '60px',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h1 style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff', margin: 0 }}>
            TIPINC Dev Portal
          </h1>
          <span style={{
            fontSize: '11px',
            color: '#6366f1',
            backgroundColor: '#6366f120',
            padding: '2px 8px',
            borderRadius: '99px',
            fontWeight: '600'
          }}>
            v0.2.02
          </span>
        </div>

        {/* App Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '13px', color: '#6b7280' }}>Viewing:</span>
          <select
            value={selectedApp}
            onChange={e => handleAppSelect(e.target.value)}
            style={{
              backgroundColor: '#2d3148',
              border: '1px solid #3d4468',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: '600',
              padding: '6px 12px',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="all">All Apps</option>
            {apps.map(app => (
              <option key={app.id} value={app.id}>{app.name}</option>
            ))}
          </select>
          <button
            onClick={fetchRequests}
            style={{
              backgroundColor: '#2d3148',
              border: '1px solid #3d4468',
              borderRadius: '8px',
              color: '#9ca3af',
              fontSize: '13px',
              padding: '6px 12px',
              cursor: 'pointer'
            }}
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Board */}
      <div style={{
        flex: 1,
        padding: '24px',
        overflowX: 'auto'
      }}>
        {/* Board Title */}
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#ffffff', margin: 0 }}>
            {selectedAppName}
          </h2>
          <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0' }}>
            {loading ? 'Loading...' : `${requests.length} total request${requests.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {/* Columns */}
        <div style={{
          display: 'flex',
          gap: '16px',
          alignItems: 'flex-start',
          minWidth: 'max-content'
        }}>
          {COLUMNS.map(column => (
            <KanbanColumn
              key={column}
              title={column}
              cards={getCardsByStatus(column)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}