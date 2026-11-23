import { ClipboardList, CalendarDays, Clock3, CheckCircle2, XCircle, Hourglass, ArrowUpRight, Mail } from 'lucide-react'
import { formatDate } from '../lib/appConstants'
import { StatCard, Panel, RequestTable } from '../components/ui'

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
      <Panel title="Kunjungan mendatang" subtitle="Jadwal kunjungan yang telah disetujui" action={upcoming.length > 5 ? <button onClick={() => onGoTo('tamu')} className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400">Lihat semua <ArrowUpRight className="ml-1 inline" size={15} /></button> : undefined}>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {upcoming.length ? upcoming.slice(0, 5).map(item => <div key={item.id} className="flex items-start gap-3 px-5 py-4">
            <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300"><CalendarDays size={19} /></div>
            <div className="min-w-0 flex-1"><p className="font-semibold text-slate-800 dark:text-slate-200">{item.name}</p><p className="mt-1 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400"><Mail size={13} className="shrink-0" /><span className="truncate">{item.email || '-'}</span></p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.purpose}</p><p className="mt-2 flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500"><Clock3 size={13} /> {formatDate(item.date)} · {item.time || '-'}</p></div>
          </div>) : <p className="px-5 py-10 text-center text-sm text-slate-400 dark:text-slate-500">Belum ada jadwal mendatang.</p>}
        </div>
      </Panel>
    </div>
  </>
}

export { Dashboard }
