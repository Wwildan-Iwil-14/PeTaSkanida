import { createApp } from './app.js'
import { config, validateConfig } from './config.js'

try {
  validateConfig()
} catch (error) {
  console.error(`\n[backend] ${error.message}\n`)
  process.exit(1)
}

const app = createApp()

app.listen(config.port, () => {
  console.log(`[backend] PeTa SKANIDA API berjalan di http://localhost:${config.port}/api`)
  console.log(
    config.usingServiceRole
      ? '[backend] MengACCESS database dengan service role key (akses penuh).'
      : '[backend] PERINGATAN: memakai ANON key. Jalankan migration database/20261111000000_tighten_rls.sql dan gunakan service role key.',
  )
})
