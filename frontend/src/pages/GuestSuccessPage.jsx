import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, ChevronRight, Copy, Check, Download, AlertTriangle, FileText } from 'lucide-react'
import { drawBarcode, downloadBarcode, BARCODE_CANVAS_ID } from '../lib/barcode'
import { drawQr, QR_CANVAS_ID } from '../lib/qr'
import { CARD, formatDate } from '../lib/appConstants'
import { ThemeToggleCorner } from '../components/ui'

function BarcodeBlock({ value, saved, onDownloaded }) {
  const canvasRef = useRef(null)
  const qrRef = useRef(null)

  useEffect(() => {
    if (!canvasRef.current || !value) return
    try {
      drawBarcode(canvasRef.current, value, { scale: 3, height: 110, fontSize: 22 })
    } catch {
      // Jika nilai tidak didukung, biarkan kanvas kosong.
    }
  }, [value])

  // QR code berisi kode yang sama; ini yang discan petugas lewat HP.
  useEffect(() => {
    if (!qrRef.current || !value) return
    drawQr(qrRef.current, value, 220).catch(() => {})
  }, [value])

  function handleDownload() {
    if (downloadBarcode(value)) onDownloaded()
  }

  return (
    <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/40 p-4 dark:border-blue-500/30 dark:bg-blue-500/5">
      <p className="text-center text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-300">Barcode Kunjungan Kamu</p>
      <p className="mt-1 text-center text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
        Barcode ini unik untuk permintaan kamu. Simpan dan tunjukkan saat tiba di sekolah.
      </p>
      <div className="mt-3 flex justify-center overflow-x-auto rounded-xl bg-white p-3 dark:bg-slate-100">
        <canvas ref={canvasRef} id={BARCODE_CANVAS_ID} className="max-w-full" aria-label={`Barcode ${value}`} role="img" />
      </div>
      <div className="mt-3 flex justify-center rounded-xl bg-white p-3 dark:bg-slate-100">
        <canvas ref={qrRef} id={QR_CANVAS_ID} className="h-[220px] w-[220px] max-w-full" aria-label={`QR code ${value}`} role="img" />
      </div>
      <p className="mt-2 text-center text-[11px] text-slate-500 dark:text-slate-400">Petugas dapat memindai barcode maupun QR code di atas.</p>
      <button
        type="button"
        onClick={handleDownload}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-200/70 transition hover:bg-blue-600 dark:shadow-blue-950/40"
      >
        <Download size={16} />
        {saved ? 'Unduh Lagi Tiket' : 'Unduh Tiket (Barcode + QR)'}
      </button>
      <p className="mt-2 text-center text-xs font-semibold text-rose-500 dark:text-rose-400">Kamu harus mengunduh barcode</p>
      {saved ? (
        <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 size={14} /> Barcode tersimpan. Kamu sudah boleh keluar dari halaman ini.
        </p>
      ) : (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-left dark:border-amber-500/30 dark:bg-amber-500/10">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-500 dark:text-amber-400" />
          <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-300">
            <span className="font-bold">Peringatan:</span> Jika barcode tidak bisa diunduh, ada <span className="font-bold">opsi kedua</span> — ambil <span className="font-bold">screenshot</span> barcode ini lalu simpan di perangkatmu.
          </p>
        </div>
      )}
    </div>
  )
}

function GuestSuccessPage({ data, onAgain, onBack, theme, onToggleTheme, saved, onDownloaded }) {
  const [copied, setCopied] = useState(false)
  const ref = data?.kode || (data?.id ? `REQ-${String(data.id).padStart(3, '0')}` : '')

  async function copyRef() {
    if (!ref) return
    try {
      await navigator.clipboard.writeText(ref)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard tidak tersedia; abaikan
    }
  }

  const rows = [
    ['Nama / Instansi', data?.nama],
    ['Tujuan', data?.tujuan],
    ['Keperluan', data?.keperluan],
    ['Tanggal', formatDate(data?.tanggal)],
    ['Waktu', data?.waktu ? `${data.waktu} WIB` : '-'],
    ['Jumlah Pengunjung', data?.jumlah ? `${data.jumlah} orang` : '-'],
    ['Surat Tugas', data?.suratTugasUrl ? (
      <a href={data.suratTugasUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-indigo-600 hover:underline dark:text-indigo-400">
        <FileText size={13} /> {data.suratTugasNama || 'Lihat surat tugas'}
      </a>
    ) : (data?.suratTugasNama || '-')],
  ]

  if (data?.suratTugasUrl) {
    rows.push(['Ditujukan Ke', data?.suratTugasEmail || '-'])
  }

  return (
    <div className="relative min-h-screen bg-[#f5f7fb] px-4 py-10 dark:bg-slate-950 sm:px-8">
      <ThemeToggleCorner theme={theme} onToggleTheme={onToggleTheme} />
      <div className="mx-auto max-w-xl pt-10 sm:pt-0">
        <button onClick={onBack} className="mb-6 flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400">
          <ChevronRight className="rotate-180" size={17} /> Kembali ke halaman login
        </button>
        <div className={`${CARD} p-6 sm:p-8`}>
          <div className="flex flex-col items-center text-center">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
              <CheckCircle2 size={34} />
            </div>
            <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Permintaan Terkirim!</h1>
            <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
              Terima kasih, <span className="font-semibold text-slate-700 dark:text-slate-300">{data?.nama}</span>.
              Permintaan kunjungan Anda sudah kami terima dan akan diverifikasi oleh admin.
            </p>
          </div>

          {ref && (
            <div className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 dark:border-indigo-500/30 dark:bg-indigo-500/10">
              <p className="text-center text-xs font-semibold uppercase tracking-wider text-indigo-500 dark:text-indigo-300">Kode Referensi</p>
              <div className="mt-2 flex items-center justify-center gap-2">
                <span className="text-2xl font-extrabold tracking-widest text-indigo-700 dark:text-indigo-200">{ref}</span>
                <button
                  type="button"
                  onClick={copyRef}
                  aria-label="Salin kode referensi"
                  className="rounded-lg p-1.5 text-indigo-500 transition hover:bg-indigo-100 dark:text-indigo-300 dark:hover:bg-indigo-500/20"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
              <p className="mt-2 text-center text-xs text-indigo-500/90 dark:text-indigo-300/80">Simpan kode ini untuk menanyakan status kunjungan Anda.</p>
            </div>
          )}

          {ref && <BarcodeBlock value={ref} saved={saved} onDownloaded={onDownloaded} />}

          <dl className="mt-6 divide-y divide-slate-100 rounded-2xl border border-slate-100 dark:divide-slate-800 dark:border-slate-800">
            {rows.map(([label, value]) => (
              <div key={label} className="flex items-start justify-between gap-4 px-4 py-3">
                <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</dt>
                <dd className="text-right text-sm font-semibold text-slate-800 dark:text-slate-200">{value || '-'}</dd>
              </div>
            ))}
          </dl>

          <button onClick={onAgain} className="mt-6 w-full rounded-xl bg-indigo-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-600 dark:shadow-indigo-950/40">Ajukan Permintaan Lain</button>
          <button onClick={onBack} className="mt-3 w-full rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Kembali ke Halaman Login</button>
        </div>
      </div>
    </div>
  )
}

export { BarcodeBlock, GuestSuccessPage }

export default GuestSuccessPage
