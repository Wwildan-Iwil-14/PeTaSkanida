import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { LogOut, Menu, X, CheckCircle2, ChevronRight, UserRound, ShieldCheck, CalendarCheck, Loader2, AlertCircle, Bell, BellOff } from 'lucide-react'
import { api } from '../lib/api'
import { enablePush, disablePush, getPushStatus } from '../lib/push'
import { ScanPage, ScanAlerts, getDeviceId, notifySound } from '../ScanPage'
import { ROLE_LABELS, resolveFeatures } from '../lib/features'
import { canReceiveNotifications, canNotifyStatus, navItems, requestSignature, mapRecord } from '../lib/appConstants'
import { BrandLogo, ThemeToggle, Status, Panel, NotificationAlerts } from '../components/ui'
import { Dashboard } from './Dashboard'
import { ListingPage } from './ListingPage'
import { HistoryPage } from './HistoryPage'
import { UpcomingVisitsPage, CurrentVisitsPage } from './VisitsPages'
import { AccountPage } from './AccountPage'
import { UsersPage } from './UsersPage'
// Halaman Database jarang dipakai dan berat — muat saat menu dibuka.
const DatabasePage = lazy(() => import('./DatabasePage').then(m => ({ default: m.DatabasePage })))

function AdminApp({ onLogout, admin, theme, onToggleTheme }) {
  const adminName = admin?.nama || ''
  const role = admin?.role || 'admin'
  const features = resolveFeatures(role, admin?.features)
  const featureKey = features.join('|')
  const allowedNav = useMemo(
    () => navItems.filter(item =>
      item.features
        ? item.features.some(feature => features.includes(feature))
        : features.includes(item.feature),
    ),
    [featureKey],
  )
  const [active, setActive] = useState(() => allowedNav[0]?.id || 'akun')
  const [requests, setRequests] = useState([])
  const [users, setUsers] = useState([])
  const [currentUserId, setCurrentUserId] = useState('')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('Semua')
  const [sortOrder, setSortOrder] = useState('Terkini')
  const [contactFilter, setContactFilter] = useState('Semua')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [scans, setScans] = useState([])
  const [scanAlerts, setScanAlerts] = useState([])
  const loadedOnceRef = useRef(false)
  const lastScanIdRef = useRef(null)
  const deviceIdRef = useRef(getDeviceId())
  const [notifyAlerts, setNotifyAlerts] = useState([])
  const [pushStatus, setPushStatus] = useState({ supported: false, permission: 'unsupported', subscribed: false })
  const [pushBusy, setPushBusy] = useState(false)
  const [highlightId, setHighlightId] = useState('')
  const [lastUpdated, setLastUpdated] = useState(null)
  const knownRequestsRef = useRef(null)
  const requestsSignatureRef = useRef(null)
  const highlightTimerRef = useRef(null)
  const fetchingRef = useRef(false)

  function showNotice(message, duration = 3200) {
    setNotice(message)
    window.setTimeout(() => setNotice(''), duration)
  }

  // Bandingkan data terbaru dengan snapshot sebelumnya untuk notifikasi in-app.
  // Snapshot awal dibuat tanpa notifikasi agar data lama tidak muncul sebagai baru.
  function announceChanges(rows) {
    const list = rows || []
    const next = new Map(list.map(row => [row.id, row.status]))
    const previous = knownRequestsRef.current
    const alerts = []

    if (previous) {
      const titles = {
        Diterima: 'Permohonan diterima',
        Ditolak: 'Permohonan ditolak',
        Selesai: 'Kunjungan selesai',
      }
      for (const row of list) {
        const code = `REQ-${String(row.id).padStart(3, '0')}`
        const label = `${code} · ${row.nama || '-'} · ${row.tujuan || '-'}`
        if (!previous.has(row.id)) {
          if (canNotifyStatus(features, 'Pending')) {
            alerts.push({
              key: `new-${row.id}-${Date.now()}`,
              title: 'Permintaan kunjungan baru',
              body: label,
              status: 'Pending',
              requestId: code,
            })
          }
        } else if (previous.get(row.id) !== row.status && canNotifyStatus(features, row.status)) {
          alerts.push({
            key: `status-${row.id}-${row.status}-${Date.now()}`,
            title: titles[row.status] || 'Status kunjungan berubah',
            body: label,
            status: row.status,
            requestId: code,
          })
        }
      }
    }

    knownRequestsRef.current = next
    if (!alerts.length) return

    setNotifyAlerts(current => [...alerts.reverse(), ...current].slice(0, 4))
    notifySound('valid')
    alerts.forEach(alert => window.setTimeout(() => dismissNotifyAlert(alert.key), 12000))
  }

  function dismissNotifyAlert(key) {
    setNotifyAlerts(current => current.filter(item => item.key !== key))
  }

  // Sorot baris yang dituju dari notifikasi, lalu gulir ke baris tersebut.
  function showHighlight(requestId) {
    if (!requestId) return
    window.clearTimeout(highlightTimerRef.current)
    setHighlightId(requestId)
    highlightTimerRef.current = window.setTimeout(() => setHighlightId(''), 6000)
  }

  useEffect(() => () => window.clearTimeout(highlightTimerRef.current), [])

  useEffect(() => {
    if (!highlightId) return undefined
    const timer = window.setTimeout(() => {
      document.getElementById(`request-row-${highlightId}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }, 150)
    return () => window.clearTimeout(timer)
  }, [highlightId, active])

  async function togglePush() {
    setPushBusy(true)
    try {
      if (pushStatus.subscribed) {
        await disablePush()
        showNotice('Notifikasi browser dimatikan di perangkat ini.')
      } else {
        await enablePush()
        showNotice('Notifikasi browser aktif di perangkat ini.')
      }
      setPushStatus(await getPushStatus())
    } catch (err) {
      showNotice(err.message || 'Gagal mengubah notifikasi browser.')
    } finally {
      setPushBusy(false)
    }
  }

  // Ambil semua data request dari backend
  async function fetchData({ announce = false } = {}) {
    // Polling dan aksi bisa bersamaan — hindari request ganda yang hanya
    // menambah beban server tanpa mengubah data.
    if (fetchingRef.current) return
    fetchingRef.current = true
    // Spinner hanya pada pemuatan pertama. Muat ulang realtime berikutnya
    // berjalan di latar belakang agar kamera scanner tidak ikut terputus.
    if (!loadedOnceRef.current) setLoading(true)
    setError(null)
    try {
      const { requests: rows } = await api.listRequests()
      const list = rows || []
      const signature = requestSignature(list)
      // Realtime + polling bisa mengirim data yang sama berulang kali.
      // Lewati setState bila tidak ada perubahan agar tabel tidak render ulang.
      if (requestsSignatureRef.current === null || signature !== requestsSignatureRef.current) {
        requestsSignatureRef.current = signature
        setRequests(list.map(row => mapRecord(row, row.status)))
        setLastUpdated(new Date())
      }
      if (announce) announceChanges(list)
      else if (knownRequestsRef.current === null) announceChanges(list)
      loadedOnceRef.current = true
    } catch (err) {
      setError('Gagal memuat data: ' + (err.message || 'Terjadi kesalahan'))
    } finally {
      fetchingRef.current = false
      setLoading(false)
    }
  }

  // Ambil scan terbaru. Scan baru dari perangkat LAIN (mis. HP petugas)
  // memunculkan notifikasi pop-up + bunyi di layar ini.
  async function fetchScans() {
    try {
      const { scans: rows } = await api.listScans(30)
      const list = rows || []
      setScans(current => (
        current.length === list.length &&
        current.every((row, index) => row.id === list[index].id && row.hasil === list[index].hasil)
          ? current
          : list
      ))

      const maxId = list.reduce((max, row) => Math.max(max, Number(row.id) || 0), 0)
      const previous = lastScanIdRef.current
      lastScanIdRef.current = Math.max(previous ?? 0, maxId)
      if (previous === null) return // pemuatan pertama: jangan notifikasi data lama

      const fresh = list
        .filter(row => (Number(row.id) || 0) > previous && row.device_id !== deviceIdRef.current)
        .sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0))
      if (!fresh.length) return

      notifySound(fresh[fresh.length - 1].hasil)
      setScanAlerts(current => [...fresh.toReversed(), ...current].slice(0, 4))
      fresh.forEach(row => window.setTimeout(() => dismissScanAlert(row.id), 12000))
    } catch (err) {
      console.error('[frontend] Gagal memuat scan:', err)
    }
  }

  function dismissScanAlert(id) {
    setScanAlerts(current => current.filter(item => item.id !== id))
  }

  async function fetchUsers() {
    try {
      const { users: rows } = await api.listAdminUsers()
      setUsers(rows || [])
    } catch (err) {
      console.error('[frontend] Gagal memuat daftar pengguna:', err)
    }
  }

  useEffect(() => {
    fetchData()
    if (features.includes('kelola_akun') || features.includes('tambah_edit_akun')) fetchUsers()
    api.me().then(({ admin: sessionAdmin }) => setCurrentUserId(sessionAdmin?.userId || '')).catch(() => {})
    if (canReceiveNotifications(features)) getPushStatus().then(setPushStatus).catch(() => {})

    // AUTO RELOAD: polling REST lewat backend. Tidak memakai realtime Supabase
    // dengan anon key karena itu membuka akses baca data tamu ke publik.
    const requestPoll = window.setInterval(() => {
      if (!document.hidden) fetchData({ announce: true })
    }, 8000)

    const canManageUsers = features.includes('kelola_akun') || features.includes('tambah_edit_akun')
    const usersPoll = canManageUsers
      ? window.setInterval(() => {
          if (!document.hidden) fetchUsers()
        }, 20000)
      : null

    // Saat pengguna kembali ke tab, segera muat ulang semua data yang relevan.
    function handleVisible() {
      if (document.visibilityState !== 'visible') return
      fetchData({ announce: true })
      if (features.includes('scan')) fetchScans()
      if (canManageUsers) fetchUsers()
    }
    document.addEventListener('visibilitychange', handleVisible)
    window.addEventListener('focus', handleVisible)

    let scanPoll = null
    if (features.includes('scan')) {
      fetchScans()
      scanPoll = window.setInterval(() => {
        if (!document.hidden) fetchScans()
      }, 5000)
    }

    return () => {
      window.clearInterval(requestPoll)
      if (usersPoll) window.clearInterval(usersPoll)
      document.removeEventListener('visibilitychange', handleVisible)
      window.removeEventListener('focus', handleVisible)
      if (scanPoll) window.clearInterval(scanPoll)
    }
  }, [])

  // Bila fitur akun berubah / menu tidak lagi diizinkan, pindah ke menu pertama.
  useEffect(() => {
    if (!allowedNav.some(item => item.id === active)) {
      setActive(allowedNav[0]?.id || 'akun')
    }
  }, [featureKey])

  const visibleRequests = useMemo(() => requests.filter(item => {
    const matchesQuery = `${item.name} ${item.id} ${item.purpose}`.toLowerCase().includes(query.toLowerCase())
    const matchesFilter = filter === 'Semua' || item.status === filter
    return matchesQuery && matchesFilter
  }), [requests, query, filter])

  async function updateStatus(id, status) {
    const target = requests.find(item => item.id === id)
    if (!target) return

    // Optimistik: ubah baris lebih dulu supaya tombol terasa instan, tanpa
    // menunggu request + fetch ulang. Rollback bila server menolak.
    setRequests(current => current.map(item => item.id === id ? { ...item, status } : item))
    try {
      if (status === 'Diterima') {
        await api.approveRequest(target.dbId)
      } else {
        await api.rejectRequest(target.dbId)
      }

      setNotice(`Request ${target.id} berhasil ${status === 'Diterima' ? 'disetujui' : 'ditolak'}.`)
      window.setTimeout(() => setNotice(''), 3000)
    } catch (err) {
      setRequests(current => current.map(item => item.id === id ? { ...item, status: target.status } : item))
      setNotice('Gagal memperbarui status: ' + (err.message || 'Terjadi kesalahan'))
      window.setTimeout(() => setNotice(''), 4000)
      fetchData()
    }
  }

  async function completeVisit(id) {
    const target = requests.find(item => item.id === id)
    if (!target) return

    try {
      await api.completeRequest(target.dbId)
      // Status Selesai otomatis menyembunyikan tamu dari Kelola Tamu /
      // Kunjungan Terkini dan memunculkannya di Riwayat Kunjungan.
      setRequests(current => current.map(item => item.id === id ? { ...item, status: 'Selesai' } : item))
      setNotice(`Kunjungan ${target.id} ditandai selesai dan dipindahkan ke Riwayat Kunjungan.`)
      window.setTimeout(() => setNotice(''), 3500)
    } catch (err) {
      setNotice('Gagal menyelesaikan kunjungan: ' + (err.message || 'Terjadi kesalahan'))
      window.setTimeout(() => setNotice(''), 4000)
    }
  }

  function goTo(id, status = 'Semua') {
    let targetId = id
    if (id === 'tamu') {
      targetId = features.includes('tamu_superadmin')
        ? 'tamu-superadmin'
        : (features.includes('tamu_admin') ? 'tamu-admin' : 'tamu-admin')
    } else if (id === 'riwayat') {
      targetId = features.includes('riwayat_superadmin')
        ? 'riwayat-superadmin'
        : (features.includes('riwayat_admin') ? 'riwayat-admin' : 'riwayat-admin')
    }
    setActive(targetId)
    setQuery('')
    setFilter(status)
    setSortOrder('Terkini')
    setContactFilter('Semua')
    setMobileOpen(false)
  }

  async function toggleContacted(id, contacted) {
    const target = requests.find(item => item.id === id)
    if (!target) return

    try {
      await api.setContacted(target.dbId, contacted)
      setRequests(current => current.map(item => item.id === id
        ? { ...item, contacted, contactedAt: contacted ? new Date().toISOString() : null }
        : item))
      setNotice(`Tamu ${target.id} ditandai ${contacted ? 'sudah' : 'belum'} dihubungi.`)
      window.setTimeout(() => setNotice(''), 3000)
    } catch (err) {
      setNotice('Gagal memperbarui status kontak: ' + (err.message || 'Terjadi kesalahan'))
      window.setTimeout(() => setNotice(''), 4000)
    }
  }

  // ---- CRUD pengguna ----
  async function createUser(values) {
    await api.createAdminUser(values)
    fetchUsers() // refresh di latar belakang, tidak menahan notifikasi
    showNotice('Pengguna baru berhasil ditambahkan.')
  }
  async function updateUser(id, values) {
    await api.updateAdminUser(id, values)
    fetchUsers() // refresh di latar belakang, tidak menahan notifikasi
    showNotice('Data pengguna berhasil diperbarui.')
  }
  async function removeUser(id) {
    await api.deleteAdminUser(id)
    fetchUsers() // refresh di latar belakang, tidak menahan notifikasi
    showNotice('Pengguna berhasil dihapus.')
  }

  // ---- CRUD tamu ----
  async function createGuest(values) {
    await api.createGuest(values)
    fetchData() // refresh di latar belakang, tidak menahan notifikasi
    showNotice('Tamu baru berhasil ditambahkan.')
  }
  async function updateGuest(id, values) {
    await api.updateRequest(id, values)
    fetchData() // refresh di latar belakang, tidak menahan notifikasi
    showNotice('Data tamu berhasil diperbarui.')
  }
  async function removeGuest(id) {
    await api.deleteRequest(id)
    fetchData() // refresh di latar belakang, tidak menahan notifikasi
    showNotice('Tamu berhasil dihapus.')
  }

  // ---- CRUD riwayat ----
  async function createHistory(values) {
    await api.createHistory(values)
    fetchData() // refresh di latar belakang, tidak menahan notifikasi
    showNotice('Riwayat baru berhasil ditambahkan.')
  }
  async function updateHistory(id, values) {
    await api.updateHistory(id, values)
    fetchData() // refresh di latar belakang, tidak menahan notifikasi
    showNotice('Riwayat berhasil diperbarui.')
  }
  async function removeHistory(id) {
    await api.deleteHistory(id)
    fetchData() // refresh di latar belakang, tidak menahan notifikasi
    showNotice('Riwayat berhasil dihapus.')
  }

  const pageTitle =
    navItems.find(item => item.id === active)?.label ||
    (active === 'tamu'
      ? (features.includes('tamu_superadmin') ? 'Kelola Tamu (superadmin)' : 'Kelola Tamu (admin)')
      : active === 'riwayat'
        ? (features.includes('riwayat_superadmin') ? 'Riwayat Kunjungan (superadmin)' : 'Riwayat Kunjungan (admin)')
        : 'Dashboard')

  return (
    <div className="min-h-screen bg-[#f5f7fb] dark:bg-slate-950">
      {mobileOpen && <button aria-label="Tutup menu" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden" />}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col bg-[#101827] text-white transition-transform duration-300 dark:border-r dark:border-slate-800 dark:bg-slate-900 lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-[84px] items-center justify-between border-b border-white/10 px-6">
          <div className="flex items-center gap-3">
            <BrandLogo className="h-10 w-10 shrink-0 rounded-xl bg-white/95 object-contain p-0.5" />
            <div><p className="font-bold tracking-wide">PeTa SKANIDA</p><p className="mt-0.5 text-[10px] tracking-[.2em] text-slate-400">ADMIN PANEL</p></div>
          </div>
          <button onClick={() => setMobileOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-white/10 lg:hidden"><X size={19} /></button>
        </div>
        <div className="px-4 pt-7">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[.2em] text-slate-500">Menu utama</p>
          <nav className="space-y-1">
            {allowedNav.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => goTo(id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition ${active === id ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-950/30' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}><Icon size={18} />{label}{active === id && <ChevronRight className="ml-auto" size={16} />}</button>)}
          </nav>
        </div>
        <div className="mt-auto border-t border-white/10 p-4">
          <div className="mb-4 flex items-center gap-3 rounded-xl bg-white/5 p-3">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-indigo-400/20 text-indigo-200"><UserRound size={18} /></div>
            <div className="min-w-0"><p className="text-sm font-semibold">{adminName || 'Administrator'}</p><p className="text-xs text-slate-500">{ROLE_LABELS[role] || role}</p></div>
            <ShieldCheck className="ml-auto text-emerald-400" size={17} />
          </div>
          <button onClick={onLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-300"><LogOut size={18} />Keluar</button>
        </div>
      </aside>

      <main className="min-h-screen lg:ml-[260px]">
        <header className="sticky top-0 z-30 flex h-[72px] sm:h-[84px] items-center justify-between border-b border-slate-200/80 bg-white/90 px-3.5 sm:px-8 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <button onClick={() => setMobileOpen(true)} aria-label="Buka menu" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 p-2 text-slate-600 dark:border-slate-700 dark:text-slate-300 lg:hidden">
              <Menu size={20} />
            </button>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 leading-none">PeTa SKANIDA / Admin</p>
              <h1 className="mt-1 text-base sm:text-xl font-bold text-slate-800 dark:text-slate-100 truncate leading-tight">{pageTitle}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 lg:flex" title="Data diperbarui otomatis">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              {lastUpdated ? `Diperbarui ${lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : 'Memuat data...'}
            </div>
            {canReceiveNotifications(features) && (
              <button
                type="button"
                onClick={togglePush}
                disabled={pushBusy || !pushStatus.supported}
                title={!pushStatus.supported
                  ? 'Notifikasi browser hanya tersedia lewat HTTPS atau localhost'
                  : pushStatus.subscribed
                    ? 'Matikan notifikasi browser di perangkat ini'
                    : 'Aktifkan notifikasi browser di perangkat ini'}
                aria-label={pushStatus.subscribed ? 'Matikan notifikasi' : 'Aktifkan notifikasi'}
                className={`grid h-10 w-10 place-items-center rounded-full border shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  pushStatus.subscribed
                    ? 'border-indigo-200 bg-indigo-50 text-indigo-600 dark:border-indigo-500/40 dark:bg-indigo-500/15 dark:text-indigo-300'
                    : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                {pushBusy
                  ? <Loader2 size={18} className="animate-spin" />
                  : pushStatus.subscribed ? <Bell size={18} /> : <BellOff size={18} />}
              </button>
            )}
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
            <div className="hidden text-right sm:block"><p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{adminName || 'Administrator'}</p><p className="text-[11px] text-slate-400 dark:text-slate-500">{ROLE_LABELS[role] || role}</p></div>
            <div className="grid h-10 w-10 place-items-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300"><UserRound size={19} /></div>
          </div>
        </header>

        <div className="mx-auto max-w-[1600px] p-3.5 sm:p-6 lg:p-8">
          {error && (
            <div className="mb-6 flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
              <AlertCircle size={20} className="shrink-0" />
              <span>{error}</span>
              <button onClick={fetchData} className="ml-auto shrink-0 rounded-lg bg-rose-100 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-200 dark:bg-rose-500/20 dark:text-rose-200 dark:hover:bg-rose-500/30">Coba lagi</button>
            </div>
          )}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400 dark:text-slate-500">
              <Loader2 size={32} className="animate-spin text-indigo-400" />
              <p className="mt-4 text-sm">Memuat data...</p>
            </div>
          ) : (
            <>
              {active === 'dashboard' && features.includes('dashboard') && <Dashboard requests={requests} adminName={adminName} onGoTo={goTo} />}
              {((active === 'tamu-superadmin') || (active === 'tamu' && features.includes('tamu_superadmin'))) && features.includes('tamu_superadmin') && (
                <ListingPage
                  type="tamu"
                  title="Kelola Tamu (superadmin)"
                  subtitle="Daftar tamu yang telah disetujui atau ditolak dengan aksi edit dan hapus. Klik Selesai untuk memindahkan tamu ke Riwayat Kunjungan."
                  canCrud={true}
                  highlightId={highlightId}
                  visibleRequests={visibleRequests}
                  query={query}
                  onQueryChange={setQuery}
                  filter={filter}
                  onFilterChange={setFilter}
                  contactFilter={contactFilter}
                  onContactFilterChange={setContactFilter}
                  onUpdateStatus={updateStatus}
                  onToggleContacted={toggleContacted}
                  onComplete={completeVisit}
                  onCreate={createGuest}
                  onUpdate={updateGuest}
                  onDelete={removeGuest}
                />
              )}
              {((active === 'tamu-admin') || (active === 'tamu' && !features.includes('tamu_superadmin') && features.includes('tamu_admin'))) && features.includes('tamu_admin') && (
                <ListingPage
                  type="tamu"
                  title="Kelola Tamu (admin)"
                  subtitle="Daftar tamu yang telah disetujui atau ditolak khusus admin. Tambah tamu tersedia; aksi edit dan hapus tidak tersedia."
                  canCrud={false}
                  canCreate={true}
                  highlightId={highlightId}
                  visibleRequests={visibleRequests}
                  query={query}
                  onQueryChange={setQuery}
                  filter={filter}
                  onFilterChange={setFilter}
                  contactFilter={contactFilter}
                  onContactFilterChange={setContactFilter}
                  onUpdateStatus={updateStatus}
                  onToggleContacted={toggleContacted}
                  onComplete={completeVisit}
                  onCreate={createGuest}
                />
              )}
              {active === 'request' && features.includes('request') && (
                <ListingPage
                  type="request"
                  highlightId={highlightId}
                  visibleRequests={visibleRequests}
                  query={query}
                  onQueryChange={setQuery}
                  filter={filter}
                  onFilterChange={setFilter}
                  contactFilter={contactFilter}
                  onContactFilterChange={setContactFilter}
                  onUpdateStatus={updateStatus}
                  onToggleContacted={toggleContacted}
                  sortOrder={sortOrder}
                  onSortOrderChange={setSortOrder}
                />
              )}
              {((active === 'riwayat-superadmin') || (active === 'riwayat' && features.includes('riwayat_superadmin'))) && features.includes('riwayat_superadmin') && (
                <HistoryPage
                  title="Riwayat Kunjungan (superadmin)"
                  subtitle="Arsip kunjungan yang sudah ditandai selesai beserta permintaan yang ditolak, dengan aksi edit dan hapus."
                  highlightId={highlightId}
                  visibleRequests={visibleRequests}
                  query={query}
                  onQueryChange={setQuery}
                  filter={filter}
                  onFilterChange={setFilter}
                  onCreate={createHistory}
                  onUpdate={updateHistory}
                  onDelete={removeHistory}
                  canPrint={features.includes('cetak_riwayat')}
                  onNotice={showNotice}
                  canEdit={true}
                />
              )}
              {((active === 'riwayat-admin') || (active === 'riwayat' && !features.includes('riwayat_superadmin') && features.includes('riwayat_admin'))) && features.includes('riwayat_admin') && (
                <HistoryPage
                  title="Riwayat Kunjungan (admin)"
                  subtitle="Arsip kunjungan yang sudah ditandai selesai beserta permintaan yang ditolak, khusus admin (tanpa aksi edit dan hapus)."
                  highlightId={highlightId}
                  visibleRequests={visibleRequests}
                  query={query}
                  onQueryChange={setQuery}
                  filter={filter}
                  onFilterChange={setFilter}
                  canPrint={features.includes('cetak_riwayat')}
                  onNotice={showNotice}
                  canEdit={false}
                />
              )}
              {active === 'kunjungan-terkini' && features.includes('kunjungan_terkini') && <CurrentVisitsPage visibleRequests={visibleRequests} query={query} onQueryChange={setQuery} filter={filter} onFilterChange={setFilter} />}
              {active === 'kunjungan-mendatang' && features.includes('kunjungan_mendatang') && <UpcomingVisitsPage visibleRequests={visibleRequests} query={query} onQueryChange={setQuery} filter={filter} onFilterChange={setFilter} />}
              {active === 'scan' && features.includes('scan') && <ScanPage scans={scans} onScanned={fetchScans} onCompleteVisit={completeVisit} />}
              {active === 'users' && (features.includes('kelola_akun') || features.includes('tambah_edit_akun')) && <UsersPage users={users} currentUserId={currentUserId} canManage={features.includes('tambah_edit_akun')} onCreate={createUser} onUpdate={updateUser} onDelete={removeUser} />}
              {active === 'database' && features.includes('database') && (
                <Suspense fallback={<div className="py-16 text-center text-sm text-slate-400">Memuat halaman database...</div>}>
                  <DatabasePage onNotice={showNotice} />
                </Suspense>
              )}
              {active === 'akun' && features.includes('akun') && <AccountPage admin={admin} features={features} />}
            </>
          )}
          <footer className="mt-10 flex flex-col gap-2 border-t border-slate-200 pt-5 text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500 sm:flex-row sm:items-center sm:justify-between"><span>© 2026 PeTa SKANIDA · Admin Panel</span><span className="flex items-center gap-1"><CalendarCheck size={13} /> Sistem pengelolaan kunjungan</span></footer>
        </div>
      </main>
      <div className="fixed right-4 top-4 z-[90] flex w-[360px] max-w-[calc(100%-32px)] flex-col gap-3">
        <NotificationAlerts
          alerts={notifyAlerts}
          onDismiss={dismissNotifyAlert}
          onOpen={alert => {
            dismissNotifyAlert(alert.key)
            showHighlight(alert.requestId)
            const target = alert.status === 'Diterima'
              ? 'tamu'
              : (alert.status === 'Selesai' || alert.status === 'Ditolak')
                ? 'riwayat'
                : 'request'
            goTo(target)
          }}
        />
        <ScanAlerts alerts={scanAlerts} onDismiss={dismissScanAlert} onOpen={scan => { dismissScanAlert(scan.id); goTo('scan') }} />
      </div>
      {notice && <div role="status" className="fixed bottom-5 right-5 z-[60] flex max-w-[calc(100%-40px)] items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-xl dark:bg-slate-800 dark:ring-1 dark:ring-slate-700"><CheckCircle2 size={17} className="text-emerald-400" />{notice}</div>}
    </div>
  )
}

// Notifikasi sistem yang muncul saat tamu mencoba keluar sebelum barcode disimpan.

export { AdminApp }

export default AdminApp
