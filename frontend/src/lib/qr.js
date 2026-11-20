import QRCode from 'qrcode'

// ID kanvas QR tamu. Dipakai bersama oleh halaman sukses dan fungsi unduh
// (lihat downloadBarcode di barcode.js yang menggabungkan barcode + QR).
export const QR_CANVAS_ID = 'guest-qr-canvas'

/** Gambar QR code berisi `value` ke elemen <canvas>. */
export function drawQr(canvas, value, size = 220) {
  return QRCode.toCanvas(canvas, String(value || ''), {
    width: size,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: { dark: '#0f172a', light: '#ffffff' },
  })
}
