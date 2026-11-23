import { ArrowRight } from 'lucide-react'
import { CARD } from '../lib/appConstants'

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

export { StatCard }
