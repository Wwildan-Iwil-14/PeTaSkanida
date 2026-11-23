import { useState } from 'react'
import { X, Loader2, Check } from 'lucide-react'
import { FEATURES, ROLE_DEFAULTS, resolveFeatures } from '../lib/features'
import { FIELD } from '../lib/appConstants'

function FormModal({ title, subtitle, fields, initial = {}, onSave, onClose }) {
  const [values, setValues] = useState(() => {
    const base = { ...initial }
    for (const field of fields) {
      if (base[field.key] === undefined || base[field.key] === null) {
        base[field.key] = field.type === 'number' ? 1 : field.type === 'features' ? [] : ''
      }
      if (field.type === 'features' && !Array.isArray(base[field.key])) {
        base[field.key] = resolveFeatures(base.role, base[field.key])
      }
    }
    return base
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  // Ganti role → sesuaikan centang fitur dengan default role tersebut.
  function handleChange(key, value) {
    setValues(current => {
      const next = { ...current, [key]: value }
      if (key === 'role' && fields.some(field => field.type === 'features')) {
        next.features = [...(ROLE_DEFAULTS[value] || [])]
      }
      return next
    })
  }

  function toggleFeature(key) {
    setValues(current => {
      const owned = Array.isArray(current.features) ? current.features : []
      return {
        ...current,
        features: owned.includes(key) ? owned.filter(item => item !== key) : [...owned, key],
      }
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await onSave(values)
    } catch (err) {
      setError(err.message || 'Gagal menyimpan data.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 dark:ring-1 dark:ring-slate-700" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h3>
            {subtitle && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Tutup" className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 grid gap-3.5 sm:grid-cols-2">
          {fields.map(field => (
            <div key={field.key} className={['keperluan', 'features'].includes(field.key) ? 'sm:col-span-2' : ''}>
              <label htmlFor={`form-${field.key}`} className="mb-1.5 block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                {field.label} {field.required && <span className="text-indigo-500">*</span>}
              </label>
              {field.type === 'features' ? (
                <div id={`form-${field.key}`} className="grid gap-2 rounded-xl border border-slate-200 p-3 dark:border-slate-700 sm:grid-cols-2">
                  {FEATURES.map(feature => {
                    const checked = (values.features || []).includes(feature.key)
                    return (
                      <label key={feature.key} className={`flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 transition ${checked ? 'bg-indigo-50 dark:bg-indigo-500/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'}`}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleFeature(feature.key)}
                          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-400"
                        />
                        <span>
                          <span className="block text-[12px] font-semibold text-slate-700 dark:text-slate-200">{feature.label}</span>
                          <span className="block text-[10px] leading-tight text-slate-400 dark:text-slate-500">{feature.hint}</span>
                        </span>
                      </label>
                    )
                  })}
                </div>
              ) : field.type === 'select' ? (
                <select
                  id={`form-${field.key}`}
                  value={values[field.key] ?? ''}
                  onChange={e => handleChange(field.key, e.target.value)}
                  required={field.required}
                  className={FIELD}
                >
                  {(field.options || []).map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              ) : (
                <input
                  id={`form-${field.key}`}
                  type={field.type}
                  value={values[field.key] ?? ''}
                  onChange={e => setValues(current => ({ ...current, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  min={field.min}
                  required={field.required}
                  autoComplete={field.autoComplete}
                  className={FIELD}
                />
              )}
              {field.hint && <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">{field.hint}</p>}
            </div>
          ))}

          {error && <p role="alert" className="sm:col-span-2 rounded-xl bg-rose-50 px-3 py-2 text-[12px] font-medium text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">{error}</p>}

          <div className="mt-1 flex justify-end gap-2 sm:col-span-2">
            <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Batal</button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-indigo-600 disabled:opacity-60">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export { FormModal }
