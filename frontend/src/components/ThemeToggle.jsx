import { Moon, Sun } from 'lucide-react'

function ThemeToggle({ theme, onToggle, className = '' }) {
  const isDark = theme === 'dark'
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isDark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
      title={isDark ? 'Mode terang' : 'Mode gelap'}
      className={`grid h-10 w-10 place-items-center rounded-full border shadow-sm transition ${
        isDark
          ? 'border-slate-700 bg-slate-800 text-amber-300 hover:bg-slate-700'
          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
      } ${className}`}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}

export { ThemeToggle }
