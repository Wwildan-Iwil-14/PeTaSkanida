import { useEffect, useMemo, useRef, useState } from 'react'
import { api, saveSession, clearSession, loadToken } from './lib/api'
import { subscribeToRequests } from './lib/realtime'
import { drawBarcode, downloadBarcode, BARCODE_CANVAS_ID } from './lib/barcode'
import {
  LayoutDashboard, Users, ClipboardList, History, LogOut, Menu, X,
  Search, CalendarDays, Clock3, CheckCircle2, XCircle, Hourglass,
  ArrowUpRight, ChevronRight, UserRound, Filter, ShieldCheck,
  CalendarCheck, Eye, EyeOff, MessageCircle,
  Loader2, AlertCircle, Moon, Sun, Copy, Check,
  CircleDashed, BadgeCheck, ArrowRight, ArrowLeft, Info, Mail,
  Phone, Send, Plus, ChevronDown, Download, AlertTriangle, Camera,
  Pencil, Trash2, UserPlus, FileText, UploadCloud
} from 'lucide-react'

const THEME_KEY = 'peta-skanida.theme'

// Surat tugas: opsional, PDF, maksimal 4 MB.
const SURAT_TUGAS_MAX_SIZE = 4 * 1024 * 1024
const SURAT_TUGAS_ACCEPT = '.pdf,application/pdf'

const CARD = 'rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900'
const FIELD = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-indigo-500 dark:focus:ring-indigo-500/20'

function getInitialTheme() {
  if (typeof window === 'undefined') return 'light'
  try {
    const saved = window.localStorage.getItem(THEME_KEY)
    if (saved === 'dark' || saved === 'light') return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

//pengaturan tema gelap terang
function ThemeToggle({ theme, onToggle, className = '' }) {
  const isDark = theme === 'dark'
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isDark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
      title={isDark ? 'Mode terang' : 'Mode gelap'}
      className={`grid h-10 w-10 place-items-center rounded-full border shadow-sm transition ${
        isDark
          ? 'border-slate-700 bg-slate-800 text-amber-300 hover:bg-slate-700'
          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
      } ${className}`}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'request', label: 'Daftar Request', icon: ClipboardList },
  { id: 'tamu', label: 'Kelola Tamu', icon: Users },
  { id: 'riwayat', label: 'Riwayat Kunjungan', icon: History },
  { id: 'users', label: 'Pengguna', icon: ShieldCheck },
]

const formatDate = (value) => {
  if (!value) return '-'
  return new Date(`${value}T00:00:00`).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}

// Tanggal hari ini dalam format YYYY-MM-DD (pakai zona waktu lokal,
// bukan toISOString yang memakai UTC dan bisa bergeser sehari).
const getTodayISO = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Mapping dari row database ke format yang dipakai UI
function mapRecord(r, status) {
  return {
    dbId: r.id,
    id: `REQ-${String(r.id).padStart(3, '0')}`,
    name: r.nama || '-',
    email: r.email || '',
    purpose: r.keperluan || '-',
    keperluan: r.keperluan || '-',
    tujuan: r.tujuan || '-',
    date: r.tanggal || '',
    time: r.waktu || '',
    phone: r.no_hp || '-',
    people: r.jumlah || 1,
    contacted: Boolean(r.dihubungi),
    contactedAt: r.dihubungi_at || null,
    suratTugasUrl: r.surat_tugas_url || '',
    suratTugasNama: r.surat_tugas_nama || '',
    status,
  }
}

function Status({ value }) {
  const styles = {
    Pending: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30',
    Diterima: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30',
    Ditolak: 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/30',
    Selesai: 'bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/30',
  }
  const Icon = value === 'Pending' ? Hourglass : value === 'Diterima' ? CheckCircle2 : value === 'Selesai' ? BadgeCheck : XCircle
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${styles[value] || styles.Pending}`}><Icon size={13} />{value}</span>
}

function ContactBadge({ contacted }) {
  const tone = contacted
    ? 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30'
    : 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30'
  const Icon = contacted ? BadgeCheck : CircleDashed
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${tone}`}>
      <Icon size={13} />{contacted ? 'Sudah dihubungi' : 'Belum dihubungi'}
    </span>
  )
}

function StatCard({ title, value, note, icon: Icon, tint, onClick }) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{value}</p>
          <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">{note}</p>
        </div>
        <div className={`rounded-xl p-3 ${tint}`}><Icon size={21} /></div>
      </div>
      {onClick && (
        <span className="mt-3 flex items-center gap-1 text-xs font-semibold text-slate-400 transition group-hover:text-indigo-600 dark:text-slate-500 dark:group-hover:text-indigo-400">
          Lihat detail <ArrowRight size={13} className="transition group-hover:translate-x-0.5" />
        </span>
      )}
    </>
  )

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${CARD} group p-5 text-left transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 dark:hover:border-indigo-500/50`}
      >
        {content}
      </button>
    )
  }

  return <article className={`${CARD} p-5`}>{content}</article>
}

function ThemeToggleCorner({ theme, onToggleTheme }) {
  return (
    <div className="fixed right-4 top-4 z-50">
      <ThemeToggle theme={theme} onToggle={onToggleTheme} />
    </div>
  )
}

function LoginPage({ onSelect, theme, onToggleTheme }) {
  return (
    <div className="relative grid min-h-screen bg-[#f5f7fb] dark:bg-slate-950 lg:grid-cols-2">
      <ThemeToggleCorner theme={theme} onToggleTheme={onToggleTheme} />
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[#101827] p-10 text-white dark:bg-slate-900 lg:flex">
        <div className="flex items-center gap-3">
          <img src="public/logo-peta-skanida.png" alt="Logo PeTa SKANIDA" className="h-12 w-12 shrink-0 object-contain" />
          <div>
            <p className="font-bold tracking-wide">PeTa SKANIDA</p>
            <p className="text-[10px] tracking-[.15em] text-slate-400">SMKN 2 MAGELANG</p>
          </div>
        </div>
        <div>
          <h1 className="max-w-md text-4xl font-bold leading-tight tracking-tight">Pengelolaan Daftar Tamu Kunjungan SKANIDA</h1>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-slate-400">
            Sistem yang membantu pengelola mencatat, memverifikasi, dan mengatur setiap permintaan kunjungan tamu ke SKANIDA.
            Tamu dapat mengajukan kunjungan secara daring, sementara admin memantau jadwal, menyetujui permintaan,
            dan mengarsipkan riwayat kunjungan dalam satu tempat.
          </p>
          <div className="mt-8 flex items-center gap-2 text-xs text-slate-400"><CalendarCheck size={15} /> Sistem pengelolaan kunjungan</div>
        </div>
        <p className="text-xs text-slate-500">© 2026 PeTa SKANIDA · Admin Panel</p>
      </div>
      <div className="flex items-center justify-center p-6 pt-20 sm:p-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img src="public/logo-peta-skanida.png" alt="Logo PeTa SKANIDA" className="h-12 w-12 shrink-0 object-contain" />
              <div>
                <p className="font-bold tracking-wide text-slate-900 dark:text-slate-100">PeTa SKANIDA</p>
                <p className="text-[10px] tracking-[.15em] text-slate-400 dark:text-slate-500">SMKN 2 MAGELANG</p>
              </div>
            </div>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Selamat Datang 👋</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Pilih jenis akses untuk melanjutkan ke aplikasi.</p>
          <div className="mt-8 space-y-4">
            <button onClick={() => onSelect('admin-login')} className="group flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-indigo-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-indigo-500">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-500 group-hover:text-white dark:bg-indigo-500/15 dark:text-indigo-300"><ShieldCheck size={22} /></div>
              <div className="min-w-0">
                <p className="font-bold text-slate-800 dark:text-slate-100">Admin / Pengelola</p>
                <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">Kelola request, tamu, dan riwayat kunjungan.</p>
              </div>
              <ChevronRight className="ml-auto shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-indigo-500 dark:text-slate-600" size={20} />
            </button>
            <button onClick={() => onSelect('tamu')} className="group flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-emerald-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-emerald-500">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600 transition group-hover:bg-emerald-500 group-hover:text-white dark:bg-emerald-500/15 dark:text-emerald-300"><UserRound size={22} /></div>
              <div className="min-w-0">
                <p className="font-bold text-slate-800 dark:text-slate-100">Tamu</p>
                <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">Ajukan permintaan kunjungan ke SKANIDA.</p>
              </div>
              <ChevronRight className="ml-auto shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-emerald-500 dark:text-slate-600" size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function AdminLoginPage({ onSuccess, onBack, theme, onToggleTheme }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail) { setError('Email wajib diisi.'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) { setError('Format email tidak valid, contoh: admin@skanida.sch.id.'); return }
    if (!password.trim()) { setError('Password wajib diisi.'); return }
    setError('')
    setSubmitting(true)
    try {
      const result = await api.login(normalizedEmail, password.trim())
      onSuccess(result)
    } catch (err) {
      setError('Gagal masuk: ' + (err.message || 'Terjadi kesalahan'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative grid min-h-screen bg-[#f5f7fb] dark:bg-slate-950 lg:grid-cols-2">
      <ThemeToggleCorner theme={theme} onToggleTheme={onToggleTheme} />
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[#101827] p-10 text-white dark:bg-slate-900 lg:flex">
        <div className="flex items-center gap-3">
          <img src="public/logo-peta-skanida.png" alt="Logo PeTa SKANIDA" className="h-12 w-12 shrink-0 object-contain" />
          <div>
            <p className="font-bold tracking-wide">PeTa SKANIDA</p>
            <p className="text-[10px] tracking-[.15em] text-slate-400">ADMIN PANEL</p>
          </div>
        </div>
        <div>
          <h1 className="max-w-md text-4xl font-bold leading-tight tracking-tight">Pengelolaan Daftar Tamu Kunjungan SKANIDA</h1>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-slate-400">
            Masuk sebagai admin untuk memverifikasi permintaan kunjungan tamu, mengatur jadwal, dan mengarsipkan riwayat kunjungan SKANIDA.
          </p>
          <div className="mt-8 flex items-center gap-2 text-xs text-slate-400"><CalendarCheck size={15} /> Sistem pengelolaan kunjungan</div>
        </div>
        <p className="text-xs text-slate-500">© 2026 PeTa SKANIDA · Admin Panel</p>
      </div>
      <div className="flex items-center justify-center p-6 pt-20 sm:p-10">
        <div className="w-full max-w-md">
          <button onClick={onBack} className="mb-6 flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400">
            <ChevronRight className="rotate-180" size={17} /> Kembali
          </button>
          <div className={`${CARD} p-6 sm:p-8`}>
            <div className="mb-7 flex items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300"><ShieldCheck size={22} /></div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Login Admin</h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Masukkan email dan password untuk masuk ke dashboard.</p>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@skanida.sch.id"
                  autoComplete="email"
                  className={FIELD}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Password"
                    autoComplete="current-password"
                    className={`${FIELD} pr-12`}
                  />
                  <button type="button" onClick={() => setShowPassword(current => !current)} aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 transition hover:text-indigo-600 dark:hover:text-indigo-400">
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>
              {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">{error}</p>}
              <button type="submit" disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-600 disabled:opacity-60 dark:shadow-indigo-950/40">
                {submitting && <Loader2 size={16} className="animate-spin" />}
                {submitting ? 'Memeriksa...' : 'Masuk'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

// Pilihan tujuan dikelompokkan agar mudah dicari.
const opsiTujuan = [
  { label: 'Organisasi', items: ['Osis'] },
  {
    label: 'Ekstrakurikuler',
    items: [
      'Tonti',
      'Pasopati',
      'Band',
      'PIK - R',
      'PMR',
      'Rohis',
      'Cospala',
      'English Club',
      'Futsal',
      'Basket',
      'Volly',
      'Silat',
      'Padus',
      'Screen',
      'Tari',
    ],
  },
  {
    label: 'Instansi',
    items: [
      'Kepala Sekolah',
      'WKS 1',
      'WKS 2',
      'WKS 3',
      'WKS 4',
      'Kaproli AKL',
      'Kaproli MPLB',
      'Kaproli PPLG',
      'Kaproli PM',
      'BK',
      'STP2K',
      'Perpustakaan',
      'TU',
      'Guru',
    ],
  },
]

const GUEST_FIELD = 'w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-[13px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-500 dark:focus:ring-blue-500/20'

function GuestFormPage({ onBack, onSubmit, theme, onToggleTheme }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', date: '', time: '', people: '1', keperluan: '' })
  const [tujuan, setTujuan] = useState([])
  const [activeTujuanGroup, setActiveTujuanGroup] = useState('')
  const [customTujuanOpen, setCustomTujuanOpen] = useState(false)
  const [customTujuan, setCustomTujuan] = useState('')
  const [error, setError] = useState('')
  const today = getTodayISO()
  const [suratTugas, setSuratTugas] = useState(null)
  const [fileError, setFileError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fields = [
    { key: 'name', label: 'Nama / Instansi', type: 'text', placeholder: 'Nama lengkap atau instansi', icon: UserRound, required: true },
    { key: 'email', label: 'Email', type: 'email', placeholder: 'nama@email.com', icon: Mail, required: true },
    { key: 'phone', label: 'Nomor Handphone', type: 'tel', placeholder: '08xxxxxxxxxx', icon: Phone, required: true },
    { key: 'date', label: 'Tanggal Kunjungan', type: 'date', placeholder: '', icon: CalendarDays, required: true },
    { key: 'time', label: 'Waktu Kunjungan', type: 'time', placeholder: '', icon: Clock3, required: true },
    { key: 'people', label: 'Jumlah Pengunjung', type: 'number', placeholder: '1', icon: Users, required: false },
  ]

  const activeGroup = opsiTujuan.find(group => group.label === activeTujuanGroup)

  function addCustomTujuan() {
    const value = customTujuan.trim()
    if (value) setTujuan(current => current.includes(value) ? current : [...current, value])
    setCustomTujuan('')
    setCustomTujuanOpen(false)
  }

  function toggleCustomTujuan() {
    if (customTujuanOpen) {
      addCustomTujuan()
      return
    }
    setCustomTujuanOpen(true)
    setActiveTujuanGroup('')
  }

  function toggleTujuanGroup(label) {
    if (customTujuanOpen) addCustomTujuan()
    setActiveTujuanGroup(current => current === label ? '' : label)
  }

  function toggleTujuanItem(value) {
    setTujuan(current => current.includes(value) ? current.filter(item => item !== value) : [...current, value])
  }

  function handleSuratTugasChange(e) {
    const file = e.target.files?.[0] || null
    setFileError('')
    if (!file) {
      setSuratTugas(null)
      return
    }
    const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name)
    if (!isPdf) {
      setSuratTugas(null)
      setFileError('Surat tugas harus berformat PDF.')
      return
    }
    if (file.size > SURAT_TUGAS_MAX_SIZE) {
      setSuratTugas(null)
      setFileError('Ukuran surat tugas maksimal 4 MB.')
      return
    }
    setSuratTugas(file)
  }

  function removeSuratTugas() {
    setSuratTugas(null)
    setFileError('')
    const input = document.getElementById('guest-surat-tugas')
    if (input) input.value = ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const finalTujuan = [...tujuan]
    const draftTujuan = customTujuan.trim()
    if (draftTujuan && !finalTujuan.includes(draftTujuan)) finalTujuan.push(draftTujuan)

    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.date || !form.time || !form.keperluan.trim() || !finalTujuan.length) {
      setError('Lengkapi semua kolom bertanda * dan pilih minimal satu tujuan kunjungan.')
      return
    }
    if (form.date < today) {
      setError('Tanggal kunjungan tidak boleh sebelum hari ini.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError('Format alamat email tidak valid, contoh: nama@email.com.')
      return
    }
    if (!/^[0-9+()\-\s]{8,}$/.test(form.phone.trim())) {
      setError('Nomor HP tidak valid, gunakan 8-15 digit angka.')
      return
    }
    if (suratTugas && suratTugas.size > SURAT_TUGAS_MAX_SIZE) {
      setError('Ukuran surat tugas maksimal 4 MB.')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('nama', form.name.trim())
      formData.append('email', form.email.trim())
      formData.append('no_hp', form.phone.trim())
      formData.append('tujuan', finalTujuan.join(', '))
      formData.append('keperluan', form.keperluan.trim())
      formData.append('tanggal', form.date)
      formData.append('waktu', form.time)
      formData.append('jumlah', String(parseInt(form.people) || 1))
      // Opsional: hanya dikirim bila tamu memilih file.
      if (suratTugas) formData.append('suratTugas', suratTugas)

      const result = await api.createRequestWithFile(formData)
      const requestId = result?.request?.id
      // Kode unik per permintaan dipakai sebagai isi barcode.
      // ID database memastikan setiap orang mendapat barcode berbeda.
      const kode = requestId
        ? `REQ-${String(requestId).padStart(3, '0')}`
        : `REQ-${Date.now()}`
      onSubmit({
        id: requestId,
        kode,
        nama: form.name.trim(),
        email: form.email.trim(),
        no_hp: form.phone.trim(),
        tujuan: finalTujuan.join(', '),
        keperluan: form.keperluan.trim(),
        tanggal: form.date,
        waktu: form.time,
        jumlah: parseInt(form.people) || 1,
        suratTugasNama:
          result?.request?.surat_tugas_nama ||
          result?.suratTugas?.nama ||
          suratTugas?.name ||
          '',
        suratTugasUrl:
          result?.request?.surat_tugas_url || result?.suratTugas?.url || '',
        suratTugasEmail: result?.suratTugas?.tujuanEmail || '',
      })
    } catch (err) {
      setError('Gagal mengirim permintaan: ' + (err.message || 'Terjadi kesalahan. Silakan coba lagi.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-sky-400 via-blue-500 to-blue-700 px-4 py-8 dark:from-slate-950 dark:via-blue-950 dark:to-slate-950 sm:px-6 sm:py-10">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 -top-24 h-[420px] w-[520px] -rotate-12 rounded-[48px] bg-white/25 blur-3xl dark:bg-blue-400/10" />
        <div className="absolute -right-24 top-16 h-[360px] w-[440px] rotate-6 rounded-[44px] bg-sky-100/40 blur-3xl dark:bg-blue-500/10" />
        <div className="absolute left-1/4 top-1/2 h-[480px] w-[600px] rounded-[64px] bg-blue-300/30 blur-3xl dark:bg-blue-600/10" />
        <div className="absolute -bottom-32 right-1/4 h-80 w-[420px] -rotate-3 rounded-[48px] bg-white/20 blur-3xl dark:bg-slate-700/20" />
      </div>

      <div className="relative mx-auto w-full max-w-xl">
        <div className="mb-5 flex items-center gap-3 px-1">
          <button
            type="button"
            onClick={onBack}
            aria-label="Kembali ke halaman login"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/40 bg-white/20 text-white shadow-sm backdrop-blur-md transition hover:bg-white/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <ArrowLeft size={19} />
          </button>
          <div className="min-w-0">
            <h1 className="text-base font-bold tracking-tight text-white sm:text-xl">Formulir Kunjungan Tamu</h1>
            <p className="mt-0.5 text-[11px] font-medium tracking-wide text-white/75 sm:text-xs">PeTa SKANIDA · SMK Negeri 2 Magelang</p>
          </div>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} className="ml-auto shrink-0" />
        </div>

        <div className="rounded-[26px] border border-white/60 bg-white/95 p-4 shadow-[0_30px_80px_-25px_rgba(8,47,99,0.55)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/95 sm:p-6">
          <div className="flex items-start gap-2.5 rounded-xl bg-blue-50 px-3.5 py-3 text-[12px] leading-relaxed text-slate-600 dark:bg-blue-500/10 dark:text-slate-300">
            <Info size={16} className="mt-0.5 shrink-0 text-blue-500 dark:text-blue-300" />
            <p>Silakan isi data kunjungan Anda dengan lengkap. Data akan digunakan oleh pihak sekolah untuk keperluan administrasi dan pengelolaan tamu.</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-4">
            <div className="grid gap-x-3.5 gap-y-3 sm:grid-cols-2">
              {fields.map(({ key, label, type, placeholder, icon: Icon, required }) => (
                <div key={key}>
                  <label htmlFor={`guest-${key}`} className="mb-1.5 block text-[12px] font-semibold text-slate-700 dark:text-slate-300">
                    {label} {required && <span className="text-blue-500 dark:text-blue-400">*</span>}
                  </label>
                  <div className="relative">
                    <Icon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
                    <input
                      id={`guest-${key}`}
                      type={type}
                      value={form[key]}
                      onChange={e => setForm(current => ({ ...current, [key]: e.target.value }))}
                      placeholder={placeholder}
                      min={type === 'number' ? 1 : type === 'date' ? today : undefined}
                      className={GUEST_FIELD}
                    />
                  </div>
                </div>
              ))}

              <div>
                <label htmlFor="guest-keperluan" className="mb-1.5 block text-[12px] font-semibold text-slate-700 dark:text-slate-300">
                  Keperluan Kunjungan <span className="text-blue-500 dark:text-blue-400">*</span>
                </label>
                <div className="relative">
                  <ClipboardList className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
                  <input
                    id="guest-keperluan"
                    type="text"
                    value={form.keperluan}
                    onChange={e => setForm(current => ({ ...current, keperluan: e.target.value }))}
                    placeholder="Tuliskan keperluan kunjungan..."
                    className={GUEST_FIELD}
                  />
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl bg-slate-100/90 px-3.5 py-3 text-[11.5px] leading-relaxed text-slate-500 dark:bg-slate-800/70 dark:text-slate-400 sm:mt-[22px]">
                <Info size={15} className="mt-0.5 shrink-0 text-slate-400 dark:text-slate-500" />
                <p>Data Anda akan diverifikasi petugas saat tiba di sekolah.</p>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300">
                Tujuan Kunjungan <span className="text-blue-500 dark:text-blue-400">*</span>
              </label>
              <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">Pilih pihak yang ingin Anda temui. Bisa lebih dari satu.</p>

              <div className="mt-2 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">Pilihan tersedia</p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {opsiTujuan.map(group => {
                    const active = activeTujuanGroup === group.label
                    const selectedCount = group.items.filter(item => tujuan.includes(item)).length
                    return (
                      <button
                        type="button"
                        key={group.label}
                        onClick={() => toggleTujuanGroup(group.label)}
                        aria-expanded={active}
                        className={`inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition ${
                          active
                            ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-200'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50/60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-500/40 dark:hover:bg-blue-500/10'
                        }`}
                      >
                        {group.label}
                        {selectedCount > 0 ? (
                          <span className="grid h-4 min-w-4 place-items-center rounded-full bg-blue-500 px-1 text-[9px] font-bold text-white">{selectedCount}</span>
                        ) : (
                          <ChevronDown size={11} className={active ? 'rotate-180 transition-transform' : 'transition-transform'} />
                        )}
                      </button>
                    )
                  })}
                  <button
                    type="button"
                    onClick={toggleCustomTujuan}
                    aria-expanded={customTujuanOpen}
                    className={`inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition ${
                      customTujuanOpen
                        ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-200'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50/60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-500/40 dark:hover:bg-blue-500/10'
                    }`}
                  >
                    Lainnya
                    <span className={`grid h-4 w-4 place-items-center rounded-full ${customTujuanOpen ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                      {customTujuanOpen ? <Check size={10} /> : <Plus size={10} />}
                    </span>
                  </button>
                </div>

                {activeGroup && (
                  <div className="mt-2.5 rounded-lg border border-slate-100 bg-slate-50/70 p-2.5 dark:border-slate-800 dark:bg-slate-950/40">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">{activeGroup.label}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {activeGroup.items.map(item => {
                        const selected = tujuan.includes(item)
                        return (
                          <button
                            type="button"
                            key={item}
                            onClick={() => toggleTujuanItem(item)}
                            aria-pressed={selected}
                            className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[10.5px] font-medium transition ${
                              selected
                                ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-200'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50/60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-500/40 dark:hover:bg-blue-500/10'
                            }`}
                          >
                            {item}
                            {selected ? <Check size={10} /> : <Plus size={9} />}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {customTujuanOpen && (
                  <div className="mt-2.5 flex flex-col gap-2 sm:flex-row">
                    <input
                      value={customTujuan}
                      onChange={e => setCustomTujuan(e.target.value)}
                      autoFocus
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addCustomTujuan()
                        }
                      }}
                      placeholder="Tulis tujuan lainnya..."
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-500 dark:focus:ring-blue-500/20"
                    />
                    <button type="button" onClick={addCustomTujuan} className="shrink-0 rounded-lg bg-blue-500 px-3 py-2 text-[11px] font-bold text-white transition hover:bg-blue-600">Tambah</button>
                  </div>
                )}
              </div>

              <div className="mt-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-3 dark:border-slate-600 dark:bg-slate-800/40">
                <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                  Tujuan terpilih <Info size={11} />
                </p>
                {tujuan.length ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {tujuan.map(item => (
                      <span key={item} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1.5 text-[11px] font-semibold text-blue-700 ring-1 ring-inset ring-blue-100 dark:bg-blue-500/10 dark:text-blue-200 dark:ring-blue-500/20">
                        {item}
                        <button
                          type="button"
                          onClick={() => setTujuan(current => current.filter(value => value !== item))}
                          aria-label={`Hapus ${item}`}
                          className="text-blue-400 transition hover:text-blue-700 dark:text-blue-300 dark:hover:text-white"
                        >
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1.5 flex items-center gap-1.5 py-0.5 text-[11.5px] text-slate-400 dark:text-slate-500">
                    <ChevronDown size={13} /> Klik pilihan di atas untuk menambahkan
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="guest-surat-tugas" className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300">
                  Surat Tugas{' '}
                  <span className="ml-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">Opsional</span>
                </label>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">PDF · maks. 4 MB</span>
              </div>
              <label
                htmlFor="guest-surat-tugas"
                className={`mt-1.5 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed px-3.5 py-3 transition ${
                  suratTugas
                    ? 'border-emerald-300 bg-emerald-50/60 dark:border-emerald-500/40 dark:bg-emerald-500/10'
                    : 'border-slate-300 bg-slate-50/70 hover:border-blue-300 hover:bg-blue-50/50 dark:border-slate-600 dark:bg-slate-800/40 dark:hover:border-blue-500/40'
                }`}
              >
                <input
                  id="guest-surat-tugas"
                  type="file"
                  accept={SURAT_TUGAS_ACCEPT}
                  onChange={handleSuratTugasChange}
                  className="sr-only"
                />
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${suratTugas ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300' : 'bg-white text-slate-400 shadow-sm dark:bg-slate-900 dark:text-slate-500'}`}>
                  {suratTugas ? <FileText size={18} /> : <UploadCloud size={18} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12px] font-semibold text-slate-700 dark:text-slate-200">
                    {suratTugas ? suratTugas.name : 'Klik untuk pilih surat tugas'}
                  </span>
                  <span className="mt-0.5 block text-[10.5px] text-slate-400 dark:text-slate-500">
                    {suratTugas
                      ? `${(suratTugas.size / 1024 / 1024).toFixed(2)} MB · siap diunggah`
                      : 'Tidak wajib diisi. Biarkan kosong jika tidak ada.'}
                  </span>
                </span>
                {suratTugas && (
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeSuratTugas() }}
                    aria-label="Hapus surat tugas"
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-white hover:text-rose-500 dark:hover:bg-slate-800"
                  >
                    <X size={14} />
                  </button>
                )}
              </label>
              {fileError && (
                <p className="mt-1.5 text-[11px] font-medium text-rose-500 dark:text-rose-400">{fileError}</p>
              )}
            </div>

            {error && (
              <p className="mt-3 rounded-xl bg-rose-50 px-3.5 py-2.5 text-[12px] font-medium text-rose-600 ring-1 ring-inset ring-rose-100 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/20">{error}</p>
            )}

            <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
              <Info size={12} className="mt-0.5 shrink-0" />
              Pilih "Lainnya" jika tujuan Anda tidak tersedia di daftar.
            </p>

            <div className="mt-4 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
              <button type="button" onClick={onBack} className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-[12.5px] font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800">
                Batal
              </button>
              <button type="submit" disabled={submitting} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-5 py-2.5 text-[12.5px] font-bold text-white shadow-lg shadow-blue-200/70 transition hover:bg-blue-600 disabled:opacity-60 dark:shadow-blue-950/40">
                {submitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                {submitting ? 'Mengirim...' : 'Kirim Data Kunjungan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Barcode unik untuk setiap permintaan, lengkap dengan tombol unduh.
function BarcodeBlock({ value, saved, onDownloaded }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!canvasRef.current || !value) return
    try {
      drawBarcode(canvasRef.current, value, { scale: 3, height: 110, fontSize: 22 })
    } catch {
      // Jika nilai tidak didukung, biarkan kanvas kosong.
    }
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
      <button
        type="button"
        onClick={handleDownload}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-200/70 transition hover:bg-blue-600 dark:shadow-blue-950/40"
      >
        <Download size={16} />
        {saved ? 'Unduh Lagi Barcode' : 'Unduh Barcode'}
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

function Panel({ title, subtitle, action, children }) {
  return (
    <section className={`${CARD} overflow-hidden`}>
      <div className="flex flex-col gap-2 border-b border-slate-100 px-6 py-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-bold text-slate-900 dark:text-slate-100">{title}</h2>
          {subtitle && <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

// ---- Form & konfirmasi untuk fitur CRUD admin ----

const RECORD_FIELDS = [
  { key: 'nama', label: 'Nama / Instansi', type: 'text', required: true },
  { key: 'email', label: 'Email', type: 'email', required: true },
  { key: 'no_hp', label: 'Nomor Handphone', type: 'tel', required: true },
  { key: 'tujuan', label: 'Tujuan', type: 'text', required: true },
  { key: 'keperluan', label: 'Keperluan', type: 'text', required: true },
  { key: 'tanggal', label: 'Tanggal Kunjungan', type: 'date', required: true },
  { key: 'waktu', label: 'Waktu Kunjungan', type: 'time' },
  { key: 'jumlah', label: 'Jumlah Pengunjung', type: 'number', required: true, min: 1 },
]

const GUEST_CREATE_FIELDS = [
  ...RECORD_FIELDS,
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    required: true,
    options: [
      { value: 'Diterima', label: 'Diterima' },
      { value: 'Ditolak', label: 'Ditolak' },
      { value: 'Selesai', label: 'Selesai (langsung masuk riwayat)' },
      { value: 'Pending', label: 'Pending' },
    ],
  },
]

const USER_FIELDS = [
  { key: 'nama', label: 'Nama Petugas', type: 'text', required: true },
  { key: 'email', label: 'Email', type: 'email', required: true },
  { key: 'password', label: 'Password', type: 'password', autoComplete: 'new-password' },
  {
    key: 'role',
    label: 'Role',
    type: 'select',
    required: true,
    options: [
      { value: 'admin', label: 'Admin' },
      { value: 'petugas', label: 'Petugas' },
    ],
  },
]

function FormModal({ title, subtitle, fields, initial = {}, onSave, onClose }) {
  const [values, setValues] = useState(() => {
    const base = { ...initial }
    for (const field of fields) {
      if (base[field.key] === undefined || base[field.key] === null) {
        base[field.key] = field.type === 'number' ? 1 : ''
      }
    }
    return base
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await onSave(values)
    } catch (err) {
      setError(err.message || 'Gagal menyimpan data.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 dark:ring-1 dark:ring-slate-700" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h3>
            {subtitle && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Tutup" className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 grid gap-3.5 sm:grid-cols-2">
          {fields.map(field => (
            <div key={field.key} className={field.key === 'keperluan' ? 'sm:col-span-2' : ''}>
              <label htmlFor={`form-${field.key}`} className="mb-1.5 block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                {field.label} {field.required && <span className="text-indigo-500">*</span>}
              </label>
              {field.type === 'select' ? (
                <select
                  id={`form-${field.key}`}
                  value={values[field.key] ?? ''}
                  onChange={e => setValues(current => ({ ...current, [field.key]: e.target.value }))}
                  required={field.required}
                  className={FIELD}
                >
                  {(field.options || []).map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              ) : (
                <input
                  id={`form-${field.key}`}
                  type={field.type}
                  value={values[field.key] ?? ''}
                  onChange={e => setValues(current => ({ ...current, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  min={field.min}
                  required={field.required}
                  autoComplete={field.autoComplete}
                  className={FIELD}
                />
              )}
              {field.hint && <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">{field.hint}</p>}
            </div>
          ))}

          {error && <p className="sm:col-span-2 rounded-xl bg-rose-50 px-3 py-2 text-[12px] font-medium text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">{error}</p>}

          <div className="mt-1 flex justify-end gap-2 sm:col-span-2">
            <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Batal</button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-indigo-600 disabled:opacity-60">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ConfirmModal({ title, message, onConfirm, onClose }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleConfirm() {
    setBusy(true)
    setError('')
    try {
      await onConfirm()
    } catch (err) {
      setError(err.message || 'Gagal menghapus data.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 dark:ring-1 dark:ring-slate-700" onClick={e => e.stopPropagation()}>
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300"><Trash2 size={19} /></div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{message}</p>
          </div>
        </div>
        {error && <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-[12px] font-medium text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Batal</button>
          <button type="button" onClick={handleConfirm} disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-rose-600 disabled:opacity-60">
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            {busy ? 'Menghapus...' : 'Hapus'}
          </button>
        </div>
      </div>
    </div>
  )
}

function UsersPage({ users, onCreate, onUpdate, onDelete, currentUserId }) {
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const fields = editing === 'new'
    ? USER_FIELDS.map(field => field.key === 'password'
        ? { ...field, required: true, hint: 'Minimal 6 karakter.' }
        : field)
    : USER_FIELDS.map(field => field.key === 'password'
        ? { ...field, hint: 'Kosongkan untuk tetap memakai password lama.' }
        : field)

  return <>
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Pengguna</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Kelola akun admin dan petugas yang bisa mengakses aplikasi.</p>
      </div>
      <button type="button" onClick={() => setEditing('new')} className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-600">
        <UserPlus size={15} /> Tambah Pengguna
      </button>
    </div>

    <Panel title="Daftar pengguna" subtitle={`${users.length} akun terdaftar`}>
      {users.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-400 dark:bg-slate-800/60">
              <tr>
                <th className="px-6 py-4 font-semibold">Nama</th>
                <th className="px-6 py-4 font-semibold">Email</th>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold">Dibuat</th>
                <th className="px-6 py-4 text-right font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.map(user => (
                <tr key={user.id} className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">{user.nama || '-'}</div>
                    {user.user_id === currentUserId && <span className="mt-1 inline-block text-[10px] font-semibold text-indigo-500">Akun Anda</span>}
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{user.email || '-'}</td>
                  <td className="px-6 py-4"><span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold capitalize text-slate-600 dark:bg-slate-800 dark:text-slate-300">{user.role || 'admin'}</span></td>
                  <td className="px-6 py-4 text-xs text-slate-400 dark:text-slate-500">{user.created_at ? new Date(user.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => setEditing(user)} title="Edit pengguna" className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20"><Pencil size={13} /> Edit</button>
                      <button type="button" onClick={() => setDeleting(user)} title="Hapus pengguna" className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20"><Trash2 size={13} /> Hapus</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <div className="px-6 py-12 text-center text-sm text-slate-400 dark:text-slate-500">Belum ada pengguna.</div>}
    </Panel>

    {editing && (
      <FormModal
        title={editing === 'new' ? 'Tambah Pengguna' : 'Edit Pengguna'}
        subtitle={editing === 'new' ? 'Buat akun admin/petugas baru.' : `Ubah data ${editing.nama}.`}
        fields={fields}
        initial={editing === 'new' ? { role: 'admin' } : editing}
        onSave={async values => {
          if (editing === 'new') await onCreate(values)
          else await onUpdate(editing.id, values)
          setEditing(null)
        }}
        onClose={() => setEditing(null)}
      />
    )}

    {deleting && (
      <ConfirmModal
        title="Hapus pengguna?"
        message={`Akun ${deleting.nama} akan dihapus dan tidak bisa lagi login ke aplikasi.`}
        onConfirm={async () => { await onDelete(deleting.id); setDeleting(null) }}
        onClose={() => setDeleting(null)}
      />
    )}
  </>
}

function RequestTable({ items, showActions = false, showContact = false, onUpdateStatus, onToggleContacted, onComplete, showCrud = false, onEdit, onDelete }) {
  if (!items.length) {
    return <div className="px-6 py-12 text-center text-sm text-slate-400 dark:text-slate-500">Tidak ada data yang cocok.</div>
  }
  const hasActions = showActions || Boolean(onComplete) || showCrud
  const waLink = phone => `https://wa.me/${phone.replace(/[^0-9]/g, '').replace(/^0/, '62')}`
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1140px] text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-400 dark:bg-slate-800/60 dark:text-slate-400">
          <tr>
            <th className="px-6 py-4 font-semibold">Pengunjung</th>
            <th className="px-6 py-4 font-semibold">Email</th>
            <th className="px-6 py-4 font-semibold">Tujuan</th>
            <th className="px-6 py-4 font-semibold">Keperluan</th>
            <th className="px-6 py-4 font-semibold">Surat Tugas</th>
            <th className="px-6 py-4 font-semibold">Jadwal</th>
            <th className="px-6 py-4 font-semibold">Jumlah</th>
            <th className="px-6 py-4 font-semibold">Status</th>
            {hasActions && <th className="px-6 py-4 text-right font-semibold">Aksi</th>}
            {showContact && <th className="px-6 py-4 font-semibold">Kontak</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {items.map(item => (
            <tr key={item.id} className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
              <td className="px-6 py-4">
                <div className="font-semibold text-slate-800 dark:text-slate-200">{item.name}</div>
                <div className="mt-1 text-xs text-slate-400 dark:text-slate-500">{item.id} · {item.phone}</div>
              </td>
              <td className="px-6 py-4">
                {item.email ? (
                  <a
                    href={`mailto:${item.email}`}
                    title={item.email}
                    className="inline-flex max-w-[220px] items-center gap-1.5 text-slate-600 transition hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400"
                  >
                    <Mail size={14} className="shrink-0" />
                    <span className="truncate">{item.email}</span>
                  </a>
                ) : <span className="text-slate-400 dark:text-slate-500">-</span>}
              </td>
              <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{item.tujuan}</td>
              <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{item.keperluan}</td>
              <td className="px-6 py-4">
                {item.suratTugasUrl ? (
                  <a href={item.suratTugasUrl} target="_blank" rel="noreferrer" title={item.suratTugasNama || 'Buka surat tugas'} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20">
                    <FileText size={13} /> Lihat
                  </a>
                ) : <span className="text-xs text-slate-400 dark:text-slate-500">-</span>}
              </td>
              <td className="px-6 py-4">
                <div className="font-medium text-slate-700 dark:text-slate-300">{formatDate(item.date)}</div>
                <div className="mt-1 text-xs text-slate-400 dark:text-slate-500">{item.time ? `${item.time} WIB` : '-'}</div>
              </td>
              <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{item.people} orang</td>
              <td className="px-6 py-4"><Status value={item.status} /></td>
              {hasActions && <td className="px-6 py-4">
                <div className="flex flex-wrap items-center justify-end gap-2">
                  {item.status === 'Pending' && showActions && (
                    <>
                      <button type="button" onClick={() => onUpdateStatus(item.id, 'Diterima')} className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20">Terima</button>
                      <button type="button" onClick={() => onUpdateStatus(item.id, 'Ditolak')} className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20">Tolak</button>
                    </>
                  )}
                  {item.status === 'Diterima' && onComplete && (
                    <button
                      type="button"
                      onClick={() => onComplete(item.id)}
                      title="Tandai kunjungan selesai dan pindahkan ke Riwayat Kunjungan"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700 transition hover:bg-sky-100 dark:bg-sky-500/10 dark:text-sky-300 dark:hover:bg-sky-500/20"
                    >
                      <CheckCircle2 size={14} /> Selesai
                    </button>
                  )}
                  {showCrud && (
                    <>
                      {onEdit && (
                        <button type="button" onClick={() => onEdit(item)} title="Edit data" className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20"><Pencil size={13} /> Edit</button>
                      )}
                      {onDelete && (
                        <button type="button" onClick={() => onDelete(item)} title="Hapus data" className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20"><Trash2 size={13} /> Hapus</button>
                      )}
                    </>
                  )}
                  {!showActions && !onComplete && !showCrud && (
                    <span className="text-xs text-slate-400 dark:text-slate-500">{item.status === 'Selesai' ? 'Di riwayat' : 'Sudah diproses'}</span>
                  )}
                </div>
              </td>}
              {showContact && <td className="px-6 py-4">
                <div className="flex flex-col items-start gap-2">
                  <ContactBadge contacted={item.contacted} />
                  {item.contacted && item.contactedAt && (
                    <span className="text-[11px] text-slate-400 dark:text-slate-500">
                      {new Date(item.contactedAt).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    <a href={waLink(item.phone)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20">
                      <MessageCircle size={14} /> Hubungi
                    </a>
                    {onToggleContacted && (
                      <button
                        type="button"
                        onClick={() => onToggleContacted(item.id, !item.contacted)}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                          item.contacted
                            ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                            : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20'
                        }`}
                      >
                        {item.contacted ? <CircleDashed size={14} /> : <BadgeCheck size={14} />}
                        {item.contacted ? 'Tandai belum' : 'Tandai sudah'}
                      </button>
                    )}
                  </div>
                </div>
              </td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SearchFilter({ query, onQueryChange, filter, onFilterChange, contactFilter, onContactFilterChange, showContactFilter = false, statusOptions = ['Semua', 'Pending', 'Diterima', 'Ditolak'], sortOrder, onSortOrderChange }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <div className="relative flex-1">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
        <input
          type="search"
          value={query}
          onChange={e => onQueryChange(e.target.value)}
          placeholder="Cari nama atau ID request..."
          aria-label="Cari nama atau ID request"
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-indigo-500 dark:focus:ring-indigo-500/20"
        />
      </div>
      {showContactFilter && (
        <div className="relative">
          <MessageCircle className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <select
            value={contactFilter}
            onChange={e => onContactFilterChange(e.target.value)}
            aria-label="Filter status kontak"
            className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-9 text-sm text-slate-600 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:focus:border-indigo-500 sm:w-48"
          >
            <option value="Semua">Semua kontak</option><option value="Sudah">Sudah dihubungi</option><option value="Belum">Belum dihubungi</option>
          </select>
        </div>
      )}
      <div className="relative">
        <Filter className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <select
          value={filter}
          onChange={e => onFilterChange(e.target.value)}
          aria-label="Filter status"
          className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-9 text-sm text-slate-600 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:focus:border-indigo-500 sm:w-44"
        >
          {statusOptions.map(option => <option key={option}>{option}</option>)}
        </select>
      </div>
      {sortOrder !== undefined && (
        <div className="relative">
          <CalendarDays className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <select
            value={sortOrder}
            onChange={e => onSortOrderChange(e.target.value)}
            aria-label="Urutkan berdasarkan tanggal request"
            className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-9 text-sm text-slate-600 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:focus:border-indigo-500 sm:w-52"
          >
            <option value="Terkini">Tanggal Terkini</option>
            <option value="Terlama">Tanggal Terlama</option>
          </select>
        </div>
      )}
    </div>
  )
}

function Dashboard({ requests, adminName, onGoTo }) {
  const pending = requests.filter(item => item.status === 'Pending')
  const accepted = requests.filter(item => item.status === 'Diterima')
  const rejected = requests.filter(item => item.status === 'Ditolak')
  const today = new Date().toISOString().split('T')[0]
  const upcoming = requests.filter(item => item.status === 'Diterima' && item.date >= today)

  return <>
    <div className="mb-7">
      <p className="text-sm text-slate-500 dark:text-slate-400">Selamat datang kembali, {adminName || 'Admin'} 👋</p>
      <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Ringkasan aktivitas</h2>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Pantau permintaan dan jadwal kunjungan dalam satu tempat. Dashboard hanya menampilkan informasi — persetujuan dilakukan di menu Daftar Request.</p>
    </div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard title="Total Request" value={requests.length} note="Seluruh permintaan masuk" icon={ClipboardList} tint="bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300" />
      <StatCard title="Menunggu" value={pending.length} note="Klik untuk membuka daftar request" icon={Hourglass} tint="bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300" onClick={() => onGoTo('request')} />
      <StatCard title="Diterima" value={accepted.length} note="Klik untuk membuka kelola tamu" icon={CheckCircle2} tint="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300" onClick={() => onGoTo('tamu', 'Diterima')} />
      <StatCard title="Ditolak" value={rejected.length} note="Klik untuk membuka kelola tamu" icon={XCircle} tint="bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300" onClick={() => onGoTo('tamu', 'Ditolak')} />
    </div>
    <div className="mt-6 space-y-6">
      <Panel title="Request terbaru" subtitle="Permintaan kunjungan yang baru masuk" action={<button onClick={() => onGoTo('request')} className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300">Lihat semua <ArrowUpRight className="ml-1 inline" size={15} /></button>}>
        <RequestTable items={requests.slice(0, 4)} />
      </Panel>
      <Panel title="Kunjungan mendatang" subtitle="Jadwal kunjungan yang telah disetujui">
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {upcoming.length ? upcoming.map(item => <div key={item.id} className="flex items-start gap-3 px-5 py-4">
            <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300"><CalendarDays size={19} /></div>
            <div className="min-w-0 flex-1"><p className="font-semibold text-slate-800 dark:text-slate-200">{item.name}</p><p className="mt-1 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400"><Mail size={13} className="shrink-0" /><span className="truncate">{item.email || '-'}</span></p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.purpose}</p><p className="mt-2 flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500"><Clock3 size={13} /> {formatDate(item.date)} · {item.time || '-'}</p></div>
          </div>) : <p className="px-5 py-10 text-center text-sm text-slate-400 dark:text-slate-500">Belum ada jadwal mendatang.</p>}
        </div>
      </Panel>
    </div>
  </>
}

function ListingPage({ type, visibleRequests, query, onQueryChange, filter, onFilterChange, contactFilter, onContactFilterChange, onUpdateStatus, onToggleContacted, onComplete, sortOrder, onSortOrderChange, onCreate, onUpdate, onDelete }) {
  const isPending = type === 'request'
  const [tamuView, setTamuView] = useState('semua')
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  // Kelola Tamu hanya menampilkan tamu yang belum selesai.
  // Tamu berstatus "Selesai" sudah pindah ke Riwayat Kunjungan.
  const managed = visibleRequests.filter(item => item.status === 'Diterima' || item.status === 'Ditolak')
  const recent = managed.filter(item => item.status === 'Diterima')
  const view = isPending ? 'request' : (filter === 'Ditolak' ? 'semua' : tamuView)
  const byStatus = isPending
    ? visibleRequests.filter(item => item.status === 'Pending')
    : view === 'terkini' ? recent : managed
  const filtered = isPending
    ? byStatus
    : byStatus.filter(item => view !== 'semua' || contactFilter === 'Semua' || (contactFilter === 'Sudah' ? item.contacted : !item.contacted))
  const items = sortOrder === undefined
    ? filtered
    : filtered.slice().sort((a, b) => {
        const toValue = item => new Date(`${item.date || ''}T${item.time || '00:00'}`).getTime() || 0
        const diff = toValue(a) - toValue(b)
        return sortOrder === 'Terlama' ? diff : -diff
      })
  const contactedCount = byStatus.filter(item => item.contacted).length

  function selectView(next) {
    setTamuView(next)
    if (next === 'terkini' && filter === 'Ditolak') onFilterChange('Semua')
  }

  return <>
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{isPending ? 'Daftar Request' : 'Kelola Tamu'}</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{isPending ? 'Periksa permintaan dan tentukan persetujuan kunjungan.' : 'Daftar tamu yang telah disetujui atau ditolak. Klik Selesai untuk memindahkan tamu ke Riwayat Kunjungan.'}</p>
      </div>
      {!isPending && (
        <button type="button" onClick={() => setEditing('new')} className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-600">
          <UserPlus size={15} /> Tambah Tamu
        </button>
      )}
    </div>

    {!isPending && (
      <div className="mb-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => selectView('semua')}
          className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
            view === 'semua'
              ? 'border-indigo-500 bg-indigo-500 text-white shadow-sm shadow-indigo-200 dark:shadow-indigo-950/40'
              : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-indigo-500/50 dark:hover:text-indigo-300'
          }`}
        >
          <ClipboardList size={16} /> Semua Tamu
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${view === 'semua' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>{managed.length}</span>
        </button>
        <button
          type="button"
          onClick={() => selectView('terkini')}
          className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
            view === 'terkini'
              ? 'border-indigo-500 bg-indigo-500 text-white shadow-sm shadow-indigo-200 dark:shadow-indigo-950/40'
              : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-indigo-500/50 dark:hover:text-indigo-300'
          }`}
        >
          <Users size={16} /> Kunjungan Terkini
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${view === 'terkini' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>{recent.length}</span>
        </button>
      </div>
    )}

    <div className="mb-5">
      <SearchFilter
        query={query}
        onQueryChange={onQueryChange}
        filter={filter}
        onFilterChange={onFilterChange}
        showContactFilter={!isPending && view === 'semua'}
        contactFilter={contactFilter}
        onContactFilterChange={onContactFilterChange}
        statusOptions={isPending ? ['Semua', 'Pending', 'Diterima', 'Ditolak'] : ['Semua', 'Diterima', 'Ditolak']}
        sortOrder={isPending ? sortOrder : undefined}
        onSortOrderChange={onSortOrderChange}
      />
    </div>
    <Panel
      title={isPending ? 'Permintaan menunggu persetujuan' : view === 'terkini' ? 'Kunjungan terkini' : 'Daftar tamu terkelola'}
      subtitle={isPending
        ? `${items.length} data ditemukan`
        : view === 'terkini'
          ? `${items.length} tamu aktif · klik Selesai untuk memindahkan ke Riwayat Kunjungan`
          : `${items.length} data · ${contactedCount} sudah dihubungi · ${byStatus.length - contactedCount} belum dihubungi`}
    >
      <RequestTable
        items={items}
        showActions={isPending}
        showContact={!isPending && view === 'semua'}
        onUpdateStatus={onUpdateStatus}
        onToggleContacted={onToggleContacted}
        onComplete={!isPending ? onComplete : undefined}
        showCrud={!isPending}
        onEdit={item => setEditing(item)}
        onDelete={item => setDeleting(item)}
      />
    </Panel>

    {editing && (
      <FormModal
        title={editing === 'new' ? 'Tambah Tamu' : 'Edit Tamu'}
        subtitle={editing === 'new' ? 'Tambahkan tamu baru ke dalam sistem.' : `Ubah data ${editing.name}.`}
        fields={editing === 'new' ? GUEST_CREATE_FIELDS : RECORD_FIELDS}
        initial={editing === 'new'
          ? { tanggal: new Date().toISOString().split('T')[0], jumlah: 1, status: 'Diterima' }
          : {
              nama: editing.name,
              email: editing.email,
              no_hp: editing.phone,
              tujuan: editing.tujuan,
              keperluan: editing.keperluan,
              tanggal: editing.date,
              waktu: editing.time,
              jumlah: editing.people,
            }}
        onSave={async values => {
          if (editing === 'new') await onCreate(values)
          else await onUpdate(editing.dbId, values)
          setEditing(null)
        }}
        onClose={() => setEditing(null)}
      />
    )}

    {deleting && (
      <ConfirmModal
        title="Hapus tamu?"
        message={`Data ${deleting.name} (${deleting.id}) akan dihapus beserta catatan kunjungannya.`}
        onConfirm={async () => { await onDelete(deleting.dbId); setDeleting(null) }}
        onClose={() => setDeleting(null)}
      />
    )}
  </>
}

function HistoryPage({ visibleRequests, query, onQueryChange, filter, onFilterChange, onCreate, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const items = visibleRequests
    .filter(item => item.status === 'Selesai' || item.status === 'Ditolak')
    .slice()
    .sort((a, b) => {
      const toValue = ({ date, time }) => new Date(`${date}T${time || '00:00'}`).getTime()
      return toValue(b) - toValue(a)
    })
  const completed = items.filter(item => item.status === 'Selesai').length
  return <>
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Riwayat Kunjungan</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Arsip kunjungan yang sudah ditandai selesai, beserta permintaan yang ditolak.</p>
      </div>
      <button type="button" onClick={() => setEditing('new')} className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-600">
        <UserPlus size={15} /> Tambah Riwayat
      </button>
    </div>
    <div className="mb-5">
      <SearchFilter query={query} onQueryChange={onQueryChange} filter={filter} onFilterChange={onFilterChange} statusOptions={['Semua', 'Selesai', 'Ditolak']} />
    </div>
    <Panel title="Riwayat request" subtitle={`${items.length} data · ${completed} kunjungan selesai · ${items.length - completed} ditolak`}>
      <RequestTable
        items={items}
        showCrud
        onEdit={item => setEditing(item)}
        onDelete={item => setDeleting(item)}
      />
    </Panel>

    {editing && (
      <FormModal
        title={editing === 'new' ? 'Tambah Riwayat' : 'Edit Riwayat'}
        subtitle={editing === 'new' ? 'Tambahkan arsip kunjungan baru.' : `Ubah data ${editing.name}.`}
        fields={RECORD_FIELDS}
        initial={editing === 'new'
          ? { tanggal: new Date().toISOString().split('T')[0], jumlah: 1 }
          : {
              nama: editing.name,
              email: editing.email,
              no_hp: editing.phone,
              tujuan: editing.tujuan,
              keperluan: editing.keperluan,
              tanggal: editing.date,
              waktu: editing.time,
              jumlah: editing.people,
            }}
        onSave={async values => {
          if (editing === 'new') await onCreate(values)
          else await onUpdate(editing.dbId, values)
          setEditing(null)
        }}
        onClose={() => setEditing(null)}
      />
    )}

    {deleting && (
      <ConfirmModal
        title="Hapus riwayat?"
        message={`Riwayat ${deleting.name} (${deleting.id}) akan dihapus permanen.`}
        onConfirm={async () => { await onDelete(deleting.dbId); setDeleting(null) }}
        onClose={() => setDeleting(null)}
      />
    )}
  </>
}

function AdminApp({ onLogout, adminName, theme, onToggleTheme }) {
  const [active, setActive] = useState('dashboard')
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

  function showNotice(message, duration = 3200) {
    setNotice(message)
    window.setTimeout(() => setNotice(''), duration)
  }

  // Ambil semua data request dari backend
  async function fetchData() {
    setLoading(true)
    setError(null)
    try {
      const { requests: rows } = await api.listRequests()
      setRequests((rows || []).map(row => mapRecord(row, row.status)))
    } catch (err) {
      setError('Gagal memuat data: ' + (err.message || 'Terjadi kesalahan'))
    } finally {
      setLoading(false)
    }
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
    fetchUsers()
    api.me().then(({ admin }) => setCurrentUserId(admin?.userId || '')).catch(() => {})

    // Berlangganan perubahan real-time dari database.
    // Otomatis refresh ketika tamu mengirim request atau admin memproses.
    const unsubscribe = subscribeToRequests(() => fetchData())

    return unsubscribe
  }, [])

  const visibleRequests = useMemo(() => requests.filter(item => {
    const matchesQuery = `${item.name} ${item.id} ${item.purpose}`.toLowerCase().includes(query.toLowerCase())
    const matchesFilter = filter === 'Semua' || item.status === filter
    return matchesQuery && matchesFilter
  }), [requests, query, filter])

  async function updateStatus(id, status) {
    const target = requests.find(item => item.id === id)
    if (!target) return

    try {
      if (status === 'Diterima') {
        await api.approveRequest(target.dbId)
      } else {
        await api.rejectRequest(target.dbId)
      }

      setNotice(`Request ${target.id} berhasil ${status === 'Diterima' ? 'disetujui' : 'ditolak'}.`)
      window.setTimeout(() => setNotice(''), 3000)
      fetchData()
    } catch (err) {
      setNotice('Gagal memperbarui status: ' + (err.message || 'Terjadi kesalahan'))
      window.setTimeout(() => setNotice(''), 4000)
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
    setActive(id)
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
    await fetchUsers()
    showNotice('Pengguna baru berhasil ditambahkan.')
  }
  async function updateUser(id, values) {
    await api.updateAdminUser(id, values)
    await fetchUsers()
    showNotice('Data pengguna berhasil diperbarui.')
  }
  async function removeUser(id) {
    await api.deleteAdminUser(id)
    await fetchUsers()
    showNotice('Pengguna berhasil dihapus.')
  }

  // ---- CRUD tamu ----
  async function createGuest(values) {
    await api.createGuest(values)
    await fetchData()
    showNotice('Tamu baru berhasil ditambahkan.')
  }
  async function updateGuest(id, values) {
    await api.updateRequest(id, values)
    await fetchData()
    showNotice('Data tamu berhasil diperbarui.')
  }
  async function removeGuest(id) {
    await api.deleteRequest(id)
    await fetchData()
    showNotice('Tamu berhasil dihapus.')
  }

  // ---- CRUD riwayat ----
  async function createHistory(values) {
    await api.createHistory(values)
    await fetchData()
    showNotice('Riwayat baru berhasil ditambahkan.')
  }
  async function updateHistory(id, values) {
    await api.updateHistory(id, values)
    await fetchData()
    showNotice('Riwayat berhasil diperbarui.')
  }
  async function removeHistory(id) {
    await api.deleteHistory(id)
    await fetchData()
    showNotice('Riwayat berhasil dihapus.')
  }

  const pageTitle = navItems.find(item => item.id === active)?.label || 'Dashboard'

  return (
    <div className="min-h-screen bg-[#f5f7fb] dark:bg-slate-950">
      {mobileOpen && <button aria-label="Tutup menu" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden" />}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col bg-[#101827] text-white transition-transform duration-300 dark:border-r dark:border-slate-800 dark:bg-slate-900 lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-[84px] items-center justify-between border-b border-white/10 px-6">
          <div className="flex items-center gap-3">
            <img src="public/logo-peta-skanida.png" alt="Logo PeTa SKANIDA" className="h-10 w-10 shrink-0 rounded-xl bg-white/95 object-contain p-0.5" />
            <div><p className="font-bold tracking-wide">PeTa SKANIDA</p><p className="mt-0.5 text-[10px] tracking-[.2em] text-slate-400">ADMIN PANEL</p></div>
          </div>
          <button onClick={() => setMobileOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-white/10 lg:hidden"><X size={19} /></button>
        </div>
        <div className="px-4 pt-7">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[.2em] text-slate-500">Menu utama</p>
          <nav className="space-y-1">
            {navItems.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => goTo(id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition ${active === id ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-950/30' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}><Icon size={18} />{label}{active === id && <ChevronRight className="ml-auto" size={16} />}</button>)}
          </nav>
        </div>
        <div className="mt-auto border-t border-white/10 p-4">
          <div className="mb-4 flex items-center gap-3 rounded-xl bg-white/5 p-3">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-indigo-400/20 text-indigo-200"><UserRound size={18} /></div>
            <div className="min-w-0"><p className="text-sm font-semibold">{adminName || 'Administrator'}</p><p className="text-xs text-slate-500">Pengelola sistem</p></div>
            <ShieldCheck className="ml-auto text-emerald-400" size={17} />
          </div>
          <button onClick={onLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-300"><LogOut size={18} />Keluar</button>
        </div>
      </aside>

      <main className="min-h-screen lg:ml-[260px]">
        <header className="sticky top-0 z-30 flex h-[84px] items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90 sm:px-8">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="rounded-xl border border-slate-200 p-2 text-slate-600 dark:border-slate-700 dark:text-slate-300 lg:hidden"><Menu size={20} /></button>
            <div><p className="text-xs text-slate-400 dark:text-slate-500">PeTa SKANIDA / Admin</p><h1 className="mt-1 font-bold text-slate-800 dark:text-slate-100">{pageTitle}</h1></div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
            <div className="hidden text-right sm:block"><p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{adminName || 'Administrator'}</p><p className="text-[11px] text-slate-400 dark:text-slate-500">Admin</p></div>
            <div className="grid h-10 w-10 place-items-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300"><UserRound size={19} /></div>
          </div>
        </header>

        <div className="mx-auto max-w-[1600px] p-4 sm:p-8">
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
              {active === 'dashboard' && <Dashboard requests={requests} adminName={adminName} onGoTo={goTo} />}
              {active === 'tamu' && <ListingPage type="tamu" visibleRequests={visibleRequests} query={query} onQueryChange={setQuery} filter={filter} onFilterChange={setFilter} contactFilter={contactFilter} onContactFilterChange={setContactFilter} onUpdateStatus={updateStatus} onToggleContacted={toggleContacted} onComplete={completeVisit} onCreate={createGuest} onUpdate={updateGuest} onDelete={removeGuest} />}
              {active === 'request' && <ListingPage type="request" visibleRequests={visibleRequests} query={query} onQueryChange={setQuery} filter={filter} onFilterChange={setFilter} contactFilter={contactFilter} onContactFilterChange={setContactFilter} onUpdateStatus={updateStatus} onToggleContacted={toggleContacted} sortOrder={sortOrder} onSortOrderChange={setSortOrder} />}
              {active === 'riwayat' && <HistoryPage visibleRequests={visibleRequests} query={query} onQueryChange={setQuery} filter={filter} onFilterChange={setFilter} onCreate={createHistory} onUpdate={updateHistory} onDelete={removeHistory} />}
              {active === 'users' && <UsersPage users={users} currentUserId={currentUserId} onCreate={createUser} onUpdate={updateUser} onDelete={removeUser} />}
            </>
          )}
          <footer className="mt-10 flex flex-col gap-2 border-t border-slate-200 pt-5 text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500 sm:flex-row sm:items-center sm:justify-between"><span>© 2026 PeTa SKANIDA · Admin Panel</span><span className="flex items-center gap-1"><CalendarCheck size={13} /> Sistem pengelolaan kunjungan</span></footer>
        </div>
      </main>
      {notice && <div role="status" className="fixed bottom-5 right-5 z-[60] flex max-w-[calc(100%-40px)] items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-xl dark:bg-slate-800 dark:ring-1 dark:ring-slate-700"><CheckCircle2 size={17} className="text-emerald-400" />{notice}</div>}
    </div>
  )
}

// Notifikasi sistem yang muncul saat tamu mencoba keluar sebelum barcode disimpan.
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

function App() {
  const [role, setRole] = useState(null) // null = login, 'admin-login', 'admin', 'tamu', 'tamu-success'
  const [adminName, setAdminName] = useState('')
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
      .then(({ admin }) => {
        if (!active) return
        setAdminName(admin.nama)
        setRole('admin')
      })
      .catch(() => {
        clearSession()
      })
      .finally(() => {
        if (active) setRestoring(false)
      })

    return () => {
      active = false
    }
  }, [])

  function handleLoginSuccess(result) {
    saveSession(result)
    setAdminName(result.admin.nama)
    setRole('admin')
  }

  function handleLogout() {
    api.logout() // cabut sesi di Supabase Auth (fire-and-forget)
    clearSession()
    setAdminName('')
    setRole(null)
  }

  if (restoring) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f5f7fb] text-slate-400 dark:bg-slate-950 dark:text-slate-500">
        <Loader2 size={32} className="animate-spin text-indigo-400" />
        <p className="mt-4 text-sm">Memuat sesi...</p>
      </div>
    )
  }

  if (role === null) return <LoginPage onSelect={setRole} theme={theme} onToggleTheme={toggleTheme} />
  if (role === 'admin-login') return <AdminLoginPage onSuccess={handleLoginSuccess} onBack={() => setRole(null)} theme={theme} onToggleTheme={toggleTheme} />
  if (role === 'tamu') return <GuestFormPage theme={theme} onToggleTheme={toggleTheme} onBack={() => setRole(null)} onSubmit={data => {
    setGuestResult(data)
    setBarcodeSaved(false)
    setRole('tamu-success')
  }} />
  if (role === 'tamu-success') return <>
    <GuestSuccessPage
      data={guestResult}
      theme={theme}
      onToggleTheme={toggleTheme}
      saved={barcodeSaved}
      onDownloaded={() => setBarcodeSaved(true)}
      onAgain={() => attemptLeave(() => { setGuestResult(null); setBarcodeSaved(false); setRole('tamu') })}
      onBack={() => attemptLeave(() => { setGuestResult(null); setBarcodeSaved(false); setRole(null) })}
    />
    {leaveModalOpen && <LeaveWarningModal
      onDownload={handleModalDownload}
      onScreenshot={unlockLeave}
      onClose={() => { setLeaveModalOpen(false); setPendingLeave(null) }}
    />}
  </>
  return <AdminApp adminName={adminName} onLogout={handleLogout} theme={theme} onToggleTheme={toggleTheme} />
}

export default App
