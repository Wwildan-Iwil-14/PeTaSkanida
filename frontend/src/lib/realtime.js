import { supabase } from './supabaseClient'

/**
 * Berlangganan perubahan data request di database.
 * Callback dipanggil setiap ada insert baru sehingga dashboard admin
 * otomatis memuat ulang data dari backend.
 */
export function subscribeToRequests(onChange) {
  if (!supabase) return () => {}

  const channel = supabase
    .channel('realtime-requests')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'req_pending' }, onChange)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'req_acc' }, onChange)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'req_reject' }, onChange)
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'req_acc' }, onChange)
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
