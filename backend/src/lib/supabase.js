import { createClient } from '@supabase/supabase-js'
import { config } from '../config.js'

// Klien admin: memakai service role key sehingga operasi tulis (setujui /
// tolak request) tidak melewati aturan RLS tabel di database.
export const supabase = createClient(config.supabaseUrl, config.supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})
