// ============================================
// Generator barcode Code 39 murni JavaScript.
// Tidak memakai library eksternal agar tetap bisa
// dipakai tanpa perlu npm install tambahan.
// ============================================
import { QR_CANVAS_ID } from './qr.js'

// Pola Code 39: 9 elemen per karakter (baris-spasi bergantian,
// diawali baris). 'n' = narrow (tipis), 'w' = wide (tebal).
const CODE39 = {
  '0': 'nnnwwnwnn',
  '1': 'wnnwnnnnw',
  '2': 'nnwwnnnnw',
  '3': 'wnwwnnnnn',
  '4': 'nnnwwnnnw',
  '5': 'wnnwwnnnn',
  '6': 'nnwwwnnnn',
  '7': 'nnnwnnwnw',
  '8': 'wnnwnnwnn',
  '9': 'nnwwnnwnn',
  A: 'wnnnnwnnw',
  B: 'nnwnnwnnw',
  C: 'wnwnnwnnn',
  D: 'nnnnwwnnw',
  E: 'wnnnwwnnn',
  F: 'nnwnwwnnn',
  G: 'nnnnnwwnw',
  H: 'wnnnnwwnn',
  I: 'nnwnnwwnn',
  J: 'nnnnwwwnn',
  K: 'wnnnnnnww',
  L: 'nnwnnnnww',
  M: 'wnwnnnnwn',
  N: 'nnnnwnnww',
  O: 'wnnnwnnwn',
  P: 'nnwnwnnwn',
  Q: 'nnnnnnwww',
  R: 'wnnnnnwwn',
  S: 'nnwnnnwwn',
  T: 'nnnnwnwwn',
  U: 'wwnnnnnnw',
  V: 'nwwnnnnnw',
  W: 'wwwnnnnnn',
  X: 'nwnnwnnnw',
  Y: 'wwnnwnnnn',
  Z: 'nwwnwnnnn',
  '-': 'nwnnnnwnw',
  '.': 'wwnnnnwnn',
  ' ': 'nwwnnnwnn',
  $: 'nwnwnwnnn',
  '/': 'nwnwnnnwn',
  '+': 'nwnnnwnwn',
  '%': 'nnnwnwnwn',
  '*': 'nwnnwnwnn', // start / stop
}

const NARROW = 1
const WIDE = 3

// Ubah nilai teks menjadi daftar elemen baris/spasi.
function encodeCode39(value) {
  const text = String(value || '').toUpperCase()
  // Code 39 selalu diawali dan diakhiri tanda '*'.
  const full = `*${text}*`
  const elements = []

  for (let i = 0; i < full.length; i += 1) {
    const pattern = CODE39[full[i]]
    if (!pattern) {
      throw new Error(`Karakter "${full[i]}" tidak didukung barcode Code 39.`)
    }
    for (let e = 0; e < 9; e += 1) {
      elements.push({
        bar: e % 2 === 0, // elemen genap = baris, ganjil = spasi
        width: pattern[e] === 'w' ? WIDE : NARROW,
      })
    }
    // Jarak antar karakter = satu spasi tipis.
    if (i < full.length - 1) {
      elements.push({ bar: false, width: NARROW })
    }
  }
  return elements
}

/**
 * Gambar barcode ke elemen <canvas>.
 * Mengembalikan lebar canvas dalam pixel.
 */
export function drawBarcode(canvas, value, options = {}) {
  const {
    scale = 3, // pixel per satuan tipis
    height = 110, // tinggi baris dalam pixel
    fontSize = 22, // ukuran teks yang terbaca manusia
    quiet = 10, // margin putih (quiet zone) dalam satuan tipis
    text = String(value || ''),
  } = options

  const elements = encodeCode39(value)
  const unit = scale
  const quietPx = quiet * unit
  const barcodeWidth = elements.reduce((total, el) => total + el.width * unit, 0)
  const textHeight = text ? fontSize + 12 : 0
  const paddingTop = 10
  const totalWidth = barcodeWidth + quietPx * 2
  const totalHeight = paddingTop + height + textHeight + 10

  const ctx = canvas.getContext('2d')
  canvas.width = totalWidth
  canvas.height = totalHeight

  // Latar putih (penting agar barcode tetap terbaca saat diunduh).
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, totalWidth, totalHeight)

  // Gambar hanya baris; spasi dibiarkan putih.
  ctx.fillStyle = '#0f172a'
  let x = quietPx
  for (const el of elements) {
    const w = el.width * unit
    if (el.bar) ctx.fillRect(x, paddingTop, w, height)
    x += w
  }

  // Teks yang bisa dibaca manusia di bawah barcode.
  if (text) {
    ctx.fillStyle = '#0f172a'
    ctx.font = `600 ${fontSize}px ui-monospace, SFMono-Regular, Menlo, monospace`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'alphabetic'
    ctx.fillText(text, totalWidth / 2, paddingTop + height + fontSize + 4)
  }

  return totalWidth
}

/** Ambil barcode sebagai data URL PNG (untuk diunduh). */
export function barcodeDataUrl(canvas) {
  return canvas.toDataURL('image/png')
}

// ID kanvas barcode tamu. Dipakai bersama oleh tombol di halaman sukses
// dan oleh notifikasi sistem saat pengguna mencoba keluar.
export const BARCODE_CANVAS_ID = 'guest-barcode-canvas'

/**
 * Unduh barcode yang sedang ditampilkan sebagai file PNG.
 * Mengembalikan true jika unduhan berhasil dipicu.
 */
export function downloadBarcode(value) {
  const barcode = document.getElementById(BARCODE_CANVAS_ID)
  if (!barcode) return false
  try {
    // Bila QR juga ditampilkan, gabungkan keduanya dalam satu gambar tiket
    // (barcode di atas, QR di bawah) supaya satu file bisa dipakai kedua-duanya.
    const qr = document.getElementById(QR_CANVAS_ID)
    let source = barcode
    if (qr && qr.width > 0) {
      const gap = 16
      const combined = document.createElement('canvas')
      combined.width = Math.max(barcode.width, qr.width)
      combined.height = barcode.height + gap + qr.height + gap
      const ctx = combined.getContext('2d')
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, combined.width, combined.height)
      ctx.drawImage(barcode, (combined.width - barcode.width) / 2, 0)
      ctx.drawImage(qr, (combined.width - qr.width) / 2, barcode.height + gap)
      source = combined
    }
    const link = document.createElement('a')
    link.download = `tiket-${value}.png`
    link.href = source.toDataURL('image/png')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    return true
  } catch {
    return false
  }
}
