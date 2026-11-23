import { useState } from 'react'
import { X, ChevronRight, UserRound, ShieldCheck, CalendarCheck, MessageCircle, Mail } from 'lucide-react'
import { CS_EMAIL, CS_WHATSAPP, CS_WHATSAPP_MESSAGE } from '../lib/appConstants'
import { BrandLogo, ThemeToggleCorner, Panel } from '../components/ui'

function LoginPage({ onSelect, theme, onToggleTheme }) {
  const [contactOpen, setContactOpen] = useState(false)
  return (
    <div className="relative grid min-h-screen bg-[#f5f7fb] dark:bg-slate-950 lg:grid-cols-2">
      <ThemeToggleCorner theme={theme} onToggleTheme={onToggleTheme} />
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[#101827] p-10 text-white dark:bg-slate-900 lg:flex">
        <div className="flex items-center gap-3">
          <BrandLogo className="h-12 w-12 shrink-0 object-contain" />
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
              <BrandLogo className="h-12 w-12 shrink-0 object-contain" />
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

          <div className="mt-7 border-t border-slate-200 pt-5 text-center dark:border-slate-800">
            <p className="text-xs text-slate-400 dark:text-slate-500">Butuh bantuan atau ada pertanyaan?</p>
            <button
              type="button"
              onClick={() => setContactOpen(true)}
              className="mt-2 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-500/10"
            >
              <MessageCircle size={16} /> Hubungi customer service
            </button>
          </div>
        </div>
      </div>
      {contactOpen && <ContactModal onClose={() => setContactOpen(false)} />}
    </div>
  )
}

function ContactModal({ onClose }) {
  const waNumber = CS_WHATSAPP.replace(/[^0-9]/g, '')
  const waHref = `https://wa.me/${waNumber}?text=${encodeURIComponent(CS_WHATSAPP_MESSAGE)}`
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 dark:ring-1 dark:ring-slate-700" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="cs-modal-title">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 id="cs-modal-title" className="text-lg font-bold text-slate-900 dark:text-slate-100">Hubungi Customer Service</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Pilih cara menghubungi tim PeTa SKANIDA.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Tutup" className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"><X size={18} /></button>
        </div>

        <div className="mt-5 space-y-3">
          <a href={`mailto:${CS_EMAIL}`} className="group flex items-center gap-4 rounded-xl border border-slate-200 p-4 transition hover:border-indigo-300 hover:bg-indigo-50/50 dark:border-slate-700 dark:hover:border-indigo-500 dark:hover:bg-indigo-500/10">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300"><Mail size={20} /></span>
            <span className="min-w-0">
              <span className="block text-sm font-bold text-slate-800 dark:text-slate-100">Via Email</span>
              <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{CS_EMAIL}</span>
            </span>
            <ChevronRight className="ml-auto shrink-0 text-slate-300 group-hover:text-indigo-500 dark:text-slate-600" size={18} />
          </a>
          <a href={waHref} target="_blank" rel="noreferrer" className="group flex items-center gap-4 rounded-xl border border-slate-200 p-4 transition hover:border-emerald-300 hover:bg-emerald-50/50 dark:border-slate-700 dark:hover:border-emerald-500 dark:hover:bg-emerald-500/10">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300"><MessageCircle size={20} /></span>
            <span className="min-w-0">
              <span className="block text-sm font-bold text-slate-800 dark:text-slate-100">Via WhatsApp</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">+{waNumber}</span>
            </span>
            <ChevronRight className="ml-auto shrink-0 text-slate-300 group-hover:text-emerald-500 dark:text-slate-600" size={18} />
          </a>
        </div>
      </div>
    </div>
  )
}

export { LoginPage, ContactModal }
