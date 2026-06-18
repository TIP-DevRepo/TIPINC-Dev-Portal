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