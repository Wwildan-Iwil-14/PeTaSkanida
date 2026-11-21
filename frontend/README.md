# PeTa SKANIDA — Frontend (Tampilan Web)

Frontend adalah **tampilan aplikasi** yang dibuka di browser. Di sini **tamu** mengisi form kunjungan ke **SMKN 2 Kota Magelang**, dan **admin/petugas** mengelola data kunjungan tersebut.

Dibangun dengan **React + Vite** dan **Tailwind CSS**. Tampilannya dibuat responsif supaya nyaman dipakai di HP, tablet, dan laptop.

> Frontend membutuhkan **backend yang sedang berjalan** untuk mengirim dan mengambil data.

---

## Daftar Isi

1. [Yang Dibutuhkan](#1-yang-dibutuhkan)
2. [Install Kebutuhan](#2-install-kebutuhan)
3. [Buat & Isi File `.env`](#3-buat--isi-file-env)
4. [Menjalankan Frontend](#4-menjalankan-frontend)
5. [Membuka Aplikasi](#5-membuka-aplikasi)
6. [Yang Bisa Dilakukan](#6-yang-bisa-dilakukan)
7. [Notifikasi & Sorotan Data](#7-notifikasi--sorotan-data)
8. [Isi Folder](#8-isi-folder)
9. [Mode Produksi (Build)](#9-mode-produksi-build)
10. [Pemecahan Masalah](#10-pemecahan-masalah)
11. [Lisensi](#11-lisensi)

---

## 1. Yang Dibutuhkan

- **Node.js 18+** (cek: `node -v`)
- **Backend sudah berjalan** di `http://localhost:3001` — lihat [`../backend/README.md`](../backend/README.md)
- **Dua nilai dari Supabase** (Project Settings → API): **Project URL** dan **anon key**

> Anon key **aman** dipakai di browser. **Jangan pernah** memakai service_role key di sini.

---

## 2. Install Kebutuhan

Dari folder utama `PeTaSkanida`:

```bash
cd frontend
npm install
```

Cukup dijalankan sekali, atau saat ada library baru.

> `node_modules` tidak disimpan di Git dan aman dihapus. Jangan menyalinnya dari komputer/OS lain — bisa menyebabkan error Rollup/esbuild.

---

## 3. Buat & Isi File `.env`

**Windows:** `copy .env.example .env`  
**Mac/Linux:** `cp .env.example .env`

Isi `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:3001/api
VITE_SUPABASE_URL=https://PROJECT-URL-KAMU.supabase.co
VITE_SUPABASE_ANON_KEY=TEMPEL-ANON-KEY
```

| Variabel | Fungsi |
|---|---|
| `VITE_API_BASE_URL` | Alamat backend. Lokal: `http://localhost:3001/api` |
| `VITE_SUPABASE_URL` | Project URL Supabase (untuk update real-time) |
| `VITE_SUPABASE_ANON_KEY` | Anon key (boleh dipakai di browser) |

> **Tips:** simpan sebagai **UTF-8 tanpa BOM**, tanpa tanda kutip di sekitar nilai. Variabel `VITE_` hanya dibaca saat build/dev dimulai, jadi restart setelah mengubah `.env`.

Jika Supabase URL/anon key kosong atau salah, muncul pesan error "Konfigurasi Supabase".

---

## 4. Menjalankan Frontend

Pastikan backend sudah jalan di terminal lain, lalu:

```bash
npm run dev
```

Jika berhasil:

```
VITE v6.x.x ready
➜  Local:   http://localhost:5173/
```

Biarkan terminal tetap terbuka.

---

## 5. Membuka Aplikasi

Buka **<http://localhost:5173/>**. Halaman awal menyediakan dua pilihan:

- **Tamu** → mengisi form permintaan kunjungan.
- **Admin / Pengelola** → login untuk mengelola.

### Akun admin

Login memakai email + password yang dibuat lewat `npm run admin:create` di backend:

| Email | Password |
|---|---|
| `admin@skanida.sch.id` | `admin123` *(atau password yang kamu buat)* |

Ganti password setelah login pertama — lihat [`../database/README.md`](../database/README.md).

---

## 6. Yang Bisa Dilakukan

### Untuk tamu

- Mengisi form kunjungan: nama/instansi, email, no. HP, tujuan, keperluan, tanggal, jam, jumlah tamu.
- Menambahkan **Surat Tugas** (PDF opsional, maks. 4 MB).
- Mendapat **tiket QR + barcode** berisi kode `REQ-xxx` setelah form terkirim; tiket bisa diunduh.

### Untuk admin & petugas

| Menu | Fungsi |
|---|---|
| **Dashboard** | Ringkasan request menunggu, diterima, dan ditolak |
| **Daftar Request** | Setujui / tolak permintaan Pending |
| **Kelola Tamu** | Lihat tamu diproses, hubungi WhatsApp, tandai sudah dihubungi, klik **Selesai** |
| **Kunjungan Terkini / Mendatang** | Pantau jadwal & tamu aktif |
| **Riwayat Kunjungan** | Arsip kunjungan, pencarian, filter, ekspor |
| **Scan Tamu** | Pemindaian QR/barcode pakai kamera HP |
| **Kelola Akun** | Tambah/edit/hapus admin & petugas (super admin) |
| **Database** | Statistik, backup data, bersihkan log scan lama |
| **Akun Saya** | Profil & daftar fitur yang dimiliki |

### Ekspor riwayat

Tombol **Ekspor & Cetak** di halaman Riwayat Kunjungan menyediakan:

- **Lihat Web** — laporan rapi di tab baru + tombol Cetak/Simpan PDF.
- **Excel (.xlsx)** — file Excel asli.
- **CSV (.csv)** — UTF-8, aman untuk karakter Indonesia.

Ekspor mengikuti filter/pencarian yang sedang aktif dan hanya muncul untuk akun dengan fitur **Cetak Riwayat**.

---

## 7. Notifikasi & Sorotan Data

### Notifikasi browser

Klik **ikon lonceng** di header dashboard untuk mengaktifkan notifikasi pada perangkat ini. Perlu **HTTPS** (atau `localhost`) dan izin browser. Notifikasi dikirim saat:

- tamu mengirim form baru;
- status berubah menjadi **Diterima**, **Ditolak**, atau **Selesai**.

Notifikasi juga tetap muncul **di dalam dashboard** (pojok kanan atas) walau izin push ditolak. Data diperbarui otomatis lewat Supabase Realtime, dengan cadangan pengecekan tiap 15 detik.

> Kunci yang dipakai pengiriman bernama **VAPID** (`VAPID_PUBLIC_KEY` dan `VAPID_PRIVATE_KEY`). Kunci dibuat di backend dengan `npm run push:keys` dan disimpan di `backend/.env`. Penjelasan lengkapnya ada di [`../backend/README.md`](../backend/README.md#kunci-vapid-apa-dan-dari-mana).

### Sorotan dari notifikasi

Klik **Lihat data** pada notifikasi:

1. Aplikasi membuka halaman yang tepat (Pending → Daftar Request, Diterima → Kelola Tamu, Ditolak/Selesai → Riwayat).
2. Halaman di-scroll ke baris tersebut.
3. Baris **disorot** dengan warna + garis indigo selama beberapa detik supaya mudah ditemukan.

### Catatan performa

Agar aplikasi tetap ringan saat data banyak:

- kolom sekunder otomatis disembunyikan di layar kecil;
- pencarian di-debounce 150 ms;
- tabel tidak di-render ulang bila isi data tidak berubah.

---

## 8. Isi Folder

```
frontend/
├── src/
│   ├── App.jsx            # halaman tamu & seluruh dashboard admin
│   ├── main.jsx           # titik mulai React
│   ├── ScanPage.jsx       # pemindai QR/barcode + alert scan
│   ├── lib/
│   │   ├── api.js         # klien REST ke backend
│   │   ├── realtime.js    # langganan perubahan Supabase
│   │   ├── push.js        # langganan notifikasi Web Push
│   │   ├── export.js      # ekspor XLSX / CSV / tampilan web
│   │   ├── supabaseClient.js
│   │   ├── barcode.js
│   │   └── qr.js
│   ├── assets/            # gambar/aset
│   └── index.css          # gaya global Tailwind + cetak + sorotan baris
├── public/                # file publik (logo, favicon, sw.js)
├── index.html
├── vite.config.js
├── tailwind.config.js
└── package.json
```

---

## 9. Mode Produksi (Build)

```bash
npm run build     # hasil di frontend/dist
npm run preview   # coba hasil build secara lokal
```

Unggah isi `frontend/dist` ke hosting statis (Vercel, Netlify, Cloudflare Pages, dll). Saat deploy, isi variabel environment (`VITE_API_BASE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) di platform hosting, lalu **build ulang**.

> Untuk notifikasi browser, pastikan hosting memakai **HTTPS** dan file `sw.js` ikut terdeploy di root.

---

## 10. Pemecahan Masalah

| Gejala | Penyebab | Solusi |
|---|---|---|
| `Tidak dapat terhubung ke backend` | Backend belum jalan | Jalankan backend di folder `backend` |
| Error "Konfigurasi Supabase" | `.env` kosong/salah | Isi URL & anon key, lalu restart `npm run dev` |
| Login gagal | Backend/database bermasalah | Cek backend; pastikan `schema.sql` sudah dijalankan |
| `.env` tidak berlaku | Vite perlu restart | Ctrl+C lalu `npm run dev` lagi |
| Styling tidak muncul | CSS belum ter-import | Pastikan `src/index.css` di-import di `main.jsx` |
| Ikon lonceng abu / tidak bisa diklik | Browser tidak mendukung push atau bukan HTTPS | Gunakan Chrome/Edge/Firefox terbaru lewat HTTPS/localhost |
| Notifikasi tidak muncul | Migration `push_subscriptions` belum dijalankan | Jalankan migration di Supabase SQL Editor, restart backend |
| Kamera scan tidak aktif | Kamera butuh HTTPS | Deploy ke HTTPS atau gunakan tunnel HTTPS |
| Build sukses tapi data kosong | Env belum diisi saat build | Isi env di hosting lalu build ulang |

---

## 11. Lisensi

PeTa SKANIDA — SMKN 2 Kota Magelang. Dibangun untuk mempermudah pendataan kunjungan tamu sekolah.
