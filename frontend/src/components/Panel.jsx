import { CARD } from '../lib/appConstants'

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

export { Panel }
