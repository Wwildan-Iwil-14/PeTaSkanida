import { config } from '../src/config.js'
import { isWhatsappEnabled, sendText, normalizeNumber } from '../src/lib/whatsapp.js'

if (!isWhatsappEnabled()) {
  console.error(
    'Notifikasi WhatsApp belum aktif.\n' +
      'Isi FONNTE_TOKEN dan WHATSAPP_NOTIFY_NUMBERS di backend/.env, lalu jalankan ulang skrip ini.',
  )
  process.exit(1)
}

const targets = [...new Set(config.whatsappTargets.map(normalizeNumber).filter(Boolean))]

console.log(`Mengirim pesan uji ke ${targets.length} nomor...`)

const results = await Promise.allSettled(
  targets.map(target =>
    sendText({
      target,
      message:
        '✅ *Tes notifikasi PeTa SKANIDA*\n\n' +
        'Jika pesan ini muncul, pengaturan WhatsApp sudah benar.\n' +
        'Notifikasi akan dikirim otomatis saat tamu mendaftar dan saat status kunjungan berubah.',
    }),
  ),
)

let failed = 0
results.forEach((result, index) => {
  if (result.status === 'fulfilled') {
    console.log(`  ✔ ${targets[index]}: terkirim`)
  } else {
    failed += 1
    console.error(`  ✘ ${targets[index]}: ${result.reason?.message || result.reason}`)
  }
})

process.exit(failed ? 1 : 0)
