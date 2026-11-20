import { useCallback, useEffect, useRef, useState } from 'react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import {
  ScanLine, Camera, CameraOff, Loader2, CheckCircle2, XCircle, Hourglass,
  BadgeCheck, AlertTriangle, Keyboard, Smartphone, Users, Clock3, X, Bell,
} from 'lucide-react'
import { api } from './lib/api'

const CARD = 'rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900'
const READER_ID = 'peta-qr-reader'

// ID perangkat per tab: dikirim saat scan agar HP pemindai tidak ikut
// menerima notifikasi dari scan-nya sendiri.
export function getDeviceId() {
  try {
    let id = window.sessionStorage.getItem('peta-skanida.device')
    if (!id) {
      id = Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
      window.sessionStorage.setItem('peta-skanida.device', id)
    }
    return id
  } catch {
    return 'dev-' + Math.random().toString(36).slice(2, 10)
  }
}

// Tampilan tiap hasil scan.
const HASIL = {
  valid: {
    label: 'Tamu Terdaftar',
    note: 'Permintaan kunjungan sudah disetujui. Silakan persilakan masuk.',
    icon: CheckCircle2,
    tone: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200',
    dot: 'bg-emerald-500',
  },
  pending: {
    label: 'Belum Disetujui',
    note: 'Permintaan masih menunggu persetujuan admin.',
    icon: Hourglass,
    tone: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200',
    dot: 'bg-amber-500',
  },
  ditolak: {
    label: 'Permintaan Ditolak',
    note: 'Permintaan kunjungan ini ditolak. Jangan izinkan masuk.',
    icon: XCircle,
    tone: 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200',
    dot: 'bg-rose-500',
  },
  selesai: {
    label: 'Kunjungan Sudah Selesai',
    note: 'Kode ini sudah dipakai dan kunjungannya ditandai selesai.',
    icon: BadgeCheck,
    tone: 'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200',
    dot: 'bg-sky-500',
  },
  tidak_ditemukan: {
    label: 'Kode Tidak Dikenal',
    note: 'Kode tidak ada di sistem. Minta tamu menunjukkan barcode/QR yang benar.',
    icon: AlertTriangle,
    tone: 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200',
    dot: 'bg-rose-500',
  },
}

const formatTime = value => {
  if (!value) return '-'
  const d = new Date(value)
  return Number.isNaN(d.getTime())
    ? '-'
    : d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function beep(ok = true) {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = ok ? 880 : 300
    gain.gain.setValueAtTime(0.0001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35)
    osc.connect(gain).connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.4)
    osc.onended = () => ctx.close()
  } catch {
    // Audio bisa diblokir browser; abaikan.
  }
}

export function notifySound(hasil) {
  beep(hasil === 'valid')
}

function GuestDetail({ guest }) {
  if (!guest) return null
  const rows = [
    ['Nama', guest.nama],
    ['Tujuan', guest.tujuan],
    ['Keperluan', guest.keperluan],
    ['Jumlah', guest.jumlah ? `${guest.jumlah} orang` : '-'],
    ['Jadwal', [guest.tanggal, guest.waktu].filter(Boolean).join(' · ') || '-'],
    ['No. HP', guest.no_hp],
  ]
  return (
    <dl className="mt-3 space-y-1.5 text-sm">
      {rows.map(([k, v]) => (
        <div key={k} className="flex gap-3">
          <dt className="w-20 shrink-0 text-xs font-semibold uppercase tracking-wide opacity-60">{k}</dt>
          <dd className="min-w-0 break-words font-medium">{v || '-'}</dd>
        </div>
      ))}
    </dl>
  )
}

function ResultCard({ scan }) {
  const meta = HASIL[scan.hasil] || HASIL.tidak_ditemukan
  const Icon = meta.icon
  return (
    <div className={`rounded-2xl border p-4 ${meta.tone}`} role="status">
      <div className="flex items-center gap-3">
        <Icon size={28} className="shrink-0" />
        <div className="min-w-0">
          <p className="text-lg font-bold leading-tight">{meta.label}</p>
          <p className="text-xs opacity-80">{scan.kode}</p>
        </div>
      </div>
      <p className="mt-2 text-sm">{meta.note}</p>
      <GuestDetail guest={scan.guest} />
    </div>
  )
}

/** Panel kamera: memindai QR (dan barcode Code 39) lalu memanggil onDecoded(kode). */
function CameraScanner({ onDecoded, disabled }) {
  const scannerRef = useRef(null)
  const runningRef = useRef(false)
  const lastRef = useRef({ kode: '', at: 0 })
  const onDecodedRef = useRef(onDecoded)
  const disabledRef = useRef(disabled)
  const [active, setActive] = useState(false)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { onDecodedRef.current = onDecoded }, [onDecoded])
  useEffect(() => { disabledRef.current = disabled }, [disabled])

  const stop = useCallback(async () => {
    const scanner = scannerRef.current
    scannerRef.current = null
    if (scanner && runningRef.current) {
      runningRef.current = false
      try { await scanner.stop() } catch { /* sudah berhenti */ }
    }
    try { scanner?.clear() } catch { /* abaikan */ }
    setActive(false)
  }, [])

  const start = useCallback(async () => {
    setError('')
    setStarting(true)
    try {
      if (!window.isSecureContext) {
        throw new Error('Kamera hanya bisa dipakai lewat HTTPS (atau localhost). Buka aplikasi dari alamat https://.')
      }
      const scanner = new Html5Qrcode(READER_ID, {
        verbose: false,
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE, Html5QrcodeSupportedFormats.CODE_39],
        useBarCodeDetectorIfSupported: true,
      })
      scannerRef.current = scanner
      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: (w, h) => ({
            width: Math.floor(Math.min(w, 420) * 0.9),
            height: Math.floor(Math.min(h * 0.7, 260)),
          }),
        },
        text => {
          if (disabledRef.current) return
          const now = Date.now()
          // Abaikan kode yang sama dalam 4 detik (kamera membaca berulang-ulang).
          if (text === lastRef.current.kode && now - lastRef.current.at < 4000) return
          lastRef.current = { kode: text, at: now }
          onDecodedRef.current(text)
        },
        () => {},
      )
      runningRef.current = true
      setActive(true)
    } catch (err) {
      scannerRef.current = null
      const message = String(err?.message || err)
      setError(
        /permission|denied|NotAllowed/i.test(message)
          ? 'Izin kamera ditolak. Izinkan akses kamera di pengaturan browser, lalu coba lagi.'
          : /NotFound|no camera/i.test(message)
            ? 'Kamera tidak ditemukan di perangkat ini.'
            : message,
      )
    } finally {
      setStarting(false)
    }
  }, [])

  useEffect(() => () => { stop() }, [stop])

  return (
    <div>
      <div
        id={READER_ID}
        className={`overflow-hidden rounded-2xl bg-slate-900 ${active ? '' : 'hidden'}`}
      />
      {!active && (
        <div className="grid place-items-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-950">
          <ScanLine size={40} className="text-indigo-400" />
          <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Kamera belum aktif</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Arahkan kamera ke QR code atau barcode tiket tamu.</p>
        </div>
      )}
      {error && (
        <p className="mt-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" /> {error}
        </p>
      )}
      <button
        type="button"
        onClick={active ? stop : start}
        disabled={starting}
        className={`mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white shadow-lg transition disabled:opacity-60 ${active ? 'bg-slate-700 hover:bg-slate-800' : 'bg-indigo-500 shadow-indigo-200/70 hover:bg-indigo-600 dark:shadow-indigo-950/40'}`}
      >
        {starting ? <Loader2 size={17} className="animate-spin" /> : active ? <CameraOff size={17} /> : <Camera size={17} />}
        {starting ? 'Membuka kamera...' : active ? 'Matikan Kamera' : 'Aktifkan Kamera'}
      </button>
    </div>
  )
}

/** Halaman "Scan Tamu": pemindai di HP + daftar scan terbaru (live) di laptop. */
export function ScanPage({ scans = [], onScanned }) {
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [manual, setManual] = useState('')
  const deviceId = useRef(getDeviceId()).current

  const submit = useCallback(async kode => {
    const value = String(kode || '').trim()
    if (!value) return
    setBusy(true)
    setError('')
    try {
      const { scan } = await api.scanGuest(value, deviceId)
      setResult(scan)
      notifySound(scan.hasil)
      try { navigator.vibrate?.(scan.hasil === 'valid' ? 120 : [80, 60, 80]) } catch { /* abaikan */ }
      onScanned?.(scan)
    } catch (err) {
      setError(err.message || 'Gagal memproses scan.')
    } finally {
      setBusy(false)
    }
  }, [deviceId, onScanned])

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
      <div className="space-y-4">
        <div className={`${CARD} p-5`}>
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300"><Smartphone size={20} /></div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-slate-100">Scan Tamu</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Buka halaman ini di HP, lalu scan QR tiket tamu.</p>
            </div>
          </div>
          <CameraScanner onDecoded={submit} disabled={busy} />

          <form
            className="mt-4 flex gap-2"
            onSubmit={e => { e.preventDefault(); submit(manual); setManual('') }}
          >
            <div className="relative flex-1">
              <Keyboard size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={manual}
                onChange={e => setManual(e.target.value)}
                placeholder="Atau ketik kode, mis. REQ-007"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-indigo-500/20"
              />
            </div>
            <button type="submit" disabled={busy || !manual.trim()} className="rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-40 dark:bg-slate-700">
              Cek
            </button>
          </form>
        </div>

        {busy && (
          <p className="flex items-center justify-center gap-2 text-sm text-slate-500"><Loader2 size={16} className="animate-spin" /> Memeriksa kode...</p>
        )}
        {error && (
          <p className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" /> {error}
          </p>
        )}
        {result && !busy && <ResultCard scan={result} />}
      </div>

      <div className={`${CARD} self-start`}>
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100">Scan terbaru</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Diperbarui otomatis saat ada tamu yang discan.</p>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> Live
          </span>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {scans.length ? scans.map(scan => {
            const meta = HASIL[scan.hasil] || HASIL.tidak_ditemukan
            return (
              <div key={scan.id} className="flex items-start gap-3 px-5 py-3.5">
                <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${meta.dot}`} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {scan.guest?.nama || 'Tidak dikenal'} <span className="font-normal text-slate-400">· {scan.kode}</span>
                  </p>
                  <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                    {meta.label}{scan.guest?.tujuan ? ` · ${scan.guest.tujuan}` : ''}
                  </p>
                </div>
                <div className="shrink-0 text-right text-[11px] text-slate-400 dark:text-slate-500">
                  <p className="flex items-center justify-end gap-1"><Clock3 size={11} />{formatTime(scan.scanned_at)}</p>
                  <p className="mt-0.5">{scan.scanned_by || '-'}</p>
                </div>
              </div>
            )
          }) : (
            <p className="px-5 py-12 text-center text-sm text-slate-400 dark:text-slate-500">Belum ada tamu yang discan.</p>
          )}
        </div>
      </div>
    </div>
  )
}

/** Notifikasi pop-up (kanan atas) di laptop admin saat ada scan baru dari HP. */
export function ScanAlerts({ alerts = [], onDismiss, onOpen }) {
  if (!alerts || !alerts.length) return null
  return (
    <div className="fixed right-4 top-4 z-[90] flex w-[360px] max-w-[calc(100%-32px)] flex-col gap-3">
      {alerts.map(scan => {
        const meta = HASIL[scan.hasil] || HASIL.tidak_ditemukan
        const Icon = meta.icon
        return (
          <div key={scan.id} role="alert" className={`rounded-2xl border p-4 shadow-xl backdrop-blur ${meta.tone}`}>
            <div className="flex items-start gap-3">
              <Icon size={22} className="mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide opacity-70"><Bell size={11} /> Scan baru dari HP</p>
                <p className="mt-0.5 truncate font-bold">{scan.guest?.nama || 'Kode tidak dikenal'}</p>
                <p className="text-xs opacity-80">{meta.label} · {scan.kode}</p>
                {scan.guest && (
                  <p className="mt-1.5 flex items-center gap-1 text-xs opacity-80">
                    <Users size={12} /> {scan.guest.jumlah || 1} orang · {scan.guest.tujuan || '-'}
                  </p>
                )}
                <button onClick={() => onOpen(scan)} className="mt-2 text-xs font-bold underline underline-offset-2">Lihat detail</button>
              </div>
              <button onClick={() => onDismiss(scan.id)} aria-label="Tutup notifikasi" className="rounded-lg p-1 opacity-60 transition hover:opacity-100"><X size={16} /></button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
