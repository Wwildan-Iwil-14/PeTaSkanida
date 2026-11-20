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
    'tamu_admin',
    'riwayat_admin',
    'cetak_riwayat',
    'scan',
    'akun',
  ],
  super_admin: [
    'tamu_superadmin',
    'riwayat_superadmin',
    'cetak_riwayat',
    'kunjungan_terkini',
    'kelola_akun',
    'tambah_edit_akun',
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
  'tamu_superadmin',
  'tamu_admin',
  'riwayat_superadmin',
  'riwayat_admin',
  'cetak_riwayat',
  'kelola_akun',
  'tambah_edit_akun',
  'database',
  'akun',
]

export const FEATURE_LABELS = {
  kunjungan_mendatang: 'Kunjungan Mendatang',
  kunjungan_terkini: 'Kunjungan Terkini',
  scan: 'Scan QR',
  dashboard: 'Dashboard',
  request: 'Daftar Request',
  tamu_superadmin: 'Kelola Tamu (superadmin)',
  tamu_admin: 'Kelola Tamu (admin)',
  riwayat_superadmin: 'Riwayat Kunjungan (superadmin)',
  riwayat_admin: 'Riwayat Kunjungan (admin)',
  cetak_riwayat: 'Cetak Riwayat',
  kelola_akun: 'Kelola Semua Akun',
  tambah_edit_akun: 'Tambah/Edit Akun',
  database: 'Kelola Database',
  akun: 'Akun Saya',
}

// Alias fitur lama agar data yang sudah tersimpan tetap terbaca.
const FEATURE_ALIASES = {
  pengguna: ['kelola_akun', 'tambah_edit_akun'],
}

export const ROLES = ['petugas', 'admin', 'super_admin']

/** Terjemahkan alias lama ke fitur baru. */
function expandFeature(key, role) {
  if (key === 'tamu') {
    return role === 'super_admin' ? ['tamu_superadmin'] : ['tamu_admin']
  }
  if (key === 'riwayat') {
    return role === 'super_admin' ? ['riwayat_superadmin'] : ['riwayat_admin']
  }
  return FEATURE_ALIASES[key] || [key]
}

/**
 * Tentukan fitur efektif sebuah akun.
 * `features` null/undefined → pakai default role. Array kosong → tanpa fitur.
 */
export function resolveFeatures(role, features) {
  if (!Array.isArray(features)) return ROLE_DEFAULTS[role] || []
  const expanded = features.flatMap(key => expandFeature(key, role))
  return [...new Set(expanded.filter(key => FEATURE_KEYS.includes(key)))]
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
  return features.every(
    key =>
      FEATURE_KEYS.includes(key) ||
      Boolean(FEATURE_ALIASES[key]) ||
      key === 'tamu' ||
      key === 'riwayat',
  )
}
