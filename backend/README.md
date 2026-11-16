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

> Folder `node_modules` dihasilkan oleh `npm install` dan **tidak disimpan di Git**. Aman dihapus kapan saja; jalankan `npm install` lagi untuk membuatnya ulang. Jangan menyalin folder ini dari komputer lain (beda OS dapat menyebabkan error).

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
CORS_ORIGIN=http://localhost:5173
```

Penjelasan tiap baris:

| Variabel | Wajib? | Fungsi |
|---|---|---|
| `PORT` | Ya | Port server backend (default `3001`) |
| `SUPABASE_URL` | **Ya** | Alamat project Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | **Ya** | Kunci akses penuh (untuk menulis data). **Rahasia.** |
| `SUPABASE_ANON_KEY` | Opsional | Cadangan bila service role belum diisi |
| `CORS_ORIGIN` | Ya | Alamat frontend yang diizinkan (`http://localhost:5173`) |

> **Catatan:** Masa berlaku token, refresh token, dan enkripsi sesi dikelola langsung oleh **Supabase Auth (schema auth / GoTrue)**, sehingga variabel `AUTH_SECRET` dan `TOKEN_TTL_SECONDS` tidak lagi dipakai.
>
> **Tips:** simpan file sebagai **UTF-8 tanpa BOM**, dan jangan memakai tanda kutip (`"`) di sekitar nilai.

---

## 4. Menyiapkan Akun Admin & Menjalankan Backend

### 4.1 Buat / Reset Akun Admin

Jalankan perintah berikut untuk membuat akun di Supabase Auth sekaligus menautkan profilnya ke tabel `public.admins`:

```bash
npm run admin:create -- admin@skanida.sch.id admin123 "Administrator"
```

*(Ganti `admin123` dengan password aman yang kamu inginkan)*

### 4.2 Menjalankan Server

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
| `npm run admin:create` | Buat atau perbarui akun admin di Supabase Auth & profil admins |
| `npm run db:sync` | Sinkronisasi migrasi SQL dari folder database/ ke supabase/ |

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
│   ├── routes/            # daftar endpoint API (auth, request)
│   ├── middleware/        # penjaga: cek login Supabase Auth, rate limiting, error handler
│   └── lib/               # koneksi Supabase, profil admin, validasi form
├── scripts/
│   ├── create-admin.js    # pendaftaran & reset password admin Supabase Auth
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
| POST | `/api/auth/login` | Tidak | Login admin (email + password) → access & refresh token |
| POST | `/api/auth/refresh` | Tidak | Tukar refresh token dengan access token baru |
| POST | `/api/auth/logout` | Opsional | Cabut sesi admin di Supabase Auth |
| GET | `/api/auth/me` | Ya | Cek profil admin dari token aktif |
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
  -d '{"email":"admin@skanida.sch.id","password":"admin123"}'
```

---

## 8. Catatan Keamanan

- **Service role key tidak pernah dikirim ke browser.** Semua operasi tulis lewat backend.
- Password admin disimpan dan diverifikasi oleh **Supabase Auth (schema auth)** dengan hash standar industri. Tabel `public.admins` hanya menyimpan data profil (nama, role) yang terhubung ke `auth.users(id)`.
- Token login admin adalah **Supabase Auth JWT** standar yang diverifikasi langsung oleh backend, didukung refresh token untuk rotasi sesi otomatis tanpa menyimpan rahasia lokal.
- Login dibatasi **10 percobaan per menit per IP** untuk mencegah serangan brute force.
- **Segera ganti password default** setelah akun admin pertama kali dibuat.

---

## 9. Pemecahan Masalah

| Gejala | Penyebab | Solusi |
|---|---|---|
| `Konfigurasi backend belum lengkap` | `.env` belum diisi | Isi `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` |
| `Invalid API key` | Key salah/tertukar | Salin ulang anon & service_role key dengan benar |
| `EADDRINUSE` / port terpakai | Backend lain sudah jalan | Tutup proses lama, atau ubah `PORT` |
| Login: `Email atau password salah` | Kredensial tidak cocok | Coba email / password yang dibuat, atau reset via `npm run admin:create` |
| Login: `Akun ini bukan admin terdaftar` | Akun ada di auth.users tapi profil belum ada di public.admins | Jalankan `npm run admin:create -- <email> <password> <nama>` |
| Frontend tidak bisa konek | `CORS_ORIGIN` salah | Pastikan berisi alamat frontend, mis. `http://localhost:5173` |
| Perubahan `.env` tidak terbaca | Server belum restart | Hentikan (Ctrl+C) lalu `npm run dev` lagi |

---

## Lisensi

PeTa SKANIDA — SMKN 2 Kota Magelang.
