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
  corsOrigins: toList(process.env.CORS_ORIGIN || 'http://localhost:5173'),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Google Drive (opsional) — dipakai untuk menyimpan surat tugas tamu.
  // Upload tetap opsional: request tanpa file tetap bisa dikirim.
  googleServiceAccountEmail: (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '').trim(),
  // .env sering menulis private key dengan "\\n" literal → ubah ke newline.
  googlePrivateKey: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  googleDriveFolderId: (process.env.GOOGLE_DRIVE_FOLDER_ID || '').trim(),
  googleDriveFolderName: (process.env.GOOGLE_DRIVE_FOLDER_NAME || 'doc_kunjungan').trim(),
  googleDrivePublicLink: process.env.GOOGLE_DRIVE_PUBLIC_LINK !== 'false',

  // Email tujuan dokumen surat tugas. Sementara memakai gmail pribadi;
  // cukup ganti nilai ini di .env saat email sekolah sudah tersedia.
  suratTugasEmail: (process.env.SURAT_TUGAS_EMAIL || 'rubikesper@gmail.com').trim(),
}

export const isGoogleDriveConfigured = Boolean(
  config.googleServiceAccountEmail && config.googlePrivateKey,
)

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
