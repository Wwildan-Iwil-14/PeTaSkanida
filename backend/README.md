# PeTa SKANIDA — Backend (Server API)

Backend adalah **server kecil** yang menjadi perantara antara tampilan web dan database. Semua operasi penting — login admin, pengajuan tamu, persetujuan, penolakan, notifikasi, dan scan QR — berjalan lewat sini. Kunci rahasia database **hanya** disimpan di backend, tidak pernah di frontend.

> **Tujuan aplikasi:** mempermudah pendataan tamu yang berkunjung ke **SMKN 2 Kota Magelang**. Backend memastikan setiap kunjungan tercatat rapi, statusnya jelas, dan admin mendapat notifikasi dengan aman.

> **Analogi:** Frontend = kasir yang melayani tamu. Backend = gudang yang mengambil dan menyimpan barang. Database = rak penyimpanan. Tamu tidak masuk gudang langsung, melainkan lewat kasir → gudang → rak.

---

## Daftar Isi

1. [Yang Dibutuhkan](#1-yang-dibutuhkan)
2. [Install Kebutuhan](#2-install-kebutuhan)
3. [Buat & Isi File `.env`](#3-buat--isi-file-env)
4. [Menyiapkan Akun Admin & Menjalankan Backend](#4-menyiapkan-akun-admin--menjalankan-backend)
5. [Cek Backend Berjalan](#5-cek-backend-berjalan)
6. [Isi Folder](#6-isi-folder)
7. [Daftar Endpoint API](#7-daftar-endpoint-api)
8. [Catatan Keamanan](#8-catatan-keamanan)
9. [Pemecahan Masalah](#9-pemecahan-masalah)
10. [Notifikasi Browser (Web Push)](#10-notifikasi-browser-web-push)
11. [Lisensi](#11-lisensi)

---

## 1. Yang Dibutuhkan

- **Node.js 18+** (cek: `node -v`)
- **Database Supabase sudah disiapkan** — lihat [`../database/README.md`](../database/README.md)
- **Tiga nilai dari Supabase** (Project Settings → API): **Project URL**, **anon key**, **service_role key**

---

## 2. Install Kebutuhan

Dari folder utama `PeTaSkanida`:

```bash
cd backend
npm install
```

Cukup dijalankan sekali (atau saat ada library baru).

> `node_modules` dihasilkan oleh `npm install`, tidak disimpan di Git, dan aman dihapus. Jangan menyalinnya dari komputer/OS lain — beda sistem operasi bisa menyebabkan error.

---

## 3. Buat & Isi File `.env`

File `.env` menyimpan pengaturan dan kunci rahasia. **Jangan unggah ke GitHub** (sudah diabaikan `.gitignore`).

**Windows:** `copy .env.example .env`  
**Mac/Linux:** `cp .env.example .env`

### Contoh isi `backend/.env`

```env
PORT=3001
SUPABASE_URL=https://PROJECT-URL-KAMU.supabase.co
SUPABASE_SERVICE_ROLE_KEY=TEMPEL-SERVICE-ROLE-KEY
SUPABASE_ANON_KEY=TEMPEL-ANON-KEY
CORS_ORIGIN=http://localhost:5173

# Notifikasi browser (Web Push)
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:admin@petaskanida.sch.id
```

| Variabel | Wajib? | Fungsi |
|---|---|---|
| `PORT` | Ya | Port server API (default `3001`) |
| `SUPABASE_URL` | **Ya** | Alamat project Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | **Ya** | Kunci akses penuh untuk menulis data. **Rahasia.** |
| `SUPABASE_ANON_KEY` | Opsional | Cadangan jika service role key belum diisi |
| `CORS_ORIGIN` | Ya | Alamat frontend yang diizinkan (pisahkan dengan koma) |
| `VAPID_PUBLIC_KEY` | Ya untuk notifikasi | Kunci publik Web Push, dibuat dengan `npm run push:keys` |
| `VAPID_PRIVATE_KEY` | Ya untuk notifikasi | Kunci privat Web Push. **Rahasia**, hanya di backend |
| `VAPID_SUBJECT` | Opsional | Kontak admin untuk Web Push, default `mailto:admin@petaskanida.sch.id` |
| `PUSH_FRONTEND_URL` | Opsional | URL dashboard saat notifikasi diklik |
| `SURAT_TUGAS_EMAIL` | Opsional | Email tujuan yang ditampilkan ke tamu |

> **Catatan:** masa berlaku token & refresh token diurus langsung oleh **Supabase Auth (GoTrue)**. Variabel `AUTH_SECRET` dan `TOKEN_TTL_SECONDS` tidak dipakai lagi.
>
> **Tips:** simpan sebagai **UTF-8 tanpa BOM**, tanpa tanda kutip di sekitar nilai.

---

## 4. Menyiapkan Akun Admin & Menjalankan Backend

### 4.1 Buat / reset akun admin

Mendaftarkan akun di Supabase Auth sekaligus membuat profil di `public.admins`:

```bash
npm run admin:create -- admin@skanida.sch.id admin123 "Administrator" super_admin
```

Ganti `admin123` dengan password kuat. Jika email sudah terdaftar, skrip memperbarui passwordnya. Role: `petugas`, `admin`, `super_admin`.

### 4.2 Jalankan server

```bash
npm run dev
```

Jika berhasil:

```
[backend] PeTa SKANIDA API berjalan di http://localhost:3001/api
[backend] Mengakses database dengan service role key (akses penuh).
```

**Biarkan terminal tetap terbuka** selama aplikasi dipakai.

| Perintah | Kegunaan |
|---|---|
| `npm run dev` | Mode pengembangan (auto-restart saat kode berubah) |
| `npm start` | Mode produksi |
| `npm run admin:create` | Buat/perbarui akun admin |
| `npm run db:sync` | Salin migration SQL ke `backend/supabase/migrations` |
| `npm run storage:setup` | Buat bucket `surat-tugas` di Supabase Storage |
| `npm run push:keys` | Buat kunci VAPID untuk Web Push |

---

## 5. Cek Backend Berjalan

Buka <http://localhost:3001/api/health>. Harus muncul:

```json
{"status":"ok","service":"peta-skanida-backend"}
```

Jika error, lihat [bagian 9](#9-pemecahan-masalah).

---

## 6. Isi Folder

```
backend/
├── src/
│   ├── server.js              # titik mulai server
│   ├── app.js                 # Express: CORS, JSON, routing
│   ├── config.js              # membaca & memeriksa .env
│   ├── routes/
│   │   ├── auth.routes.js     # login, refresh, logout, profil
│   │   ├── request.routes.js  # form tamu & approve/reject/complete
│   │   ├── history.routes.js  # arsip kunjungan
│   │   ├── user.routes.js     # kelola admin/petugas
│   │   ├── scan.routes.js     # log scan QR tamu
│   │   ├── database.routes.js # statistik & backup
│   │   └── push.routes.js     # langganan notifikasi browser
│   ├── middleware/            # auth JWT, rate limit, upload, error handler
│   └── lib/
│       ├── supabase.js        # koneksi database
│       ├── admins.js          # profil admin
│       ├── validate.js        # validasi form
│       ├── storage.js         # upload surat tugas
│       └── push.js            # pengirim Web Push
├── scripts/                   # admin, migrasi, storage, VAPID, tes WA
├── supabase/                  # konfigurasi Supabase CLI (opsional)
├── .env.example               # contoh .env
└── package.json               # dependensi & perintah
```

---

## 7. Daftar Endpoint API

| Method | Endpoint | Login admin? | Keterangan |
|---|---|---|---|
| GET | `/` | Tidak | Info bahwa backend berjalan |
| GET | `/api/health` | Tidak | Cek kesehatan server |
| POST | `/api/auth/login` | Tidak | Login admin → access & refresh token |
| POST | `/api/auth/refresh` | Tidak | Tukar refresh token |
| POST | `/api/auth/logout` | Opsional | Cabut sesi |
| GET | `/api/auth/me` | Ya | Profil admin aktif |
| POST | `/api/requests` | Tidak | Tamu mengirim permintaan kunjungan |
| GET | `/api/requests` | Ya | Daftar request + status |
| POST | `/api/requests/:id/approve` | Ya | Setujui permintaan |
| POST | `/api/requests/:id/reject` | Ya | Tolak permintaan |
| POST | `/api/requests/:id/complete` | Ya | Selesai → pindah ke riwayat |
| PATCH | `/api/requests/:id/contacted` | Ya | Tandai sudah/belum dihubungi |
| POST | `/api/requests/admin` | Ya | Tambah tamu oleh admin |
| PATCH | `/api/requests/:id` | Ya | Edit tamu |
| DELETE | `/api/requests/:id` | Ya | Hapus tamu |
| POST / PATCH / DELETE | `/api/history` ... | Ya | Kelola arsip riwayat |
| GET / POST / PATCH / DELETE | `/api/admin/users` ... | Ya | Kelola akun admin/petugas |
| POST | `/api/scans` | Ya | Simpan hasil scan QR |
| GET | `/api/scans` | Ya | Ambil log scan terbaru |
| GET | `/api/push/public-key` | Tidak | Kunci publik VAPID |
| POST | `/api/push/subscribe` | Ya | Simpan subscription browser |
| DELETE | `/api/push/subscribe` | Ya | Hapus subscription browser |

Endpoint yang butuh login memakai header `Authorization: Bearer <token>`.

Contoh login lewat terminal:

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@skanida.sch.id","password":"admin123"}'
```

---

## 8. Catatan Keamanan

- **Service role key tidak pernah dikirim ke browser.** Semua penulisan data lewat backend.
- Password admin diverifikasi oleh **Supabase Auth** dengan hash standar industri; `public.admins` hanya menyimpan profil (nama, role).
- Token admin adalah JWT Supabase Auth standar, diverifikasi backend, dengan refresh token otomatis.
- Login dibatasi **10 percobaan per menit per IP**.
- `VAPID_PRIVATE_KEY` **rahasia**, hanya di `.env` backend. `VAPID_PUBLIC_KEY` aman dibagikan ke browser.
- Tabel `push_subscriptions` tidak memiliki policy anon — hanya backend yang mengakses.
- **Segera ganti password default** setelah akun dibuat.

---

## 9. Pemecahan Masalah

| Gejala | Penyebab | Solusi |
|---|---|---|
| `Konfigurasi backend belum lengkap` | `.env` belum diisi | Isi `SUPABASE_URL` & `SUPABASE_SERVICE_ROLE_KEY` |
| `Invalid API key` | Key tertukar | Salin ulang anon & service role key |
| `EADDRINUSE` | Port terpakai | Tutup proses lama atau ubah `PORT` |
| Login: `Email atau password salah` | Kredensial tidak cocok | Reset lewat `npm run admin:create` |
| Login: `Akun ini bukan admin terdaftar` | Profil belum ada di `public.admins` | Jalankan `npm run admin:create -- <email> <password> <nama>` |
| Frontend tidak bisa konek | `CORS_ORIGIN` salah | Isi dengan alamat frontend, mis. `http://localhost:5173` |
| `.env` tidak terbaca | Server belum direstart | Ctrl+C lalu `npm run dev` lagi |
| `Could not find the table 'public.push_subscriptions'` | Migration belum dijalankan | Jalankan `database/migrations/20261121000000_create_push_subscriptions.sql` di SQL Editor |
| Notifikasi browser tidak sampai | VAPID key kosong / subscription belum tersimpan / kunci diganti | Jalankan `npm run push:keys`, cek migration & izin browser; jika kunci diganti, klik lonceng lagi |

---

## 10. Notifikasi Browser (Web Push)

Notifikasi muncul langsung di browser admin saat ada tamu baru atau perubahan status (**Diterima / Ditolak / Selesai**), walau dashboard sedang tidak dibuka. Tidak memakai nomor WhatsApp sekolah, jadi tidak ada risiko pembatasan akun.

### Kunci VAPID: apa dan dari mana?

VAPID (*Voluntary Application Server Identification*) adalah **pasangan kunci** yang dipakai protokol Web Push untuk mengenali server pengirim notifikasi.

| Kunci | Fungsi | Boleh dibagikan? |
|---|---|---|
| `VAPID_PUBLIC_KEY` | Dikirim ke browser saat admin mengaktifkan notifikasi (`pushManager.subscribe`), lalu diteruskan ke layanan push (Google/Chromium, Mozilla, Apple) agar langganan terkait dengan aplikasi sekolah | **Ya** — memang dikirim ke browser |
| `VAPID_PRIVATE_KEY` | Dipakai backend untuk **menandatangani JWT** pada setiap request pengiriman. Layanan push menolak pesan bila tanda tangan tidak cocok dengan public key | **Tidak** — rahasia, hanya di `backend/.env` |
| `VAPID_SUBJECT` | Kontak admin berformat `mailto:...` yang ikut dikirim ke layanan push | Ya |

Keduanya **sepasang**. Kunci ini **bukan** token WhatsApp dan **bukan** kunci Supabase. Tidak perlu mendaftar atau membayar ke vendor push — browser sudah punya layanan push bawaan.

Cara membuatnya (dari folder `backend`):

```bash
npm run push:keys
```

Skrip ini memanggil `web-push.generateVAPIDKeys()` dan mencetak `VAPID_PUBLIC_KEY` serta `VAPID_PRIVATE_KEY`. Salin keduanya ke `.env`. Kunci di environment ini **sudah dibuat**; Anda hanya perlu membuat ulang bila ingin menggantinya.

> ⚠️ Mengganti kunci membuat semua langganan lama tidak valid. Admin harus membuka dashboard dan mengklik **lonceng** lagi supaya subscribe ulang. Simpan kunci yang sudah ada dengan aman.

### Setup notifikasi

1. Pastikan `VAPID_PUBLIC_KEY` dan `VAPID_PRIVATE_KEY` terisi di `.env`.
2. Jalankan `database/migrations/20261121000000_create_push_subscriptions.sql` di **Supabase SQL Editor**, lalu restart backend.
3. Di browser admin (**HTTPS** atau `localhost`), klik **ikon lonceng** di header dan izinkan notifikasi.

### Catatan teknis

- Tabel `push_subscriptions` hanya menyimpan endpoint perangkat + kunci enkripsi (satu baris per perangkat). **Isi pesan tidak disimpan di database**, jadi tidak menambah storage.
- Subscription kedaluwarsa (HTTP 404/410) dihapus otomatis.
- Pengiriman **fail-soft**: kegagalan tidak menggagalkan form tamu/perubahan status; detail ada di konsol backend.
- Karena backend di-deploy di Vercel (serverless), pengiriman di-`await` dengan batas 7 detik agar tidak terputus saat fungsi di-freeze.
- Frontend punya notifikasi in-app + polling 15 detik sebagai cadangan bila Realtime/izin push tidak aktif.

---

## 11. Lisensi

PeTa SKANIDA — SMKN 2 Kota Magelang. Dibangun untuk mempermudah pendataan kunjungan tamu sekolah.
