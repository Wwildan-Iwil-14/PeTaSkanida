# PeTa SKANIDA - Backend

REST API (Express) yang menjadi perantara antara frontend React dan database Supabase.

## Isi folder

```
backend/
├── src/
│   ├── server.js          # entry point server
│   ├── app.js             # konfigurasi Express (CORS, JSON, routing)
│   ├── config.js          # pembacaan env + validasi konfigurasi
│   ├── routes/            # endpoint API
│   │   ├── index.js
│   │   ├── auth.routes.js
│   │   └── request.routes.js
│   ├── middleware/        # auth, rate limit, error handler
│   └── lib/               # klien Supabase, token, validasi
├── scripts/
│   └── sync-migrations.js # salin database/migrations -> supabase/migrations
├── supabase/              # konfigurasi Supabase CLI (lokal)
└── .env.example
```

## Setup

```bash
cd backend
npm install
cp .env.example .env        # Windows: copy .env.example .env
```

Isi `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` (Supabase Dashboard > Project Settings > API Keys).
`SUPABASE_ANON_KEY` hanya dipakai sebagai fallback kalau service role key belum diisi.

## Menjalankan

```bash
npm run dev     # mode pengembangan (auto reload)
npm start       # mode produksi
```

Server berjalan di `http://localhost:3001/api`.

## Daftar Endpoint

| Method | Endpoint | Auth | Keterangan |
|---|---|---|---|
| GET | `/api/health` | - | Cek status server |
| POST | `/api/auth/login` | - | Login admin, mengembalikan token session |
| GET | `/api/auth/me` | Admin | Validasi token session |
| POST | `/api/requests` | - | Tamu mengajukan permintaan kunjungan |
| GET | `/api/requests` | Admin | Semua request + statusnya |
| POST | `/api/requests/:id/approve` | Admin | Setujui request (req_acc + riwayat) |
| POST | `/api/requests/:id/reject` | Admin | Tolak request (req_reject + riwayat) |

Endpoint admin memakai header `Authorization: Bearer <token>`.

## Database

Semua query memakai file di folder `../database` (sumber kebenaran):

- `schema.sql` - struktur tabel, function, dan policy
- `migrations/` - perubahan schema bertahap
- `seed.sql` - contoh data

Untuk memakai Supabase CLI dari folder ini:

```bash
npm run db:sync   # salin database/migrations ke supabase/migrations
supabase db push
```

## Catatan Keamanan

- Service role key hanya ada di backend, tidak pernah dikirim ke browser.
- Password admin diverifikasi di database lewat function `verify_admin` (bcrypt).
- Session admin memakai token bertanda tangan HMAC-SHA256 dengan masa berlaku.
- Endpoint login dibatasi 10 percobaan per menit per IP.
