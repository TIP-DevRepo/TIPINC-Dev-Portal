const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export async function submitRequest(payload) {
  const response = await fetch(`${BASE_URL}/api/requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to submit request')
  }

  return response.json()
}

export async function getRequests(filters = {}) {
  const params = new URLSearchParams(filters).toString()
  const response = await fetch(`${BASE_URL}/api/requests${params ? `?${params}` : ''}`)

  if (!response.ok) throw new Error('Failed to fetch requests')
  return response.json()
}

export async function getRequestsByClient(clientId) {
  const response = await fetch(`${BASE_URL}/api/requests?client_id=${clientId}`)
  if (!response.ok) throw new Error('Failed to fetch requests')
  return response.json()
}

export async function getApps() {
  const response = await fetch(`${BASE_URL}/api/apps`)
  if (!response.ok) throw new Error('Failed to fetch apps')
  return response.json()
}

export async function assignRequest(requestId, devId, devName) {
  const response = await fetch(`${BASE_URL}/api/requests/${requestId}/assign`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ assigned_dev_id: devId, assigned_dev_name: devName })
  })
  if (!response.ok) throw new Error('Failed to assign request')
  return response.json()
}

export async function getDevelopers() {
  const response = await fetch(`${BASE_URL}/api/roles`)
  if (!response.ok) throw new Error('Failed to fetch developers')
  return response.json()
}

export async function moveRequest(requestId, status) {
  const response = await fetch(`${BASE_URL}/api/requests/${requestId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  })
  if (!response.ok) throw new Error('Failed to move request')
  return response.json()
}

export async function deleteRequest(requestId) {
  const response = await fetch(`${BASE_URL}/api/requests/${requestId}`, {
    method: 'DELETE'
  })
  if (!response.ok) throw new Error('Failed to delete request')
  return response.json()
}

export async function getChangelogsByApp(appId) {
  const response = await fetch(`${BASE_URL}/api/deployments/changelogs?app_id=${appId}`)
  if (!response.ok) throw new Error('Failed to fetch changelogs')
  return response.json()
}

export async function getVersionHistory(appId) {
  const url = appId
    ? `${BASE_URL}/api/deployments/versions?app_id=${appId}`
    : `${BASE_URL}/api/deployments/versions`
  const response = await fetch(url)
  if (!response.ok) throw new Error('Failed to fetch version history')
  return response.json()
}

export async function getChangelogs(appId) {
  const url = appId
    ? `${BASE_URL}/api/deployments/changelogs?app_id=${appId}`
    : `${BASE_URL}/api/deployments/changelogs`
  const response = await fetch(url)
  if (!response.ok) throw new Error('Failed to fetch changelogs')
  return response.json()
}

export async function unassignRequest(requestId) {
  const response = await fetch(`${BASE_URL}/api/requests/${requestId}/unassign`, {
    method: 'PATCH'
  })
  if (!response.ok) throw new Error('Failed to unassign request')
  return response.json()
}

export async function getNotesByRequest(requestId) {
  const response = await fetch(`${BASE_URL}/api/notes/${requestId}`)
  if (!response.ok) throw new Error('Failed to fetch notes')
  return response.json()
}