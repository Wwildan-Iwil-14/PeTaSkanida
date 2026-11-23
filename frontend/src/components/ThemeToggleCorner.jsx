import { ThemeToggle } from './ThemeToggle'

function ThemeToggleCorner({ theme, onToggleTheme }) {
  return (
    <div className="fixed right-4 top-4 z-50">
      <ThemeToggle theme={theme} onToggle={onToggleTheme} />
    </div>
  )
}

export { ThemeToggleCorner }
