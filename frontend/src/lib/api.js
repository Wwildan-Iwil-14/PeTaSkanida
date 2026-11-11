/**
 * Klien REST untuk backend PETA SKANIDA.
 * Semua akses tulis (login, ajukan request, setujui/tolak) lewat backend,
 * sehingga service role key tidak pernah terekspos ke browser.
 */
const BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api').replace(/\/+$/, '')

async function request(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`

  let response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new Error(
      `Tidak dapat terhubung ke backend (${BASE_URL}). Pastikan server backend berjalan.`,
    )
  }

  const raw = await response.text()
  let payload = null
  if (raw) {
    try {
      payload = JSON.parse(raw)
    } catch {
      payload = null
    }
  }

  if (!response.ok) {
    throw new Error(payload?.error || `Permintaan gagal (HTTP ${response.status}).`)
  }

  return payload
}

export const api = {
  health: () => request('/health'),

  login: (username, password) =>
    request('/auth/login', { method: 'POST', body: { username, password } }),

  me: (token) => request('/auth/me', { token }),

  listRequests: (token) => request('/requests', { token }),

  createRequest: (payload) => request('/requests', { method: 'POST', body: payload }),

  approveRequest: (id, token) => request(`/requests/${id}/approve`, { method: 'POST', token }),

  rejectRequest: (id, token) => request(`/requests/${id}/reject`, { method: 'POST', token }),
}

export { BASE_URL as API_BASE_URL }
