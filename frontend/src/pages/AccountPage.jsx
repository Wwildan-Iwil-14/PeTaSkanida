import { BadgeCheck } from 'lucide-react'
import { ROLE_LABELS, featureLabel } from '../lib/features'
import { Panel } from '../components/ui'

function AccountPage({ admin, features }) {
  const rows = [
    { label: 'Nama', value: admin?.nama || '-' },
    { label: 'Email', value: admin?.email || '-' },
    { label: 'Role', value: ROLE_LABELS[admin?.role] || admin?.role || '-' },
    { label: 'Fitur aktif', value: `${features.length} fitur` },
  ]
  return <>
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Akun Saya</h2>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Detail akun yang sedang aktif di perangkat ini.</p>
    </div>
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel title="Profil akun" subtitle="Data diambil dari sesi login aktif.">
        <dl className="divide-y divide-slate-100 dark:divide-slate-800">
          {rows.map(row => (
            <div key={row.label} className="flex items-center justify-between gap-4 px-3 py-3 sm:px-6 sm:py-4">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">{row.label}</dt>
              <dd className="text-sm font-semibold text-slate-700 dark:text-slate-200">{row.value}</dd>
            </div>
          ))}
        </dl>
      </Panel>
      <Panel title="Fitur yang boleh diakses" subtitle="Diatur oleh super admin lewat menu Pengguna.">
        <div className="flex flex-wrap gap-2 px-6 py-5">
          {features.length ? features.map(key => (
            <span key={key} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
              <BadgeCheck size={13} /> {featureLabel(key)}
            </span>
          )) : <p className="text-sm text-slate-400 dark:text-slate-500">Belum ada fitur yang diberikan.</p>}
        </div>
      </Panel>
    </div>
  </>
}

// ---- Ekspor / impor database (super admin) --------------------------------

export { AccountPage }
