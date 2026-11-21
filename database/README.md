# PeTa SKANIDA — Database (Supabase)

Folder ini berisi semua file **SQL** untuk membuat dan mengubah database di **Supabase**. Folder ini adalah **sumber kebenaran** (acuan utama) struktur data aplikasi.

> **Tujuan aplikasi:** mempermudah pendataan tamu yang berkunjung ke **SMKN 2 Kota Magelang**. Database menyimpan setiap permintaan kunjungan, statusnya, akun admin, log scan, dan langganan notifikasi — sehingga data tamu tidak lagi dicatat manual di buku tamu.

> **Database itu apa?** Tempat menyimpan data, misalnya permintaan kunjungan, akun admin, dan riwayat. Di proyek ini memakai **Supabase** (PostgreSQL online).

---

## Daftar Isi

1. [File di Folder Ini](#1-file-di-folder-ini)
2. [Database Sudah Ada?](#2-database-sudah-ada)
3. [Membuat Database Baru (dari nol)](#3-membuat-database-baru-dari-nol)
4. [Tabel & Fungsinya](#4-tabel--fungsinya)
5. [Alur Data Kunjungan](#5-alur-data-kunjungan)
6. [Aturan Keamanan (RLS)](#6-aturan-keamanan-rls)
7. [Migration yang Pernah Ditambahkan](#7-migration-yang-pernah-ditambahkan)
8. [Mengganti Password Admin](#8-mengganti-password-admin)
9. [Menambah Admin Baru](#9-menambah-admin-baru)
10. [Mengubah Struktur (Migration Baru)](#10-mengubah-struktur-migration-baru)
11. [Pemecahan Masalah](#11-pemecahan-masalah)
12. [Lisensi](#12-lisensi)

---

## 1. File di Folder Ini

```
database/
├── schema.sql      # Struktur LENGKAP untuk instalasi baru (jalankan ini dulu)
├── seed.sql        # Data contoh (opsional)
└── migrations/     # Perubahan struktur bertahap, diurutkan berdasarkan nama file
```

- **`schema.sql`** → dijalankan sekali saat pertama kali membuat database.
- **`seed.sql`** → data contoh untuk latihan (boleh dilewati).
- **`migrations/`** → perubahan kecil untuk database yang sudah berjalan (misalnya menambah kolom/tabel).

---

## 2. Database Sudah Ada?

- **Belum punya project Supabase?** Ikuti [bagian 3](#3-membuat-database-baru-dari-nol).
- **Sudah punya dan `schema.sql` pernah dijalankan?** Cek apakah ada file di `migrations/` yang belum dijalankan — lihat [bagian 7](#7-migration-yang-pernah-ditambahkan).

---

## 3. Membuat Database Baru (dari nol)

### Langkah 1 — Buat project Supabase

1. Buka <https://supabase.com>, login atau daftar (gratis).
2. Klik **New Project**.
3. Isi **Name** (mis. `peta-skanida`), **Database Password** (simpan baik-baik), dan pilih region terdekat (misalnya Southeast Asia / Singapore).
4. Klik **Create new project** dan tunggu status **Active**.

### Langkah 2 — Jalankan `schema.sql`

1. Di dashboard project, buka **SQL Editor** → **New query**.
2. Salin seluruh isi `database/schema.sql`, tempel ke editor.
3. Klik **Run** (Ctrl+Enter).
4. Pastikan tidak ada error merah.

Perintah ini membuat semua tabel, aturan keamanan (RLS), realtime, dan bucket-related column. **Akun admin tidak dibuat lewat SQL** — buat lewat skrip backend, lihat [bagian 9](#9-menambah-admin-baru).

### Langkah 3 — (Opsional) Isi data contoh

Ulangi cara yang sama dengan `database/seed.sql` untuk contoh permintaan kunjungan. Aman dijalankan berulang.

### Langkah 4 — Ambil kunci untuk backend & frontend

Buka **Project Settings** → **API / API Keys**. Catat:

| Nilai | Dipakai di mana |
|---|---|
| **Project URL** (`https://xxxxx.supabase.co`) | `backend/.env` dan `frontend/.env` |
| **anon / public key** | `backend/.env` dan `frontend/.env` |
| **service_role key** (rahasia) | **hanya** `backend/.env` |

> ⚠️ `service_role` memberi akses penuh ke database. Jangan taruh di frontend atau bagikan ke publik.

Setelah itu lanjut ke panduan utama: [`../README.md`](../README.md).

---

## 4. Tabel & Fungsinya

| Tabel | Isi | Siapa mengakses |
|---|---|---|
| `req_pending` | Tabel master: semua permintaan kunjungan masuk ke sini. Menyimpan penanda `dihubungi` dan tautan surat tugas | Backend menulis; frontend membaca (real-time) |
| `req_acc` | Permintaan **diterima** dan masih aktif (belum selesai) | Backend menulis; frontend membaca |
| `req_reject` | Permintaan yang **ditolak** | Backend menulis; frontend membaca |
| `riwayat` | Arsip kunjungan **selesai** + permintaan ditolak | Backend menulis; frontend membaca |
| `admins` | Profil admin (nama, role, fitur), terhubung ke `auth.users` | Backend (service role); login lewat Supabase Auth |
| `scan_logs` | Log scan QR/barcode tamu oleh petugas, untuk notifikasi real-time admin | Backend menulis; frontend membaca |
| `push_subscriptions` | Perangkat admin yang berlangganan notifikasi browser (endpoint + kunci enkripsi) | **Hanya backend** (service role) |

Catatan penting:

- `req_acc`, `req_reject`, dan `riwayat` memiliki **foreign key ke `req_pending.id` dengan `ON DELETE CASCADE`**. Menghapus data di `req_pending` otomatis menghapus baris terkait.
- Tabel `scan_logs` **sengaja tidak menyimpan data pribadi**; detail tamu diambil lewat backend yang wajib login.
- Tabel `push_subscriptions` **tidak menyimpan isi pesan**, hanya langganan perangkat — jadi notifikasi tidak menambah storage database.

---

## 5. Alur Data Kunjungan

```
Tamu isi form
   ↓  (INSERT)
req_pending  ── status: Pending
   ↓  admin setujui                 ↓  admin tolak
req_acc                        req_reject + riwayat
   ↓  admin klik "Selesai"
riwayat  (baris di req_acc dihapus)
```

Data asli tetap tersimpan di `req_pending`. Status di dashboard dihitung dari keberadaan baris di tabel-tabel tersebut:

- ada di `req_acc` → **Diterima**
- ada di `req_reject` → **Ditolak**
- ada di `riwayat` → **Selesai**
- tidak ada di ketiganya → **Pending**

---

## 6. Aturan Keamanan (RLS)

RLS (Row Level Security) adalah "penjaga pintu" database:

- Pengunjung (`anon`) hanya boleh **membaca** tabel request. Ini dipakai frontend untuk update real-time.
- Semua **penulisan** (tambah request, approve/reject, hapus) dilakukan **backend** dengan *service role key*.
- Tabel `admins`: `anon` dilarang mengakses. Admin yang login hanya bisa membaca profilnya sendiri (`auth.uid() = user_id`).
- Tabel `push_subscriptions`: **tanpa policy untuk anon/authenticated** — frontend tidak pernah mengakses langsung, semua lewat backend.

Artinya, walaupun orang membuka kode frontend, mereka tidak bisa mengubah data langsung di database.

---

## 7. Migration yang Pernah Ditambahkan

Jalankan file yang **belum pernah** dijalankan di SQL Editor (urutan berdasarkan nama file):

| File | Fungsi |
|---|---|
| `20261110000000_add_waktu_jumlah_columns.sql` | Menambah kolom jam & jumlah tamu |
| `20261110000001_create_admins_table.sql` | Tabel profil admin |
| `20261110000002_enable_realtime.sql` | Mengaktifkan Supabase Realtime |
| `20261111000000_tighten_rls_policies.sql` | Memperketat aturan RLS |
| `20261112000000_link_admins_to_auth_users.sql` | Menghubungkan admin ke Supabase Auth |
| `20261116000000_add_dihubungi_column.sql` | Penanda tamu sudah dihubungi |
| `20261120000000_add_surat_tugas_columns.sql` | Tautan surat tugas tamu |
| `20261120000001_create_scan_logs.sql` | Tabel log scan QR/barcode |
| `20261120000002_add_features_role.sql` | Pembagian fitur per akun |
| **`20261121000000_create_push_subscriptions.sql`** | **Tabel langganan notifikasi browser** |

> Untuk notifikasi browser, migration terakhir **wajib** dijalankan. Tanpa itu, backend akan menampilkan error `Could not find the table 'public.push_subscriptions'`.

---

## 8. Mengganti Password Admin

Autentikasi admin dikelola **Supabase Auth**, bukan tabel SQL publik.

### Cara 1 — Skrip CLI (paling cepat)

```bash
npm run admin:create -- admin@skanida.sch.id PASSWORD_BARU "Administrator"
```

Skrip mendeteksi akun yang sudah ada dan memperbarui passwordnya.

### Cara 2 — Dashboard Supabase

**Authentication → Users** → cari email admin → menu titik tiga (`...`) → **Reset Password**.

---

## 9. Menambah Admin Baru

```bash
npm run admin:create -- email.admin@skanida.sch.id password123 "Nama Admin Baru" admin
```

Skrip otomatis:

1. Mendaftarkan akun di Supabase Auth (`auth.users`) dengan status langsung terverifikasi.
2. Membuat baris profil di `public.admins` yang terhubung ke `user_id`.

Role yang tersedia: `petugas`, `admin`, `super_admin`. Buat minimal satu `super_admin` agar menu Pengguna & Database bisa diakses.

---

## 10. Mengubah Struktur (Migration Baru)

### Langkah 1 — Buat file

Buat file di `migrations/` dengan pola nama:

```
YYYYMMDDHHMMSS_deskripsi_perubahan.sql
```

Contoh: `20261201120000_tambah_kolom_instansi.sql`

### Langkah 2 — Tulis SQL aman

Gunakan `IF NOT EXISTS` agar bisa dijalankan berulang:

```sql
ALTER TABLE public.req_pending
  ADD COLUMN IF NOT EXISTS instansi text;
```

### Langkah 3 — Jalankan

Salin ke **SQL Editor** Supabase lalu **Run**, atau lewat CLI:

```bash
cd backend
npm run db:sync     # salin migration ke backend/supabase/migrations
supabase db push    # butuh Supabase CLI terpasang & login
```

### Langkah 4 — Perbarui `schema.sql`

Tambahkan perubahan yang sama ke `schema.sql` supaya instalasi baru tetap lengkap.

---

## 11. Pemecahan Masalah

| Gejala | Penyebab | Solusi |
|---|---|---|
| Error "already exists" saat `schema.sql` | Objek sudah ada | Wajar; sebagian perintah memakai `IF NOT EXISTS` |
| `relation "supabase_realtime" does not exist` | Publication realtime belum ada | Jalankan migration realtime setelah project aktif |
| Login admin selalu gagal | Profil admin belum dibuat | Jalankan `npm run admin:create` (bagian 9) |
| Frontend error "Invalid API key" | Anon key salah | Ambil ulang di Project Settings → API |
| Backend tidak bisa menulis data | Memakai anon key | Isi `SUPABASE_SERVICE_ROLE_KEY` di `backend/.env` |
| Data real-time tidak update | Realtime belum aktif | Jalankan `20261110000002_enable_realtime.sql` |
| `Could not find the table 'public.push_subscriptions'` | Migration notifikasi belum dijalankan | Jalankan `20261121000000_create_push_subscriptions.sql` |
| Riwayat/scan kosong padahal data ada | Baris dihapus dari tabel bayangan | Cek foreign key `ON DELETE CASCADE` di `req_pending` |

---

## 12. Lisensi

PeTa SKANIDA — SMKN 2 Kota Magelang. Dibangun untuk mempermudah pendataan kunjungan tamu sekolah.
