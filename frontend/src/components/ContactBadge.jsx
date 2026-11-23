import { CircleDashed, BadgeCheck } from 'lucide-react'

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

export { ContactBadge }
