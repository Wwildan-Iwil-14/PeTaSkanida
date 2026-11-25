import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Loader2, Download, AlertTriangle, Camera } from 'lucide-react'
import { api, saveSession, clearSession, loadToken } from './lib/api'
import { downloadBarcode } from './lib/barcode'
import { THEME_KEY, getInitialTheme } from './lib/appConstants'
import { LoginPage } from './pages/LoginPage'
import { AdminLoginPage } from './pages/AdminLoginPage'

// Halaman berat dimuat sesuai kebutuhan agar bundle awal tetap ringan.
const GuestFormPage = lazy(() => import('./pages/GuestFormPage'))
const GuestSuccessPage = lazy(() => import('./pages/GuestSuccessPage'))
const AdminApp = lazy(() => import('./pages/AdminApp'))

const PATHS = {
  login: '/',
  adminLogin: '/admin/login',
  admin: '/admin',
  guest: '/tamu',
  guestSuccess: '/tamu/sukses',
}

function PageLoader() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f5f7fb] text-slate-400 dark:bg-slate-950 dark:text-slate-500">
      <Loader2 size={32} className="animate-spin text-indigo-400" />
      <p className="mt-4 text-sm">Memuat halaman...</p>
    </div>
  )
}

function LeaveWarningModal({ onDownload, onScreenshot, onClose }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="leave-modal-title">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-start gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h2 id="leave-modal-title" className="text-lg font-bold text-slate-900 dark:text-slate-100">Barcode belum disimpan</h2>
            <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Notifikasi sistem</p>
          </div>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          Kamu <span className="font-bold">wajib mengunduh barcode</span> terlebih dahulu sebelum keluar dari halaman ini. Barcode tersebut dipakai sebagai bukti kunjungan saat tiba di sekolah.
        </p>

        <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-left dark:border-amber-500/30 dark:bg-amber-500/10">
          <Camera size={16} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-300">
            <span className="font-bold">Opsi kedua:</span> jika barcode tidak bisa diunduh, silakan ambil <span className="font-bold">screenshot</span> barcode itu lalu simpan di perangkatmu.
          </p>
        </div>

        <div className="mt-5 space-y-2.5">
          <button type="button" onClick={onDownload} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200/70 transition hover:bg-blue-600 dark:shadow-blue-950/40">
            <Download size={16} /> Unduh Barcode Sekarang
          </button>
          <button type="button" onClick={onScreenshot} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-amber-200 bg-white py-2.5 text-sm font-semibold text-amber-700 transition hover:bg-amber-50 dark:border-amber-500/30 dark:bg-slate-900 dark:text-amber-300 dark:hover:bg-amber-500/10">
            <Camera size={15} /> Sudah simpan dengan screenshot
          </button>
          <button type="button" onClick={onClose} className="w-full rounded-xl py-2 text-sm font-semibold text-slate-500 transition hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
            Kembali ke halaman
          </button>
        </div>
      </div>
    </div>
  )
}

// Notifikasi in-app untuk request baru & perubahan status (cadangan Web Push
// saat browser tidak mengizinkan notifikasi). Ditumpuk di pojok kanan atas
// bersama notifikasi scan QR dalam satu wadah di AdminApp.

function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const [role, setRole] = useState(null) // null = login, 'admin-login', 'admin', 'tamu', 'tamu-success'
  const [admin, setAdmin] = useState(null)
  const [restoring, setRestoring] = useState(true)
  const [guestResult, setGuestResult] = useState(null)
  const [theme, setTheme] = useState(getInitialTheme)
  // Barcode wajib disimpan sebelum tamu boleh meninggalkan halaman konfirmasi.
  const [barcodeSaved, setBarcodeSaved] = useState(false)
  const [leaveModalOpen, setLeaveModalOpen] = useState(false)
  const [pendingLeave, setPendingLeave] = useState(null)

  // Terapkan tema ke <html> dan simpan pilihan pengguna.
  useEffect(() => {
    const root = document.documentElement
    root.classList.add('theme-transition')
    root.classList.toggle('dark', theme === 'dark')
    document.querySelector('meta[name="color-scheme"]').content = theme
    try {
      window.localStorage.setItem(THEME_KEY, theme)
    } catch {
      // localStorage bisa diblokir; abaikan
    }
    const timer = window.setTimeout(() => root.classList.remove('theme-transition'), 300)
    return () => window.clearTimeout(timer)
  }, [theme])

  const toggleTheme = () => setTheme(current => (current === 'dark' ? 'light' : 'dark'))

  // --- Pengunci halaman: barcode harus disimpan dulu sebelum keluar ---
  const leaveBlocked = role === 'tamu-success' && !barcodeSaved
  const leaveBlockedRef = useRef(leaveBlocked)
  leaveBlockedRef.current = leaveBlocked

  useEffect(() => {
    if (!leaveBlocked) return undefined

    function handleBeforeUnload(event) {
      // Notifikasi sistem bawaan browser saat refresh, tutup tab, atau keluar situs.
      event.preventDefault()
      event.returnValue = ''
      return ''
    }

    function handlePopState() {
      if (!leaveBlockedRef.current) return
      // Kembalikan posisi riwayat agar tamu tetap berada di halaman ini.
      window.history.pushState({ petaBarcodeGuard: true }, '')
      setPendingLeave(null)
      setLeaveModalOpen(true)
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('popstate', handlePopState)
    window.history.pushState({ petaBarcodeGuard: true }, '')

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [leaveBlocked])

  // Dipakai tombol "Ajukan Permintaan Lain" & "Kembali ke Halaman Login".
  function attemptLeave(action) {
    if (barcodeSaved) {
      action()
      return
    }
    setPendingLeave(() => action)
    setLeaveModalOpen(true)
  }

  // Buka kunci setelah barcode diunduh (atau disimpan via screenshot).
  function unlockLeave() {
    const action = pendingLeave
    setBarcodeSaved(true)
    setLeaveModalOpen(false)
    setPendingLeave(null)
    if (action) action()
  }

  function handleModalDownload() {
    if (downloadBarcode(guestResult?.kode)) unlockLeave()
  }

  // Pulihkan sesi admin dari token yang tersimpan di browser.
  // api.me() otomatis memperbarui token yang kedaluwarsa memakai refresh token.
  useEffect(() => {
    if (!loadToken()) {
      setRestoring(false)
      return
    }

    let active = true
    api
      .me()
      .then(({ admin: sessionAdmin }) => {
        if (!active) return
        setAdmin(sessionAdmin)
        setRole('admin')
        // Kalau dibuka dari halaman login, arahkan ke panel admin.
        // Deep link seperti /admin/request tetap dipertahankan.
        if (!location.pathname.startsWith('/admin')) {
          navigate(PATHS.admin, { replace: true })
        }
      })
      .catch(err => {
        // Jangan menghapus sesi untuk gangguan jaringan/server sementara.
        if ([400, 401, 403].includes(err?.status)) clearSession()
      })
      .finally(() => {
        if (active) setRestoring(false)
      })

    return () => {
      active = false
    }
  }, [])

  // Selaraskan peran dengan URL, termasuk tombol Back/Forward browser.
  useEffect(() => {
    if (restoring) return
    const path = location.pathname
    if (path === PATHS.adminLogin) {
      setRole('admin-login')
    } else if (path.startsWith('/admin')) {
      if (loadToken()) setRole('admin')
      else navigate(PATHS.login, { replace: true })
    } else if (path === PATHS.guest) {
      setRole('tamu')
    } else if (path === PATHS.guestSuccess) {
      if (guestResult) setRole('tamu-success')
      else navigate(PATHS.guest, { replace: true })
    } else {
      setRole(null)
    }
  }, [location.pathname, restoring])

  function handleLoginSuccess(result) {
    saveSession(result)
    setAdmin(result.admin)
    setRole('admin')
    navigate(PATHS.admin)
  }

  function handleLogout() {
    api.logout() // cabut sesi di Supabase Auth (fire-and-forget)
    clearSession()
    setAdmin(null)
    setRole(null)
    navigate(PATHS.login)
  }

  if (restoring) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f5f7fb] text-slate-400 dark:bg-slate-950 dark:text-slate-500">
        <Loader2 size={32} className="animate-spin text-indigo-400" />
        <p className="mt-4 text-sm">Memuat sesi...</p>
      </div>
    )
  }

  if (role === null) return <LoginPage onSelect={next => {
    setRole(next)
    navigate(next === 'admin-login' ? PATHS.adminLogin : PATHS.guest)
  }} theme={theme} onToggleTheme={toggleTheme} />
  if (role === 'admin-login') return <AdminLoginPage onSuccess={handleLoginSuccess} onBack={() => {
    setRole(null)
    navigate(PATHS.login)
  }} theme={theme} onToggleTheme={toggleTheme} />

  const page = role === 'tamu'
    ? <GuestFormPage theme={theme} onToggleTheme={toggleTheme} onBack={() => {
        setRole(null)
        navigate(PATHS.login)
      }} onSubmit={data => {
        setGuestResult(data)
        setBarcodeSaved(false)
        setRole('tamu-success')
        navigate(PATHS.guestSuccess)
      }} />
    : role === 'tamu-success'
      ? <>
          <GuestSuccessPage
            data={guestResult}
            theme={theme}
            onToggleTheme={toggleTheme}
            saved={barcodeSaved}
            onDownloaded={() => setBarcodeSaved(true)}
            onAgain={() => attemptLeave(() => { setGuestResult(null); setBarcodeSaved(false); setRole('tamu'); navigate(PATHS.guest) })}
            onBack={() => attemptLeave(() => { setGuestResult(null); setBarcodeSaved(false); setRole(null); navigate(PATHS.login) })}
          />
          {leaveModalOpen && <LeaveWarningModal
            onDownload={handleModalDownload}
            onScreenshot={unlockLeave}
            onClose={() => { setLeaveModalOpen(false); setPendingLeave(null) }}
          />}
        </>
      : <AdminApp admin={admin} onLogout={handleLogout} theme={theme} onToggleTheme={toggleTheme} />

  return <Suspense fallback={<PageLoader />}>{page}</Suspense>
}

export default App
