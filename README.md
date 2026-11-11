# PETA SKANIDA - Sistem Pengelolaan Tamu Kunjungan

Aplikasi web untuk mengelola daftar permintaan kunjungan tamu SKANIDA.
Dibangun dengan React 18 + Vite 6 + Tailwind CSS 3 + Express + Supabase.

## Struktur Project

Project dipisah menjadi tiga folder yang berdiri sendiri:

```
Peta-skanida/
├── frontend/   # Aplikasi React (Vite) - tampilan untuk tamu & admin
├── backend/    # REST API (Express) - perantara frontend <-> database
├── database/   # Skema, seed, dan migration SQL Supabase
└── scripts/    # Helper development di root
```

Alur data:

```
Browser (frontend)  --HTTP-->  Backend (Express)  --Supabase SDK-->  Database (PostgreSQL)
     ^                                  |
     |--------- real-time ------------|
```

Frontend tidak pernah menyentuh service role key. Semua operasi tulis
(login admin, ajukan request, setujui/tolak) melewati backend.

## Setup Kolaborator

### 1. Clone Repository

```bash
git clone https://github.com/massmoses25-maker/Peta-skanida.git
cd Peta-skanida
```

### 2. Setup Database

Jika database Supabase sudah ada, lewati ke langkah 3.
Untuk project baru: buka Supabase SQL Editor, copy isi `database/schema.sql`, Run.

Detailnya ada di [database/README.md](database/README.md).

### 3. Setup Backend

```bash
cd backend
npm install
copy .env.example .env      # Windows
```

Isi `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` dari Supabase Dashboard
(Project Settings > API Keys). Detailnya di [backend/README.md](backend/README.md).

### 4. Setup Frontend

```bash
cd frontend
npm install
copy .env.example .env.local   # Windows
```

Isi `VITE_API_BASE_URL`, `VITE_SUPABASE_URL`, dan `VITE_SUPABASE_ANON_KEY`.
Detailnya di [frontend/README.md](frontend/README.md).

### 5. Jalankan

Dari root repository:

```bash
npm run install:all
npm run dev
```

Frontend: http://localhost:5173/ &nbsp;|&nbsp; Backend: http://localhost:3001/api

Atau jalankan terpisah di dua terminal:

```bash
npm run dev:backend
npm run dev:frontend
```

## Akun Admin Default

Username: admin | Password: admin123
Ganti password setelah login pertama. Lihat [database/README.md](database/README.md).

## Perintah Root

| Perintah | Keterangan |
|---|---|
| `npm run install:all` | Install dependency frontend + backend |
| `npm run dev` | Jalankan frontend & backend sekaligus |
| `npm run dev:frontend` | Jalankan frontend saja |
| `npm run dev:backend` | Jalankan backend saja |
| `npm run build` | Build produksi frontend |
| `npm run db:sync` | Salin `database/migrations` ke `backend/supabase/migrations` |

## Endpoint API

| Method | Endpoint | Auth |
|---|---|---|
| GET | `/api/health` | - |
| POST | `/api/auth/login` | - |
| GET | `/api/auth/me` | Admin |
| POST | `/api/requests` | - |
| GET | `/api/requests` | Admin |
| POST | `/api/requests/:id/approve` | Admin |
| POST | `/api/requests/:id/reject` | Admin |

## Troubleshooting

- Error "Konfigurasi backend belum lengkap": isi `backend/.env`
- "Tidak dapat terhubung ke backend": server backend belum berjalan / `VITE_API_BASE_URL` salah
- Error Konfigurasi Supabase: buat `frontend/.env.local`
- Data tidak muncul: pastikan `schema.sql` sudah dijalankan
- Login admin gagal: cek tabel `admins` di database
- Real-time tidak update: jalankan migration `20261110000002_enable_realtime.sql`
- Setelah mengetatkan RLS, backend wajib memakai service role key

## Lisensi
PETA SKANIDA - SMKN 2 Magelang
