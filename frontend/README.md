# PeTa SKANIDA - Frontend

Aplikasi React (Vite) untuk mengelola daftar permintaan kunjungan tamu SKANIDA.

## Isi folder

```
frontend/
├── src/
│   ├── App.jsx            # halaman login, form tamu, dashboard admin
│   ├── main.jsx           # entry point React
│   ├── lib/
│   │   ├── api.js         # klien REST untuk backend
│   │   ├── realtime.js    # langganan real-time Supabase
│   │   └── supabaseClient.js
│   ├── assets/
│   └── index.css
├── public/
├── index.html
├── vite.config.js
└── package.json
```

## Setup

```bash
cd frontend
npm install
cp .env.example .env.local     # Windows: copy .env.example .env.local
```

Isi `frontend/.env.local`:

| Variabel | Keterangan |
|---|---|
| `VITE_API_BASE_URL` | Alamat backend, default `http://localhost:3001/api` |
| `VITE_SUPABASE_URL` | URL project Supabase (untuk real-time) |
| `VITE_SUPABASE_ANON_KEY` | Anon key Supabase (untuk real-time) |

> Anon key aman dipakai di browser. Service role key **tidak boleh** dipakai di frontend.

## Menjalankan

```bash
npm run dev       # development server (http://localhost:5173)
npm run build     # build produksi ke frontend/dist
npm run preview   # preview hasil build
```

Backend harus berjalan dulu supaya form tamu, login admin, dan approve/reject bekerja.

## Peran Pengguna

- **Tamu** - mengisi form permintaan kunjungan (POST ke backend).
- **Admin** - login, melihat daftar request, menyetujui/menolak, melihat riwayat.
