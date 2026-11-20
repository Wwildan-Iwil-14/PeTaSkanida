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
  { key: 'tamu_superadmin', label: 'Kelola Tamu (superadmin)', hint: 'Tambah, edit, selesaikan, dan hapus data tamu.' },
  { key: 'tamu_admin', label: 'Kelola Tamu (admin)', hint: 'Lihat dan selesaikan kunjungan tamu tanpa aksi edit dan hapus.' },
  { key: 'riwayat_superadmin', label: 'Riwayat Kunjungan (superadmin)', hint: 'Lihat arsip kunjungan selesai / ditolak dengan aksi edit dan hapus.' },
  { key: 'riwayat_admin', label: 'Riwayat Kunjungan (admin)', hint: 'Lihat arsip kunjungan selesai / ditolak tanpa aksi edit dan hapus.' },
  { key: 'cetak_riwayat', label: 'Cetak Riwayat', hint: 'Cetak arsip riwayat kunjungan.' },
  { key: 'kelola_akun', label: 'Kelola Semua Akun', hint: 'Lihat daftar seluruh akun.' },
  { key: 'tambah_edit_akun', label: 'Tambah/Edit Akun', hint: 'Buat, ubah, dan hapus akun.' },
  { key: 'database', label: 'Kelola Database', hint: 'Statistik, backup, dan bersihkan log.' },
  { key: 'akun', label: 'Akun Saya', hint: 'Lihat detail akun yang sedang aktif.' },
]

export const FEATURE_KEYS = FEATURES.map(feature => feature.key)

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

export const ROLES = ['petugas', 'admin', 'super_admin']

// Alias fitur lama agar data lama tetap terbaca.
const FEATURE_ALIASES = {
  pengguna: ['kelola_akun', 'tambah_edit_akun'],
}

/** Fitur efektif akun: pakai fitur akun bila ada, selain itu default role. */
export function resolveFeatures(role, features) {
  if (!Array.isArray(features)) return ROLE_DEFAULTS[role] || []
  const expanded = features.flatMap(key => {
    if (key === 'tamu') {
      return role === 'super_admin' ? ['tamu_superadmin'] : ['tamu_admin']
    }
    if (key === 'riwayat') {
      return role === 'super_admin' ? ['riwayat_superadmin'] : ['riwayat_admin']
    }
    return FEATURE_ALIASES[key] || [key]
  })
  return [...new Set(expanded.filter(key => FEATURE_KEYS.includes(key)))]
}

export function featureLabel(key) {
  return FEATURES.find(feature => feature.key === key)?.label || key
}
