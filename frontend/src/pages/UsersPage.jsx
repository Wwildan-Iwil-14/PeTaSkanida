import { useState } from 'react'
import { Pencil, Trash2, UserPlus } from 'lucide-react'
import { useTablePaging, TablePaging } from '../lib/pagination'
import { ROLE_LABELS, ROLE_DEFAULTS, resolveFeatures, featureLabel } from '../lib/features'
import { USER_FIELDS } from '../lib/appConstants'
import { Panel, FormModal, ConfirmModal } from '../components/ui'

function UsersPage({ users, onCreate, onUpdate, onDelete, currentUserId, canManage = true }) {
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const paging = useTablePaging(users, { resetKey: 'users' })

  const fields = editing === 'new'
    ? USER_FIELDS.map(field => field.key === 'password'
        ? { ...field, required: true, hint: 'Minimal 6 karakter.' }
        : field)
    : USER_FIELDS.map(field => field.key === 'password'
        ? { ...field, hint: 'Kosongkan untuk tetap memakai password lama.' }
        : field)

  return <>
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Pengguna</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Kelola akun petugas, admin, dan super admin beserta fitur yang boleh diakses.</p>
      </div>
      {canManage && (
        <div className="no-print flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setEditing('new')} className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-600">
            <UserPlus size={15} /> Tambah Akun
          </button>
        </div>
      )}
    </div>

    <Panel title="Daftar pengguna" subtitle={`${users.length} akun terdaftar`}>
      {users.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-400 dark:bg-slate-800/60">
              <tr>
                <th className="px-3 py-3 sm:px-6 sm:py-4 font-semibold">Nama</th>
                <th className="px-3 py-3 sm:px-6 sm:py-4 font-semibold">Email</th>
                <th className="px-3 py-3 sm:px-6 sm:py-4 font-semibold">Role</th>
                <th className="px-3 py-3 sm:px-6 sm:py-4 font-semibold">Fitur</th>
                <th className="px-3 py-3 sm:px-6 sm:py-4 font-semibold">Dibuat</th>
                {canManage && <th className="px-3 py-3 sm:px-6 sm:py-4 text-right font-semibold">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paging.pageItems.map(user => (
                <tr key={user.id} className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="px-3 py-3 sm:px-6 sm:py-4">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">{user.nama || '-'}</div>
                    {user.user_id === currentUserId && <span className="mt-1 inline-block text-[10px] font-semibold text-indigo-500">Akun Anda</span>}
                  </td>
                  <td className="px-3 py-3 sm:px-6 sm:py-4 text-slate-600 dark:text-slate-300">{user.email || '-'}</td>
                  <td className="px-3 py-3 sm:px-6 sm:py-4"><span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{ROLE_LABELS[user.role] || user.role || 'Admin'}</span></td>
                  <td className="px-3 py-3 sm:px-6 sm:py-4">
                    <div className="flex max-w-[260px] flex-wrap gap-1">
                      {(user.features === null || user.features === undefined
                        ? resolveFeatures(user.role, null)
                        : resolveFeatures(user.role, user.features)
                      ).slice(0, 4).map(key => (
                        <span key={key} className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">{featureLabel(key)}</span>
                      ))}
                      {(resolveFeatures(user.role, user.features).length > 4) && (
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">+{resolveFeatures(user.role, user.features).length - 4}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3 sm:px-6 sm:py-4 text-xs text-slate-400 dark:text-slate-500">{user.created_at ? new Date(user.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</td>
                  {canManage && (
                    <td className="px-3 py-3 sm:px-6 sm:py-4">
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setEditing(user)} title="Edit pengguna" className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20"><Pencil size={13} /> Edit</button>
                        <button type="button" onClick={() => setDeleting(user)} title="Hapus pengguna" className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20"><Trash2 size={13} /> Hapus</button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <div className="px-6 py-12 text-center text-sm text-slate-400 dark:text-slate-500">Belum ada pengguna.</div>}
      <TablePaging paging={paging} />
    </Panel>

    {editing && canManage && (
      <FormModal
        title={editing === 'new' ? 'Tambah Pengguna' : 'Edit Pengguna'}
        subtitle={editing === 'new' ? 'Buat akun petugas / admin / super admin baru.' : `Ubah data ${editing.nama}.`}
        fields={fields}
        initial={editing === 'new'
          ? { role: 'admin', features: [...ROLE_DEFAULTS.admin] }
          : { ...editing, features: resolveFeatures(editing.role, editing.features) }}
        onSave={async values => {
          if (editing === 'new') await onCreate(values)
          else await onUpdate(editing.id, values)
          setEditing(null)
        }}
        onClose={() => setEditing(null)}
      />
    )}

    {deleting && canManage && (
      <ConfirmModal
        title="Hapus pengguna?"
        message={`Akun ${deleting.nama} akan dihapus dan tidak bisa lagi login ke aplikasi.`}
        onConfirm={async () => { await onDelete(deleting.id); setDeleting(null) }}
        onClose={() => setDeleting(null)}
      />
    )}
  </>
}

export { UsersPage }
