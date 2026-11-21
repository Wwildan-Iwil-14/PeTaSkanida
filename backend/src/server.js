import { createApp } from './app.js'
import { config, validateConfig } from './config.js'

try {
  validateConfig()
} catch (error) {
  console.error(`\n[backend] ${error.message}\n`)
  process.exit(1)
}

const app = createApp()

const server = app.listen(config.port, () => {
  console.log(`[backend] PeTa SKANIDA API berjalan di http://localhost:${config.port}/api`)
  console.log(
    config.usingServiceRole
      ? '[backend] Mengakses database dengan service role key (akses penuh).'
      : '[backend] PERINGATAN: memakai ANON key. Jalankan migration database/20261111000000_tighten_rls.sql dan gunakan service role key.',
  )
})

// Beri pesan yang jelas bila port dipakai proses lain (misalnya ada session
// `npm run dev` yang masih berjalan) daripada membiarkan stack trace EADDRINUSE.
server.on('error', error => {
  if (error.code === 'EADDRINUSE') {
    console.error(
      `\n[backend] Port ${config.port} sudah dipakai proses lain.\n` +
        'Hentikan sesi dev sebelumnya (Ctrl+C) atau ubah PORT di backend/.env.\n',
    )
    process.exit(1)
  }
  console.error('[backend] Gagal menjalankan server:', error)
  process.exit(1)
})
