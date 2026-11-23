import { LayoutDashboard, Users, ClipboardList, History, CalendarDays, ShieldCheck, ScanLine, Database, CalendarClock, UserCog } from 'lucide-react'
import { ROLES, ROLE_LABELS } from './features'

const THEME_KEY = 'peta-skanida.theme'
const LOGO_SRC = `${import.meta.env.BASE_URL}logo-peta-skanida.png`

// Kontak customer service. Bisa diubah lewat file frontend/.env
// tanpa perlu mengubah kode.
const CS_EMAIL = (import.meta.env.VITE_CS_EMAIL || '').trim() || 'cs@petaskanida.sch.id'
const CS_WHATSAPP = (import.meta.env.VITE_CS_WHATSAPP || '').trim() || '6280000000000'
const CS_WHATSAPP_MESSAGE = (import.meta.env.VITE_CS_WHATSAPP_MESSAGE || '').trim()
  || 'Halo, saya ingin bertanya tentang kunjungan di PeTa SKANIDA.'

// Surat tugas: opsional, PDF, maksimal 4 MB.
const SURAT_TUGAS_MAX_SIZE = 4 * 1024 * 1024
const SURAT_TUGAS_ACCEPT = '.pdf,application/pdf'

// Fitur yang menentukan apakah sebuah akun boleh menerima notifikasi.
const NOTIFY_REQUEST_FEATURES = ['request']
const NOTIFY_HISTORY_FEATURES = [
  'riwayat_admin', 'riwayat_superadmin', 'riwayat',
  'tamu_admin', 'tamu_superadmin', 'tamu',
]

function canReceiveNotifications(features = []) {
  return [...NOTIFY_REQUEST_FEATURES, ...NOTIFY_HISTORY_FEATURES]
    .some(feature => features.includes(feature))
}

function canNotifyStatus(features = [], status) {
  const allowed = status === 'Selesai' ? NOTIFY_HISTORY_FEATURES : NOTIFY_REQUEST_FEATURES
  return allowed.some(feature => features.includes(feature))
}

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

// Logo diambil dari frontend/public/logo-peta-skanida.png. Vite menyalinnya
// ke root folder build; fallback dipakai bila base path berubah saat deploy.

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, feature: 'dashboard' },
  { id: 'request', label: 'Daftar Request', icon: ClipboardList, feature: 'request' },
  { id: 'tamu-superadmin', label: 'Kelola Tamu (superadmin)', icon: Users, feature: 'tamu_superadmin' },
  { id: 'tamu-admin', label: 'Kelola Tamu (admin)', icon: Users, feature: 'tamu_admin' },
  { id: 'kunjungan-terkini', label: 'Kunjungan Terkini', icon: CalendarClock, feature: 'kunjungan_terkini' },
  { id: 'kunjungan-mendatang', label: 'Kunjungan Mendatang', icon: CalendarDays, feature: 'kunjungan_mendatang' },
  { id: 'riwayat-superadmin', label: 'Riwayat Kunjungan (superadmin)', icon: History, feature: 'riwayat_superadmin' },
  { id: 'riwayat-admin', label: 'Riwayat Kunjungan (admin)', icon: History, feature: 'riwayat_admin' },
  { id: 'scan', label: 'Scan Tamu', icon: ScanLine, feature: 'scan' },
  { id: 'users', label: 'Kelola Akun', icon: ShieldCheck, features: ['kelola_akun', 'tambah_edit_akun'] },
  { id: 'database', label: 'Database', icon: Database, feature: 'database' },
  { id: 'akun', label: 'Akun Saya', icon: UserCog, feature: 'akun' },
]

// Satu formatter dipakai ulang untuk semua baris agar tidak membuat objek
// Intl baru tiap render (penting saat tabel berisi ratusan data).
const DATE_FORMATTER = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit', month: 'short', year: 'numeric',
})
const formatDate = value => {
  if (!value) return '-'
  const parsed = new Date(`${value}T00:00:00`)
  return Number.isNaN(parsed.getTime()) ? String(value) : DATE_FORMATTER.format(parsed)
}

// Tanda tangan ringan untuk mendeteksi data yang benar-benar berubah.
// Dipakai agar polling/realtime tidak memicu render ulang tabel tanpa perlu.
const requestSignature = rows => (rows || [])
  .map(row => [
    row.id, row.status, row.nama, row.tanggal, row.waktu,
    row.jumlah, row.dihubungi, row.surat_tugas_url,
  ].join(':'))
  .join('|')

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

const RECORD_FIELDS = [
  { key: 'nama', label: 'Nama / Instansi', type: 'text', required: true },
  { key: 'email', label: 'Email (opsional)', type: 'email', required: false },
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
    options: ROLES.map(role => ({ value: role, label: ROLE_LABELS[role] })),
  },
  {
    key: 'features',
    label: 'Fitur akun',
    type: 'features',
    hint: 'Fitur yang dicentang boleh diakses akun ini. Menentukan menu yang tampil.',
  },
]

const DB_TABLE_LABELS = {
  req_pending: 'Req Pending — semua tamu',
  req_acc: 'Req Acc — kunjungan aktif',
  req_reject: 'Req Reject — ditolak',
  riwayat: 'Riwayat kunjungan',
  scan_logs: 'Log scan',
  admins: 'Pengguna (tidak ikut diimpor)',
}

function saveTextFile(content, filename, type = 'text/plain;charset=utf-8') {
  const blob = content instanceof Blob ? content : new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 2000)
}

/** Parser CSV kecil: mendukung koma di dalam tanda kutip dan baris baru. */
function parseCsvText(text) {
  const source = String(text || '').replace(/^\uFEFF/, '')
  const rows = []
  let row = []
  let field = ''
  let quoted = false

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index]
    if (quoted) {
      if (char === '"') {
        if (source[index + 1] === '"') { field += '"'; index += 1 } else quoted = false
      } else {
        field += char
      }
    } else if (char === '"') {
      quoted = true
    } else if (char === ',') {
      row.push(field)
      field = ''
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && source[index + 1] === '\n') index += 1
      row.push(field)
      field = ''
      if (row.some(cell => cell !== '')) rows.push(row)
      row = []
    } else {
      field += char
    }
  }
  if (field !== '' || row.length) {
    row.push(field)
    if (row.some(cell => cell !== '')) rows.push(row)
  }
  if (!rows.length) return []

  const headers = rows[0].map(header => header.trim())
  return rows.slice(1).map(cells =>
    Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ''])),
  )
}

/** Terima backup JSON (format aplikasi) maupun CSV, lalu siapkan untuk preview. */
function readImportFile(text, isCsv) {
  if (isCsv) {
    const rows = parseCsvText(text)
    if (!rows.length) throw new Error('CSV kosong atau tidak memiliki baris data.')
    return { data: null, looseRows: rows }
  }

  const parsed = JSON.parse(text)
  if (parsed?.data && typeof parsed.data === 'object' && !Array.isArray(parsed.data)) {
    return { data: parsed.data, looseRows: null }
  }
  if (Array.isArray(parsed)) {
    if (!parsed.length) throw new Error('File JSON tidak berisi baris data.')
    return { data: null, looseRows: parsed }
  }
  if (parsed && typeof parsed === 'object') {
    return { data: parsed, looseRows: null }
  }
  throw new Error('Format JSON tidak dikenali. Gunakan file backup dari menu Ekspor.')
}

// Super admin: statistik, ekspor/impor data, backup, dan bersihkan log scan.

export { THEME_KEY, LOGO_SRC, CS_EMAIL, CS_WHATSAPP, CS_WHATSAPP_MESSAGE, SURAT_TUGAS_MAX_SIZE, SURAT_TUGAS_ACCEPT, NOTIFY_REQUEST_FEATURES, NOTIFY_HISTORY_FEATURES, canReceiveNotifications, canNotifyStatus, CARD, FIELD, getInitialTheme, navItems, DATE_FORMATTER, formatDate, requestSignature, getTodayISO, mapRecord, opsiTujuan, GUEST_FIELD, RECORD_FIELDS, GUEST_CREATE_FIELDS, USER_FIELDS, DB_TABLE_LABELS, saveTextFile, parseCsvText, readImportFile }
