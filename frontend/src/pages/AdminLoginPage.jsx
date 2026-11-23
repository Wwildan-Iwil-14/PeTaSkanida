import { useState } from 'react'
import { ChevronRight, ShieldCheck, CalendarCheck, Eye, EyeOff, Loader2 } from 'lucide-react'
import { api } from '../lib/api'
import { CARD, FIELD } from '../lib/appConstants'
import { BrandLogo, ThemeToggleCorner, Panel } from '../components/ui'

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
          <BrandLogo className="h-12 w-12 shrink-0 object-contain" />
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

export { AdminLoginPage }
