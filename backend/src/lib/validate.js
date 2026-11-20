import { ROLES, isValidFeatureList, normalizeFeatures } from './features.js'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_PATTERN = /^[0-9+()\-\s]{8,}$/
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const TIME_PATTERN = /^\d{2}:\d{2}$/

const text = value => (typeof value === 'string' ? value.trim() : '')

/**
 * Validasi & normalisasi payload permintaan kunjungan dari tamu.
 * Mengembalikan { payload, errors } - errors berisi daftar pesan kesalahan.
 */
export function validateRequestPayload(body = {}) {
  const errors = []

  const payload = {
    nama: text(body.nama),
    email: text(body.email),
    no_hp: text(body.no_hp),
    tujuan: text(body.tujuan),
    keperluan: text(body.keperluan),
    tanggal: text(body.tanggal),
    waktu: text(body.waktu),
    jumlah: Number.parseInt(body.jumlah, 10),
  }

  if (!payload.nama) errors.push('Nama / instansi wajib diisi.')
  // Email bersifat opsional untuk tamu; bila diisi tetap harus valid.
  if (payload.email && !EMAIL_PATTERN.test(payload.email)) {
    errors.push('Format alamat email tidak valid.')
  }
  if (!PHONE_PATTERN.test(payload.no_hp)) errors.push('Nomor HP tidak valid.')
  if (!payload.tujuan) errors.push('Tujuan wajib diisi.')
  if (!payload.keperluan) errors.push('Keperluan wajib diisi.')
  if (!DATE_PATTERN.test(payload.tanggal)) errors.push('Tanggal kunjungan tidak valid.')
  if (payload.waktu && !TIME_PATTERN.test(payload.waktu)) errors.push('Waktu kunjungan tidak valid.')

  if (!Number.isFinite(payload.jumlah) || payload.jumlah < 1) {
    errors.push('Jumlah pengunjung minimal 1.')
    payload.jumlah = 1
  }

  return { payload, errors }
}

/**
 * Validasi payload akun admin/petugas (dipakai fitur tambah & edit user).
 */
export function validateAdminPayload(body = {}, { isCreate = false } = {}) {
  const errors = []
  const rawFeatures = normalizeFeatures(body.features)
  const payload = {
    nama: text(body.nama),
    email: text(body.email),
    role: text(body.role) || 'admin',
    password: typeof body.password === 'string' ? body.password : '',
    // null = pakai fitur bawaan role.
    features: rawFeatures === undefined ? null : rawFeatures,
  }

  if (!payload.nama) errors.push('Nama petugas wajib diisi.')
  if (!EMAIL_PATTERN.test(payload.email)) errors.push('Format alamat email tidak valid.')
  if (!ROLES.includes(payload.role)) {
    errors.push('Role harus petugas, admin, atau super_admin.')
  }
  if (payload.features !== null && !isValidFeatureList(payload.features)) {
    errors.push('Ada fitur akun yang tidak dikenal.')
  }
  if (isCreate && payload.password.length < 6) {
    errors.push('Password minimal 6 karakter.')
  }
  if (!isCreate && payload.password && payload.password.length < 6) {
    errors.push('Password minimal 6 karakter.')
  }

  return { payload, errors }
}

/**
 * Validasi kredensial admin sebelum diteruskan ke Supabase Auth.
 * Login admin memakai email (standar GoTrue), bukan username.
 */
export function validateCredentials(body = {}) {
  const email = text(body.email)
  const password = typeof body.password === 'string' ? body.password : ''
  const errors = []
  if (!email) errors.push('Email wajib diisi.')
  else if (!EMAIL_PATTERN.test(email)) errors.push('Format email tidak valid.')
  if (!password) errors.push('Password wajib diisi.')
  return { email, password, errors }
}
