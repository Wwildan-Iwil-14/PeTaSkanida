# PeTa SKANIDA — Frontend

Frontend adalah **tampilan aplikasi** yang dibuka di browser. Di sinilah tamu mengisi form dan admin mengelola permintaan kunjungan.

Dibangun dengan **React + Vite** dan **Tailwind CSS**.

> Frontend butuh **backend yang sedang berjalan** untuk mengirim/mengambil data.

---

## Daftar Isi

1. [Yang Dibutuhkan](#1-yang-dibutuhkan)
2. [Install Kebutuhan](#2-install-kebutuhan)
3. [Buat & Isi File `.env`](#3-buat--isi-file-env)
4. [Menjalankan Frontend](#4-menjalankan-frontend)
5. [Membuka Aplikasi](#5-membuka-aplikasi)
6. [Isi Folder](#6-isi-folder)
7. [Mode Produksi (Build)](#7-mode-produksi-build)
8. [Pemecahan Masalah](#8-pemecahan-masalah)

---

## 1. Yang Dibutuhkan

- **Node.js 18+** (cek dengan `node -v`)
- **Backend sudah berjalan** di `http://localhost:3001` (lihat [`../backend/README.md`](../backend/README.md))
- **Dua nilai dari Supabase** (Project Settings → API): **Project URL** dan **anon key**

> Anon key **aman** dipakai di browser. Jangan pernah memakai service_role key di sini.

---

## 2. Install Kebutuhan

Dari folder utama `Peta-skanida`:

```bash
cd frontend
npm install
```

Cukup sekali, atau saat ada library baru.

> Folder `node_modules` dihasilkan oleh `npm install` dan **tidak disimpan di Git**. Aman dihapus kapan saja; jalankan `npm install` lagi untuk membuatnya ulang. Jangan menyalin folder ini dari komputer lain (beda OS dapat menyebabkan error Rollup/esbuild).

---

## 3. Buat & Isi File `.env`

### Buat file dari contoh

**Windows (PowerShell/CMD):**

```powershell
copy .env.example .env
```

**Mac/Linux:**

```bash
cp .env.example .env
```

> Catatan: sebagian panduan lama menyebut `.env.local`. Di projek ini file yang dipakai adalah **`.env`**. Jangan membuat keduanya dengan isi berbeda.

### Isi `frontend/.env`

```env
VITE_API_BASE_URL=http://localhost:3001/api
VITE_SUPABASE_URL=https://PROJECT-URL-KAMU.supabase.co
VITE_SUPABASE_ANON_KEY=TEMPEL-ANON-KEY
```

| Variabel | Fungsi |
|---|---|
| `VITE_API_BASE_URL` | Alamat backend. Untuk lokal biarkan `http://localhost:3001/api` |
| `VITE_SUPABASE_URL` | Project URL Supabase (dipakai untuk update real-time) |
| `VITE_SUPABASE_ANON_KEY` | Anon key (boleh di browser) |

> **Tips:** simpan sebagai **UTF-8 tanpa BOM** dan tanpa tanda kutip di sekitar nilai.

Jika `VITE_SUPABASE_URL` / anon key kosong atau salah, halaman akan error "Konfigurasi Supabase".

---

## 4. Menjalankan Frontend

Pastikan **backend sudah jalan lebih dulu** di terminal lain. Lalu:

```bash
npm run dev
```

Jika berhasil:

```
VITE v6.x.x  ready
➜  Local:   http://localhost:5173/
```

Biarkan terminal tetap terbuka. Buka alamat tersebut di browser.

---

## 5. Membuka Aplikasi

Buka: **<http://localhost:5173/>**

Halaman awal menyediakan dua pilihan:

- **Tamu** → isi form permintaan kunjungan.
- **Admin / Pengelola** → login untuk mengelola.

### Akun admin

Login admin menggunakan **email** dan **password** yang dibuat melalui skrip backend `npm run admin:create`:

| Email | Password |
|---|---|
| `admin@skanida.sch.id` | `admin123` *(atau password yang kamu buat)* |

Ganti password setelah login pertama (lihat [`../database/README.md`](../database/README.md)).

### Yang bisa dilakukan admin

- **Dashboard** — ringkasan jumlah request, menunggu, diterima, ditolak.
- **Daftar Request** — setujui atau tolak permintaan yang masih *Pending*.
- **Kelola Tamu** — lihat tamu yang sudah diproses, hubungi via WhatsApp.
- **Riwayat Kunjungan** — arsip semua permintaan yang sudah diproses.
- Data **update otomatis** (real-time) ketika ada permintaan baru masuk.

---

## 6. Isi Folder

```
frontend/
├── src/
│   ├── App.jsx            # seluruh halaman: login, form tamu, dashboard admin
│   ├── main.jsx           # titik mulai React
│   ├── lib/
│   │   ├── api.js         # penghubung ke backend (REST)
│   │   ├── realtime.js    # langganan update real-time dari Supabase
│   │   └── supabaseClient.js
│   ├── assets/            # gambar/aset
│   └── index.css          # gaya global (Tailwind)
├── public/                # file publik (logo, dll)
├── index.html
├── vite.config.js
├── tailwind.config.js
└── package.json
```

---

## 7. Mode Produksi (Build)

Untuk menaruh aplikasi di server/hosting:

```bash
npm run build     # hasil ada di folder frontend/dist
npm run preview   # mencoba hasil build secara lokal
```

Upload isi folder `frontend/dist` ke hosting statis (mis. Netlify, Vercel, Cloudflare Pages).
Saat deploy, isi variabel environment (`VITE_API_BASE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) di platform hosting, lalu **build ulang**.

> `VITE_` hanya dibaca saat build. Jika mengubah `.env`, jalankan ulang `npm run build`.

---

## 8. Pemecahan Masalah

| Gejala | Penyebab | Solusi |
|---|---|---|
| `Tidak dapat terhubung ke backend` | Backend belum jalan | Jalankan backend (`npm run dev` di folder `backend`) |
| Halaman error "Konfigurasi Supabase" | `.env` kosong/salah | Isi `VITE_SUPABASE_URL` & `VITE_SUPABASE_ANON_KEY`, restart `npm run dev` |
| Login gagal | Backend/database bermasalah | Cek backend; pastikan `schema.sql` sudah dijalankan |
| Perubahan `.env` tidak berlaku | Vite perlu restart | Hentikan (Ctrl+C) lalu `npm run dev` lagi |
| Styling tidak muncul | Tailwind belum termuat | Pastikan `src/index.css` di-import di `main.jsx` |
| `npm install` gagal | Cache/internet | `npm cache clean --force` lalu `npm install` |
| Build berhasil tapi data kosong di hosting | Env belum diisi saat build | Isi env di hosting lalu build ulang |

---

## Lisensi

PeTa SKANIDA — SMKN 2 Kota Magelang.
