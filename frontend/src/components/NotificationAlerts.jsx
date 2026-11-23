import { X, XCircle, BadgeCheck, Bell } from 'lucide-react'

function NotificationAlerts({ alerts = [], onDismiss, onOpen }) {
  if (!alerts.length) return null
  return (
    <div className="flex flex-col gap-3">
      {alerts.map(alert => {
        const Icon = alert.status === 'Ditolak' ? XCircle : alert.status === 'Selesai' ? BadgeCheck : Bell
        return (
          <div key={alert.key} role="alert" className="rounded-2xl border border-indigo-100 bg-white/95 p-4 shadow-xl backdrop-blur dark:border-indigo-500/30 dark:bg-slate-900/95">
            <div className="flex items-start gap-3">
              <Icon size={20} className="mt-0.5 shrink-0 text-indigo-500" />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-indigo-500"><Bell size={11} /> Notifikasi kunjungan</p>
                <p className="mt-0.5 font-bold text-slate-800 dark:text-slate-100">{alert.title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{alert.body}</p>
                <button type="button" onClick={() => onOpen(alert)} className="mt-2 text-xs font-bold text-indigo-600 underline underline-offset-2 dark:text-indigo-400">Lihat data</button>
              </div>
              <button type="button" onClick={() => onDismiss(alert.key)} aria-label="Tutup notifikasi" className="rounded-lg p-1 text-slate-400 transition hover:text-slate-700 dark:hover:text-slate-200"><X size={16} /></button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export { NotificationAlerts }
