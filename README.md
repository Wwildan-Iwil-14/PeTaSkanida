# PeTa SKANIDA — Panduan Lengkap (Untuk Pemula)

Aplikasi web untuk mengelola **permintaan kunjungan tamu** ke SKANIDA (SMKN 2 Kota Magelang).

- **Tamu** mengisi form permintaan kunjungan lewat browser.
- **Admin** masuk ke dashboard untuk menyetujui / menolak permintaan dan melihat riwayat.

Panduan ini dibuat langkah demi langkah. Ikuti dari atas ke bawah. Tidak perlu pengalaman coding.

---

## Daftar Isi

1. [Gambaran Aplikasi](#1-gambaran-aplikasi)
2. [Yang Harus Disiapkan](#2-yang-harus-disiapkan)
3. [Ambil Kode dari GitHub](#3-ambil-kode-dari-github)
4. [Siapkan Database (Supabase)](#4-siapkan-database-supabase)
5. [Jalankan Backend](#5-jalankan-backend)
6. [Jalankan Frontend](#6-jalankan-frontend)
7. [Buka Aplikasi & Login](#7-buka-aplikasi--login)
8. [Menjalankan Ulang di Lain Hari](#8-menjalankan-ulang-di-lain-hari)
9. [Struktur Folder](#9-struktur-folder)
10. [Pemecahan Masalah (Troubleshooting)](#10-pemecahan-masalah-troubleshooting)
11. [Keamanan Penting](#11-keamanan-penting)
12. [Perintah Tambahan](#12-perintah-tambahan)

---

## 1. Gambaran Aplikasi

Aplikasi ini terdiri dari **3 bagian** yang harus saling terhubung:

```
Browser (Frontend)  --->  Server (Backend)  --->  Database (Supabase/PostgreSQL)
    tampilan web           pengolah data              tempat menyimpan data
```

- **Frontend** = tampilan yang dilihat pengguna (React + Vite).
- **Backend** = server kecil yang mengurus login admin dan penyimpanan data (Express).
- **Database** = tempat data disimpan di cloud (Supabase).

Ketiganya harus dijalankan/diatur supaya aplikasi berfungsi.

---

## 2. Yang Harus Disiapkan

| Kebutuhan | Keterangan |
|---|---|
| **Node.js versi 18 ke atas** | Untuk menjalankan backend & frontend. Unduh di <https://nodejs.org> (pilih LTS). |
| **Akun Supabase (gratis)** | Untuk database. Daftar di <https://supabase.com>. |
| **Git** (opsional) | Untuk mengunduh kode. Kalau tidak ada, bisa unduh ZIP. |
| **Browser modern** | Chrome, Edge, Firefox, Helium, dll. |
| **Terminal** | Windows: **PowerShell** atau **Command Prompt**. Mac/Linux: **Terminal**. |

Cek Node.js sudah terpasang — buka terminal, ketik:

```bash
node -v
npm -v
```

Jika muncul nomor versi (mis. `v18.x` atau lebih baru), berarti sudah siap.
Jika muncul "command not found", install Node.js dulu lalu **tutup dan buka ulang terminal**.

> **Tips terminal:** Ketik perintah lalu tekan **Enter**. Salin-tempel perintah satu per satu.

---

## 3. Ambil Kode dari GitHub

### Cara A — dengan Git (disarankan)

```bash
git clone https://github.com/massmoses25-maker/Peta-skanida.git
cd Peta-skanida
```

### Cara B — tanpa Git (unduh ZIP)

1. Buka halaman GitHub projek ini.
2. Klik tombol hijau **Code** → **Download ZIP**.
3. Ekstrak (unzip) file tersebut.
4. Buka terminal, masuk ke folder hasil ekstrak:

```bash
cd path/ke/folder/Peta-skanida
```

> Semua perintah di bawah dijalankan **dari dalam folder `Peta-skanida`**, kecuali disebutkan lain.

---

## 4. Siapkan Database (Supabase)

Database hanya perlu disiapkan **sekali**. Kalau kamu memakai database yang sudah ada, lewati ke [Langkah 5](#5-jalankan-backend).

### 4.1 Buat project Supabase

1. Masuk ke <https://supabase.com> dan login.
2. Klik **New Project**. Isi nama project, password database, dan pilih region terdekat (mis. Singapore).
3. Tunggu sampai project selesai dibuat (status **Active**).

### 4.2 Jalankan file SQL

1. Di dashboard project, buka menu **SQL Editor** (ikon di sidebar kiri).
2. Klik **New query**.
3. Buka file `database/schema.sql` di komputer, **salin seluruh isinya**.
4. Tempel ke kotak SQL Editor, lalu klik **Run** (atau tekan Ctrl+Enter).
5. Pastikan tidak ada error merah. Ini akan membuat semua tabel, aturan keamanan, dan akun admin default.

Data contoh (opsional, tidak wajib): jalankan juga isi `database/seed.sql` bila ingin data percobaan.

### 4.3 Ambil 3 nilai penting

Buka **Project Settings** (ikon gerigi) → **API** (atau **API Keys**). Catat:

| Nilai | Nama di dashboard | Dipakai di |
|---|---|---|
| **Project URL** | `Project URL` (bentuknya `https://xxxxx.supabase.co`) | Backend & Frontend |
| **Anon key** | `anon` / `public` | Frontend & Backend |
| **Service role key** | `service_role` / `secret` | **Hanya Backend** |

> ⚠️ **Service role key itu rahasia.** Jangan pernah menaruhnya di frontend atau membagikannya ke publik.

Penjelasan detail database ada di [`database/README.md`](database/README.md).

---

## 5. Jalankan Backend

### 5.1 Install kebutuhan backend

```bash
cd backend
npm install
```

Perintah `npm install` mengunduh semua "bahan" yang dibutuhkan backend. Butuh koneksi internet dan mungkin agak lama sekali saja.

### 5.2 Buat file pengaturan `.env`

File ini berisi "kunci" rahasia koneksi ke Supabase.

**Windows (PowerShell/CMD):**

```powershell
copy .env.example .env
```

**Mac/Linux:**

```bash
cp .env.example .env
```

### 5.3 Isi file `.env`

Buka file `backend/.env` dengan text editor (Notepad, VS Code, dll), lalu isi seperti ini:

```env
PORT=3001
SUPABASE_URL=https://PROJECT-URL-KAMU.supabase.co
SUPABASE_SERVICE_ROLE_KEY=TEMPEL-SERVICE-ROLE-KEY
SUPABASE_ANON_KEY=TEMPEL-ANON-KEY
AUTH_SECRET=ganti-dengan-kalimat-acak-panjang-bebas
TOKEN_TTL_SECONDS=28800
CORS_ORIGIN=http://localhost:5173
```

Cara mengisi:

- `SUPABASE_URL` → **Project URL** dari Langkah 4.3.
- `SUPABASE_SERVICE_ROLE_KEY` → **service_role key**.
- `SUPABASE_ANON_KEY` → **anon key**.
- `AUTH_SECRET` → tulis kalimat acak apa saja yang panjang (contoh: `rahasia-sekolah-skanida-2026-abc123xyz`).
- Sisanya biarkan seperti contoh.

> **Penting:** simpan file sebagai **UTF-8 (tanpa BOM)**. Jika muncul karakter aneh di awal file, hapus. Jangan menambahkan tanda kutip (`"`) di sekitar nilai.

### 5.4 Jalankan server backend

```bash
npm run dev
```

Jika berhasil, akan muncul tulisan seperti:

```
[backend] PeTa SKANIDA API berjalan di http://localhost:3001/api
```

Biarkan terminal ini **tetap terbuka**. Backend harus terus berjalan selama aplikasi dipakai.

### 5.5 Cek backend hidup

Buka browser dan akses: <http://localhost:3001/api/health>

Harus muncul: `{"status":"ok","service":"peta-skanida-backend"}`

Detail backend ada di [`backend/README.md`](backend/README.md).

---

## 6. Jalankan Frontend

Buka **terminal baru** (jangan menutup terminal backend), lalu dari folder utama `Peta-skanida`:

### 6.1 Install kebutuhan frontend

```bash
cd frontend
npm install
```

### 6.2 Buat file pengaturan `.env`

**Windows:**

```powershell
copy .env.example .env
```

**Mac/Linux:**

```bash
cp .env.example .env
```

### 6.3 Isi file `.env`

Buka `frontend/.env`, isi:

```env
VITE_API_BASE_URL=http://localhost:3001/api
VITE_SUPABASE_URL=https://PROJECT-URL-KAMU.supabase.co
VITE_SUPABASE_ANON_KEY=TEMPEL-ANON-KEY
```

- `VITE_API_BASE_URL` → alamat backend (biarkan default jika lokal).
- `VITE_SUPABASE_URL` → **Project URL**.
- `VITE_SUPABASE_ANON_KEY` → **anon key** (boleh dipakai di browser; **jangan** pakai service role key).

### 6.4 Jalankan frontend

```bash
npm run dev
```

Jika berhasil akan muncul alamat, misalnya:

```
➜  Local:   http://localhost:5173/
```

Detail frontend ada di [`frontend/README.md`](frontend/README.md).

---

## 7. Buka Aplikasi & Login

Buka browser ke: **<http://localhost:5173/>**

Halaman awal punya dua pilihan:

- **Tamu** → mengisi form permintaan kunjungan.
- **Admin / Pengelola** → login untuk mengelola permintaan.

### Akun admin default

| Username | Password |
|---|---|
| `admin` | `admin123` |

> 🔒 **Wajib ganti password** setelah login pertama. Caranya ada di [`database/README.md`](database/README.md) bagian "Ganti Password Admin".

---

## 8. Menjalankan Ulang di Lain Hari

Kamu **tidak perlu** mengulang langkah database dan `npm install` setiap hari.

### Cara mudah (satu terminal, dari folder utama)

```bash
npm run dev
```

Perintah ini menjalankan backend dan frontend sekaligus.

### Cara terpisah (dua terminal)

**Terminal 1 — backend:**

```bash
npm run dev:backend
```

**Terminal 2 — frontend:**

```bash
npm run dev:frontend
```

Setelah itu buka <http://localhost:5173/>.

> Jika baru pertama kali setelah clone, jalankan dulu `npm run install:all` untuk memasang kebutuhan frontend dan backend sekaligus.

---

## 9. Struktur Folder

```
Peta-skanida/
├── frontend/   # Tampilan aplikasi (React + Vite) — dibuka di browser
├── backend/    # Server API (Express) — pengolah data & login
├── database/   # File SQL untuk Supabase (schema, seed, migration)
├── scripts/    # Skrip bantu untuk menjalankan dev
└── README.md   # Panduan ini
```

| Folder | Penjelasan singkat | Panduan |
|---|---|---|
| `frontend/` | Yang dilihat pengguna di browser | [frontend/README.md](frontend/README.md) |
| `backend/` | Server yang menghubungkan tampilan ke database | [backend/README.md](backend/README.md) |
| `database/` | Struktur & aturan database (dijalankan di Supabase) | [database/README.md](database/README.md) |

---

## 10. Pemecahan Masalah (Troubleshooting)

| Gejala | Kemungkinan Penyebab | Solusi |
|---|---|---|
| `node: command not found` | Node.js belum terpasang | Install dari <https://nodejs.org>, buka ulang terminal |
| `npm install` gagal | Koneksi internet / cache rusak | Coba lagi; jika perlu `npm cache clean --force` lalu `npm install` |
| Backend: **"Konfigurasi backend belum lengkap"** | `backend/.env` belum diisi | Isi `SUPABASE_URL` dan key sesuai Langkah 5.3 |
| Backend: **"Invalid API key"** | Key salah / tertukar | Salin ulang anon & service_role key dengan benar |
| Frontend: **"Tidak dapat terhubung ke backend"** | Backend belum jalan / URL salah | Pastikan `npm run dev` backend aktif dan `VITE_API_BASE_URL` benar |
| Halaman frontend kosong / error Supabase | `frontend/.env` belum ada/benar | Buat & isi `frontend/.env` (Langkah 6.3), lalu restart `npm run dev` |
| Login admin gagal | Tabel `admins` belum dibuat / password salah | Pastikan `schema.sql` sudah dijalankan; coba `admin` / `admin123` |
| Data tidak muncul | `schema.sql` belum dijalankan | Jalankan ulang `database/schema.sql` di Supabase SQL Editor |
| Real-time tidak update | Realtime belum aktif | Jalankan migration `20261110000002_enable_realtime.sql` di Supabase |
| Port sudah dipakai (`EADDRINUSE`) | Ada proses lain di port 3001/5173 | Tutup aplikasi lain, atau ubah `PORT` di `backend/.env` |
| File `.env` error aneh di awal | File tersimpan dengan BOM | Simpan ulang sebagai UTF-8 tanpa BOM |

**Cara cepat memeriksa urutan yang benar:** Database sudah dijalankan di Supabase → Backend jalan (`:3001`) → Frontend jalan (`:5173`) → buka browser.

---

## 11. Keamanan Penting

- **Jangan pernah commit** file `.env` ke GitHub (sudah otomatis diabaikan oleh `.gitignore`).
- **Service role key** hanya untuk `backend/.env`. Jangan taruh di frontend.
- **Ganti password admin default** `admin123` segera setelah login pertama.
- Gunakan `AUTH_SECRET` yang panjang dan acak, jangan yang mudah ditebak.
- Untuk pemakaian publik, jalankan backend di server (bukan laptop) dan gunakan HTTPS.

---

## 12. Perintah Tambahan

Dijalankan dari folder utama `Peta-skanida`:

| Perintah | Fungsi |
|---|---|
| `npm run install:all` | Install kebutuhan frontend + backend sekaligus |
| `npm run dev` | Jalankan frontend & backend bersamaan |
| `npm run dev:backend` | Jalankan backend saja |
| `npm run dev:frontend` | Jalankan frontend saja |
| `npm run build` | Membuat versi produksi frontend (folder `frontend/dist`) |
| `npm run db:sync` | Menyalin file migration database ke folder backend |

### Daftar endpoint API (untuk pengembang)

| Method | Endpoint | Perlu login admin? |
|---|---|---|
| GET | `/api/health` | Tidak |
| POST | `/api/auth/login` | Tidak |
| GET | `/api/auth/me` | Ya |
| POST | `/api/requests` | Tidak (form tamu) |
| GET | `/api/requests` | Ya |
| POST | `/api/requests/:id/approve` | Ya |
| POST | `/api/requests/:id/reject` | Ya |

Endpoint yang perlu login memakai header: `Authorization: Bearer <token>`.

---

## Lisensi

PeTa SKANIDA — SMKN 2 Kota Magelang.
