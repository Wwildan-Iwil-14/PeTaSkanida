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
13. [Fitur Scan QR & Barcode (HP → Laptop Admin)](#13-fitur-scan-qr-hp--notifikasi-di-laptop-admin)
14. [Notifikasi WhatsApp ke Admin (Fonnte)](#14-notifikasi-whatsapp-ke-admin-fonnte)
15. [Notifikasi Browser & Ekspor Riwayat](#15-notifikasi-browser--ekspor-riwayat)

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

### 5.4 Buat akun super admin (Supabase Auth)

Jalankan perintah berikut untuk membuat akun di Supabase Auth sekaligus membuat profilnya di tabel database:

```bash
npm run admin:create -- admin@skanida.sch.id admin123 "Administrator" super_admin
```

*(Kamu boleh mengganti `admin123` dengan password yang kamu inginkan. Role yang tersedia: `petugas`, `admin`, `super_admin`. Buat minimal satu `super_admin` agar menu Pengguna dan Database bisa diakses.)*

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
| `npm run admin:create -- <email> <pwd> [nama] [role]` | Buat atau perbarui akun di Supabase Auth & profil database (role: petugas / admin / super_admin) |

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

Form tamu punya kolom **Surat Tugas** yang **tidak wajib diisi**. Jika diisi, file PDF (maks. 4 MB) diunggah ke bucket Supabase Storage **`surat-tugas`**, dan tautannya bisa dibuka admin dari tabel request untuk dicetak.

Kenapa Supabase Storage (bukan Google Drive): service account Google tidak punya kuota Drive pribadi, sedangkan OAuth Google untuk akun personal sekarang mewajibkan privacy policy URL publik untuk bisa di-publish. Supabase sudah dipakai proyek ini, jadi tidak ada kredensial tambahan.

**Setup (sekali):**

```bash
npm run storage:setup
```

Perintah ini membuat bucket `surat-tugas` yang public, hanya menerima PDF, dengan batas 4 MB. Aman dijalankan berulang kali.

**Migration database:** jalankan `database/migrations/20261120000000_add_surat_tugas_columns.sql` di Supabase SQL Editor supaya tautan tersimpan di tabel request, lalu restart backend.

`SURAT_TUGAS_EMAIL` di `.env` adalah alamat tujuan yang dicatat pada berkas dan ditampilkan ke tamu. Nilainya **sementara** `rubikesper@gmail.com`; cukup ubah di `.env` lalu restart backend saat email sekolah sudah tersedia — tidak perlu mengubah kode.

Form tetap bisa dipakai **tanpa** file. Jika migration belum dijalankan, request tetap terkirim dan tautan tetap ditampilkan ke tamu, tetapi belum tersimpan di database.

---

## Lisensi

PeTa SKANIDA — SMKN 2 Kota Magelang.

---

## 13. Fitur Scan QR (HP → Notifikasi di Laptop Admin)

Petugas memindai QR/barcode tiket tamu memakai kamera HP. Hasilnya langsung
muncul sebagai **notifikasi + bunyi** di laptop/komputer admin, dan tercatat di
menu **Scan Tamu**.

**Alur:**

1. Tamu mengisi form → halaman sukses menampilkan **barcode + QR code** (isinya `REQ-xxx`). Tombol unduh menyimpan keduanya dalam satu gambar tiket.
2. Petugas login admin di **HP**, buka menu **Scan Tamu**, tekan **Aktifkan Kamera**, lalu arahkan ke QR/barcode tamu.
3. Backend (`POST /api/scans`) memeriksa status tamu (Diterima / Pending / Ditolak / Selesai / tidak dikenal) dan menyimpannya ke tabel `scan_logs`.
4. Laptop admin yang sedang membuka dashboard menerima perubahan lewat Supabase Realtime (cadangan: polling 6 detik) → pop-up di kanan atas + bunyi.

**Yang perlu dilakukan sekali:**

- Jalankan `database/migrations/20261120000001_create_scan_logs.sql` di Supabase SQL Editor (atau `schema.sql` untuk database baru).
- Di folder `frontend` jalankan `npm install` (ada paket baru: `qrcode`, `html5-qrcode`).

**Catatan penting:**

- Kamera browser **hanya jalan lewat HTTPS** (atau `localhost`). Saat testing dari HP lewat Wi-Fi lokal (`http://192.168.x.x`), kamera akan diblokir; gunakan versi yang sudah di-deploy (Vercel) atau tunnel HTTPS seperti ngrok/cloudflared.
- Scan dari HP tidak memunculkan pop-up di HP itu sendiri, hanya di perangkat lain yang membuka dashboard.
- Tabel `scan_logs` sengaja tidak menyimpan data pribadi; detail tamu diambil lewat backend yang wajib login admin.

---

## 14. Notifikasi WhatsApp ke Admin (Fonnte)

Setiap kali ada **tamu mengisi form reservasi**, admin mendapat pesan WhatsApp berisi
nama, tujuan, keperluan, tanggal, jumlah tamu, dan kontak tamu. Notifikasi juga dikirim
saat admin mengubah status menjadi **Diterima**, **Ditolak**, atau **Selesai**.

**Yang perlu dilakukan sekali:**

1. Daftar di <https://fonnte.com> dan ambil token API-nya.
2. Tambahkan baris ini ke `backend/.env`:

   ```env
   FONNTE_TOKEN=token_dari_fonnte
   WHATSAPP_NOTIFY_NUMBERS=081234567890,081987654321
   ```

   *(Ganti nomor dengan nomor admin. Boleh lebih dari satu, dipisah koma.)*

3. Restart backend, lalu coba kirim pesan uji:

   ```bash
   cd backend
   npm run wa:test
   ```

**Catatan:** token Fonnte **rahasia** dan hanya boleh di `backend/.env`, jangan pernah
ditaruh di frontend atau di-commit. Jika token/nomor belum diisi, aplikasi tetap normal —
cuma notifikasinya yang tidak dikirim. Detail kesalahan bisa dilihat di konsol backend.

Kanal WhatsApp **tidak aktif secara default** (`NOTIFY_CHANNELS=push`) agar nomor
sekolah tidak dipakai otomatis. Aktifkan dengan `NOTIFY_CHANNELS=whatsapp` atau
`NOTIFY_CHANNELS=push,whatsapp`.

---

## 15. Notifikasi Browser & Ekspor Riwayat

### Notifikasi tanpa WhatsApp

Notifikasi kini bisa dikirim langsung ke **browser admin** (Web Push), jadi tidak
perlu nomor WhatsApp sekolah dan tidak ada risiko ban. Pesan muncul walau dashboard
sedang tidak dibuka, selama browser mengizinkan notifikasi.

**Setup sekali:**

1. Kunci VAPID sudah dibuat di `backend/.env` (`npm run push:keys` untuk membuat yang baru).
2. Jalankan di Supabase SQL Editor:
   `database/migrations/20261121000000_create_push_subscriptions.sql`
3. Restart backend, buka dashboard di **HTTPS** (atau `localhost`), lalu klik
   ikon **lonceng** di header dan izinkan notifikasi.

Notifikasi dikirim saat tamu mendaftar dan saat status berubah menjadi Diterima /
Ditolak / Selesai. Jika izin push ditolak, tetap ada notifikasi di dalam dashboard
(dengan cadangan pengecekan tiap 15 detik).

> **Soal storage:** notifikasi tidak disimpan di database. Yang tersimpan hanya
> satu baris subscription per perangkat (endpoint + kunci enkripsi) di tabel
> `push_subscriptions`. Isi pesan tidak pernah disimpan.

### Ekspor Riwayat Kunjungan

Tombol **Ekspor & Cetak** di halaman Riwayat Kunjungan menyediakan tiga pilihan:

- **Lihat Web** — membuka halaman laporan rapi di tab baru, lengkap dengan tombol
  Cetak / Simpan PDF.
- **Excel (.xlsx)** — file Excel asli, tanpa perlu membuka browser dulu.
- **CSV (.csv)** — UTF-8 (didukung Excel, karakter Indonesia tidak rusak).

Semua ekspor mengikuti filter/pencarian yang sedang aktif. Tombol ini muncul untuk
akun yang memiliki fitur **Cetak Riwayat**.
