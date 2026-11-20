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
