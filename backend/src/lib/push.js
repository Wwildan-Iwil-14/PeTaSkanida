import webpush from 'web-push'
import { config } from '../config.js'
import { supabase } from './supabase.js'

const requestCode = id => `REQ-${String(id ?? '').padStart(3, '0')}`

// Notifikasi Web Push dikirim ke browser admin yang sudah berlangganan.
// subscription disimpan di tabel push_subscriptions (hanya backend yang bisa
// menulis/membaca lewat service role key). Pesan tidak disimpan di database.

let vapidConfigured = false

function setupVapid() {
  if (vapidConfigured) return true
  if (!config.vapidPublicKey || !config.vapidPrivateKey) return false

  webpush.setVapidDetails(config.vapidSubject, config.vapidPublicKey, config.vapidPrivateKey)
  vapidConfigured = true
  return true
}

export function isPushEnabled() {
  return Boolean(supabase && config.vapidPublicKey && config.vapidPrivateKey)
}

function formatDate(value) {
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
 * Kirim satu notifikasi ke semua perangkat yang terdaftar.
 * Tidak pernah melempar error: kegagalan push tidak boleh mengganggu request.
 */
export async function sendPush({ title, body, tag = 'peta-skanida' }) {
  if (!isPushEnabled() || !setupVapid()) {
    console.warn('[push] VAPID key belum diisi; notifikasi browser dilewati.')
    return { skipped: true }
  }

  const { data: rows, error } = await supabase
    .from('push_subscriptions')
    .select('id, subscription, admin_user_id')

  if (error) {
    console.warn(`[push] Gagal memuat subscription: ${error.message}`)
    return { sent: 0, total: 0 }
  }
  if (!rows?.length) return { sent: 0, total: 0 }

  const payload = JSON.stringify({
    title,
    body,
    tag,
    url: `${config.pushFrontendUrl}/`,
  })

  const results = await Promise.allSettled(
    rows.map(row => webpush.sendNotification(row.subscription, payload)),
  )

  let sent = 0
  const staleIds = []
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      sent += 1
      return
    }

    const status = result.reason?.statusCode
    if (status === 404 || status === 410) {
      // Perangkat sudah unsubscribe / subscription kedaluwarsa.
      staleIds.push(rows[index].id)
    } else {
      console.warn(`[push] Gagal kirim ke subscription ${rows[index].id}: ${result.reason?.message || result.reason}`)
    }
  })

  if (staleIds.length) {
    await supabase.from('push_subscriptions').delete().in('id', staleIds)
  }

  console.log(`[push] "${title}": terkirim ke ${sent}/${rows.length} perangkat.`)
  return { sent, total: rows.length }
}

export async function notifyNewRequest(request = {}) {
  return sendPush({
    title: 'Permintaan kunjungan baru',
    body: `${request.nama || '-'} · ${request.tujuan || '-'} · ${formatDate(request.tanggal)} (${requestCode(request.id)})`,
    tag: `new-request-${request.id ?? ''}`,
  })
}

const STATUS_TITLES = {
  Diterima: 'Permohonan diterima',
  Ditolak: 'Permohonan ditolak',
  Selesai: 'Kunjungan selesai',
}

export async function notifyStatusChange(request = {}, status) {
  return sendPush({
    title: STATUS_TITLES[status] || 'Status kunjungan berubah',
    body: `${requestCode(request.id)} · ${request.nama || '-'} · ${formatDate(request.tanggal)}`,
    tag: `status-${request.id ?? ''}-${status}`,
  })
}
