import { supabase } from './supabaseClient'

/**
 * Berlangganan perubahan data request di database.
 * Callback dipanggil saat ada data ditambah, diubah, maupun dihapus agar
 * dashboard admin selalu memuat ulang data dari backend.
 */
export function subscribeToRequests(onChange) {
  if (!supabase) return () => {}

  const tables = ['req_pending', 'req_acc', 'req_reject', 'riwayat']
  const events = ['INSERT', 'UPDATE', 'DELETE']
  const channel = supabase.channel('realtime-requests')

  for (const table of tables) {
    for (const event of events) {
      channel.on('postgres_changes', { event, schema: 'public', table }, onChange)
    }
  }

  channel.subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

/**
 * Berlangganan scan baru (INSERT di scan_logs). Dipakai laptop admin untuk
 * menampilkan notifikasi saat petugas memindai QR tamu lewat HP.
 */
export function subscribeToScans(onInsert) {
  if (!supabase) return () => {}

  const channel = supabase
    .channel(`realtime-scans-${Math.random().toString(36).slice(2, 8)}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'scan_logs' }, onInsert)
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
