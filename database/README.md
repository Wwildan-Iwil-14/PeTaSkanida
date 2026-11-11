# PETA SKANIDA - Database

Folder ini berisi skema dan migration database untuk Supabase.

## Setup Awal (Project Baru)

1. Buka [Supabase Dashboard](https://supabase.com) → buat project baru
2. Buka **SQL Editor**
3. Copy seluruh isi `schema.sql` → paste → klik **Run**
4. Selesai. Semua tabel, RLS, function, dan admin default sudah terbuat.

## Setelah Setup

Salin `schema.sql` sebagai referensi. Semua perubahan ke database dilakukan lewat file migration di folder `migrations/`.

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

## Struktur Tabel

| Tabel | Fungsi |
|-------|--------|
| `req_pending` | Master. Semua request kunjungan dari tamu |
| `req_acc` | Request yang diterima admin |
| `req_reject` | Request yang ditolak admin |
| `riwayat` | Arsip semua request yang sudah diproses |
| `admins` | Akun admin dengan password ter-hash (bcrypt) |
