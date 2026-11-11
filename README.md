# PETA SKANIDA — Sistem Pengelolaan Tamu Kunjungan

Aplikasi web untuk mengelola daftar permintaan kunjungan tamu SKANIDA: pengajuan tamu, verifikasi oleh admin, pengelolaan data tamu, dan arsip riwayat kunjungan.

Dibangun dengan **React 18 + Vite 6 + Tailwind CSS 3**.

> **Catatan:** project ini masih **frontend-only**. Data permintaan tamu disimpan di state (memori) dan login admin belum terhubung ke backend/database, sehingga data akan kembali ke contoh awal saat halaman di-refresh.

---

## Daftar Isi

- [Fitur](#fitur)
- [Prasyarat](#prasyarat)
- [1. Mengambil / Import Project](#1-mengambil--import-project)
- [2. Instalasi Dependency](#2-instalasi-dependency)
- [3. Menjalankan Aplikasi](#3-menjalankan-aplikasi)
- [4. Build untuk Produksi](#4-build-untuk-produksi)
- [Perintah yang Tersedia](#perintah-yang-tersedia)
- [Struktur Project](#struktur-project)
- [Troubleshooting](#troubleshooting)

---

## Fitur

- **Halaman tamu** — form pengajuan kunjungan (nama, kontak, tujuan, keperluan, custom tujuan/keperluan).
- **Login admin** — masuk ke panel admin.
- **Dashboard** — ringkasan statistik permintaan dan aktivitas terbaru.
- **Daftar Request** — verifikasi permintaan: **Diterima** / **Ditolak**.
- **Kelola Tamu** — daftar tamu beserta kontak.
- **Riwayat Kunjungan** — arsip kunjungan yang sudah diproses.
- **Pencarian & filter** berdasarkan status, serta tampilan responsif (mobile & desktop).

---

## Prasyarat

Pastikan sudah terpasang di komputer:

| Tool | Versi minimum | Cek dengan |
|------|---------------|------------|
| **Node.js** | 18.x (disarankan 20 LTS atau lebih baru) | `node -v` |
| **npm** | 9.x (ikut terpasang bersama Node.js) | `npm -v` |
| **Git** (opsional) | versi terbaru | `git --version` |

Download Node.js: <https://nodejs.org> (pilih versi **LTS**).

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
3. Ekstrak file ZIP ke folder pilihan, misalnya `Pemu_skanida`.
4. Buka folder tersebut di terminal:

```bash
cd "path/ke/Pemu_skanida"
```

### Opsi C — Import ke editor (VS Code)

1. Buka **VS Code** → **File** → **Open Folder…**
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
- mengunduh semua dependency ke folder `node_modules`,
- memastikan versi paket sama persis seperti yang dipakai saat pengembangan.

Jika ingin instalasi yang benar-benar identik dengan lock file (untuk CI/CD):

```bash
npm ci
```

---

## 3. Menjalankan Aplikasi

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

1. Di halaman awal, pilih **Tamu** untuk mengisi form pengajuan kunjungan, atau **Admin** untuk masuk ke panel.
2. Pada login admin, isi nama akun dan password apa saja (minimal tidak kosong) — verifikasi masih simulasi frontend.
3. Setelah masuk, gunakan menu **Dashboard**, **Daftar Request**, **Kelola Tamu**, dan **Riwayat Kunjungan**.
4. Pada **Daftar Request**, klik aksi untuk menerima/menolak permintaan; status akan berubah dan masuk ke riwayat.

> Ingin membuka dari perangkat lain di jaringan yang sama? Jalankan `npm run dev -- --host`, lalu akses `http://IP-KOMPUTER:5173/`.

---

## 4. Build untuk Produksi

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

---

## Perintah yang Tersedia

| Perintah | Fungsi |
|----------|--------|
| `npm install` | Memasang seluruh dependency |
| `npm run dev` | Menjalankan development server (hot reload) |
| `npm run build` | Membuat build produksi ke folder `dist/` |
| `npm run preview` | Menjalankan hasil build secara lokal |

---

## Struktur Project

```
Pemu_skanida/
├── public/                 # Aset statis (logo, favicon, ikon)
├── src/
│   ├── assets/             # Gambar & ikon yang di-import
│   ├── App.jsx             # Komponen utama: halaman tamu, login, & panel admin
│   ├── App.css
│   ├── index.css           # Entry Tailwind (base, components, utilities)
│   └── main.jsx            # Entry React (root render)
├── index.html              # Template HTML
├── package.json            # Metadata & daftar dependency
├── package-lock.json       # Lock versi dependency (WAJIB di-commit)
├── vite.config.js          # Konfigurasi Vite
├── tailwind.config.js      # Konfigurasi Tailwind CSS
├── postcss.config.js       # Konfigurasi PostCSS/Autoprefixer
├── .oxlintrc.json          # Konfigurasi lint
└── .gitignore              # File/folder yang diabaikan Git
```

> **Penting:** jangan commit `node_modules/` dan `dist/`. Keduanya sudah dikecualikan di `.gitignore`. Cukup commit `package.json` dan `package-lock.json`.

---

## Troubleshooting

| Masalah | Penyebab & Solusi |
|---------|-------------------|
| `'npm' is not recognized` | Node.js belum terpasang / belum masuk PATH. Install dari <https://nodejs.org> lalu restart terminal. |
| `EADDRINUSE: port 5173 already in use` | Port dipakai proses lain. Jalankan `npm run dev -- --port 5174` atau tutup proses lama. |
| Halaman error / dependency tidak ditemukan | Hapus folder `node_modules` lalu jalankan ulang `npm install`. |
| Install gagal karena cache rusak | `npm cache clean --force` lalu `npm install`. |
| Styling Tailwind tidak muncul | Pastikan `src/index.css` di-import di `main.jsx` dan `tailwind.config.js` mencakup folder `src`. |
| `npm ci` gagal karena lock file beda | Hapus `package-lock.json` lalu jalankan `npm install` (hanya jika memang perlu memperbarui lock). |
| Perubahan tidak terlihat | Pastikan dev server masih berjalan dan hard refresh browser (`Ctrl + Shift + R`). |

---

## Lisensi

Project ini dibuat untuk keperluan internal **PETA SKANIDA**. Silakan sesuaikan bagian lisensi sesuai kebutuhan organisasi.
