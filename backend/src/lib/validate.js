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
  if (!EMAIL_PATTERN.test(payload.email)) errors.push('Format alamat email tidak valid.')
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
 * Validasi kredensial admin sebelum diteruskan ke database.
 */
export function validateCredentials(body = {}) {
  const username = text(body.username)
  const password = typeof body.password === 'string' ? body.password : ''
  const errors = []
  if (!username) errors.push('Nama akun wajib diisi.')
  if (!password) errors.push('Password wajib diisi.')
  return { username, password, errors }
}
