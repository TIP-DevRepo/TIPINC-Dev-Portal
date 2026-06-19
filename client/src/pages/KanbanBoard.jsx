import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import KanbanColumn from '../components/KanbanColumn'
import RequestCard from '../components/RequestCard'
import RequestModal from '../components/RequestModal'
import ContextMenu from '../components/ContextMenu'
import { getApps, getRequests, getDevelopers, assignRequest, moveRequest, deleteRequest } from '../utils/api'

const COLUMNS = ['Incoming', 'In Review', 'In Progress', 'Pending Approval', 'Deployed']

export default function KanbanBoard() {
  const [apps, setApps] = useState([])
  const [requests, setRequests] = useState([])
  const [developers, setDevelopers] = useState([])
  const [selectedApp, setSelectedApp] = useState(
    sessionStorage.getItem('selectedApp') || 'all'
  )
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [activePage, setActivePage] = useState('board')
  const [contextMenu, setContextMenu] = useState(null)

  useEffect(() => {
    fetchApps()
    fetchRequests()
    fetchDevelopers()
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

  async function fetchDevelopers() {
    try {
      const data = await getDevelopers()
      setDevelopers(data)
    } catch (err) {
      console.error('Failed to fetch developers:', err)
    }
  }

  function handleContextMenu(e, request) {
    setContextMenu({ x: e.clientX, y: e.clientY, request })
  }

  async function handleAssign(requestId, devId, devName) {
    try {
      const updated = await assignRequest(requestId, devId, devName)
      setRequests(prev => prev.map(r => r.id === updated.id ? updated : r))
    } catch (err) {
      console.error('Failed to assign:', err)
    }
  }

  async function handleMove(requestId, status) {
    try {
      const updated = await moveRequest(requestId, status)
      setRequests(prev => prev.map(r => r.id === updated.id ? updated : r))
    } catch (err) {
      console.error('Failed to move:', err)
    }
  }

  async function handleDelete(requestId) {
    if (!window.confirm('Are you sure you want to delete this request?')) return
    try {
      await deleteRequest(requestId)
      setRequests(prev => prev.filter(r => r.id !== requestId))
    } catch (err) {
      console.error('Failed to delete:', err)
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
    <Layout activePage={activePage} onNavigate={setActivePage}>
      {/* Board Header */}
      <div style={{
        backgroundColor: '#1a1d27',
        borderBottom: '1px solid #2d3148',
        padding: '0 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '60px',
        flexShrink: 0
      }}>
        <div>
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#ffffff', margin: 0 }}>
            {selectedAppName}
          </h2>
          <p style={{ fontSize: '11px', color: '#6b7280', margin: 0 }}>
            {loading ? 'Loading...' : `${requests.length} total request${requests.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '13px', color: '#6b7280' }}>App:</span>
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
        padding: '28px',
        overflowX: 'auto'
      }}>
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
              renderCard={(request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  developers={developers}
                  apps={apps}
                  onClick={setSelectedRequest}
                  onContextMenu={handleContextMenu}
                />
              )}
            />
          ))}
        </div>

        <RequestModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onUpdate={(updated) => {
            setRequests(prev => prev.map(r => r.id === updated.id ? updated : r))
            setSelectedRequest(updated)
          }}
        />
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          request={contextMenu.request}
          developers={developers}
          onClose={() => setContextMenu(null)}
          onAssign={handleAssign}
          onMove={handleMove}
          onDelete={handleDelete}
        />
      )}

    </Layout>
  )
}