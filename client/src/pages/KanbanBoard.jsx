import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import KanbanColumn from '../components/KanbanColumn'
import { getApps, getRequests, getDevelopers, assignRequest, moveRequest, deleteRequest } from '../utils/api'
import RequestCard from '../components/RequestCard'
import RequestModal from '../components/RequestModal'
import ContextMenu from '../components/ContextMenu'

const COLUMNS = ['Incoming', 'In Review', 'In Progress', 'Pending Approval', 'Deployed']
const CATEGORIES = ['All', 'New Feature', 'Bug / Fix', 'UI Update', 'Stats / Reporting', 'Workflow Change']

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
  const [search, setSearch] = useState('')
  const [filterPriority, setFilterPriority] = useState('All')
  const [filterCategory, setFilterCategory] = useState('All')

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

  function handleAppSelect(appId) {
    setSelectedApp(appId)
    sessionStorage.setItem('selectedApp', appId)
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
      console.error('Failed to move request:', err)
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

  async function handleDrop(requestId, status) {
    const request = requests.find(r => r.id === requestId)
    if (!request || request.status === status) return
    try {
      const updated = await moveRequest(requestId, status)
      setRequests(prev => prev.map(r => r.id === updated.id ? updated : r))
    } catch (err) {
      console.error('Failed to move request:', err)
    }
  }

  function getCardsByStatus(status) {
    return requests.filter(r => {
      if (r.status !== status) return false
      if (filterPriority !== 'All' && r.priority !== filterPriority) return false
      if (filterCategory !== 'All' && r.category !== filterCategory) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        const matches =
          r.title?.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q) ||
          r.category?.toLowerCase().includes(q)
        if (!matches) return false
      }
      return true
    })
  }

  function getTotalByStatus(status) {
    return requests.filter(r => r.status === status).length
  }

  const isFiltering = search || filterPriority !== 'All' || filterCategory !== 'All'
  const selectedAppName = apps.find(a => a.id === selectedApp)?.name || 'All Apps'

  return (
    <Layout activePage={activePage} onNavigate={setActivePage}>
      {/* Board Header */}
      <div style={{
        backgroundColor: '#1a1d27',
        borderBottom: '1px solid #2d3148',
        padding: '0 28px',
        flexShrink: 0
      }}>
        {/* Top Row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '60px'
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

        {/* Search + Filter Row */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          paddingBottom: '14px',
          flexWrap: 'wrap'
        }}>
          {/* Search Bar */}
          <div style={{ position: 'relative', minWidth: '200px', maxWidth: '300px', flex: 1 }}>
            <span style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#6b7280',
              fontSize: '14px'
            }}>
              🔍
            </span>
            <input
              type="text"
              placeholder="Search requests..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 12px 7px 34px',
                backgroundColor: '#2d3148',
                border: '1px solid #3d4468',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: 'Inter, system-ui, sans-serif'
              }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#6b7280',
                  cursor: 'pointer',
                  fontSize: '14px',
                  padding: 0
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {/* Priority Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', whiteSpace: 'nowrap', width: '60px' }}>
                Priority:
              </span>
              {['All', 'High', 'Medium', 'Low'].map(p => (
                <button
                  key={p}
                  onClick={() => setFilterPriority(p)}
                  style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    padding: '4px 10px',
                    borderRadius: '99px',
                    border: `1.5px solid ${filterPriority === p ? '#6366f1' : '#2d3148'}`,
                    backgroundColor: filterPriority === p ? '#6366f120' : 'transparent',
                    color: filterPriority === p ? '#6366f1' : '#6b7280',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Category Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', whiteSpace: 'nowrap', width: '60px' }}>
                Category:
              </span>
              {CATEGORIES.map(c => (
                <button
                  key={c}
                  onClick={() => setFilterCategory(c)}
                  style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    padding: '4px 10px',
                    borderRadius: '99px',
                    border: `1.5px solid ${filterCategory === c ? '#6366f1' : '#2d3148'}`,
                    backgroundColor: filterCategory === c ? '#6366f120' : 'transparent',
                    color: filterCategory === c ? '#6366f1' : '#6b7280',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Clear Filters */}
          {isFiltering && (
            <button
              onClick={() => { setSearch(''); setFilterPriority('All'); setFilterCategory('All') }}
              style={{
                fontSize: '12px',
                fontWeight: '600',
                padding: '4px 10px',
                borderRadius: '99px',
                border: '1.5px solid #ef444440',
                backgroundColor: 'transparent',
                color: '#ef4444',
                cursor: 'pointer',
                alignSelf: 'center'
              }}
            >
              ✕ Clear
            </button>
          )}
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
              totalCards={getTotalByStatus(column)}
              onDrop={handleDrop}
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
      </div>
    </Layout>
  )
}