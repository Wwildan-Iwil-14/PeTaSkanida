/**
 * Katalog fitur akun (sisi frontend).
 * Harus sinkron dengan backend/src/lib/features.js.
 */

export const ROLE_LABELS = {
  petugas: 'Petugas',
  admin: 'Admin',
  super_admin: 'Super Admin',
}

export const FEATURES = [
  { key: 'kunjungan_mendatang', label: 'Kunjungan Mendatang', hint: 'Lihat jadwal tamu yang akan datang.' },
  { key: 'kunjungan_terkini', label: 'Kunjungan Terkini', hint: 'Lihat tamu yang sedang berkunjung.' },
  { key: 'scan', label: 'Scan QR', hint: 'Pindai QR / barcode tamu.' },
  { key: 'dashboard', label: 'Dashboard', hint: 'Ringkasan statistik kunjungan.' },
  { key: 'request', label: 'Daftar Request', hint: 'Terima / tolak permintaan kunjungan.' },
  { key: 'tamu', label: 'Kelola Tamu', hint: 'Tambah, edit, dan selesaikan kunjungan.' },
  { key: 'riwayat', label: 'Riwayat Kunjungan', hint: 'Lihat arsip kunjungan selesai / ditolak.' },
  { key: 'cetak_riwayat', label: 'Cetak Riwayat', hint: 'Cetak arsip riwayat kunjungan.' },
  { key: 'pengguna', label: 'Kelola Pengguna', hint: 'Kelola akun, role, dan fitur.' },
  { key: 'database', label: 'Kelola Database', hint: 'Statistik, backup, dan bersihkan log.' },
  { key: 'akun', label: 'Akun Saya', hint: 'Lihat detail akun yang sedang aktif.' },
]

export const FEATURE_KEYS = FEATURES.map(feature => feature.key)

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

export const ROLES = ['petugas', 'admin', 'super_admin']

/** Fitur efektif akun: pakai fitur akun bila ada, selain itu default role. */
export function resolveFeatures(role, features) {
  if (!Array.isArray(features)) return ROLE_DEFAULTS[role] || []
  return [...new Set(features.filter(key => FEATURE_KEYS.includes(key)))]
}

export function featureLabel(key) {
  return FEATURES.find(feature => feature.key === key)?.label || key
}
