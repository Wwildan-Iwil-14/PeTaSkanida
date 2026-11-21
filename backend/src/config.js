import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..')

// .env dimuat relatif terhadap folder backend, bukan folder kerja saat ini,
// sehingga backend tetap jalan walau dipanggil dari root repository.
dotenv.config({ path: path.join(root, '.env') })
dotenv.config({ path: path.join(root, '.env.local'), override: true })

const toList = value =>
  (value || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)

const nodeEnv = process.env.NODE_ENV || 'development'

export const config = {
  port: Number(process.env.PORT || 3001),
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  // Service role = akses penuh (tidak tunduk RLS). Anon key = fallback untuk
  // database yang belum dijalankan migration pengetatan RLS.
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '',
  usingServiceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  // Catatan: masa berlaku & tanda tangan token login diurus Supabase Auth (GoTrue),
  // sehingga AUTH_SECRET / TOKEN_TTL_SECONDS tidak lagi dipakai.
  // Origin produksi Vercel selalu diizinkan walaupun CORS_ORIGIN di dashboard
  // masih berisi nilai development, supaya /api bisa dipanggil dari frontend
  // yang di-host di domain yang sama.
  corsOrigins: [
    ...new Set([
      ...toList(process.env.CORS_ORIGIN || 'http://localhost:5173'),
      'https://petaskanida.vercel.app',
    ]),
  ],
  nodeEnv,

  // Email tujuan dokumen surat tugas. Sementara memakai gmail pribadi;
  // cukup ganti nilai ini di .env saat email sekolah sudah tersedia.
  suratTugasEmail: (process.env.SURAT_TUGAS_EMAIL || 'rubikesper@gmail.com').trim(),

  // ===== Notifikasi Web Push (browser) =====
  vapidPublicKey: (process.env.VAPID_PUBLIC_KEY || '').trim(),
  vapidPrivateKey: (process.env.VAPID_PRIVATE_KEY || '').trim(),
  vapidSubject: (process.env.VAPID_SUBJECT || 'mailto:admin@petaskanida.sch.id').trim(),
  pushFrontendUrl: (
    process.env.PUSH_FRONTEND_URL ||
    (nodeEnv === 'production'
      ? 'https://petaskanida.vercel.app'
      : (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',')[0].trim())
  ).replace(/\/+$/, ''),
}

export function validateConfig() {
  const missing = []
  if (!config.supabaseUrl) missing.push('SUPABASE_URL')
  if (!config.supabaseKey) {
    missing.push('SUPABASE_SERVICE_ROLE_KEY (atau SUPABASE_ANON_KEY sebagai fallback)')
  }
  if (missing.length > 0) {
    throw new Error(
      `Konfigurasi backend belum lengkap: ${missing.join(', ')}.\n` +
        'Salin backend/.env.example menjadi backend/.env lalu isi nilainya.',
    )
  }
}
