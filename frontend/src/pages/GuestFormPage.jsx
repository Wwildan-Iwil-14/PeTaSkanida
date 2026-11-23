import { useState } from 'react'
import { Users, ClipboardList, X, CalendarDays, Clock3, UserRound, Loader2, Check, ArrowLeft, Info, Mail, Phone, Send, Plus, ChevronDown, FileText, UploadCloud } from 'lucide-react'
import { api } from '../lib/api'
import { SURAT_TUGAS_MAX_SIZE, SURAT_TUGAS_ACCEPT, GUEST_FIELD, getTodayISO, opsiTujuan } from '../lib/appConstants'
import { ThemeToggle } from '../components/ui'

function GuestFormPage({ onBack, onSubmit, theme, onToggleTheme }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', date: '', time: '', people: '1', keperluan: '' })
  const [tujuan, setTujuan] = useState([])
  const [activeTujuanGroup, setActiveTujuanGroup] = useState('')
  const [customTujuanOpen, setCustomTujuanOpen] = useState(false)
  const [customTujuan, setCustomTujuan] = useState('')
  const [error, setError] = useState('')
  const today = getTodayISO()
  const [suratTugas, setSuratTugas] = useState(null)
  const [fileError, setFileError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fields = [
    { key: 'name', label: 'Nama / Instansi', type: 'text', placeholder: 'Nama lengkap atau instansi', icon: UserRound, required: true },
    { key: 'email', label: 'Email (opsional)', type: 'email', placeholder: 'nama@email.com', icon: Mail, required: false },
    { key: 'phone', label: 'Nomor Handphone', type: 'tel', placeholder: '08xxxxxxxxxx', icon: Phone, required: true },
    { key: 'date', label: 'Tanggal Kunjungan', type: 'date', placeholder: '', icon: CalendarDays, required: true },
    { key: 'time', label: 'Waktu Kunjungan', type: 'time', placeholder: '', icon: Clock3, required: true },
    { key: 'people', label: 'Jumlah Pengunjung', type: 'number', placeholder: '1', icon: Users, required: false },
  ]

  const activeGroup = opsiTujuan.find(group => group.label === activeTujuanGroup)

  function addCustomTujuan() {
    const value = customTujuan.trim()
    if (value) setTujuan(current => current.includes(value) ? current : [...current, value])
    setCustomTujuan('')
    setCustomTujuanOpen(false)
  }

  function toggleCustomTujuan() {
    if (customTujuanOpen) {
      addCustomTujuan()
      return
    }
    setCustomTujuanOpen(true)
    setActiveTujuanGroup('')
  }

  function toggleTujuanGroup(label) {
    if (customTujuanOpen) addCustomTujuan()
    setActiveTujuanGroup(current => current === label ? '' : label)
  }

  function toggleTujuanItem(value) {
    setTujuan(current => current.includes(value) ? current.filter(item => item !== value) : [...current, value])
  }

  function handleSuratTugasChange(e) {
    const file = e.target.files?.[0] || null
    setFileError('')
    if (!file) {
      setSuratTugas(null)
      return
    }
    const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name)
    if (!isPdf) {
      setSuratTugas(null)
      setFileError('Surat tugas harus berformat PDF.')
      return
    }
    if (file.size > SURAT_TUGAS_MAX_SIZE) {
      setSuratTugas(null)
      setFileError('Ukuran surat tugas maksimal 4 MB.')
      return
    }
    setSuratTugas(file)
  }

  function removeSuratTugas() {
    setSuratTugas(null)
    setFileError('')
    const input = document.getElementById('guest-surat-tugas')
    if (input) input.value = ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const finalTujuan = [...tujuan]
    const draftTujuan = customTujuan.trim()
    if (draftTujuan && !finalTujuan.includes(draftTujuan)) finalTujuan.push(draftTujuan)

    if (!form.name.trim() || !form.phone.trim() || !form.date || !form.time || !form.keperluan.trim() || !finalTujuan.length) {
      setError('Lengkapi semua kolom bertanda * dan pilih minimal satu tujuan kunjungan.')
      return
    }
    if (form.date < today) {
      setError('Tanggal kunjungan tidak boleh sebelum hari ini.')
      return
    }
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError('Format alamat email tidak valid, contoh: nama@email.com.')
      return
    }
    if (!/^[0-9+()\-\s]{8,}$/.test(form.phone.trim())) {
      setError('Nomor HP tidak valid, gunakan 8-15 digit angka.')
      return
    }
    if (suratTugas && suratTugas.size > SURAT_TUGAS_MAX_SIZE) {
      setError('Ukuran surat tugas maksimal 4 MB.')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('nama', form.name.trim())
      formData.append('email', form.email.trim())
      formData.append('no_hp', form.phone.trim())
      formData.append('tujuan', finalTujuan.join(', '))
      formData.append('keperluan', form.keperluan.trim())
      formData.append('tanggal', form.date)
      formData.append('waktu', form.time)
      formData.append('jumlah', String(parseInt(form.people) || 1))
      // Opsional: hanya dikirim bila tamu memilih file.
      if (suratTugas) formData.append('suratTugas', suratTugas)

      const result = await api.createRequestWithFile(formData)
      const requestId = result?.request?.id
      // Kode unik per permintaan dipakai sebagai isi barcode.
      // ID database memastikan setiap orang mendapat barcode berbeda.
      const kode = requestId
        ? `REQ-${String(requestId).padStart(3, '0')}`
        : `REQ-${Date.now()}`
      onSubmit({
        id: requestId,
        kode,
        nama: form.name.trim(),
        email: form.email.trim(),
        no_hp: form.phone.trim(),
        tujuan: finalTujuan.join(', '),
        keperluan: form.keperluan.trim(),
        tanggal: form.date,
        waktu: form.time,
        jumlah: parseInt(form.people) || 1,
        suratTugasNama:
          result?.request?.surat_tugas_nama ||
          result?.suratTugas?.nama ||
          suratTugas?.name ||
          '',
        suratTugasUrl:
          result?.request?.surat_tugas_url || result?.suratTugas?.url || '',
        suratTugasEmail: result?.suratTugas?.tujuanEmail || '',
      })
    } catch (err) {
      setError('Gagal mengirim permintaan: ' + (err.message || 'Terjadi kesalahan. Silakan coba lagi.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-sky-400 via-blue-500 to-blue-700 px-4 py-8 dark:from-slate-950 dark:via-blue-950 dark:to-slate-950 sm:px-6 sm:py-10">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 -top-24 h-[420px] w-[520px] -rotate-12 rounded-[48px] bg-white/25 blur-3xl dark:bg-blue-400/10" />
        <div className="absolute -right-24 top-16 h-[360px] w-[440px] rotate-6 rounded-[44px] bg-sky-100/40 blur-3xl dark:bg-blue-500/10" />
        <div className="absolute left-1/4 top-1/2 h-[480px] w-[600px] rounded-[64px] bg-blue-300/30 blur-3xl dark:bg-blue-600/10" />
        <div className="absolute -bottom-32 right-1/4 h-80 w-[420px] -rotate-3 rounded-[48px] bg-white/20 blur-3xl dark:bg-slate-700/20" />
      </div>

      <div className="relative mx-auto w-full max-w-xl">
        <div className="mb-5 flex items-center gap-3 px-1">
          <button
            type="button"
            onClick={onBack}
            aria-label="Kembali ke halaman login"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/40 bg-white/20 text-white shadow-sm backdrop-blur-md transition hover:bg-white/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <ArrowLeft size={19} />
          </button>
          <div className="min-w-0">
            <h1 className="text-base font-bold tracking-tight text-white sm:text-xl">Formulir Kunjungan Tamu</h1>
            <p className="mt-0.5 text-[11px] font-medium tracking-wide text-white/75 sm:text-xs">PeTa SKANIDA · SMK Negeri 2 Magelang</p>
          </div>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} className="ml-auto shrink-0" />
        </div>

        <div className="rounded-[26px] border border-white/60 bg-white/95 p-4 shadow-[0_30px_80px_-25px_rgba(8,47,99,0.55)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/95 sm:p-6">
          <div className="flex items-start gap-2.5 rounded-xl bg-blue-50 px-3.5 py-3 text-[12px] leading-relaxed text-slate-600 dark:bg-blue-500/10 dark:text-slate-300">
            <Info size={16} className="mt-0.5 shrink-0 text-blue-500 dark:text-blue-300" />
            <p>Silakan isi data kunjungan Anda dengan lengkap. Data akan digunakan oleh pihak sekolah untuk keperluan administrasi dan pengelolaan tamu.</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-4">
            <div className="grid gap-x-3.5 gap-y-3 sm:grid-cols-2">
              {fields.map(({ key, label, type, placeholder, icon: Icon, required }) => (
                <div key={key}>
                  <label htmlFor={`guest-${key}`} className="mb-1.5 block text-[12px] font-semibold text-slate-700 dark:text-slate-300">
                    {label} {required && <span className="text-blue-500 dark:text-blue-400">*</span>}
                  </label>
                  <div className="relative">
                    <Icon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
                    <input
                      id={`guest-${key}`}
                      type={type}
                      value={form[key]}
                      onChange={e => setForm(current => ({ ...current, [key]: e.target.value }))}
                      placeholder={placeholder}
                      min={type === 'number' ? 1 : type === 'date' ? today : undefined}
                      className={GUEST_FIELD}
                    />
                  </div>
                </div>
              ))}

              <div>
                <label htmlFor="guest-keperluan" className="mb-1.5 block text-[12px] font-semibold text-slate-700 dark:text-slate-300">
                  Keperluan Kunjungan <span className="text-blue-500 dark:text-blue-400">*</span>
                </label>
                <div className="relative">
                  <ClipboardList className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
                  <input
                    id="guest-keperluan"
                    type="text"
                    value={form.keperluan}
                    onChange={e => setForm(current => ({ ...current, keperluan: e.target.value }))}
                    placeholder="Tuliskan keperluan kunjungan..."
                    className={GUEST_FIELD}
                  />
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl bg-slate-100/90 px-3.5 py-3 text-[11.5px] leading-relaxed text-slate-500 dark:bg-slate-800/70 dark:text-slate-400 sm:mt-[22px]">
                <Info size={15} className="mt-0.5 shrink-0 text-slate-400 dark:text-slate-500" />
                <p>Data Anda akan diverifikasi petugas saat tiba di sekolah.</p>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300">
                Tujuan Kunjungan <span className="text-blue-500 dark:text-blue-400">*</span>
              </label>
              <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">Pilih pihak yang ingin Anda temui. Bisa lebih dari satu.</p>

              <div className="mt-2 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">Pilihan tersedia</p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {opsiTujuan.map(group => {
                    const active = activeTujuanGroup === group.label
                    const selectedCount = group.items.filter(item => tujuan.includes(item)).length
                    return (
                      <button
                        type="button"
                        key={group.label}
                        onClick={() => toggleTujuanGroup(group.label)}
                        aria-expanded={active}
                        className={`inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition ${
                          active
                            ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-200'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50/60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-500/40 dark:hover:bg-blue-500/10'
                        }`}
                      >
                        {group.label}
                        {selectedCount > 0 ? (
                          <span className="grid h-4 min-w-4 place-items-center rounded-full bg-blue-500 px-1 text-[9px] font-bold text-white">{selectedCount}</span>
                        ) : (
                          <ChevronDown size={11} className={active ? 'rotate-180 transition-transform' : 'transition-transform'} />
                        )}
                      </button>
                    )
                  })}
                  <button
                    type="button"
                    onClick={toggleCustomTujuan}
                    aria-expanded={customTujuanOpen}
                    className={`inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition ${
                      customTujuanOpen
                        ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-200'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50/60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-500/40 dark:hover:bg-blue-500/10'
                    }`}
                  >
                    Lainnya
                    <span className={`grid h-4 w-4 place-items-center rounded-full ${customTujuanOpen ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                      {customTujuanOpen ? <Check size={10} /> : <Plus size={10} />}
                    </span>
                  </button>
                </div>

                {activeGroup && (
                  <div className="mt-2.5 rounded-lg border border-slate-100 bg-slate-50/70 p-2.5 dark:border-slate-800 dark:bg-slate-950/40">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">{activeGroup.label}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {activeGroup.items.map(item => {
                        const selected = tujuan.includes(item)
                        return (
                          <button
                            type="button"
                            key={item}
                            onClick={() => toggleTujuanItem(item)}
                            aria-pressed={selected}
                            className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[10.5px] font-medium transition ${
                              selected
                                ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-200'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50/60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-500/40 dark:hover:bg-blue-500/10'
                            }`}
                          >
                            {item}
                            {selected ? <Check size={10} /> : <Plus size={9} />}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {customTujuanOpen && (
                  <div className="mt-2.5 flex flex-col gap-2 sm:flex-row">
                    <input
                      value={customTujuan}
                      onChange={e => setCustomTujuan(e.target.value)}
                      autoFocus
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          if (e.isComposing || e.keyCode === 229) return
                          addCustomTujuan()
                        }
                      }}
                      placeholder="Tulis tujuan lainnya..."
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-500 dark:focus:ring-blue-500/20"
                    />
                    <button type="button" onClick={addCustomTujuan} className="shrink-0 rounded-lg bg-blue-500 px-3 py-2 text-[11px] font-bold text-white transition hover:bg-blue-600">Tambah</button>
                  </div>
                )}
              </div>

              <div className="mt-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-3 dark:border-slate-600 dark:bg-slate-800/40">
                <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                  Tujuan terpilih <Info size={11} />
                </p>
                {tujuan.length ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {tujuan.map(item => (
                      <span key={item} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1.5 text-[11px] font-semibold text-blue-700 ring-1 ring-inset ring-blue-100 dark:bg-blue-500/10 dark:text-blue-200 dark:ring-blue-500/20">
                        {item}
                        <button
                          type="button"
                          onClick={() => setTujuan(current => current.filter(value => value !== item))}
                          aria-label={`Hapus ${item}`}
                          className="text-blue-400 transition hover:text-blue-700 dark:text-blue-300 dark:hover:text-white"
                        >
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1.5 flex items-center gap-1.5 py-0.5 text-[11.5px] text-slate-400 dark:text-slate-500">
                    <ChevronDown size={13} /> Klik pilihan di atas untuk menambahkan
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="guest-surat-tugas" className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300">
                  Surat Tugas{' '}
                  <span className="ml-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">Opsional</span>
                </label>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">PDF · maks. 4 MB</span>
              </div>
              <label
                htmlFor="guest-surat-tugas"
                className={`mt-1.5 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed px-3.5 py-3 transition ${
                  suratTugas
                    ? 'border-emerald-300 bg-emerald-50/60 dark:border-emerald-500/40 dark:bg-emerald-500/10'
                    : 'border-slate-300 bg-slate-50/70 hover:border-blue-300 hover:bg-blue-50/50 dark:border-slate-600 dark:bg-slate-800/40 dark:hover:border-blue-500/40'
                }`}
              >
                <input
                  id="guest-surat-tugas"
                  type="file"
                  accept={SURAT_TUGAS_ACCEPT}
                  onChange={handleSuratTugasChange}
                  className="sr-only"
                />
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${suratTugas ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300' : 'bg-white text-slate-400 shadow-sm dark:bg-slate-900 dark:text-slate-500'}`}>
                  {suratTugas ? <FileText size={18} /> : <UploadCloud size={18} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12px] font-semibold text-slate-700 dark:text-slate-200">
                    {suratTugas ? suratTugas.name : 'Klik untuk pilih surat tugas'}
                  </span>
                  <span className="mt-0.5 block text-[10.5px] text-slate-400 dark:text-slate-500">
                    {suratTugas
                      ? `${(suratTugas.size / 1024 / 1024).toFixed(2)} MB · siap diunggah`
                      : 'Tidak wajib diisi. Biarkan kosong jika tidak ada.'}
                  </span>
                </span>
                {suratTugas && (
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeSuratTugas() }}
                    aria-label="Hapus surat tugas"
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-white hover:text-rose-500 dark:hover:bg-slate-800"
                  >
                    <X size={14} />
                  </button>
                )}
              </label>
              {fileError && (
                <p className="mt-1.5 text-[11px] font-medium text-rose-500 dark:text-rose-400">{fileError}</p>
              )}
            </div>

            {error && (
              <p className="mt-3 rounded-xl bg-rose-50 px-3.5 py-2.5 text-[12px] font-medium text-rose-600 ring-1 ring-inset ring-rose-100 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/20">{error}</p>
            )}

            <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
              <Info size={12} className="mt-0.5 shrink-0" />
              Pilih "Lainnya" jika tujuan Anda tidak tersedia di daftar.
            </p>

            <div className="mt-4 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
              <button type="button" onClick={onBack} className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-[12.5px] font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800">
                Batal
              </button>
              <button type="submit" disabled={submitting} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-5 py-2.5 text-[12.5px] font-bold text-white shadow-lg shadow-blue-200/70 transition hover:bg-blue-600 disabled:opacity-60 dark:shadow-blue-950/40">
                {submitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                {submitting ? 'Mengirim...' : 'Kirim Data Kunjungan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Barcode unik untuk setiap permintaan, lengkap dengan tombol unduh.

export { GuestFormPage }

export default GuestFormPage
