import { config } from '../config.js'

// Pengirim notifikasi WhatsApp memakai gateway Fonnte (https://fonnte.com).
// Modul ini sengaja "fail-soft": kegagalan kirim tidak boleh menggagalkan
// pendaftaran tamu atau perubahan status di dashboard.

const DEFAULT_ENDPOINT = 'https://api.fonnte.com/send'
const REQUEST_TIMEOUT_MS = 7000

const escapeText = value =>
  String(value ?? '')
    .trim()
    .replace(/([*_~`])/g, '\\$1')

export const requestCode = id => `REQ-${String(id ?? '').padStart(3, '0')}`

export function isWhatsappEnabled() {
  return Boolean(config.whatsappToken && config.whatsappTargets.length > 0)
}

/**
 * Normalisasi nomor ke format internasional tanpa tanda "+".
 * Fonnte menerima "62..." maupun "08...", tapi format ini lebih aman.
 */
export function normalizeNumber(input) {
  const digits = String(input ?? '').replace(/\D/g, '')
  if (!digits) return ''

  const countryCode = String(config.whatsappCountryCode || '62').replace(/\D/g, '') || '62'

  if (digits.startsWith('0')) return countryCode + digits.slice(1)
  if (digits.startsWith(countryCode)) return digits
  return countryCode + digits
}

const formatDate = value => {
  if (!value) return '-'
  const parsed = new Date(`${String(value).slice(0, 10)}T00:00:00Z`)
  if (Number.isNaN(parsed.getTime())) return String(value)
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(parsed)
}

/**
 * Kirim satu pesan teks ke satu nomor lewat Fonnte.
 * Melempar error agar pemanggil bisa mencatatnya; dipakai juga oleh skrip tes.
 */
export async function sendText({ target, message }) {
  if (!config.whatsappToken) {
    throw new Error('FONNTE_TOKEN belum diisi di backend/.env.')
  }

  const normalized = normalizeNumber(target)
  if (!normalized) throw new Error('Nomor tujuan WhatsApp kosong / tidak valid.')

  const body = new URLSearchParams({
    target: normalized,
    message: String(message ?? ''),
    countryCode: String(config.whatsappCountryCode || '62').replace(/\D/g, '') || '62',
  })

  const response = await fetch(config.whatsappApiUrl || DEFAULT_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: config.whatsappToken,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })

  const text = await response.text()
  let result = null
  try {
    result = text ? JSON.parse(text) : null
  } catch {
    // Fonnte kadang membalas teks biasa; anggap sukses selama HTTP OK.
  }

  if (!response.ok) {
    throw new Error(`Fonnte HTTP ${response.status}: ${text.slice(0, 200) || 'tanpa detail'}`)
  }
  if (result && result.status === false) {
    throw new Error(`Fonnte menolak pengiriman: ${result.reason || JSON.stringify(result).slice(0, 200)}`)
  }

  return result || { status: true }
}

/**
 * Kirim pesan ke semua nomor admin yang terdaftar di .env.
 * Tidak pernah melempar error — hanya mencatat kegagalan ke konsol.
 */
async function sendToAdmins(message, event) {
  if (!isWhatsappEnabled()) {
    if (!config.whatsappToken) {
      console.warn('[whatsapp] FONNTE_TOKEN belum diisi; notifikasi dilewati.')
    } else {
      console.warn('[whatsapp] WHATSAPP_NOTIFY_NUMBERS belum diisi; notifikasi dilewati.')
    }
    return { skipped: true }
  }

  const targets = [...new Set(config.whatsappTargets.map(normalizeNumber).filter(Boolean))]
  const results = await Promise.allSettled(
    targets.map(target => sendText({ target, message })),
  )

  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.warn(
        `[whatsapp] Gagal mengirim ${event} ke ${targets[index]}: ${result.reason?.message || result.reason}`,
      )
    }
  })

  const sent = results.filter(result => result.status === 'fulfilled').length
  console.log(`[whatsapp] ${event}: terkirim ke ${sent}/${targets.length} nomor.`)
  return { sent, total: targets.length }
}

function newRequestMessage(request = {}) {
  const lines = [
    '🔔 *Permintaan Kunjungan Baru — PeTa SKANIDA*',
    '',
    `Kode: *${escapeText(requestCode(request.id))}*`,
    `Nama / Instansi: ${escapeText(request.nama) || '-'}`,
    `Tujuan: ${escapeText(request.tujuan) || '-'}`,
    `Keperluan: ${escapeText(request.keperluan) || '-'}`,
    `Tanggal: ${formatDate(request.tanggal)}${request.waktu ? ` · ${escapeText(request.waktu)}` : ''}`,
    `Jumlah tamu: ${escapeText(request.jumlah) || 1} orang`,
    `No. HP: ${escapeText(request.no_hp) || '-'}`,
    ...(request.email ? [`Email: ${escapeText(request.email)}`] : []),
    ...(request.surat_tugas_url ? [`Surat tugas: ${request.surat_tugas_url}`] : []),
    '',
    'Silakan cek dashboard admin untuk menindaklanjuti.',
  ]
  return lines.join('\n')
}

function statusMessage(request = {}, status) {
  const labels = {
    Diterima: '✅ *Permohonan DITERIMA*',
    Ditolak: '❌ *Permohonan DITOLAK*',
    Selesai: '🏁 *Kunjungan SELESAI*',
  }
  const heading = labels[status] || `🔄 *Status diperbarui: ${escapeText(status)}*`

  const lines = [
    heading,
    '',
    `Kode: *${escapeText(requestCode(request.id))}*`,
    `Nama / Instansi: ${escapeText(request.nama) || '-'}`,
    `Tujuan: ${escapeText(request.tujuan) || '-'}`,
    `Tanggal: ${formatDate(request.tanggal)}${request.waktu ? ` · ${escapeText(request.waktu)}` : ''}`,
    `Status: *${escapeText(status)}*`,
  ]

  if (status === 'Diterima') {
    lines.push('', 'Tamu dapat dihubungi untuk konfirmasi kunjungan.')
  }

  return lines.join('\n')
}

export async function notifyNewRequest(request) {
  return sendToAdmins(newRequestMessage(request), 'pendaftaran baru')
}

export async function notifyStatusChange(request, status) {
  return sendToAdmins(statusMessage(request, status), `status ${status}`)
}
