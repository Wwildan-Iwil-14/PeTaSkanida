# PETA SKANIDA — Sistem Pengelolaan Tamu Kunjungan

Aplikasi web untuk mengelola daftar permintaan kunjungan tamu SKANIDA: pengajuan tamu secara daring, verifikasi oleh admin, pengelolaan data tamu, dan arsip riwayat kunjungan.

Dibangun dengan **React 18 + Vite 6 + Tailwind CSS 3 + Supabase** (PostgreSQL database, autentikasi admin, dan penyimpanan data permanen).

---

## Daftar Isi

- [Fitur](#fitur)
- [Prasyarat](#prasyarat)
- [1. Mengambil / Import Project](#1-mengambil--import-project)
- [2. Instalasi Dependency](#2-instalasi-dependency)
- [3. Konfigurasi Supabase](#3-konfigurasi-supabase)
- [4. Menjalankan Aplikasi](#4-menjalankan-aplikasi)
- [5. Build untuk Produksi](#5-build-untuk-produksi)
- [Perintah yang Tersedia](#perintah-yang-tersedia)
- [Struktur Database](#struktur-database)
- [Akun Admin Default](#akun-admin-default)
- [Struktur Project](#struktur-project)
- [Troubleshooting](#troubleshooting)

---

## Fitur

- **Halaman tamu** — form pengajuan kunjungan (nama, email, kontak, tujuan, keperluan, waktu, jumlah pengunjung) dengan opsi tujuan/keperluan custom.
- **Login admin** — autentikasi dengan validasi password ter-hash (bcrypt) ke database. Tidak sembarang orang bisa masuk.
- **Dashboard** — ringkasan statistik permintaan (total, menunggu, diterima, ditolak) dan aktivitas terbaru.
- **Daftar Request** — verifikasi permintaan: **Terima** / **Tolak**. Data tersimpan permanen di database.
- **Kelola Tamu** — daftar tamu yang disetujui/ditolak beserta kontak (tautan WhatsApp).
- **Riwayat Kunjungan** — arsip kunjungan yang sudah diproses, diurutkan terbaru di atas.
- **Pencarian & filter** berdasarkan status, serta tampilan responsif (mobile & desktop).
- **Loading & error handling** — indikator loading saat memuat data, pesan error dengan tombol coba lagi.

---

## Prasyarat

Pastikan sudah terpasang di komputer:

| Tool | Versi minimum | Cek dengan |
|------|---------------|------------|
| **Node.js** | 18.x (disarankan 20 LTS atau lebih baru) | `node -v` |
| **npm** | 9.x (ikut terpasang bersama Node.js) | `npm -v` |
| **Git** (opsional) | versi terbaru | `git --version` |
| **Supabase CLI** (opsional) | 3.x | `supabase --version` |

Download Node.js: <https://nodejs.org> (pilih versi **LTS**).

Install Supabase CLI (opsional, hanya untuk sync migration dari terminal):
```bash
# Windows (scoop)
scoop install supabase

# macOS (Homebrew)
brew install supabase/tap/supabase
```

---

## 1. Mengambil / Import Project

### Opsi A — Clone dari GitHub (disarankan)

```bash
git clone https://github.com/USERNAME/NAMA-REPO.git
cd NAMA-REPO
```

Ganti `USERNAME` dan `NAMA-REPO` sesuai repository kamu.

### Opsi B — Download ZIP

1. Buka halaman repository di GitHub.
2. Klik tombol **Code** → **Download ZIP**.
3. Ekstrak file ZIP ke folder pilihan.
4. Buka folder tersebut di terminal:

```bash
cd "path/ke/folder-project"
```

### Opsi C — Import ke editor (VS Code / Kiro)

1. Buka editor → **File** → **Open Folder…**
2. Pilih folder project.
3. Buka terminal terintegrasi: **Terminal** → **New Terminal** (`Ctrl + ~`).

> Folder `node_modules` **tidak ikut** di repository (sudah masuk `.gitignore`). Dependency akan dibuat ulang pada langkah instalasi di bawah.

---

## 2. Instalasi Dependency

Jalankan di dalam folder project:

```bash
npm install
```

Perintah ini akan:

- membaca `package.json` dan `package-lock.json`,
- mengunduh semua dependency ke folder `node_modules` (termasuk `@supabase/supabase-js`),
- memastikan versi paket sama persis seperti yang dipakai saat pengembangan.

Jika ingin instalasi yang benar-benar identik dengan lock file (untuk CI/CD):

```bash
npm ci
```

---

## 3. Konfigurasi Supabase

Aplikasi ini memerlukan project Supabase untuk menyimpan data. Jika project Supabase sudah ada, lewati ke langkah 3b.

### 3a. Buat Project Supabase (jika belum ada)

1. Buka <https://supabase.com> dan daftar/masuk.
2. Klik **New Project**, isi nama, pilih region terdekat, lalu **Create**.
3. Tunggu beberapa menit hingga project siap (status: Active).

### 3b. Buat file `.env.local`

Buat file bernama `.env.local` di root folder project (satu level dengan `package.json`), lalu isi dengan URL dan API key dari project Supabase kamu:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

Cara mendapatkan nilainya:

- **URL**: di dashboard Supabase → **Project Settings** → **API** → **Project URL**.
- **Anon Key**: di halaman yang sama → **Project API keys** → **anon public**.

> File `.env.local` sudah masuk `.gitignore` dan tidak akan ter-commit. Jangan bagikan nilainya ke publik.

### 3c. Jalankan Migration Database

Database perlu beberapa tabel dan function agar aplikasi berfungsi. File migration sudah disediakan di folder `supabase/migrations/`.

**Opsi 1 — Via Supabase Dashboard (paling mudah):**

1. Buka dashboard Supabase → project kamu → **SQL Editor**.
2. Buka file di `supabase/migrations/20261110000000_add_waktu_jumlah_columns.sql`, copy seluruh isinya, paste di SQL Editor, lalu **Run**.
3. Ulangi untuk file `supabase/migrations/20261110000001_create_admins_table.sql`.

**Opsi 2 — Via Supabase CLI:**

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

> Jika database kamu sudah memiliki tabel `req_pending`, `req_acc`, `req_reject`, dan `riwayat`, migration pertama hanya menambahkan kolom `waktu` dan `jumlah`. Migration kedua membuat tabel `admins` dan function `verify_admin`.

---

## 4. Menjalankan Aplikasi

Jalankan development server:

```bash
npm run dev
```

Output contoh:

```
  VITE v6.x.x  ready in 300 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

Buka **<http://localhost:5173/>** di browser.

- Perubahan pada file di `src/` langsung terlihat (hot reload) tanpa refresh manual.
- Hentikan server dengan `Ctrl + C`.

### Alur penggunaan

1. **Sebagai Tamu**: di halaman awal, pilih **Tamu** → isi form pengajuan kunjungan → klik **Kirim Permintaan**. Data tersimpan ke database dan akan muncul di panel admin.

2. **Sebagai Admin**: pilih **Admin / Pengelola** → masukkan nama akun dan password → klik **Masuk**. Gunakan menu:
   - **Dashboard** — lihat ringkasan statistik.
   - **Daftar Request** — periksa permintaan, klik **Terima** atau **Tolak**.
   - **Kelola Tamu** — lihat daftar tamu beserta kontak WhatsApp.
   - **Riwayat Kunjungan** — lihat arsip semua kunjungan yang sudah diproses.

> Ingin membuka dari perangkat lain di jaringan yang sama? Jalankan `npm run dev -- --host`, lalu akses `http://IP-KOMPUTER:5173/`.

---

## 5. Build untuk Produksi

```bash
npm run build
```

Hasil build ada di folder **`dist/`** (HTML, JS, CSS yang sudah diminifikasi).

Untuk menguji hasil build secara lokal:

```bash
npm run preview
```

Lalu buka alamat yang ditampilkan (biasanya <http://localhost:4173/>).

### Deploy (opsional)

Folder `dist/` bisa di-hosting sebagai situs statis di:

- **Vercel** / **Netlify** — build command: `npm run build`, output directory: `dist`
- **GitHub Pages** — perlu `base` di `vite.config.js` sesuai nama repo
- **Cloudflare Pages**, **Firebase Hosting**, atau web server statis lainnya

> Pastikan variabel environment (`VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`) sudah diset di platform deploy yang dipakai.

---

## Perintah yang Tersedia

| Perintah | Fungsi |
|----------|--------|
| `npm install` | Memasang seluruh dependency |
| `npm run dev` | Menjalankan development server (hot reload) |
| `npm run build` | Membuat build produksi ke folder `dist/` |
| `npm run preview` | Menjalankan hasil build secara lokal |

---

## Struktur Database

Aplikasi menggunakan 5 tabel di Supabase PostgreSQL:

| Tabel | Fungsi |
|-------|--------|
| `req_pending` | Tabel master. Semua request kunjungan dari tamu masuk ke sini. |
| `req_acc` | Request yang sudah **diterima** admin. (FK ke `req_pending`) |
| `req_reject` | Request yang sudah **ditolak** admin. (FK ke `req_pending`) |
| `riwayat` | Arsip semua request yang sudah diproses. (FK ke `req_pending`) |
| `admins` | Daftar akun admin dengan password ter-hash (bcrypt). |

**Kolom setiap tabel request** (`req_pending`, `req_acc`, `req_reject`, `riwayat`):

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | bigint (identity) | Primary key, auto-increment |
| `nama` | text | Nama / instansi pengunjung |
| `email` | text | Alamat email pengunjung |
| `no_hp` | text | Nomor HP pengunjung |
| `tujuan` | text | Bertemu siapa (Kepala SKANIDA, Staf, dll.) |
| `keperluan` | text | Keperluan kunjungan |
| `tanggal` | date | Tanggal kunjungan |
| `waktu` | text | Jam kunjungan |
| `jumlah` | integer | Jumlah pengunjung (default: 1) |

**Alur data**: Tamu mengisi form → masuk ke `req_pending` → admin terima (pindah ke `req_acc` + `riwayat`) atau tolak (pindah ke `req_reject` + `riwayat`). Data tetap ada di `req_pending` sebagai master record.

Semua tabel request memiliki **Row Level Security (RLS)** aktif dengan policy yang mengizinkan akses baca/tulis untuk anon dan authenticated. Tabel `admins` RLS-nya memblokir semua akses langsung — hanya function `verify_admin` yang bisa membacanya (via `SECURITY DEFINER`).

---

## Akun Admin Default

Setelah migration, satu akun admin default otomatis dibuat:

| Field | Nilai |
|-------|-------|
| Username | `admin` |
| Password | `admin123` |

**Ganti password default ini segera setelah instalasi!** Jalankan SQL berikut di Supabase SQL Editor:

```sql
UPDATE public.admins
SET password_hash = crypt('PASSWORD_BARU_KAMU', gen_salt('bf'))
WHERE username = 'admin';
```

Untuk menambah admin baru:

```sql
INSERT INTO public.admins (username, email, password_hash, nama)
VALUES ('admin2', 'admin2@skanida.sch.id', crypt('password_admin2', gen_salt('bf')), 'Admin Kedua');
```

---

## Struktur Project

```
Peta-skanida/
├── public/                      # Aset statis (logo, favicon, ikon)
│   ├── favicon.svg
│   ├── icons.svg
│   └── logo-peta-skanida.svg
├── src/
│   ├── assets/                  # Gambar & ikon yang di-import
│   │   ├── hero.png
│   │   ├── react.svg
│   │   └── vite.svg
│   ├── lib/
│   │   └── supabaseClient.js    # Inisialisasi client Supabase
│   ├── App.jsx                  # Komponen utama: halaman tamu, login admin, & panel admin
│   ├── App.css
│   ├── index.css                # Entry Tailwind (base, components, utilities)
│   └── main.jsx                 # Entry React (root render)
├── supabase/
│   ├── migrations/              # File SQL migration database
│   │   ├── 20261110000000_add_waktu_jumlah_columns.sql
│   │   └── 20261110000001_create_admins_table.sql
│   ├── config.toml              # Konfigurasi Supabase CLI
│   └── .gitignore
├── .env.local                   # URL & API key Supabase (TIDAK di-commit)
├── .gitignore                   # File/folder yang diabaikan Git
├── index.html                   # Template HTML
├── package.json                 # Metadata & daftar dependency
├── package-lock.json            # Lock versi dependency (WAJIB di-commit)
├── vite.config.js               # Konfigurasi Vite
├── tailwind.config.js           # Konfigurasi Tailwind CSS
├── postcss.config.js            # Konfigurasi PostCSS/Autoprefixer
└── README.md                    # Dokumentasi ini
```

> **Penting:** jangan commit `node_modules/`, `dist/`, dan `.env.local`. Ketiganya sudah dikecualikan di `.gitignore`. Cukup commit `package.json` dan `package-lock.json`.

---

## Troubleshooting

| Masalah | Penyebab & Solusi |
|---------|-------------------|
| `'npm' is not recognized` | Node.js belum terpasang / belum masuk PATH. Install dari <https://nodejs.org> lalu restart terminal. |
| `EADDRINUSE: port 5173 already in use` | Port dipakai proses lain. Jalankan `npm run dev -- --port 5174` atau tutup proses lama. |
| Halaman error / dependency tidak ditemukan | Hapus folder `node_modules` lalu jalankan ulang `npm install`. |
| Install gagal karena cache rusak | `npm cache clean --force` lalu `npm install`. |
| Styling Tailwind tidak muncul | Pastikan `src/index.css` di-import di `main.jsx` dan `tailwind.config.js` mencakup folder `src`. |
| Data tidak muncul / error "Gagal memuat data" | Periksa file `.env.local` — pastikan `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` sudah benar. |
| Login admin gagal ("Nama akun atau password salah") | Pastikan migration `create_admins_table` sudah dijalankan. Cek kredensial: username `admin`, password `admin123`. |
| Form tamu gagal mengirim | Periksa koneksi ke Supabase dan pastikan tabel `req_pending` sudah ada dengan kolom `waktu` dan `jumlah`. |
| `supabase` command not found | Supabase CLI belum terpasang. Lihat [Prasyarat](#prasyarat) untuk cara install. |
| Perubahan tidak terlihat | Pastikan dev server masih berjalan dan hard refresh browser (`Ctrl + Shift + R`). |

---

## Lisensi

Project ini dibuat untuk keperluan internal **PETA SKANIDA — SMKN 2 Magelang**. Silakan sesuaikan bagian lisensi sesuai kebutuhan organisasi.
