# PETA SKANIDA - Sistem Pengelolaan Tamu Kunjungan

Aplikasi web untuk mengelola daftar permintaan kunjungan tamu SKANIDA.
Dibangun dengan React 18 + Vite 6 + Tailwind CSS 3 + Supabase.

## Struktur Project

- **frontend/** - Aplikasi React (Vite)
- **database/** - Skema dan migration SQL
- **backend/** - Konfigurasi Supabase CLI

## Setup Kolaborator

### 1. Clone Repository
`git clone https://github.com/massmoses25-maker/Peta-skanida.git`
`cd Peta-skanida`

### 2. Setup Database
Jika database Supabase sudah ada, lewati ke langkah 3.
Untuk project baru: buka Supabase SQL Editor, copy isi database/schema.sql, Run.

### 3. Setup Frontend
`cd frontend`
`cp .env.example .env.local`
Edit .env.local dengan URL dan key dari Supabase Dashboard.
Lalu jalankan: npm install dan npm run dev
Buka http://localhost:5173/

## Akun Admin Default
Username: admin | Password: admin123
Ganti password setelah login pertama. Lihat database/README.md.

## Perintah Frontend
- npm install - Install dependency
- npm run dev - Development server
- npm run build - Build produksi

## Troubleshooting
- Error Konfigurasi Supabase: buat frontend/.env.local
- Data tidak muncul: pastikan schema.sql sudah dijalankan
- Login admin gagal: cek tabel admins di database
- Real-time tidak update: jalankan migration enable_realtime.sql

## Lisensi
PETA SKANIDA - SMKN 2 Magelang