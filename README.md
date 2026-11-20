# PeTa SKANIDA — Panduan Lengkap (Untuk Pemula)

Aplikasi web untuk mengelola **permintaan kunjungan tamu** ke SKANIDA (SMKN 2 Kota Magelang).

- **Tamu** mengisi form permintaan kunjungan lewat browser.
- **Admin** masuk ke dashboard untuk menyetujui atau menolak permintaan dan melihat riwayatnya.

Panduan ini disusun langkah demi langkah. Ikuti urut dari atas ke bawah. Tidak butuh pengalaman coding.

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

Aplikasi ini terdiri dari **3 bagian** yang saling terhubung:

```
Browser (Frontend)  --->  Server (Backend)  --->  Database (Supabase/PostgreSQL)
     tampilan web           pengolah data              tempat menyimpan data
```

- **Frontend** = tampilan yang dilihat pengguna (dibuat dengan React + Vite).
- **Backend** = server kecil yang mengurus login admin dan penyimpanan data (dibuat dengan Express).
- **Database** = tempat data disimpan di cloud (memakai Supabase).

Ketiganya harus diatur dan dijalankan supaya aplikasi bisa berfungsi.

---

## 2. Yang Harus Disiapkan

| Kebutuhan | Keterangan |
|---|---|
| **Node.js versi 18 ke atas** | Untuk menjalankan backend dan frontend. Unduh di <https://nodejs.org>, pilih versi **LTS**. |
| **Akun Supabase (gratis)** | Untuk database. Daftar di <https://supabase.com>. |
| **Git** (opsional) | Untuk mengunduh kode. Jika tidak ada Git, kode bisa diunduh sebagai file ZIP. |
| **Browser modern** | Chrome, Edge, Firefox, dan sejenisnya. |
| **Terminal** | Windows: **PowerShell** atau **Command Prompt**. Mac/Linux: **Terminal**. |

Cek apakah Node.js sudah terpasang. Buka terminal, lalu ketik:

```bash
node -v
npm -v
```

Jika muncul nomor versi (misalnya `v18.x` atau lebih baru), berarti Node.js sudah siap.
Jika muncul pesan "command not found", pasang Node.js terlebih dahulu, lalu **tutup dan buka lagi terminal**.

> **Tips memakai terminal:** ketik perintah, lalu tekan **Enter**. Salin dan tempel perintah satu per satu.

---

## 3. Ambil Kode dari GitHub

### Cara A — dengan Git (disarankan)

```bash
git clone https://github.com/massmoses25-maker/Peta-skanida.git
cd Peta-skanida
```

### Cara B — tanpa Git (unduh ZIP)

1. Buka halaman GitHub projek ini.
2. Klik tombol hijau **Code**, lalu klik **Download ZIP**.
3. Ekstrak (unzip) file yang sudah diunduh.
4. Buka terminal, lalu masuk ke folder hasil ekstrak:

```bash
cd path/ke/folder/Peta-skanida
```

> Semua perintah di bawah dijalankan **dari dalam folder `Peta-skanida`**, kecuali jika ada keterangan lain.

---

## 4. Siapkan Database (Supabase)

Database hanya perlu disiapkan **sekali**. Jika kamu memakai database yang sudah ada, langsung lanjut ke [Langkah 5](#5-jalankan-backend).

### 4.1 Buat project Supabase

1. Masuk ke <https://supabase.com>, lalu login.
2. Klik **New Project**. Isi nama project, password database, dan pilih region terdekat (misalnya Singapore).
3. Tunggu sampai project selesai dibuat (statusnya harus **Active**).

### 4.2 Jalankan file SQL

1. Di dashboard project, buka menu **SQL Editor** di sidebar kiri.
2. Klik **New query**.
3. Buka file `database/schema.sql` di komputer, lalu **salin seluruh isinya**.
4. Tempel ke kotak SQL Editor, lalu klik **Run** (atau tekan Ctrl+Enter).
5. Pastikan tidak ada error berwarna merah. Perintah ini membuat semua tabel, aturan keamanan, dan akun admin default.

Data contoh (opsional): jalankan juga isi `database/seed.sql` jika ingin data percobaan.

### 4.3 Ambil 3 nilai penting

Buka **Project Settings** (ikon gerigi), lalu pilih **API** (atau **API Keys**). Catat:

| Nilai | Nama di dashboard | Dipakai di |
|---|---|---|
| **Project URL** | `Project URL` (bentuknya `https://xxxxx.supabase.co`) | Backend & Frontend |
| **Anon key** | `anon` / `public` | Frontend & Backend |
| **Service role key** | `service_role` / `secret` | **Hanya Backend** |

> ⚠️ **Service role key adalah kunci rahasia.** Jangan pernah menaruhnya di frontend atau membagikannya ke publik.

Penjelasan detail tentang database ada di [`database/README.md`](database/README.md).

---

## 5. Jalankan Backend

### 5.1 Install kebutuhan backend

```bash
cd backend
npm install
```

Perintah `npm install` mengunduh semua library yang dibutuhkan backend. Butuh koneksi internet, dan cukup dijalankan sekali.

### 5.2 Buat file pengaturan `.env`

File ini berisi kunci rahasia untuk koneksi ke Supabase.

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
CORS_ORIGIN=http://localhost:5173
```

Cara mengisinya:

- `SUPABASE_URL` → **Project URL** dari Langkah 4.3.
- `SUPABASE_SERVICE_ROLE_KEY` → **service_role key**.
- `SUPABASE_ANON_KEY` → **anon key**.
- Sisanya biarkan seperti contoh.

> **Catatan:** autentikasi admin memakai **Supabase Auth (schema auth / GoTrue)**. Variabel `AUTH_SECRET` dan `TOKEN_TTL_SECONDS` tidak dipakai lagi.
>
> **Penting:** simpan file sebagai **UTF-8 (tanpa BOM)**. Jika muncul karakter aneh di awal file, hapus. Jangan menambahkan tanda kutip (`"`) di sekitar nilai.

### 5.4 Buat akun admin (Supabase Auth)

Jalankan perintah berikut untuk membuat akun admin di Supabase Auth sekaligus membuat profilnya di tabel database:

```bash
npm run admin:create -- admin@skanida.sch.id admin123 "Administrator"
```

*(Kamu boleh mengganti `admin123` dengan password yang kamu inginkan.)*

### 5.5 Jalankan server backend

```bash
npm run dev
```

Jika berhasil, akan muncul tulisan seperti ini:

```
[backend] PeTa SKANIDA API berjalan di http://localhost:3001/api
```

Biarkan terminal ini **tetap terbuka**. Backend harus terus berjalan selama aplikasi dipakai.

### 5.6 Cek backend hidup

Buka browser, lalu akses: <http://localhost:3001/api/health>

Yang muncul harus: `{"status":"ok","service":"peta-skanida-backend"}`

Detail tentang backend ada di [`backend/README.md`](backend/README.md).

---

## 6. Jalankan Frontend

Buka **terminal baru** (jangan tutup terminal backend), lalu dari folder utama `Peta-skanida`:

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

Buka `frontend/.env`, lalu isi:

```env
VITE_API_BASE_URL=http://localhost:3001/api
VITE_SUPABASE_URL=https://PROJECT-URL-KAMU.supabase.co
VITE_SUPABASE_ANON_KEY=TEMPEL-ANON-KEY
```

Penjelasan:

- `VITE_API_BASE_URL` → alamat backend. Biarkan default jika dipakai di komputer sendiri.
- `VITE_SUPABASE_URL` → **Project URL**.
- `VITE_SUPABASE_ANON_KEY` → **anon key** (boleh dipakai di browser; **jangan** memakai service role key).

### 6.4 Jalankan frontend

```bash
npm run dev
```

Jika berhasil, akan muncul alamat seperti ini:

```
➜  Local:   http://localhost:5173/
```

Detail tentang frontend ada di [`frontend/README.md`](frontend/README.md).

---

## 7. Buka Aplikasi & Login

Buka browser ke: **<http://localhost:5173/>**

Halaman awal menyediakan dua pilihan:

- **Tamu** → mengisi form permintaan kunjungan.
- **Admin / Pengelola** → login untuk mengelola permintaan.

### Akun admin

Login admin menggunakan **email** dan **password** yang dibuat di Langkah 5.4:

| Email | Password |
|---|---|
| `admin@skanida.sch.id` | `admin123` *(atau password yang kamu buat)* |

> 🔒 **Ganti password:** kamu bisa mengganti password kapan saja lewat `npm run admin:create -- admin@skanida.sch.id PASSWORD_BARU "Administrator"`, atau lewat Supabase Dashboard (**Authentication > Users**).

---

## 8. Menjalankan Ulang di Lain Hari

Kamu **tidak perlu** mengulang langkah database dan `npm install` setiap hari — asalkan folder `node_modules` belum dihapus.

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

> Jika ini pertama kali dijalankan setelah clone, jalankan dulu `npm run install:all` untuk memasang kebutuhan frontend dan backend sekaligus.

---

## 9. Struktur Folder

```
Peta-skanida/
├── frontend/   # Tampilan aplikasi (React + Vite) — dibuka di browser
├── backend/    # Server API (Express) — pengolah data & login
├── database/   # File SQL untuk Supabase (schema, seed, migration)
├── scripts/    # Skrip bantu untuk menjalankan mode dev
└── README.md   # Panduan ini
```

| Folder | Penjelasan singkat | Panduan |
|---|---|---|
| `frontend/` | Yang dilihat pengguna di browser | [frontend/README.md](frontend/README.md) |
| `backend/` | Server yang menghubungkan tampilan ke database | [backend/README.md](backend/README.md) |
| `database/` | Struktur & aturan database (dijalankan di Supabase) | [database/README.md](database/README.md) |

> **Tentang `node_modules`:** folder `node_modules` (di root, `frontend/`, dan `backend/`) **bukan kode program** dan tidak disimpan di Git. Isinya library yang diunduh otomatis oleh npm dari `package.json` dan `package-lock.json`.
>
> - **Aman dihapus kapan saja** untuk menghemat ruang atau membersihkan instalasi yang rusak.
> - Setelah dihapus, jalankan `npm run install:all` dari folder utama sebelum menjalankan aplikasi.
> - **Jangan menyalin** folder `node_modules` dari komputer lain, apalagi beda sistem operasi — bisa muncul error seperti `Cannot find module @rollup/rollup-linux-x64-gnu` atau `You installed esbuild for another platform`.
> - Folder ini sudah otomatis diabaikan `.gitignore`, jadi tidak akan ikut ter-commit.

---

## 10. Pemecahan Masalah (Troubleshooting)

| Gejala | Kemungkinan Penyebab | Solusi |
|---|---|---|
| `node: command not found` | Node.js belum terpasang | Pasang dari <https://nodejs.org>, lalu buka ulang terminal |
| `npm install` gagal | Koneksi internet bermasalah / cache rusak | Coba lagi; jika perlu jalankan `npm cache clean --force` lalu `npm install` |
| Error `Cannot find module @rollup/...` / `installed esbuild for another platform` | Folder `node_modules` disalin dari komputer/OS lain | Hapus semua `node_modules` (root, `frontend/`, `backend/`), lalu jalankan `npm run install:all` |
| Aplikasi tidak jalan setelah `node_modules` dihapus | Library belum dipasang ulang | Jalankan `npm run install:all` |
| Backend: **"Konfigurasi backend belum lengkap"** | `backend/.env` belum diisi | Isi `SUPABASE_URL` dan key sesuai Langkah 5.3 |
| Backend: **"Invalid API key"** | Key salah atau tertukar | Salin ulang anon & service_role key dengan benar |
| Frontend: **"Tidak dapat terhubung ke backend"** | Backend belum jalan / URL salah | Pastikan backend aktif (`npm run dev`) dan `VITE_API_BASE_URL` benar |
| Halaman frontend kosong / error Supabase | `frontend/.env` belum ada atau salah isi | Buat dan isi `frontend/.env` (Langkah 6.3), lalu restart `npm run dev` |
| Login admin gagal | Akun admin belum dibuat / email atau password salah | Buat atau reset akun lewat `npm run admin:create -- admin@skanida.sch.id password` |
| Data tidak muncul | `schema.sql` belum dijalankan | Jalankan ulang `database/schema.sql` di Supabase SQL Editor |
| Real-time tidak update | Realtime belum aktif | Jalankan migration `20261110000002_enable_realtime.sql` di Supabase |
| Port sudah dipakai (`EADDRINUSE`) | Ada proses lain di port 3001/5173 | Tutup aplikasi lain, atau ubah `PORT` di `backend/.env` |
| File `.env` muncul aneh di awal | File tersimpan dengan BOM | Simpan ulang sebagai UTF-8 tanpa BOM |

**Cara cepat memeriksa urutan yang benar:** Database sudah dijalankan di Supabase → Backend jalan (`:3001`) → Frontend jalan (`:5173`) → buka browser.

---

## 11. Keamanan Penting

- **Jangan pernah commit** file `.env` ke GitHub (sudah otomatis diabaikan oleh `.gitignore`).
- **Service role key** hanya boleh ada di `backend/.env`. Jangan taruh di frontend.
- **Password admin dikelola oleh Supabase Auth** (schema auth) dengan hash standar industri.
- **Segera ganti password admin default** setelah akun dibuat.
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
| `npm run admin:create -- <email> <pwd> [nama]` | Buat atau perbarui akun admin di Supabase Auth & profil database |

> Setelah folder `node_modules` dihapus, jalankan `npm run install:all` terlebih dahulu sebelum `npm run dev`.

### Daftar endpoint API (untuk pengembang)

| Method | Endpoint | Perlu login admin? | Keterangan |
|---|---|---|---|
| GET | `/` | Tidak | Info bahwa backend berjalan (bukan tampilan aplikasi) |
| GET | `/api/health` | Tidak | Cek server hidup |
| POST | `/api/auth/login` | Tidak | Login admin (email + password) → access & refresh token |
| POST | `/api/auth/refresh` | Tidak | Tukar refresh token dengan access token baru |
| POST | `/api/auth/logout` | Opsional | Cabut sesi admin di Supabase Auth |
| GET | `/api/auth/me` | Ya | Cek profil admin dari token aktif |
| POST | `/api/requests` | Tidak | Form pengajuan tamu |
| GET | `/api/requests` | Ya | Ambil seluruh data request |
| POST | `/api/requests/:id/approve` | Ya | Setujui permohonan |
| POST | `/api/requests/:id/reject` | Ya | Tolak permohonan |
| POST | `/api/requests/:id/complete` | Ya | Tandai selesai → pindah ke Riwayat Kunjungan |
| PATCH | `/api/requests/:id/contacted` | Ya | Tandai tamu sudah/belum dihubungi (`{ "dihubungi": true }`) |
| POST | `/api/requests/admin` | Ya | Tambah tamu oleh admin (bisa langsung berstatus Diterima/Ditolak/Selesai) |
| PATCH | `/api/requests/:id` | Ya | Edit data tamu |
| DELETE | `/api/requests/:id` | Ya | Hapus tamu beserta data terkait |
| POST | `/api/history` | Ya | Tambah entri riwayat |
| PATCH | `/api/history/:id` | Ya | Edit entri riwayat |
| DELETE | `/api/history/:id` | Ya | Hapus entri riwayat |
| GET | `/api/admin/users` | Ya | Daftar akun admin/petugas |
| POST | `/api/admin/users` | Ya | Tambah admin/petugas |
| PATCH | `/api/admin/users/:id` | Ya | Edit admin/petugas (nama, email, password, role) |
| DELETE | `/api/admin/users/:id` | Ya | Hapus admin/petugas (tidak bisa menghapus diri sendiri) |

Endpoint yang perlu login memakai header: `Authorization: Bearer <token>`.

### Fitur kelola admin

Menu **Pengguna** dipakai untuk menambah, mengedit, dan menghapus akun admin/petugas. Menu **Kelola Tamu** menyediakan tambah, edit, hapus, dan tombol **Selesai** untuk memindahkan tamu ke **Riwayat Kunjungan**. Menu **Riwayat Kunjungan** juga menyediakan tambah, edit, dan hapus arsip kunjungan.

### Upload Surat Tugas (opsional)

Form tamu punya kolom **Surat Tugas** yang **tidak wajib diisi**. Jika diisi, file PDF (maks. 4 MB) diunggah ke folder **`doc_kunjungan`** di Google Drive akun **rubikesper@gmail.com**, dan tautannya bisa dibuka admin dari tabel request.

Karena Drive itu akun personal, upload memakai **service account**:

1. Di Google Cloud Console, aktifkan **Google Drive API** dan buat **service account**.
2. Di Drive `rubikesper@gmail.com`, buat folder `doc_kunjungan` lalu **Share** ke email service account sebagai **Editor**.
3. Isi `backend/.env` (contoh ada di `backend/.env.example`):

   ```env
   GOOGLE_SERVICE_ACCOUNT_EMAIL=xxx@xxx.iam.gserviceaccount.com
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   GOOGLE_DRIVE_FOLDER_NAME=doc_kunjungan
   # Email tujuan dokumen (sementara). Nanti ganti ke email sekolah di sini:
   SURAT_TUGAS_EMAIL=rubikesper@gmail.com
   ```

   `SURAT_TUGAS_EMAIL` adalah alamat tujuan yang dicatat pada berkas dan ditampilkan ke tamu. Nilainya **sementara** `rubikesper@gmail.com`; cukup ubah di `.env` lalu restart backend saat email sekolah sudah tersedia — tidak perlu mengubah kode.

4. Jalankan migration `database/migrations/20261120000000_add_surat_tugas_columns.sql` di Supabase SQL Editor, lalu restart backend.

Sebelum kredensial diisi, form tetap bisa dipakai **tanpa** file. Jika ada file tanpa kredensial, muncul pesan "Upload surat tugas belum tersedia". Jika migration belum dijalankan, request tetap terkirim dan tautan tetap ditampilkan ke tamu, tetapi belum tersimpan di database.

---

## Lisensi

PeTa SKANIDA — SMKN 2 Kota Magelang.
