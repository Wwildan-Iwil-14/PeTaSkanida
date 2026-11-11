# PeTa SKANIDA - Database

Folder ini berisi skema, seed, dan migration database untuk Supabase.
Folder ini adalah **sumber kebenaran** untuk semua perubahan schema.

## Isi folder

```
database/
├── schema.sql      # struktur lengkap untuk instalasi baru
├── seed.sql        # contoh data (aman dijalankan berulang)
└── migrations/     # perubahan schema bertahap, berurutan nama
```

## Setup Awal (Project Baru)

1. Buka [Supabase Dashboard](https://supabase.com) - buat project baru
2. Buka **SQL Editor**
3. Copy seluruh isi `schema.sql` - paste - klik **Run**
4. Selesai. Semua tabel, RLS, function, dan admin default sudah terbuat.

## Project Lama (sudah ada datanya)

Jalankan migration yang belum dieksekusi, dari yang lama ke yang baru:

```sql
-- contoh: jalankan isi file migrations/20261111000000_tighten_rls_policies.sql
```

Atau lewat Supabase CLI dari folder `backend/`:

```bash
cd backend
npm run db:sync     # salin database/migrations ke supabase/migrations
supabase db push
```

## Peran Folder Database

| Tabel | Fungsi | Diakses oleh |
|---|---|---|
| `req_pending` | Master. Semua request kunjungan dari tamu | Backend (tulis), frontend (baca/real-time) |
| `req_acc` | Request yang diterima admin | Backend (tulis), frontend (baca/real-time) |
| `req_reject` | Request yang ditolak admin | Backend (tulis), frontend (baca/real-time) |
| `riwayat` | Arsip semua request yang sudah diproses | Backend (tulis), frontend (baca/real-time) |
| `admins` | Akun admin dengan password ter-hash (bcrypt) | Backend saja (lewat function `verify_admin`) |

Aturan akses (RLS):

- `anon` / `authenticated` hanya boleh **membaca** (dipakai real-time di frontend).
- Semua **tulis** dilakukan backend memakai service role key.
- Tabel `admins` tidak punya policy apa pun - hanya bisa diakses lewat
  function `verify_admin` (SECURITY DEFINER).

## Ganti Password Admin Default

Setelah login pertama, jalankan SQL ini di Supabase SQL Editor:

```sql
UPDATE public.admins
SET password_hash = crypt('PASSWORD_BARU', gen_salt('bf'))
WHERE username = 'admin';
```

## Tambah Admin Baru

```sql
INSERT INTO public.admins (username, email, password_hash, nama)
VALUES ('admin2', 'email@skanida.sch.id', crypt('password', gen_salt('bf')), 'Nama Admin');
```

## Menambah Kolom / Tabel Baru

1. Buat file baru di `migrations/` dengan format `YYYYMMDDHHMMSS_nama_perubahan.sql`
2. Tulis perintah SQL-nya (bisa dijalankan berulang dengan `IF NOT EXISTS`)
3. Jalankan file tersebut di Supabase SQL Editor
4. Update `schema.sql` agar instalasi baru tetap konsisten
