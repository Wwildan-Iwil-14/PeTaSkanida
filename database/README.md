# PeTa SKANIDA — Database (Supabase)

Folder ini berisi semua file **SQL** untuk membuat dan mengubah database di **Supabase**.
Folder ini adalah **sumber kebenaran** (acuan utama) untuk struktur database.

> **Database itu apa?** Tempat menyimpan data (permintaan kunjungan, akun admin, riwayat). Di projek ini database memakai **Supabase**, layanan database online gratis.

---

## Daftar Isi

1. [File di Folder Ini](#1-file-di-folder-ini)
2. [Database Sudah Ada?](#2-database-sudah-ada)
3. [Membuat Database Baru (dari nol)](#3-membuat-database-baru-dari-nol)
4. [Tabel & Fungsinya](#4-tabel--fungsinya)
5. [Aturan Keamanan (RLS)](#5-aturan-keamanan-rls)
6. [Mengganti Password Admin](#6-mengganti-password-admin)
7. [Menambah Admin Baru](#7-menambah-admin-baru)
8. [Mengubah Struktur (Migration)](#8-mengubah-struktur-migration)
9. [Pemecahan Masalah](#9-pemecahan-masalah)

---

## 1. File di Folder Ini

```
database/
├── schema.sql      # Struktur LENGKAP untuk instalasi baru (jalankan ini dulu)
├── seed.sql        # Data contoh (opsional)
└── migrations/     # Perubahan struktur bertahap, diurutkan berdasarkan nama file
```

- **`schema.sql`** → jalankan sekali saat pertama kali membuat database.
- **`seed.sql`** → data contoh untuk uji coba (boleh dilewati).
- **`migrations/`** → file perubahan kecil (mis. menambah kolom). Untuk database yang sudah lama berjalan.

---

## 2. Database Sudah Ada?

- **Belum punya project Supabase?** Ikuti [bagian 3](#3-membuat-database-baru-dari-nol).
- **Sudah punya & `schema.sql` sudah pernah dijalankan?** Kamu hanya perlu mengecek apakah ada file baru di `migrations/` yang belum dijalankan. Lihat [bagian 8](#8-mengubah-struktur-migration).

---

## 3. Membuat Database Baru (dari nol)

### Langkah 1 — Buat project Supabase

1. Buka <https://supabase.com> dan login/daftar (gratis).
2. Klik **New Project**.
3. Isi:
   - **Name**: bebas, mis. `peta-skanida`
   - **Database Password**: buat password kuat (simpan!)
   - **Region**: pilih terdekat, mis. **Southeast Asia (Singapore)**
4. Klik **Create new project** dan tunggu sampai status **Active** (beberapa menit).

### Langkah 2 — Jalankan `schema.sql`

1. Di dashboard project, buka **SQL Editor** (sidebar kiri).
2. Klik **New query**.
3. Buka file `database/schema.sql` di komputer, **salin semua isinya**.
4. Tempel ke SQL Editor.
5. Klik **Run** (Ctrl+Enter).
6. Pastikan muncul pesan sukses, tanpa error merah.

Selesai. Semua tabel, aturan keamanan, fungsi login, real-time, dan akun admin default sudah terbuat.

### Langkah 3 — (Opsional) Isi data contoh

Ulangi cara di atas, tetapi salin isi `database/seed.sql`. Ini menambahkan beberapa contoh permintaan kunjungan untuk latihan. Aman dijalankan berulang.

### Langkah 4 — Ambil kunci untuk backend & frontend

Buka **Project Settings** (ikon gerigi) → **API** / **API Keys**. Catat:

| Nilai | Dipakai di mana |
|---|---|
| **Project URL** (`https://xxxxx.supabase.co`) | `backend/.env` dan `frontend/.env` |
| **anon / public key** | `backend/.env` dan `frontend/.env` |
| **service_role key** (rahasia) | **hanya** `backend/.env` |

> ⚠️ `service_role` key memberi akses penuh ke database. Jangan taruh di frontend atau bagikan ke publik.

Setelah itu lanjut ke panduan utama: [`../README.md`](../README.md).

---

## 4. Tabel & Fungsinya

| Tabel | Isi | Siapa yang mengakses |
|---|---|---|
| `req_pending` | Master — semua permintaan kunjungan yang masuk | Backend menulis; frontend membaca (real-time) |
| `req_acc` | Permintaan yang **diterima** admin | Backend menulis; frontend membaca |
| `req_reject` | Permintaan yang **ditolak** admin | Backend menulis; frontend membaca |
| `riwayat` | Arsip semua permintaan yang sudah diproses | Backend menulis; frontend membaca |
| `admins` | Akun admin (password di-hash bcrypt) | **Hanya** lewat fungsi `verify_admin` |

**Alur data:** tamu mengisi form → masuk `req_pending` → admin menerima (masuk `req_acc` + `riwayat`) atau menolak (masuk `req_reject` + `riwayat`). Data asli tetap ada di `req_pending`.

---

## 5. Aturan Keamanan (RLS)

RLS (Row Level Security) adalah "penjaga pintu" database. Aturannya:

- Pengunjung biasa (`anon`) hanya boleh **membaca** data. Ini dipakai frontend untuk update real-time.
- Semua **penulisan** (tambah permintaan, terima/tolak) dilakukan **backend** memakai *service role key*.
- Tabel `admins` **tidak punya** aturan akses langsung — hanya bisa dibaca lewat fungsi `verify_admin` yang aman.

Artinya, walaupun orang membuka kode frontend, mereka tidak bisa mengubah data langsung di database.

---

## 6. Mengganti Password Admin

Akun default adalah `admin` / `admin123`. **Ganti setelah login pertama.**

1. Buka **SQL Editor** di Supabase.
2. Jalankan SQL ini (ganti `PASSWORD_BARU`):

```sql
UPDATE public.admins
SET password_hash = crypt('PASSWORD_BARU', gen_salt('bf'))
WHERE username = 'admin';
```

3. Klik **Run**. Password langsung berubah.

> Password disimpan dalam bentuk hash (acak), bukan teks asli. Jadi aman.

---

## 7. Menambah Admin Baru

Jalankan di SQL Editor (ganti nilainya):

```sql
INSERT INTO public.admins (username, email, password_hash, nama)
VALUES ('admin2', 'email@skanida.sch.id', crypt('passwordku', gen_salt('bf')), 'Nama Admin 2');
```

Admin baru bisa langsung login memakai `admin2` / `passwordku`.

---

## 8. Mengubah Struktur (Migration)

Jika perlu menambah kolom/tabel baru:

### Langkah 1 — Buat file migration

Buat file baru di folder `migrations/` dengan nama berpola:

```
YYYYMMDDHHMMSS_deskripsi_perubahan.sql
```

Contoh: `20261201120000_tambah_kolom_instansi.sql`

### Langkah 2 — Tulis SQL-nya

Gunakan `IF NOT EXISTS` agar aman dijalankan berulang:

```sql
ALTER TABLE public.req_pending
  ADD COLUMN IF NOT EXISTS instansi text;
```

### Langkah 3 — Jalankan

- Salin isi file ke **SQL Editor** Supabase lalu **Run**, atau
- Lewat Supabase CLI (lihat di bawah).

### Langkah 4 — Perbarui `schema.sql`

Tambahkan perubahan yang sama ke `schema.sql` supaya instalasi baru tetap lengkap.

### Menjalankan lewat Supabase CLI (opsional)

```bash
# dari folder backend
npm run db:sync     # salin database/migrations -> backend/supabase/migrations
supabase db push    # kirim migration ke Supabase (butuh Supabase CLI terpasang & login)
```

> Jika belum punya Supabase CLI, cara termudah adalah menyalin SQL ke **SQL Editor** secara manual.

---

## 9. Pemecahan Masalah

| Gejala | Penyebab | Solusi |
|---|---|---|
| Error saat Run `schema.sql`: "already exists" | Objek sudah ada | Wajar pada sebagian perintah; `schema.sql` memakai `IF NOT EXISTS` untuk tabel |
| Error `relation "supabase_realtime" does not exist` | Publication realtime belum ada | Abaikan/buat lewat menu **Database → Replication**, atau jalankan migration realtime setelah project aktif |
| Login admin selalu gagal | Tabel `admins` kosong | Jalankan bagian DEFAULT ADMIN di `schema.sql`, atau tambah admin (bagian 7) |
| Frontend error "Invalid API key" | Key salah | Ambil ulang anon key dari Project Settings → API |
| Backend tidak bisa menulis data | Memakai anon key, bukan service role | Isi `SUPABASE_SERVICE_ROLE_KEY` di `backend/.env` |
| Data real-time tidak update | Realtime belum aktif | Jalankan `migrations/20261110000002_enable_realtime.sql` |

---

## Lisensi

PeTa SKANIDA — SMKN 2 Kota Magelang.
