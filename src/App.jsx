import { useMemo, useState } from 'react'
import {
  LayoutDashboard, Users, ClipboardList, History, LogOut, Menu, X,
  Search, Bell, CalendarDays, Clock3, CheckCircle2, XCircle, Hourglass,
  ArrowUpRight, ChevronRight, MapPin, UserRound, Filter, ShieldCheck,
  CalendarCheck, MoreHorizontal, Eye, EyeOff, MessageCircle
} from 'lucide-react'

const initialRequests = [
  { id: 'REQ-008', name: 'Nadia Putri', purpose: 'Bertemu keluarga', date: '2026-11-11', time: '10:00', phone: '0812-3456-7890', people: 2, status: 'Pending' },
  { id: 'REQ-007', name: 'Rizky Pratama', purpose: 'Kunjungan teman', date: '2026-11-11', time: '13:30', phone: '0813-2222-4567', people: 1, status: 'Pending' },
  { id: 'REQ-006', name: 'Aulia Rahma', purpose: 'Mengantar barang', date: '2026-11-12', time: '09:00', phone: '0821-9876-5432', people: 2, status: 'Pending' },
  { id: 'REQ-005', name: 'Dimas Saputra', purpose: 'Kunjungan keluarga', date: '2026-11-10', time: '14:00', phone: '0857-1111-2233', people: 3, status: 'Diterima' },
  { id: 'REQ-004', name: 'Siti Amelia', purpose: 'Keperluan administrasi', date: '2026-11-09', time: '11:00', phone: '0819-4444-5555', people: 1, status: 'Ditolak' },
  { id: 'REQ-003', name: 'Fajar Ramadhan', purpose: 'Bertemu keluarga', date: '2026-11-08', time: '15:30', phone: '0878-3333-1212', people: 2, status: 'Diterima' },
]

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'request', label: 'Daftar Request', icon: ClipboardList },
  { id: 'tamu', label: 'Kelola Tamu', icon: Users },
  { id: 'riwayat', label: 'Riwayat Kunjungan', icon: History },
]

const formatDate = (value) => new Date(`${value}T00:00:00`).toLocaleDateString('id-ID', {
  day: '2-digit', month: 'short', year: 'numeric'
})

function Status({ value }) {
  const styles = {
    Pending: 'bg-amber-50 text-amber-700 ring-amber-200',
    Diterima: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    Ditolak: 'bg-rose-50 text-rose-700 ring-rose-200',
  }
  const Icon = value === 'Pending' ? Hourglass : value === 'Diterima' ? CheckCircle2 : XCircle
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${styles[value]}`}><Icon size={13} />{value}</span>
}

function StatCard({ title, value, note, icon: Icon, tint }) {
  return (
    <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
          <p className="mt-2 text-xs text-slate-400">{note}</p>
        </div>
        <div className={`rounded-xl p-3 ${tint}`}><Icon size={21} /></div>
      </div>
    </article>
  )
}

function LoginPage({ onSelect }) {
  return (
    <div className="grid min-h-screen bg-[#f5f7fb] lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[#101827] p-10 text-white lg:flex">
        <div className="flex items-center gap-3">
          <img src="/logo-peta-skanida.svg" alt="Logo PETA SKANIDA" className="h-11 w-11" />
          <div>
            <p className="font-bold tracking-wide">PETA SKANIDA</p>
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
        <p className="text-xs text-slate-500">© 2026 PETA SKANIDA · Admin Panel</p>
      </div>
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img src="/logo-peta-skanida.svg" alt="Logo PETA SKANIDA" className="h-11 w-11" />
              <div>
                <p className="font-bold tracking-wide text-slate-900">PETA SKANIDA</p>
                <p className="text-[10px] tracking-[.15em] text-slate-400">SMKN 2 MAGELANG</p>
              </div>
            </div>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Selamat Datang 👋</h2>
          <p className="mt-2 text-sm text-slate-500">Pilih jenis akses untuk melanjutkan ke aplikasi.</p>
          <div className="mt-8 space-y-4">
            <button onClick={() => onSelect('admin')} className="group flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-indigo-300 hover:shadow-md">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-500 group-hover:text-white"><ShieldCheck size={22} /></div>
              <div className="min-w-0">
                <p className="font-bold text-slate-800">Admin / Pengelola</p>
                <p className="mt-0.5 text-xs text-slate-400">Kelola request, tamu, dan riwayat kunjungan.</p>
              </div>
              <ChevronRight className="ml-auto shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-indigo-500" size={20} />
            </button>
            <button onClick={() => onSelect('tamu')} className="group flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-indigo-300 hover:shadow-md">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600 transition group-hover:bg-emerald-500 group-hover:text-white"><UserRound size={22} /></div>
              <div className="min-w-0">
                <p className="font-bold text-slate-800">Tamu</p>
                <p className="mt-0.5 text-xs text-slate-400">Ajukan permintaan kunjungan ke SKANIDA.</p>
              </div>
              <ChevronRight className="ml-auto shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-emerald-500" size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function AdminLoginPage({ onSuccess, onBack }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!username.trim()) { setError('Nama akun wajib diisi.'); return }
    if (!password.trim()) { setError('Password wajib diisi.'); return }
    // SEMENTARA FRONTEND SAJA: verifikasi akun akan dihubungkan dengan backend/database oleh tim lain.
    setError('')
    onSuccess(username.trim())
  }

  return (
    <div className="grid min-h-screen bg-[#f5f7fb] lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[#101827] p-10 text-white lg:flex">
        <div className="flex items-center gap-3">
          <img src="/logo-peta-skanida.svg" alt="Logo PETA SKANIDA" className="h-11 w-11" />
          <div>
            <p className="font-bold tracking-wide">PETA SKANIDA</p>
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
        <p className="text-xs text-slate-500">© 2026 PETA SKANIDA · Admin Panel</p>
      </div>
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <button onClick={onBack} className="mb-6 flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-indigo-600">
            <ChevronRight className="rotate-180" size={17} /> Kembali
          </button>
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-7 flex items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600"><ShieldCheck size={22} /></div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900">Login Admin</h1>
                <p className="mt-1 text-sm text-slate-500">Masukkan nama akun dan password untuk masuk ke dashboard.</p>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Nama Akun</label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Nama akun admin"
                  autoComplete="username"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Password"
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-12 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                  />
                  <button type="button" onClick={() => setShowPassword(current => !current)} aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 transition hover:text-indigo-600">
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>
              {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">{error}</p>}
              <button type="submit" className="w-full rounded-xl bg-indigo-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-600">Masuk</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

// GANTI pilihan di bawah ini saat opsi tujuan sudah disediakan.
const opsiTujuan = ['Pilih tujuan...', 'Kepala SKANIDA', 'Staf Administrasi', 'Divisi Humas', 'Lainnya...']
// GANTI pilihan di bawah ini saat opsi keperluan sudah disediakan.
const opsiKeperluan = ['Pilih keperluan...', 'Bertemu keluarga', 'Kunjungan dinas', 'Keperluan administrasi', 'Lainnya...']

function GuestFormPage({ onBack, onSubmit }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', date: '', tujuan: '', keperluan: '' })
  const [customOpen, setCustomOpen] = useState({})
  const [error, setError] = useState('')

  const fields = [
    { key: 'name', label: 'Nama / Instansi', type: 'text', placeholder: 'Contoh: Nadia Putri / Dinas Kominfo' },
    { key: 'email', label: 'Alamat Email', type: 'email', placeholder: 'nama@email.com' },
    { key: 'phone', label: 'Nomor HP', type: 'tel', placeholder: '0812-3456-7890' },
    { key: 'date', label: 'Tanggal Kunjungan', type: 'date', placeholder: '' },
  ]

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.date || !form.tujuan || !form.keperluan) {
      setError('Semua kolom wajib diisi. Pada menu tujuan dan keperluan, pilih salah satu opsi (bukan "Pilih...").')
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
    onSubmit(form)
  }

  function handleSelectChange(key, value) {
    if (value === 'Lainnya...') {
      setCustomOpen(current => ({ ...current, [key]: true }))
      setForm(current => ({ ...current, [key]: '' }))
    } else {
      setCustomOpen(current => ({ ...current, [key]: false }))
      setForm(current => ({ ...current, [key]: value }))
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb] px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-xl">
        <button onClick={onBack} className="mb-6 flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-indigo-600">
          <ChevronRight className="rotate-180" size={17} /> Kembali ke halaman login
        </button>
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-7 flex items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600"><UserRound size={22} /></div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">Form Permintaan Kunjungan</h1>
              <p className="mt-1 text-sm text-slate-500">Lengkapi data berikut untuk mengajukan kunjungan ke SKANIDA.</p>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            {fields.map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</label>
                <input
                  type={type}
                  value={form[key]}
                  onChange={e => setForm({ ...form, [key]: e.target.value })}
                  placeholder={placeholder}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                />
              </div>
            ))}
            {[{ key: 'tujuan', label: 'Tujuan (mau bertemu siapa)', options: opsiTujuan, placeholder: 'Tuliskan tujuan Anda...' }, { key: 'keperluan', label: 'Keperluan', options: opsiKeperluan, placeholder: 'Tuliskan keperluan Anda...' }].map(({ key, label, options, placeholder }) => (
              <div key={key}>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</label>
                <div className="relative">
                  <select
                    value={customOpen[key] ? 'Lainnya...' : form[key]}
                    onChange={e => handleSelectChange(key, e.target.value)}
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                  >
                    {options.map(opt => <option key={opt} value={opt === options[0] ? '' : opt}>{opt}</option>)}
                  </select>
                  <ChevronRight className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 rotate-90 text-slate-400" size={16} />
                </div>
                {customOpen[key] && (
                  <input
                    value={form[key]}
                    onChange={e => setForm({ ...form, [key]: e.target.value })}
                    placeholder={placeholder}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-indigo-50/40 px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                  />
                )}
              </div>
            ))}
            {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">{error}</p>}
            <button type="submit" className="w-full rounded-xl bg-indigo-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-600">Kirim Permintaan</button>
          </form>
        </div>
      </div>
    </div>
  )
}

function AdminApp({ onLogout }) {
  const [active, setActive] = useState('dashboard')
  const [requests, setRequests] = useState(initialRequests)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('Semua')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notice, setNotice] = useState('')

  const pending = requests.filter(item => item.status === 'Pending')
  const accepted = requests.filter(item => item.status === 'Diterima')
  const rejected = requests.filter(item => item.status === 'Ditolak')
  const upcoming = requests.filter(item => item.status === 'Diterima' && item.date >= '2026-11-10')

  const visibleRequests = useMemo(() => requests.filter(item => {
    const matchesQuery = `${item.name} ${item.id} ${item.purpose}`.toLowerCase().includes(query.toLowerCase())
    const matchesFilter = filter === 'Semua' || item.status === filter
    return matchesQuery && matchesFilter
  }), [requests, query, filter])

  function updateStatus(id, status) {
    setRequests(current => current.map(item => item.id === id ? { ...item, status } : item))
    const target = requests.find(item => item.id === id)
    setNotice(`Request ${target?.id} berhasil ${status === 'Diterima' ? 'disetujui' : 'ditolak'}.`)
    window.setTimeout(() => setNotice(''), 3000)
  }

  function goTo(id) {
    setActive(id)
    setQuery('')
    setFilter('Semua')
    setMobileOpen(false)
  }

  const pageTitle = navItems.find(item => item.id === active)?.label || 'Dashboard'

  function RequestTable({ items, showActions = false, showContact = false }) {
    if (!items.length) return <div className="px-6 py-12 text-center text-sm text-slate-400">Tidak ada data yang cocok.</div>
    const waLink = phone => `https://wa.me/${phone.replace(/[^0-9]/g, '').replace(/^0/, '62')}`
    return (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-6 py-4 font-semibold">Pengunjung</th>
              <th className="px-6 py-4 font-semibold">Tujuan</th>
              <th className="px-6 py-4 font-semibold">Jadwal</th>
              <th className="px-6 py-4 font-semibold">Jumlah</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              {showContact && <th className="px-6 py-4 font-semibold">Kontak</th>}
              {showActions && <th className="px-6 py-4 text-right font-semibold">Aksi</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map(item => (
              <tr key={item.id} className="transition hover:bg-slate-50/80">
                <td className="px-6 py-4">
                  <div className="font-semibold text-slate-800">{item.name}</div>
                  <div className="mt-1 text-xs text-slate-400">{item.id} · {item.phone}</div>
                </td>
                <td className="px-6 py-4 text-slate-600">{item.purpose}</td>
                <td className="px-6 py-4">
                  <div className="font-medium text-slate-700">{formatDate(item.date)}</div>
                  <div className="mt-1 text-xs text-slate-400">{item.time} WIB</div>
                </td>
                <td className="px-6 py-4 text-slate-600">{item.people} orang</td>
                <td className="px-6 py-4"><Status value={item.status} /></td>
                {showContact && <td className="px-6 py-4">
                  <a href={waLink(item.phone)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100">
                    <MessageCircle size={14} /> Hubungi
                  </a>
                </td>}
                {showActions && <td className="px-6 py-4">
                  {item.status === 'Pending' ? (
                    <div className="flex justify-end gap-2">
                      <button onClick={() => updateStatus(item.id, 'Diterima')} className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100">Terima</button>
                      <button onClick={() => updateStatus(item.id, 'Ditolak')} className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100">Tolak</button>
                    </div>
                  ) : <div className="text-right text-xs text-slate-400">Sudah diproses</div>}
                </td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  function SearchFilter() {
    return <div className="flex flex-col gap-3 sm:flex-row">
      <div className="relative flex-1">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Cari nama atau ID request..." className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50" />
      </div>
      <div className="relative">
        <Filter className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <select value={filter} onChange={e => setFilter(e.target.value)} className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-9 text-sm text-slate-600 outline-none focus:border-indigo-400 sm:w-44">
          <option>Semua</option><option>Pending</option><option>Diterima</option><option>Ditolak</option>
        </select>
      </div>
    </div>
  }

  function Panel({ title, subtitle, children, action }) {
    return <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="flex flex-col gap-2 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="font-bold text-slate-900">{title}</h2>{subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}</div>
        {action}
      </div>
      {children}
    </section>
  }

  function Dashboard() {
    return <>
      <div className="mb-7">
        <p className="text-sm text-slate-500">Selamat datang kembali, Admin 👋</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Ringkasan aktivitas</h2>
        <p className="mt-2 text-sm text-slate-500">Pantau permintaan dan jadwal kunjungan dalam satu tempat.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Request" value={requests.length} note="Seluruh permintaan masuk" icon={ClipboardList} tint="bg-indigo-50 text-indigo-600" />
        <StatCard title="Menunggu" value={pending.length} note="Perlu tindakan admin" icon={Hourglass} tint="bg-amber-50 text-amber-600" />
        <StatCard title="Diterima" value={accepted.length} note="Permintaan disetujui" icon={CheckCircle2} tint="bg-emerald-50 text-emerald-600" />
        <StatCard title="Ditolak" value={rejected.length} note="Permintaan tidak disetujui" icon={XCircle} tint="bg-rose-50 text-rose-600" />
      </div>
      <div className="mt-6 grid gap-6 2xl:grid-cols-[1.5fr_1fr]">
        <Panel title="Request terbaru" subtitle="Permintaan kunjungan yang baru masuk" action={<button onClick={() => goTo('request')} className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">Lihat semua <ArrowUpRight className="ml-1 inline" size={15} /></button>}>
          <RequestTable items={requests.slice(0, 4)} showActions />
        </Panel>
        <Panel title="Kunjungan mendatang" subtitle="Jadwal kunjungan yang telah disetujui">
          <div className="divide-y divide-slate-100">
            {upcoming.length ? upcoming.map(item => <div key={item.id} className="flex items-start gap-3 px-5 py-4">
              <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600"><CalendarDays size={19} /></div>
              <div className="min-w-0 flex-1"><p className="font-semibold text-slate-800">{item.name}</p><p className="mt-1 text-xs text-slate-500">{item.purpose}</p><p className="mt-2 flex items-center gap-1 text-xs text-slate-400"><Clock3 size={13} /> {formatDate(item.date)} · {item.time}</p></div>
            </div>) : <p className="px-5 py-10 text-center text-sm text-slate-400">Belum ada jadwal mendatang.</p>}
          </div>
        </Panel>
      </div>
    </>
  }

  function ListingPage({ type }) {
    const isPending = type === 'request'
    const items = isPending ? visibleRequests.filter(item => item.status === 'Pending') : visibleRequests.filter(item => item.status === 'Diterima' || item.status === 'Ditolak')
    return <>
      <div className="mb-6"><h2 className="text-2xl font-bold text-slate-900">{isPending ? 'Daftar Request' : 'Kelola Tamu'}</h2><p className="mt-2 text-sm text-slate-500">{isPending ? 'Periksa permintaan dan tentukan persetujuan kunjungan.' : 'Daftar tamu yang telah disetujui atau ditolak, lengkap dengan kontaknya.'}</p></div>
      <div className="mb-5"><SearchFilter /></div>
      <Panel title={isPending ? 'Permintaan menunggu persetujuan' : 'Daftar tamu terkelola'} subtitle={`${items.length} data ditemukan`}>
        <RequestTable items={items} showActions={isPending} showContact={!isPending} />
      </Panel>
    </>
  }

  function HistoryPage() {
    const items = visibleRequests
      .filter(item => item.status === 'Diterima')
      .slice()
      .sort((a, b) => {
        const toValue = ({ date, time }) => new Date(`${date}T${time || '00:00'}`).getTime()
        return toValue(b) - toValue(a)
      })
    return <>
      <div className="mb-6"><h2 className="text-2xl font-bold text-slate-900">Riwayat Kunjungan</h2><p className="mt-2 text-sm text-slate-500">Arsip kunjungan tamu yang telah disetujui.</p></div>
      <div className="mb-5"><SearchFilter /></div>
      <Panel title="Riwayat kunjungan" subtitle={`${items.length} kunjungan diterima`}><RequestTable items={items} /></Panel>
    </>
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb]">
      {mobileOpen && <button aria-label="Tutup menu" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden" />}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col bg-[#101827] text-white transition-transform duration-300 lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-[84px] items-center justify-between border-b border-white/10 px-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-500 font-black text-white">PS</div>
            <div><p className="font-bold tracking-wide">PETA SKANIDA</p><p className="mt-0.5 text-[10px] tracking-[.2em] text-slate-400">ADMIN PANEL</p></div>
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
            <div className="min-w-0"><p className="text-sm font-semibold">Administrator</p><p className="text-xs text-slate-500">Pengelola sistem</p></div>
            <ShieldCheck className="ml-auto text-emerald-400" size={17} />
          </div>
          <button onClick={onLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-300"><LogOut size={18} />Keluar</button>
        </div>
      </aside>

      <main className="min-h-screen lg:ml-[260px]">
        <header className="sticky top-0 z-30 flex h-[84px] items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-xl sm:px-8">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="rounded-xl border border-slate-200 p-2 text-slate-600 lg:hidden"><Menu size={20} /></button>
            <div><p className="text-xs text-slate-400">PETA SKANIDA / Admin</p><h1 className="mt-1 font-bold text-slate-800">{pageTitle}</h1></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block"><p className="text-xs font-semibold text-slate-700">Administrator</p><p className="text-[11px] text-slate-400">Admin</p></div>
            <div className="grid h-10 w-10 place-items-center rounded-full bg-indigo-50 text-indigo-600"><UserRound size={19} /></div>
          </div>
        </header>

        <div className="mx-auto max-w-[1600px] p-4 sm:p-8">
          {active === 'dashboard' && <Dashboard />}
          {active === 'tamu' && <ListingPage type="tamu" />}
          {active === 'request' && <ListingPage type="request" />}
          {active === 'riwayat' && <HistoryPage />}
          <footer className="mt-10 flex flex-col gap-2 border-t border-slate-200 pt-5 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between"><span>© 2026 PETA SKANIDA · Admin Panel</span><span className="flex items-center gap-1"><CalendarCheck size={13} /> Sistem pengelolaan kunjungan</span></footer>
        </div>
      </main>
      {notice && <div role="status" className="fixed bottom-5 right-5 z-[60] flex max-w-[calc(100%-40px)] items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-xl"><CheckCircle2 size={17} className="text-emerald-400" />{notice}</div>}
    </div>
  )
}

function App() {
  const [role, setRole] = useState(null) // null = login, 'admin-login', 'admin', 'tamu'

  if (role === null) return <LoginPage onSelect={setRole} />
  if (role === 'admin-login') return <AdminLoginPage onSuccess={() => setRole('admin')} onBack={() => setRole(null)} />
  if (role === 'tamu') return <GuestFormPage onBack={() => setRole(null)} onSubmit={form => {
    window.alert(`Terima kasih, ${form.name}. Permintaan kunjungan Anda telah dikirim dan akan diverifikasi oleh admin.`)
    setRole(null)
  }} />
  return <AdminApp onLogout={() => setRole(null)} />
}

export default App
