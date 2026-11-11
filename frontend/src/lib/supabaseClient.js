import { createClient } from '@supabase/supabase-js'

/**
 * Klien Supabase publik (anon key) - hanya dipakai untuk suscripción real-time
 * di dashboard admin. Akses data & operasi tulis melewati backend REST.
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null

if (!supabase) {
  console.warn(
    'Real-time nonaktif: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY belum diisi di frontend/.env.local.',
  )
}
