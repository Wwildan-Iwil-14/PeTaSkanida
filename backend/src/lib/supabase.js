import { createClient } from '@supabase/supabase-js'
import { config } from '../config.js'

/**
 * Klien admin (service role key):
 * Digunakan untuk seluruh query database (bypasses RLS),
 * dan operasi administrasi auth (auth.admin.*).
 *
 * Client ini TIDAK boleh menjalankan signInWithPassword agar tidak mengubah
 * authorization header (service role) menjadi user session.
 */
export const supabase = createClient(
  config.supabaseUrl,
  config.supabaseServiceRoleKey || config.supabaseKey,
  {
    auth: { persistSession: false, autoRefreshToken: false },
  },
)

/**
 * Klien auth khusus untuk verifikasi user (login / refresh session):
 * Menggunakan anon key terpisah agar pemanggilan signInWithPassword / refreshSession
 * terisolasi dan tidak merusak hak akses service role pada klien database admin.
 */
export const supabaseAuth = createClient(
  config.supabaseUrl,
  config.supabaseAnonKey || config.supabaseKey,
  {
    auth: { persistSession: false, autoRefreshToken: false },
  },
)
