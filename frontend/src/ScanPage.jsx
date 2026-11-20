import { useCallback, useEffect, useRef, useState } from 'react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import {
  ScanLine, Camera, CameraOff, Loader2, CheckCircle2, XCircle, Hourglass,
  BadgeCheck, AlertTriangle, Keyboard, Smartphone, Users, Clock3, X, Bell,
  RefreshCw, Zap, Volume2, VolumeX, ArrowRight,
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
    tone: 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200',
    dot: 'bg-emerald-500',
    badgeTone: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300',
  },
  pending: {
    label: 'Belum Disetujui',
    note: 'Permintaan masih menunggu persetujuan admin.',
    icon: Hourglass,
    tone: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200',
    dot: 'bg-amber-500',
    badgeTone: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300',
  },
  ditolak: {
    label: 'Permintaan Ditolak',
    note: 'Permintaan kunjungan ini ditolak. Jangan izinkan masuk.',
    icon: XCircle,
    tone: 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200',
    dot: 'bg-rose-500',
    badgeTone: 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300',
  },
  selesai: {
    label: 'Kunjungan Sudah Selesai',
    note: 'Kode ini sudah dipakai dan kunjungannya ditandai selesai.',
    icon: BadgeCheck,
    tone: 'border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200',
    dot: 'bg-sky-500',
    badgeTone: 'bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300',
  },
  tidak_ditemukan: {
    label: 'Kode Tidak Dikenal',
    note: 'Kode tidak ada di sistem. Minta tamu menunjukkan barcode/QR yang benar.',
    icon: AlertTriangle,
    tone: 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200',
    dot: 'bg-rose-500',
    badgeTone: 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300',
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
    osc.frequency.value = ok ? 880 : 320
    gain.gain.setValueAtTime(0.0001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3)
    osc.connect(gain).connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.32)
    osc.onended = () => ctx.close()
  } catch {
    // Audio bisa diblokir browser; abaikan.
  }
}

export function notifySound(hasil, soundEnabled = true) {
  if (!soundEnabled) return
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
    <dl className="mt-3 space-y-1.5 text-xs sm:text-sm">
      {rows.map(([k, v]) => (
        <div key={k} className="flex gap-2 sm:gap-3">
          <dt className="w-18 sm:w-20 shrink-0 text-[11px] font-semibold uppercase tracking-wider opacity-70">{k}</dt>
          <dd className="min-w-0 break-words font-medium">{v || '-'}</dd>
        </div>
      ))}
    </dl>
  )
}

function ResultCard({ scan, onDismiss, onCompleteVisit }) {
  const meta = HASIL[scan.hasil] || HASIL.tidak_ditemukan
  const Icon = meta.icon
  const [completing, setCompleting] = useState(false)
  const [completed, setCompleted] = useState(false)

  const canComplete = scan.guest && (scan.hasil === 'valid' || scan.guest.status === 'Diterima') && !completed

  async function handleComplete() {
    if (!scan.guest?.id || completing) return
    setCompleting(true)
    try {
      if (onCompleteVisit) {
        await onCompleteVisit(scan.guest.id)
      } else {
        await api.completeRequest(scan.guest.id)
      }
      setCompleted(true)
    } catch (err) {
      alert(err.message || 'Gagal menyelesaikan kunjungan.')
    } finally {
      setCompleting(false)
    }
  }

  const effectiveMeta = completed ? HASIL.selesai : meta
  const EffectiveIcon = effectiveMeta.icon

  return (
    <div className={`relative rounded-2xl border p-4 sm:p-5 shadow-md ${effectiveMeta.tone}`} role="status">
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Tutup hasil"
          className="absolute right-3.5 top-3.5 rounded-lg p-1 opacity-60 hover:opacity-100 hover:bg-black/10 transition"
        >
          <X size={17} />
        </button>
      )}
      <div className="flex items-center gap-3 pr-6">
        <EffectiveIcon size={30} className="shrink-0" />
        <div className="min-w-0">
          <p className="text-base sm:text-lg font-bold leading-tight">{effectiveMeta.label}</p>
          <p className="text-xs font-mono opacity-80 mt-0.5">{scan.kode}</p>
        </div>
      </div>
      <p className="mt-2.5 text-xs sm:text-sm leading-relaxed">{completed ? HASIL.selesai.note : effectiveMeta.note}</p>
      <GuestDetail guest={scan.guest} />

      {canComplete && (
        <button
          type="button"
          onClick={handleComplete}
          disabled={completing}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
        >
          {completing ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
          {completing ? 'Menandai selesai...' : 'Tandai Kunjungan Selesai Sekarang'}
        </button>
      )}
    </div>
  )
}

/** Panel kamera: memindai QR / Barcode dengan dukungan dual camera, flash, dan visual overlay modern. */
function CameraScanner({ onDecoded, disabled, soundEnabled = true, onToggleSound }) {
  const scannerRef = useRef(null)
  const runningRef = useRef(false)
  const lastRef = useRef({ kode: '', at: 0 })
  const onDecodedRef = useRef(onDecoded)
  const disabledRef = useRef(disabled)

  const [active, setActive] = useState(false)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState('')
  const [facingMode, setFacingMode] = useState('environment') // 'environment' = belakang, 'user' = depan
  const [cameraList, setCameraList] = useState([])
  const [selectedCameraId, setSelectedCameraId] = useState('')
  const [hasTorch, setHasTorch] = useState(false)
  const [torchOn, setTorchOn] = useState(false)

  useEffect(() => { onDecodedRef.current = onDecoded }, [onDecoded])
  useEffect(() => { disabledRef.current = disabled }, [disabled])

  // Cek ketersediaan kamera perangkat saat komponen dimuat
  useEffect(() => {
    let mounted = true
    async function loadCameras() {
      try {
        const cameras = await Html5Qrcode.getCameras()
        if (mounted && Array.isArray(cameras) && cameras.length > 0) {
          setCameraList(cameras)
        }
      } catch {
        // Akses kamera mungkin belum diizinkan; daftar dimuat setelah izin diberikan.
      }
    }
    loadCameras()
    return () => { mounted = false }
  }, [])

  // Matikan torch bila kamera berhenti
  const turnOffTorch = useCallback(async () => {
    if (!torchOn) return
    try {
      if (scannerRef.current) {
        await scannerRef.current.applyVideoConstraints({ advanced: [{ torch: false }] })
      }
    } catch {}
    try {
      const video = document.querySelector(`#${READER_ID} video`)
      const stream = video?.srcObject
      const track = stream?.getVideoTracks?.()?.[0]
      if (track) await track.applyConstraints({ advanced: [{ torch: false }] })
    } catch {}
    setTorchOn(false)
  }, [torchOn])

  const stop = useCallback(async () => {
    await turnOffTorch()
    const scanner = scannerRef.current
    scannerRef.current = null
    if (scanner && runningRef.current) {
      runningRef.current = false
      try { await scanner.stop() } catch {}
    }
    try { scanner?.clear() } catch {}
    setActive(false)
    setStarting(false)
    setHasTorch(false)
    setTorchOn(false)
  }, [turnOffTorch])

  // Deteksi kemampuan flashlight / senter dari video track aktif
  const checkTorchCapability = useCallback(() => {
    try {
      const video = document.querySelector(`#${READER_ID} video`)
      const stream = video?.srcObject
      const track = stream?.getVideoTracks?.()?.[0]
      if (track) {
        const caps = track.getCapabilities?.() || {}
        setHasTorch(Boolean(caps.torch))
      } else {
        setHasTorch(false)
      }
    } catch {
      setHasTorch(false)
    }
  }, [])

  const start = useCallback(async (preferredFacing = facingMode, preferredCameraId = selectedCameraId) => {
    setError('')
    setStarting(true)
    try {
      if (!window.isSecureContext) {
        throw new Error('Kamera hanya bisa digunakan lewat HTTPS atau localhost. Buka aplikasi dari alamat berawalan https://.')
      }

      // Pastikan scanner sebelumnya dibersihkan jika masih ada
      if (scannerRef.current && runningRef.current) {
        runningRef.current = false
        try { await scannerRef.current.stop() } catch {}
        try { scannerRef.current.clear() } catch {}
      }

      const scanner = new Html5Qrcode(READER_ID, {
        verbose: false,
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.EAN_13,
        ],
        // Matikan BarcodeDetector bawaan agar tidak crash di Chrome Android tertentu
        useBarCodeDetectorIfSupported: false,
      })
      scannerRef.current = scanner

      const scanConfig = {
        fps: 15,
        qrbox: (w, h) => {
          const minEdge = Math.min(w, h)
          const edge = Math.max(160, Math.floor(minEdge * 0.72))
          return { width: edge, height: edge }
        },
        aspectRatio: 1.333333,
        disableFlip: false,
      }

      const onScanSuccess = text => {
        if (disabledRef.current) return
        const now = Date.now()
        // Cegah scan berulang dalam 3.5 detik untuk kode yang persis sama
        if (text === lastRef.current.kode && now - lastRef.current.at < 3500) return
        lastRef.current = { kode: text, at: now }
        onDecodedRef.current(text)
      }

      // Prioritas target kamera: ID kamera spesifik, atau facingMode
      const cameraTarget = preferredCameraId
        ? preferredCameraId
        : { facingMode: preferredFacing || 'environment' }

      try {
        await scanner.start(cameraTarget, scanConfig, onScanSuccess, () => {})
      } catch (firstErr) {
        // Bila facingMode gagal (misal environment tidak ditemukan), coba fallback ke kamera pertama
        const cameras = await Html5Qrcode.getCameras().catch(() => [])
        if (cameras.length > 0) {
          setCameraList(cameras)
          const fallbackId = cameras[0].id
          await scanner.start(fallbackId, scanConfig, onScanSuccess, () => {})
        } else {
          // Fallback generik
          await scanner.start({ facingMode: 'user' }, scanConfig, onScanSuccess, () => {})
        }
      }

      runningRef.current = true
      setActive(true)

      // Cek apakah perangkat mendukung Flash / Torch setelah video berjalan
      window.setTimeout(checkTorchCapability, 400)

      // Update daftar kamera bila belum ada
      if (cameraList.length === 0) {
        Html5Qrcode.getCameras().then(cams => {
          if (Array.isArray(cams) && cams.length > 0) setCameraList(cams)
        }).catch(() => {})
      }
    } catch (err) {
      scannerRef.current = null
      const message = String(err?.message || err)
      setError(
        /permission|denied|NotAllowed/i.test(message)
          ? 'Izin kamera ditolak. Izinkan akses kamera pada ikon gembok / pengaturan browser Anda, lalu coba lagi.'
          : /NotFound|no camera|devices not found/i.test(message)
            ? 'Kamera tidak ditemukan pada perangkat ini.'
            : /is not readable|Concurrent/i.test(message)
              ? 'Kamera sedang digunakan oleh aplikasi lain. Tutup aplikasi kamera lain lalu coba lagi.'
              : message,
      )
    } finally {
      setStarting(false)
    }
  }, [facingMode, selectedCameraId, cameraList.length, checkTorchCapability])

  useEffect(() => () => { stop() }, [stop])

  // Ganti kamera depan / belakang
  async function toggleCamera() {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment'
    setFacingMode(nextMode)
    setSelectedCameraId('')
    if (active) {
      await stop()
      await start(nextMode, '')
    }
  }

  // Pilih kamera spesifik dari dropdown
  async function handleSelectCamera(id) {
    setSelectedCameraId(id)
    if (active) {
      await stop()
      await start(facingMode, id)
    }
  }

  // Toggle flash / senter
  async function toggleTorch() {
    if (!active) return
    const nextState = !torchOn
    let success = false
    try {
      if (scannerRef.current) {
        await scannerRef.current.applyVideoConstraints({ advanced: [{ torch: nextState }] })
        success = true
      }
    } catch {}
    if (!success) {
      try {
        const video = document.querySelector(`#${READER_ID} video`)
        const stream = video?.srcObject
        const track = stream?.getVideoTracks?.()?.[0]
        if (track) {
          await track.applyConstraints({ advanced: [{ torch: nextState }] })
          success = true
        }
      } catch (err) {
        console.warn('Torch tidak dapat dinyalakan:', err)
      }
    }
    if (success) {
      setTorchOn(nextState)
    }
  }

  return (
    <div>
      {/* Box Viewfinder Kamera */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-inner">
        {/* Kontainer html5-qrcode video */}
        <div
          id={READER_ID}
          style={{ display: active || starting ? 'block' : 'none' }}
          className="w-full min-h-[280px] sm:min-h-[340px]"
        />

        {/* Loading overlay saat membuka kamera */}
        {starting && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/85 p-6 text-center text-white backdrop-blur-sm">
            <Loader2 size={36} className="animate-spin text-indigo-400" />
            <p className="mt-3 text-sm font-bold">Membuka kamera...</p>
            <p className="mt-1 text-xs text-slate-400">Menghubungkan ke sensor {facingMode === 'environment' ? 'kamera belakang' : 'kamera depan'}</p>
          </div>
        )}

        {/* Tampilan bila kamera BELUM aktif */}
        {!active && !starting && (
          <div className="flex flex-col items-center justify-center px-4 py-8 sm:py-12 text-center bg-slate-50 dark:bg-slate-950">
            <div className="relative mb-3.5 grid h-16 w-16 place-items-center rounded-2xl bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 ring-8 ring-indigo-50/60 dark:ring-indigo-500/5">
              <ScanLine size={32} />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">Siap Memindai Tiket</h3>
            <p className="mt-1 max-w-xs text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Arahkan kamera ke QR code atau barcode tiket tamu untuk memeriksa data kunjungan.
            </p>

            {/* Selector mode kamera depan / belakang */}
            <div className="mt-4 flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
              <button
                type="button"
                onClick={() => setFacingMode('environment')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  facingMode === 'environment'
                    ? 'bg-indigo-500 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <Camera size={13} /> Belakang
              </button>
              <button
                type="button"
                onClick={() => setFacingMode('user')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  facingMode === 'user'
                    ? 'bg-indigo-500 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <Smartphone size={13} /> Depan
              </button>
            </div>

            {/* Pilihan spesifik bila terdeteksi lebih dari 2 kamera */}
            {cameraList.length > 2 && (
              <div className="mt-2.5 max-w-xs w-full">
                <select
                  value={selectedCameraId}
                  onChange={e => setSelectedCameraId(e.target.value)}
                  className="w-full text-center truncate rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                >
                  <option value="">Otomatis ({facingMode === 'environment' ? 'Belakang' : 'Depan'})</option>
                  {cameraList.map((cam, idx) => (
                    <option key={cam.id} value={cam.id}>
                      {cam.label || `Lensa Kamera ${idx + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="button"
              onClick={() => start(facingMode, selectedCameraId)}
              disabled={starting}
              className="mt-4 inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-xs sm:text-sm font-bold text-white shadow-md shadow-indigo-600/30 transition hover:bg-indigo-700 active:scale-[0.99] disabled:opacity-60"
            >
              <Camera size={16} /> Aktifkan Kamera
            </button>
          </div>
        )}

        {/* Overlay aktif: Grid Scanner, Garis Laser Animasi, & Toolbar */}
        {active && (
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3.5 sm:p-4">
            {/* Top Toolbar overlay */}
            <div className="pointer-events-auto flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={toggleCamera}
                title="Ganti kamera depan / belakang"
                className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/80 px-3 py-1.5 text-xs font-semibold text-white shadow backdrop-blur-md border border-white/10 hover:bg-slate-800 transition"
              >
                <RefreshCw size={12} className="text-indigo-400" />
                <span>{facingMode === 'environment' ? 'Belakang' : 'Depan'}</span>
              </button>

              <div className="flex items-center gap-1.5">
                {hasTorch && (
                  <button
                    type="button"
                    onClick={toggleTorch}
                    title="Nyalakan / matikan lampu senter flash"
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold backdrop-blur-md border transition ${
                      torchOn
                        ? 'bg-amber-400 text-slate-950 border-amber-300 font-bold shadow-md shadow-amber-400/40'
                        : 'bg-slate-900/80 text-white border-white/10 hover:bg-slate-800'
                    }`}
                  >
                    <Zap size={13} className={torchOn ? 'fill-slate-950' : 'text-amber-400'} />
                    <span>{torchOn ? 'Flash ON' : 'Flash'}</span>
                  </button>
                )}

                {onToggleSound && (
                  <button
                    type="button"
                    onClick={onToggleSound}
                    title={soundEnabled ? 'Matikan bunyi beep' : 'Nyalakan bunyi beep'}
                    className="grid h-8 w-8 place-items-center rounded-full bg-slate-900/80 text-white backdrop-blur-md border border-white/10 hover:bg-slate-800 transition"
                  >
                    {soundEnabled ? <Volume2 size={14} className="text-emerald-400" /> : <VolumeX size={14} className="text-slate-400" />}
                  </button>
                )}
              </div>
            </div>

            {/* Target Box Viewfinder di tengah dengan Garis Laser */}
            <div className="relative mx-auto w-48 sm:w-56 h-48 sm:h-56">
              {/* Sudut-sudut bidik kamera (corner guides) */}
              <div className="absolute left-0 top-0 h-6 w-6 border-l-3 border-t-3 border-emerald-400 rounded-tl-lg" />
              <div className="absolute right-0 top-0 h-6 w-6 border-r-3 border-t-3 border-emerald-400 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 h-6 w-6 border-b-3 border-l-3 border-emerald-400 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 h-6 w-6 border-b-3 border-r-3 border-emerald-400 rounded-br-lg" />

              {/* Garis laser animasi menyapu vertikal */}
              <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_10px_#34d399] animate-scan-laser" />
            </div>

            {/* Bottom Bar: Petunjuk & Tombol Matikan */}
            <div className="pointer-events-auto flex flex-col items-center gap-2">
              <span className="rounded-full bg-slate-900/75 px-3 py-1 text-[11px] font-medium text-slate-200 backdrop-blur-md">
                Posisikan QR atau barcode di dalam kotak
              </span>
              <button
                type="button"
                onClick={stop}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600/90 px-4 py-2 text-xs font-bold text-white shadow-md backdrop-blur-md hover:bg-rose-600 transition"
              >
                <CameraOff size={14} /> Matikan Kamera
              </button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">Gagal Mengakses Kamera</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}
    </div>
  )
}

/** Halaman "Scan Tamu": pemindai di HP + daftar scan terbaru (live) di laptop. */
export function ScanPage({ scans = [], onScanned, onCompleteVisit }) {
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [manual, setManual] = useState('')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const deviceId = useRef(getDeviceId()).current

  const submit = useCallback(async kode => {
    const value = String(kode || '').trim()
    if (!value) return
    setBusy(true)
    setError('')
    try {
      const { scan } = await api.scanGuest(value, deviceId)
      setResult(scan)
      notifySound(scan.hasil, soundEnabled)
      try { navigator.vibrate?.(scan.hasil === 'valid' ? [80, 50, 80] : [100, 70, 100]) } catch {}
      onScanned?.(scan)
    } catch (err) {
      setError(err.message || 'Gagal memproses scan.')
    } finally {
      setBusy(false)
    }
  }, [deviceId, onScanned, soundEnabled])

  return (
    <div className="mx-auto max-w-md xl:max-w-none xl:grid xl:grid-cols-[440px_minmax(0,1fr)] xl:items-start xl:gap-6 space-y-6 xl:space-y-0">
      <div className="space-y-4">
        <div className={`${CARD} p-4 sm:p-5`}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
                <Smartphone size={20} />
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">Scan Tamu</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Pindai QR / Barcode tiket tamu dari HP atau laptop.</p>
              </div>
            </div>
          </div>

          <CameraScanner
            onDecoded={submit}
            disabled={busy}
            soundEnabled={soundEnabled}
            onToggleSound={() => setSoundEnabled(v => !v)}
          />

          <form
            className="mt-4 flex gap-2"
            onSubmit={e => { e.preventDefault(); submit(manual); setManual('') }}
          >
            <div className="relative flex-1">
              <Keyboard size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={manual}
                onChange={e => setManual(e.target.value)}
                placeholder="Atau ketik kode, mis. REQ-007"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-xs sm:text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-indigo-500/20"
              />
            </div>
            <button
              type="submit"
              disabled={busy || !manual.trim()}
              className="h-11 shrink-0 rounded-xl bg-indigo-600 px-4 sm:px-5 text-xs sm:text-sm font-bold text-white transition hover:bg-indigo-700 active:scale-[0.99] disabled:opacity-40"
            >
              Cek
            </button>
          </form>
        </div>

        {busy && (
          <div className="flex items-center justify-center gap-2 rounded-xl bg-indigo-50 p-3.5 text-xs sm:text-sm font-semibold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
            <Loader2 size={16} className="animate-spin" /> Memeriksa kode tiket...
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs sm:text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">{error}</div>
          </div>
        )}

        {result && !busy && (
          <ResultCard
            scan={result}
            onDismiss={() => setResult(null)}
            onCompleteVisit={onCompleteVisit}
          />
        )}
      </div>

      <div className={`${CARD} self-start overflow-hidden`}>
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5 sm:px-5 sm:py-4 dark:border-slate-800">
          <div className="min-w-0">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">Scan terbaru</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Diperbarui otomatis saat ada tamu yang discan</p>
          </div>
          <span className="shrink-0 flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> Live
          </span>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {scans.length ? scans.map(scan => {
            const meta = HASIL[scan.hasil] || HASIL.tidak_ditemukan
            return (
              <div key={scan.id} className="p-3.5 sm:p-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${meta.dot}`} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                        {scan.guest?.nama || 'Kode Tidak Terdaftar'}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 truncate">
                        {scan.guest?.tujuan || scan.guest?.keperluan || 'Tanpa keterangan'}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 dark:text-slate-500">
                      <Clock3 size={11} /> {formatTime(scan.scanned_at)}
                    </span>
                    <span className="block mt-0.5 text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400">
                      {scan.kode}
                    </span>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800/60 pt-2 text-[11px]">
                  <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-semibold ${meta.badgeTone}`}>
                    {meta.label}
                  </span>
                  <span className="text-slate-400 dark:text-slate-500">
                    Oleh: {scan.scanned_by || 'Admin'}
                  </span>
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
