/**
 * Katalog fitur yang bisa diberikan ke sebuah akun.
 *
 * Hak akses akun = gabungan role + daftar fitur. Setiap akun bisa punya
 * daftar fitur sendiri (kolom public.admins.features). Bila kolom itu kosong
 * (null), akun memakai fitur bawaan role-nya.
 */

export const ROLE_DEFAULTS = {
  petugas: ['kunjungan_mendatang', 'scan', 'akun'],
  admin: [
    'dashboard',
    'request',
    'tamu',
    'riwayat',
    'cetak_riwayat',
    'scan',
    'akun',
  ],
  super_admin: [
    'riwayat',
    'cetak_riwayat',
    'kunjungan_terkini',
    'pengguna',
    'database',
    'akun',
  ],
}

export const FEATURE_KEYS = [
  'kunjungan_mendatang',
  'kunjungan_terkini',
  'scan',
  'dashboard',
  'request',
  'tamu',
  'riwayat',
  'cetak_riwayat',
  'pengguna',
  'database',
  'akun',
]

export const FEATURE_LABELS = {
  kunjungan_mendatang: 'Kunjungan Mendatang',
  kunjungan_terkini: 'Kunjungan Terkini',
  scan: 'Scan QR',
  dashboard: 'Dashboard',
  request: 'Daftar Request',
  tamu: 'Kelola Tamu',
  riwayat: 'Riwayat Kunjungan',
  cetak_riwayat: 'Cetak Riwayat',
  pengguna: 'Kelola Pengguna',
  database: 'Kelola Database',
  akun: 'Akun Saya',
}

export const ROLES = ['petugas', 'admin', 'super_admin']

/**
 * Tentukan fitur efektif sebuah akun.
 * `features` null/undefined → pakai default role. Array kosong → tanpa fitur.
 */
export function resolveFeatures(role, features) {
  if (!Array.isArray(features)) return ROLE_DEFAULTS[role] || []
  return [...new Set(features.filter(key => FEATURE_KEYS.includes(key)))]
}

/** Normalisasi input fitur dari body request (array atau string dipisah koma). */
export function normalizeFeatures(value) {
  if (value === null) return null
  if (Array.isArray(value)) {
    return [...new Set(value.map(item => String(item).trim()).filter(Boolean))]
  }
  if (typeof value === 'string') {
    return [...new Set(value.split(',').map(item => item.trim()).filter(Boolean))]
  }
  return undefined
}

export function isValidFeatureList(features) {
  return features.every(key => FEATURE_KEYS.includes(key))
}
