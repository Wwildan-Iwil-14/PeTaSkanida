# PeTa SKANIDA — Backend

Backend adalah **server kecil** yang menjadi perantara antara tampilan (frontend) dan database (Supabase).
Semua operasi penting — login admin, ajukan permintaan, setujui/tolak — lewat sini. Kunci rahasia database hanya disimpan di backend.

> **Analogi:** Frontend = kasir yang melayani tamu. Backend = bagian gudang yang mengambil/menyimpan barang. Database = gudangnya.
> Tamu tidak boleh masuk gudang langsung, jadi lewat kasir (frontend) → gudang (backend) → rak (database).

---

## Daftar Isi

1. [Yang Dibutuhkan](#1-yang-dibutuhkan)
2. [Install Kebutuhan](#2-install-kebutuhan)
3. [Buat & Isi File `.env`](#3-buat--isi-file-env)
4. [Menjalankan Backend](#4-menjalankan-backend)
5. [Cek Backend Berjalan](#5-cek-backend-berjalan)
6. [Isi Folder](#6-isi-folder)
7. [Daftar Endpoint API](#7-daftar-endpoint-api)
8. [Catatan Keamanan](#8-catatan-keamanan)
9. [Pemecahan Masalah](#9-pemecahan-masalah)

---

## 1. Yang Dibutuhkan

- **Node.js 18+** (cek dengan `node -v`)
- **Database Supabase sudah disiapkan** (lihat [`../database/README.md`](../database/README.md))
- **Tiga nilai dari Supabase** (Project Settings → API): **Project URL**, **anon key**, **service_role key**

---

## 2. Install Kebutuhan

Dari folder utama `Peta-skanida`:

```bash
cd backend
npm install
```

`npm install` akan mengunduh semua library yang dibutuhkan. Cukup sekali (atau saat ada library baru).

---

## 3. Buat & Isi File `.env`

File `.env` menyimpan pengaturan rahasia. **Jangan diunggah ke GitHub** (sudah otomatis diabaikan).

### Buat file dari contoh

**Windows (PowerShell/CMD):**

```powershell
copy .env.example .env
```

**Mac/Linux:**

```bash
cp .env.example .env
```

### Isi `backend/.env`

```env
PORT=3001
SUPABASE_URL=https://PROJECT-URL-KAMU.supabase.co
SUPABASE_SERVICE_ROLE_KEY=TEMPEL-SERVICE-ROLE-KEY
SUPABASE_ANON_KEY=TEMPEL-ANON-KEY
AUTH_SECRET=tulis-kalimat-acak-panjang-bebas
TOKEN_TTL_SECONDS=28800
CORS_ORIGIN=http://localhost:5173
```

Penjelasan tiap baris:

| Variabel | Wajib? | Fungsi |
|---|---|---|
| `PORT` | Ya | Port server backend (default `3001`) |
| `SUPABASE_URL` | **Ya** | Alamat project Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | **Ya** | Kunci akses penuh (untuk menulis data). **Rahasia.** |
| `SUPABASE_ANON_KEY` | Opsional | Cadangan bila service role belum diisi |
| `AUTH_SECRET` | Ya | Kunci tanda tangan token login admin — pakai kalimat acak panjang |
| `TOKEN_TTL_SECONDS` | Opsional | Lama sesi login admin (detik). `28800` = 8 jam |
| `CORS_ORIGIN` | Ya | Alamat frontend yang diizinkan (`http://localhost:5173`) |

> **Tips:** simpan file sebagai **UTF-8 tanpa BOM**, dan jangan memakai tanda kutip (`"`) di sekitar nilai.

Contoh `AUTH_SECRET` yang baik: `skanida-2026-rahasia-acak-9f3k2m8x`.

---

## 4. Menjalankan Backend

```bash
npm run dev
```

Jika berhasil:

```
[backend] PeTa SKANIDA API berjalan di http://localhost:3001/api
[backend] MengACCESS database dengan service role key (akses penuh).
```

**Biarkan terminal ini tetap terbuka.** Frontend membutuhkan backend yang terus berjalan.

Mode lain:

| Perintah | Kegunaan |
|---|---|
| `npm run dev` | Mode pengembangan (otomatis restart saat kode diubah) |
| `npm start` | Mode produksi (jalankan biasa) |

---

## 5. Cek Backend Berjalan

Buka di browser: <http://localhost:3001/api/health>

Harus muncul:

```json
{"status":"ok","service":"peta-skanida-backend"}
```

Kalau muncul tulisan itu, backend sehat. Kalau error, lihat [bagian 9](#9-pemecahan-masalah).

---

## 6. Isi Folder

```
backend/
├── src/
│   ├── server.js          # titik mulai server
│   ├── app.js             # pengaturan Express (CORS, JSON, routing)
│   ├── config.js          # membaca & memeriksa file .env
│   ├── routes/            # daftar endpoint API
│   ├── middleware/        # penjaga: cek login, batasi percobaan, tangani error
│   └── lib/               # koneksi Supabase, token, validasi
├── scripts/
│   └── sync-migrations.js # salin database/migrations ke supabase/migrations
├── supabase/              # konfigurasi Supabase CLI (opsional)
├── .env.example           # contoh isi .env
└── package.json           # daftar library & perintah
```

---

## 7. Daftar Endpoint API

| Method | Endpoint | Perlu login admin? | Keterangan |
|---|---|---|---|
| GET | `/api/health` | Tidak | Cek server hidup |
| POST | `/api/auth/login` | Tidak | Login admin → dapat token |
| GET | `/api/auth/me` | Ya | Cek token masih valid |
| POST | `/api/requests` | Tidak | Tamu mengirim permintaan kunjungan |
| GET | `/api/requests` | Ya | Ambil semua permintaan + status |
| POST | `/api/requests/:id/approve` | Ya | Setujui permintaan |
| POST | `/api/requests/:id/reject` | Ya | Tolak permintaan |

Endpoint yang perlu login memakai header:

```
Authorization: Bearer <token>
```

Contoh mencoba login lewat terminal (curl):

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

---

## 8. Catatan Keamanan

- **Service role key tidak pernah dikirim ke browser.** Semua operasi tulis lewat backend.
- Password admin disimpan sebagai **hash bcrypt** di database, diverifikasi lewat fungsi `verify_admin`.
- Token login admin ditandatangani **HMAC-SHA256** dan punya masa berlaku (`TOKEN_TTL_SECONDS`).
- Login dibatasi **10 percobaan per menit per IP** untuk mencegah tebak password.
- **Segera ganti** `admin123` dan `AUTH_SECRET` sebelum dipakai sungguhan.

---

## 9. Pemecahan Masalah

| Gejala | Penyebab | Solusi |
|---|---|---|
| `Konfigurasi backend belum lengkap` | `.env` belum diisi | Isi `SUPABASE_URL` dan key-nya |
| `Invalid API key` | Key salah/tertukar | Salin ulang anon & service_role key dengan benar |
| `EADDRINUSE` / port terpakai | Backend lain sudah jalan | Tutup proses lama, atau ubah `PORT` |
| Login: `Verifikasi admin gagal` | Database belum disiapkan | Jalankan `database/schema.sql` di Supabase |
| Login: `Nama akun atau password salah` | Kredensial salah | Coba `admin` / `admin123`, atau reset password |
| Frontend tidak bisa konek | `CORS_ORIGIN` salah | Pastikan berisi alamat frontend, mis. `http://localhost:5173` |
| Perubahan `.env` tidak terbaca | Server belum restart | Hentikan (Ctrl+C) lalu `npm run dev` lagi |

---

## Lisensi

PeTa SKANIDA — SMKN 2 Kota Magelang.
