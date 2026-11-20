/**
 * Klien REST untuk backend PETA SKANIDA.
 * Semua akses tulis (login, ajukan request, setujui/tolak) lewat backend,
 * sehingga service role key tidak pernah terekspos ke browser.
 *
 * Sesi admin memakai JWT Supabase Auth. Access token yang kedaluwarsa otomatis
 * ditukar dengan yang baru memakai refresh token (lihat refreshSession).
 */
// Path relatif /api diteruskan oleh proxy Vite (lihat vite.config.js) ke
// backend, sehingga frontend & backend tersambung tanpa masalah CORS.
// Untuk deployment, isi VITE_API_BASE_URL dengan URL backend lengkap,
// misalnya https://api.contoh.com/api.
const CONFIGURED_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').trim()
const BASE_URL = (
  CONFIGURED_BASE_URL || (import.meta.env.DEV ? '/api' : 'http://localhost:3001/api')
).replace(/\/+$/, '')

const TOKEN_KEY = 'peta-skanida.admin.token'
const REFRESH_KEY = 'peta-skanida.admin.refresh'

class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

// ---- Penyimpanan sesi (localStorage) ----

function readStore(key) {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStore(key, value) {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // localStorage bisa diblokir; abaikan
  }
}

function removeStore(key) {
  try {
    window.localStorage.removeItem(key)
  } catch {
    // localStorage bisa diblokir; abaikan
  }
}

/** Simpan sesi admin hasil login / hasil refresh. */
export function saveSession({ token, refreshToken }) {
  if (token) writeStore(TOKEN_KEY, token)
  if (refreshToken) writeStore(REFRESH_KEY, refreshToken)
}

/** Hapus sesi admin dari browser (dipakai saat keluar / sesi kedaluwarsa). */
export function clearSession() {
  removeStore(TOKEN_KEY)
  removeStore(REFRESH_KEY)
}

/** Ambil access token yang tersimpan (null bila belum pernah login). */
export function loadToken() {
  return readStore(TOKEN_KEY)
}

// ---- Permintaan HTTP ----

async function rawRequest(path, { method = 'GET', body, token } = {}) {
  // FormData berisi file: biarkan browser yang menentukan boundary
  // multipart/form-data (Content-Type tidak boleh di-set manual).
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData
  const headers = isFormData ? {} : { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`

  let response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
    })
  } catch {
    throw new ApiError(
      `Tidak dapat terhubung ke backend (${BASE_URL}). Pastikan server backend berjalan.`,
      0,
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
    throw new ApiError(payload?.error || `Permintaan gagal (HTTP ${response.status}).`, response.status)
  }

  return payload
}

/**
 * Tukar refresh token dengan access token baru.
 * Mengembalikan token baru, atau null bila sesi sudah tidak berlaku
 * (dalam hal ini sesi browser ikut dibersihkan).
 */
async function renewSession() {
  const refreshToken = readStore(REFRESH_KEY)
  if (!refreshToken) return null

  try {
    const data = await rawRequest('/auth/refresh', {
      method: 'POST',
      body: { refreshToken },
    })
    saveSession(data)
    return data.token
  } catch {
    clearSession()
    return null
  }
}

/**
 * Permintaan untuk endpoint yang butuh login admin.
 * Jika token kedaluwarsa (401), sesi diperbarui sekali lalu dicoba ulang.
 */
async function authedRequest(path, opts = {}) {
  try {
    return await rawRequest(path, opts)
  } catch (err) {
    if (err.status !== 401 || !opts.token) throw err
    const renewed = await renewSession()
    if (!renewed) throw err
    return rawRequest(path, { ...opts, token: renewed })
  }
}

/**
 * Token sesi dibaca dari penyimpanan setiap kali dipanggil, sehingga token
 * hasil pembaruan otomatis dipakai pada permintaan berikutnya.
 */
const currentToken = () => loadToken() || undefined

export const api = {
  health: () => rawRequest('/health'),

  /** Login admin (email + password) → { token, refreshToken, admin }. */
  login: (email, password) =>
    rawRequest('/auth/login', { method: 'POST', body: { email, password } }),

  me: () => authedRequest('/auth/me', { token: currentToken() }),

  /** Cabut sesi di server (refresh token tidak bisa dipakai lagi). */
  logout: () =>
    rawRequest('/auth/logout', {
      method: 'POST',
      body: { refreshToken: readStore(REFRESH_KEY) },
      token: currentToken(),
    }).catch(() => {}),

  listRequests: () => authedRequest('/requests', { token: currentToken() }),

  createRequest: payload => rawRequest('/requests', { method: 'POST', body: payload }),

  /** Kirim request tamu berikut surat tugas opsional (FormData / multipart). */
  createRequestWithFile: formData =>
    rawRequest('/requests', { method: 'POST', body: formData }),

  approveRequest: id =>
    authedRequest(`/requests/${id}/approve`, { method: 'POST', token: currentToken() }),

  /** Tandai kunjungan selesai → pindah dari Kelola Tamu ke Riwayat Kunjungan. */
  completeRequest: id =>
    authedRequest(`/requests/${id}/complete`, { method: 'POST', token: currentToken() }),

  rejectRequest: id => authedRequest(`/requests/${id}/reject`, { method: 'POST', token: currentToken() }),

  /** Tandai tamu sudah (true) / belum (false) dihubungi. */
  setContacted: (id, dihubungi) =>
    authedRequest(`/requests/${id}/contacted`, {
      method: 'PATCH',
      body: { dihubungi },
      token: currentToken(),
    }),

  // ---- Kelola tamu (CRUD admin) ----

  createGuest: payload =>
    authedRequest('/requests/admin', { method: 'POST', body: payload, token: currentToken() }),

  updateRequest: (id, payload) =>
    authedRequest(`/requests/${id}`, { method: 'PATCH', body: payload, token: currentToken() }),

  deleteRequest: id =>
    authedRequest(`/requests/${id}`, { method: 'DELETE', token: currentToken() }),

  // ---- Riwayat kunjungan (CRUD admin) ----

  createHistory: payload =>
    authedRequest('/history', { method: 'POST', body: payload, token: currentToken() }),

  updateHistory: (id, payload) =>
    authedRequest(`/history/${id}`, { method: 'PATCH', body: payload, token: currentToken() }),

  deleteHistory: id =>
    authedRequest(`/history/${id}`, { method: 'DELETE', token: currentToken() }),

  // ---- Scan QR / barcode tamu ----

  /** Catat hasil scan dari HP → admin di laptop menerima notifikasi real-time. */
  scanGuest: (kode, deviceId) =>
    authedRequest('/scans', { method: 'POST', body: { kode, deviceId }, token: currentToken() }),

  listScans: (limit = 20) =>
    authedRequest(`/scans?limit=${limit}`, { token: currentToken() }),

  // ---- Akun admin / petugas (CRUD admin) ----

  listAdminUsers: () => authedRequest('/admin/users', { token: currentToken() }),

  createAdminUser: payload =>
    authedRequest('/admin/users', { method: 'POST', body: payload, token: currentToken() }),

  updateAdminUser: (id, payload) =>
    authedRequest(`/admin/users/${id}`, { method: 'PATCH', body: payload, token: currentToken() }),

  deleteAdminUser: id =>
    authedRequest(`/admin/users/${id}`, { method: 'DELETE', token: currentToken() }),

  // ---- Kelola database (khusus super admin) ----

  databaseStats: () => authedRequest('/admin/database/stats', { token: currentToken() }),

  databaseBackup: () => authedRequest('/admin/database/backup', { token: currentToken() }),

  cleanScanLogs: days =>
    authedRequest('/admin/database/scan-logs/clean', {
      method: 'POST',
      body: { days },
      token: currentToken(),
    }),
}

export { BASE_URL as API_BASE_URL }
