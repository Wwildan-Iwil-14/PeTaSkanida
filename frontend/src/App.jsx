import { useEffect, useMemo, useState } from 'react'
import { api, saveSession, clearSession, loadToken } from './lib/api'
import { subscribeToRequests } from './lib/realtime'
import {
  LayoutDashboard, Users, ClipboardList, History, LogOut, Menu, X,
  Search, CalendarDays, Clock3, CheckCircle2, XCircle, Hourglass,
  ArrowUpRight, ChevronRight, UserRound, Filter, ShieldCheck,
  CalendarCheck, Eye, EyeOff, MessageCircle,
  Loader2, AlertCircle, Moon, Sun, Copy, Check,
  CircleDashed, BadgeCheck, ArrowRight, ArrowLeft, Info, Mail,
  Phone, Send, Plus, ChevronDown
} from 'lucide-react'

const THEME_KEY = 'peta-skanida.theme'

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
]

const formatDate = (value) => {
  if (!value) return '-'
  return new Date(`${value}T00:00:00`).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
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
    status,
  }
}

function Status({ value }) {
  const styles = {
    Pending: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30',
    Diterima: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30',
    Ditolak: 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/30',
  }
  const Icon = value === 'Pending' ? Hourglass : value === 'Diterima' ? CheckCircle2 : XCircle
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${styles[value]}`}><Icon size={13} />{value}</span>
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

  async function handleSubmit(e) {
    e.preventDefault()
    const finalTujuan = [...tujuan]
    const draftTujuan = customTujuan.trim()
    if (draftTujuan && !finalTujuan.includes(draftTujuan)) finalTujuan.push(draftTujuan)

    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.date || !form.time || !form.keperluan.trim() || !finalTujuan.length) {
      setError('Lengkapi semua kolom bertanda * dan pilih minimal satu tujuan kunjungan.')
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
    setError('')
    setSubmitting(true)
    try {
      const result = await api.createRequest({
        nama: form.name.trim(),
        email: form.email.trim(),
        no_hp: form.phone.trim(),
        tujuan: finalTujuan.join(', '),
        keperluan: form.keperluan.trim(),
        tanggal: form.date,
        waktu: form.time,
        jumlah: parseInt(form.people) || 1,
      })
      onSubmit({
        id: result?.request?.id,
        nama: form.name.trim(),
        email: form.email.trim(),
        no_hp: form.phone.trim(),
        tujuan: finalTujuan.join(', '),
        keperluan: form.keperluan.trim(),
        tanggal: form.date,
        waktu: form.time,
        jumlah: parseInt(form.people) || 1,
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
                      min={type === 'number' ? 1 : undefined}
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

function GuestSuccessPage({ data, onAgain, onBack, theme, onToggleTheme }) {
  const [copied, setCopied] = useState(false)
  const ref = data?.id ? `REQ-${String(data.id).padStart(3, '0')}` : ''

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
  ]

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

function RequestTable({ items, showActions = false, showContact = false, onUpdateStatus, onToggleContacted }) {
  if (!items.length) {
    return <div className="px-6 py-12 text-center text-sm text-slate-400 dark:text-slate-500">Tidak ada data yang cocok.</div>
  }
  const waLink = phone => `https://wa.me/${phone.replace(/[^0-9]/g, '').replace(/^0/, '62')}`
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-400 dark:bg-slate-800/60 dark:text-slate-400">
          <tr>
            <th className="px-6 py-4 font-semibold">Pengunjung</th>
            <th className="px-6 py-4 font-semibold">Tujuan</th>
            <th className="px-6 py-4 font-semibold">Keperluan</th>
            <th className="px-6 py-4 font-semibold">Jadwal</th>
            <th className="px-6 py-4 font-semibold">Jumlah</th>
            <th className="px-6 py-4 font-semibold">Status</th>
            {showContact && <th className="px-6 py-4 font-semibold">Kontak</th>}
            {showActions && <th className="px-6 py-4 text-right font-semibold">Aksi</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {items.map(item => (
            <tr key={item.id} className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
              <td className="px-6 py-4">
                <div className="font-semibold text-slate-800 dark:text-slate-200">{item.name}</div>
                <div className="mt-1 text-xs text-slate-400 dark:text-slate-500">{item.id} · {item.phone}</div>
              </td>
              <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{item.tujuan}</td>
              <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{item.keperluan}</td>
              <td className="px-6 py-4">
                <div className="font-medium text-slate-700 dark:text-slate-300">{formatDate(item.date)}</div>
                <div className="mt-1 text-xs text-slate-400 dark:text-slate-500">{item.time ? `${item.time} WIB` : '-'}</div>
              </td>
              <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{item.people} orang</td>
              <td className="px-6 py-4"><Status value={item.status} /></td>
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
              {showActions && <td className="px-6 py-4">
                {item.status === 'Pending' ? (
                  <div className="flex justify-end gap-2">
                    <button onClick={() => onUpdateStatus(item.id, 'Diterima')} className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20">Terima</button>
                    <button onClick={() => onUpdateStatus(item.id, 'Ditolak')} className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20">Tolak</button>
                  </div>
                ) : <div className="text-right text-xs text-slate-400 dark:text-slate-500">Sudah diproses</div>}
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
      {sortOrder !== undefined ? (
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
      ) : (
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
            <div className="min-w-0 flex-1"><p className="font-semibold text-slate-800 dark:text-slate-200">{item.name}</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.purpose}</p><p className="mt-2 flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500"><Clock3 size={13} /> {formatDate(item.date)} · {item.time || '-'}</p></div>
          </div>) : <p className="px-5 py-10 text-center text-sm text-slate-400 dark:text-slate-500">Belum ada jadwal mendatang.</p>}
        </div>
      </Panel>
    </div>
  </>
}

function ListingPage({ type, visibleRequests, query, onQueryChange, filter, onFilterChange, contactFilter, onContactFilterChange, onUpdateStatus, onToggleContacted, sortOrder, onSortOrderChange }) {
  const isPending = type === 'request'
  const byStatus = isPending
    ? visibleRequests.filter(item => item.status === 'Pending')
    : visibleRequests.filter(item => item.status === 'Diterima' || item.status === 'Ditolak')
  const filtered = isPending
    ? byStatus
    : byStatus.filter(item => contactFilter === 'Semua' || (contactFilter === 'Sudah' ? item.contacted : !item.contacted))
  const items = isPending
    ? filtered.slice().sort((a, b) => {
        const toValue = item => new Date(`${item.date || ''}T${item.time || '00:00'}`).getTime() || 0
        const diff = toValue(a) - toValue(b)
        return sortOrder === 'Terlama' ? diff : -diff
      })
    : filtered
  const contactedCount = byStatus.filter(item => item.contacted).length

  return <>
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{isPending ? 'Daftar Request' : 'Kelola Tamu'}</h2>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{isPending ? 'Periksa permintaan dan tentukan persetujuan kunjungan.' : 'Daftar tamu yang telah disetujui atau ditolak, lengkap dengan kontaknya. Badge hijau menandai tamu yang sudah dihubungi, badge kuning berarti belum dihubungi.'}</p>
    </div>
    <div className="mb-5">
      <SearchFilter
        query={query}
        onQueryChange={onQueryChange}
        filter={filter}
        onFilterChange={onFilterChange}
        showContactFilter={!isPending}
        contactFilter={contactFilter}
        onContactFilterChange={onContactFilterChange}
        sortOrder={isPending ? sortOrder : undefined}
        onSortOrderChange={onSortOrderChange}
      />
    </div>
    <Panel
      title={isPending ? 'Permintaan menunggu persetujuan' : 'Daftar tamu terkelola'}
      subtitle={isPending
        ? `${items.length} data ditemukan`
        : `${items.length} data · ${contactedCount} sudah dihubungi · ${byStatus.length - contactedCount} belum dihubungi`}
    >
      <RequestTable items={items} showActions={isPending} showContact={!isPending} onUpdateStatus={onUpdateStatus} onToggleContacted={onToggleContacted} />
    </Panel>
  </>
}

function HistoryPage({ visibleRequests, query, onQueryChange, filter, onFilterChange }) {
  const items = visibleRequests
    .filter(item => item.status !== 'Pending')
    .slice()
    .sort((a, b) => {
      const toValue = ({ date, time }) => new Date(`${date}T${time || '00:00'}`).getTime()
      return toValue(b) - toValue(a)
    })
  return <>
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Riwayat Kunjungan</h2>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Semua permintaan yang sudah diterima atau ditolak.</p>
    </div>
    <div className="mb-5">
      <SearchFilter query={query} onQueryChange={onQueryChange} filter={filter} onFilterChange={onFilterChange} statusOptions={['Semua', 'Diterima', 'Ditolak']} />
    </div>
    <Panel title="Riwayat request" subtitle={`${items.length} data telah diproses`}><RequestTable items={items} /></Panel>
  </>
}

function AdminApp({ onLogout, adminName, theme, onToggleTheme }) {
  const [active, setActive] = useState('dashboard')
  const [requests, setRequests] = useState([])
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('Semua')
  const [sortOrder, setSortOrder] = useState('Terkini')
  const [contactFilter, setContactFilter] = useState('Semua')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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

  useEffect(() => {
    fetchData()

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
              {active === 'tamu' && <ListingPage type="tamu" visibleRequests={visibleRequests} query={query} onQueryChange={setQuery} filter={filter} onFilterChange={setFilter} contactFilter={contactFilter} onContactFilterChange={setContactFilter} onUpdateStatus={updateStatus} onToggleContacted={toggleContacted} />}
              {active === 'request' && <ListingPage type="request" visibleRequests={visibleRequests} query={query} onQueryChange={setQuery} filter={filter} onFilterChange={setFilter} contactFilter={contactFilter} onContactFilterChange={setContactFilter} onUpdateStatus={updateStatus} onToggleContacted={toggleContacted} sortOrder={sortOrder} onSortOrderChange={setSortOrder} />}
              {active === 'riwayat' && <HistoryPage visibleRequests={visibleRequests} query={query} onQueryChange={setQuery} filter={filter} onFilterChange={setFilter} />}
            </>
          )}
          <footer className="mt-10 flex flex-col gap-2 border-t border-slate-200 pt-5 text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500 sm:flex-row sm:items-center sm:justify-between"><span>© 2026 PeTa SKANIDA · Admin Panel</span><span className="flex items-center gap-1"><CalendarCheck size={13} /> Sistem pengelolaan kunjungan</span></footer>
        </div>
      </main>
      {notice && <div role="status" className="fixed bottom-5 right-5 z-[60] flex max-w-[calc(100%-40px)] items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-xl dark:bg-slate-800 dark:ring-1 dark:ring-slate-700"><CheckCircle2 size={17} className="text-emerald-400" />{notice}</div>}
    </div>
  )
}

function App() {
  const [role, setRole] = useState(null) // null = login, 'admin-login', 'admin', 'tamu', 'tamu-success'
  const [adminName, setAdminName] = useState('')
  const [restoring, setRestoring] = useState(true)
  const [guestResult, setGuestResult] = useState(null)
  const [theme, setTheme] = useState(getInitialTheme)

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
    setRole('tamu-success')
  }} />
  if (role === 'tamu-success') return <GuestSuccessPage
    data={guestResult}
    theme={theme}
    onToggleTheme={toggleTheme}
    onAgain={() => { setGuestResult(null); setRole('tamu') }}
    onBack={() => { setGuestResult(null); setRole(null) }}
  />
  return <AdminApp adminName={adminName} onLogout={handleLogout} theme={theme} onToggleTheme={toggleTheme} />
}

export default App
