# PeTa SKANIDA — Pendataan Kunjungan Tamu SMKN 2 Kota Magelang

**PeTa SKANIDA** adalah aplikasi web untuk **mempermudah pendataan tamu yang berkunjung ke SMKN 2 Kota Magelang**.

Dulu, tamu yang datang biasanya dicatat manual di buku tamu atau spreadsheet: nama bisa terlewat, status kunjungan tidak jelas, dan arsip sulit dicari. Aplikasi ini menggantikan proses tersebut dengan alur digital:

- **Tamu** mengisi form permintaan kunjungan dari mana saja lewat browser.
- **Admin / petugas** menyetujui atau menolak permintaan, memantau tamu yang datang, dan menyimpan riwayatnya.
- **Notifikasi** otomatis muncul saat ada permintaan baru atau perubahan status.
- **Tiket QR/barcode** dipakai petugas untuk mencheck-in tamu di lokasi.
- **Riwayat** bisa dicetak atau diekspor ke Excel/CSV untuk keperluan administrasi sekolah.

Panduan ini ditujukan untuk pemula. Ikuti urutan dari atas ke bawah — tidak perlu pengalaman coding.

---

## Daftar Isi

1. [Tentang Aplikasi](#1-tentang-aplikasi)
2. [Fitur Unggulan](#2-fitur-unggulan)
3. [Yang Harus Disiapkan](#3-yang-harus-disiapkan)
4. [Ambil Kode dari GitHub](#4-ambil-kode-dari-github)
5. [Siapkan Database (Supabase)](#5-siapkan-database-supabase)
6. [Jalankan Backend](#6-jalankan-backend)
7. [Jalankan Frontend](#7-jalankan-frontend)
8. [Buka Aplikasi & Login](#8-buka-aplikasi--login)
9. [Alur Kerja Sehari-hari](#9-alur-kerja-sehari-hari)
10. [Menjalankan Ulang di Lain Hari](#10-menjalankan-ulang-di-lain-hari)
11. [Struktur Folder](#11-struktur-folder)
12. [Pemecahan Masalah](#12-pemecahan-masalah)
13. [Keamanan Penting](#13-keamanan-penting)
14. [Perintah Tambahan & API](#14-perintah-tambahan--api)
15. [Pengaturan Lanjutan](#15-pengaturan-lanjutan)
16. [Lisensi](#16-lisensi)

---

## 1. Tentang Aplikasi

### Masalah yang diatasi

SMKN 2 Kota Magelang menerima banyak tamu: guru dari sekolah lain, siswa studi banding, orang tua, mitra industri, dan instansi pemerintah. Pencatatan manual punya beberapa kelemahan:

| Masalah | Solusi di PeTa SKANIDA |
|---|---|
| Nama tamu tertulis tidak rapi / terlewat | Tamu mengisi sendiri form terstruktur |
| Tidak jelas tamu sudah disetujui atau belum | Status **Pending / Diterima / Ditolak / Selesai** |
| Admin baru tahu ada tamu saat tamu sudah tiba | Notifikasi otomatis saat form dikirim |
| Sulit mencari arsip kunjungan | Pencarian, filter status, dan riwayat tersimpan rapi |
| Buku tamu fisik bisa hilang / rusak | Data tersimpan aman di cloud (Supabase) |
| Laporan dibuat ulang manual | Ekspor **Excel / CSV / cetak PDF** sekali klik |

### Siapa saja yang memakainya

| Peran | Apa yang dilakukan |
|---|---|
| **Tamu** | Mengisi form kunjungan, mendapat tiket QR/barcode |
| **Petugas** | Memindai tiket tamu lewat HP saat check-in |
| **Admin** | Menyetujui/menolak permintaan, menghubungi tamu, menandai selesai |
| **Super admin** | Mengelola akun, pengaturan, dan seluruh data |

### Teknologi yang dipakai

```
Browser (React + Vite + Tailwind)  ──>  Server API (Express)  ──>  Supabase
     tampilan untuk tamu & admin        aturan & keamanan         database, login, file, realtime
```

- **Frontend**: React + Vite + Tailwind CSS — tampilan yang dibuka di browser.
- **Backend**: Express — mengurus login admin, validasi, dan semua penulisan data.
- **Database**: Supabase (PostgreSQL) — menyimpan data, akun admin, file surat tugas, dan update real-time.

Ketiganya harus berjalan supaya aplikasi berfungsi.

---

## 2. Fitur Unggulan

1. **Form permintaan kunjungan** — nama/instansi, email, no. HP, tujuan, keperluan, tanggal, jam, jumlah tamu, dan surat tugas opsional (PDF maks. 4 MB).
2. **Tiket QR + barcode** — otomatis muncul setelah tamu mengirim form, bisa diunduh.
3. **Dashboard admin** — ringkasan request menunggu, diterima, dan ditolak.
4. **Persetujuan & penolakan** — satu klik, status langsung berubah dan data pindah ke kategori yang tepat.
5. **Notifikasi** — muncul di browser/laptop admin (Web Push) dan di dalam dashboard. Klik **Lihat data** pada notifikasi untuk membuka dan menyorot barisnya.
6. **Scan QR/barcode tamu** — petugas memindai dengan kamera HP; hasilnya muncul sebagai notifikasi + bunyi di komputer admin.
7. **Riwayat kunjungan** — arsip rapi, bisa dicari/filter, dan diekspor ke **Lihat Web (PDF)**, **Excel (.xlsx)**, atau **CSV (.csv)**.
8. **Kelola akun** — super admin bisa menambah/edit/hapus admin & petugas dengan pembagian fitur (role).
9. **Real-time + cadangan** — data diperbarui otomatis; bila koneksi realtime terputus, ada polling sebagai cadangan.
10. **Tampilan responsif** — nyaman dipakai di HP, tablet, maupun laptop.
11. **Kelola database (super admin)** — menu **Database** menyediakan statistik tabel, **ekspor** Backup JSON / CSV per tabel, **impor** data dari JSON/CSV langsung di dashboard (tanpa membuka Supabase), dan pembersihan log scan lama. Saat impor, ID baru dibuat otomatis oleh database dan relasi antartabel tetap dipetakan; opsi "lewati data yang sudah ada" mencegah duplikat. Akun pengguna tidak ikut diimpor karena terhubung ke Supabase Auth.

---

## 3. Yang Harus Disiapkan

| Kebutuhan | Keterangan |
|---|---|
| **Node.js versi 18 ke atas** | Untuk menjalankan backend dan frontend. Unduh di <https://nodejs.org>, pilih versi **LTS**. |
| **Akun Supabase (gratis)** | Untuk database. Daftar di <https://supabase.com>. |
| **Git** (opsional) | Untuk mengunduh kode. Bisa juga unduh ZIP. |
| **Browser modern** | Chrome, Edge, Firefox, atau sejenisnya. |
| **Terminal** | Windows: PowerShell / CMD. Mac/Linux: Terminal. |

Cek instalasi Node.js:

```bash
node -v
npm -v
```

Jika muncul nomor versi, berarti siap. Jika `command not found`, pasang Node.js dulu lalu buka ulang terminal.

---

## 4. Ambil Kode dari GitHub

### Cara A — dengan Git (disarankan)

```bash
git clone https://github.com/wildanazizsolikhudin3-code/PeTaSkanida.git
cd PeTaSkanida
```

### Cara B — tanpa Git (unduh ZIP)

1. Buka halaman GitHub proyek.
2. Klik tombol hijau **Code** → **Download ZIP**.
3. Ekstrak file tersebut.
4. Masuk ke folder hasil ekstrak lewat terminal.

> Semua perintah di bawah dijalankan **dari dalam folder `PeTaSkanida`**, kecuali ada keterangan lain.

---

## 5. Siapkan Database (Supabase)

Database hanya perlu disiapkan **sekali**. Jika sudah memakai database yang ada, lanjut ke [Langkah 6](#6-jalankan-backend).

### 5.1 Buat project Supabase

1. Masuk ke <https://supabase.com>, lalu login.
2. Klik **New Project**. Isi nama project, password database, dan pilih region terdekat (misalnya Singapore).
3. Tunggu sampai status project **Active**.

### 5.2 Jalankan file SQL

1. Di dashboard project, buka **SQL Editor** → **New query**.
2. Salun seluruh isi `database/schema.sql`, tempel, lalu klik **Run** (Ctrl+Enter).
3. Pastikan tidak ada error merah. Perintah ini membuat tabel, aturan keamanan, dan realtime.

**Database yang sudah berjalan:** jalankan juga migration yang belum pernah dijalankan dari folder `database/migrations/`. Yang terbaru:

- `20261121000000_create_push_subscriptions.sql` — wajib untuk notifikasi browser.

Data contoh opsional: jalankan `database/seed.sql`.

### 5.3 Ambil 3 nilai penting

Buka **Project Settings** → **API / API Keys**. Catat:

| Nilai | Dipakai di |
|---|---|
| **Project URL** (`https://xxxxx.supabase.co`) | Backend & Frontend |
| **Anon / public key** | Frontend & Backend |
| **Service role key** | **Hanya Backend** |

> ⚠️ **Service role key adalah kunci rahasia.** Jangan pernah ditaruh di frontend atau dibagikan.

Detail lengkap ada di [`database/README.md`](database/README.md).

---

## 6. Jalankan Backend

### 6.1 Install kebutuhan

```bash
cd backend
npm install
```

### 6.2 Buat file `.env`

**Windows:** `copy .env.example .env`  
**Mac/Linux:** `cp .env.example .env`

### 6.3 Isi `backend/.env`

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

- `SUPABASE_URL` → Project URL dari Langkah 5.3.
- `SUPABASE_SERVICE_ROLE_KEY` → service role key.
- `SUPABASE_ANON_KEY` → anon key.
- Untuk notifikasi browser, buat kunci VAPID dengan `npm run push:keys` lalu isi dua baris VAPID di atas.

> **Catatan:** login admin memakai **Supabase Auth**, sehingga `AUTH_SECRET` dan `TOKEN_TTL_SECONDS` tidak dipakai. Simpan `.env` sebagai **UTF-8 tanpa BOM** dan tanpa tanda kutip di sekitar nilai.

### 6.4 Buat akun super admin

```bash
npm run admin:create -- admin@skanida.sch.id admin123 "Administrator" super_admin
```

Ganti `admin123` dengan password yang kuat. Role yang tersedia: `petugas`, `admin`, `super_admin`. Buat minimal satu `super_admin`.

### 6.5 Jalankan server

```bash
npm run dev
```

Jika berhasil:

```
[backend] PeTa SKANIDA API berjalan di http://localhost:3001/api
```

Biarkan terminal ini tetap terbuka. Cek kesehatan di <http://localhost:3001/api/health> — harus muncul `{"status":"ok","service":"peta-skanida-backend"}`.

Detail: [`backend/README.md`](backend/README.md).

---

## 7. Jalankan Frontend

Buka **terminal baru** (jangan tutup terminal backend), dari folder utama:

```bash
cd frontend
npm install
copy .env.example .env     # Windows
cp .env.example .env       # Mac/Linux
```

Isi `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:3001/api
VITE_SUPABASE_URL=https://PROJECT-URL-KAMU.supabase.co
VITE_SUPABASE_ANON_KEY=TEMPEL-ANON-KEY
```

Lalu jalankan:

```bash
npm run dev
```

Akan muncul alamat **<http://localhost:5173/>**. Biarkan terminal tetap terbuka.

Detail: [`frontend/README.md`](frontend/README.md).

---

## 8. Buka Aplikasi & Login

Buka browser ke **<http://localhost:5173/>**.

- **Tamu** → mengisi form permintaan kunjungan.
- **Admin / Pengelola** → login menggunakan email + password yang dibuat di Langkah 6.4.

| Email | Password |
|---|---|
| `admin@skanida.sch.id` | `admin123` *(atau password yang kamu buat)* |

> 🔒 Segera ganti password default. Bisa lewat `npm run admin:create -- <email> <password-baru> "Administrator"` atau Supabase Dashboard → **Authentication → Users**.

---

## 9. Alur Kerja Sehari-hari

### Tamu

1. Buka aplikasi → pilih **Tamu**.
2. Isi form (nama/instansi, tujuan, keperluan, tanggal, jam, jumlah, no. HP; email & surat tugas opsional).
3. Setelah terkirim, muncul **tiket QR + barcode** berisi kode `REQ-xxx`. Unduh/simpan tiket.
4. Admin akan memproses permintaan; status bisa dilihat lewat notifikasi/konfirmasi sekolah.

### Admin

1. Login → **Daftar Request** → pilih **Terima** atau **Tolak**.
2. Notifikasi otomatis terkirim ke perangkat admin.
3. Di **Kelola Tamu**, hubungi tamu via WhatsApp dan tandai sudah dihubungi.
4. Saat kunjungan selesai, klik **Selesai** → data pindah ke **Riwayat Kunjungan**.
5. Di **Riwayat Kunjungan**, cari/filter data lalu ekspor ke PDF/Excel/CSV bila perlu.

### Petugas lapangan

1. Login di HP → menu **Scan Tamu** → aktifkan kamera.
2. Arahkan kamera ke QR/barcode tiket tamu.
3. Hasil scan muncul di layar petugas dan sekaligus sebagai notifikasi + bunyi di komputer admin.

---

## 10. Menjalankan Ulang di Lain Hari

Cara paling mudah, dari folder utama:

```bash
npm run dev        # menjalankan backend + frontend sekaligus
```

Atau terpisah:

```bash
npm run dev:backend    # terminal 1
npm run dev:frontend   # terminal 2
```

> Jika `node_modules` sudah dihapus, jalankan `npm run install:all` dulu.

---

## 11. Struktur Folder

```
PeTaSkanida/
├── frontend/    # Tampilan web (React + Vite) — form tamu & dashboard admin
├── backend/     # Server API (Express) — login, validasi, notifikasi
├── database/    # SQL Supabase (schema, seed, migration)
├── scripts/     # Skrip bantu menjalankan mode dev
└── README.md    # Panduan ini
```

| Folder | Penjelasan | Panduan |
|---|---|---|
| `frontend/` | Yang dilihat tamu & admin di browser | [`frontend/README.md`](frontend/README.md) |
| `backend/` | Penghubung tampilan ke database | [`backend/README.md`](backend/README.md) |
| `database/` | Struktur & aturan database | [`database/README.md`](database/README.md) |

> **`node_modules` bukan kode program.** Folder ini dihasilkan `npm install`, diabaikan Git, dan aman dihapus kapan saja. Jangan menyalinnya dari komputer/OS lain — bisa muncul error seperti `Cannot find module @rollup/...`.

---

## 12. Pemecahan Masalah

| Gejala | Penyebab | Solusi |
|---|---|---|
| `node: command not found` | Node.js belum terpasang | Pasang dari <https://nodejs.org>, lalu buka ulang terminal |
| `npm install` gagal | Internet / cache bermasalah | Coba lagi atau `npm cache clean --force` |
| Error `Cannot find module @rollup/...` | `node_modules` disalin dari OS lain | Hapus semua `node_modules`, jalankan `npm run install:all` |
| Backend: **"Konfigurasi backend belum lengkap"** | `.env` belum diisi | Isi `SUPABASE_URL` dan key (Langkah 6.3) |
| Backend: **"Invalid API key"** | Key tertukar | Salin ulang anon & service role key |
| Frontend: **"Tidak dapat terhubung ke backend"** | Backend mati / URL salah | Pastikan backend jalan dan `VITE_API_BASE_URL` benar |
| Halaman kosong / error Supabase | `frontend/.env` belum diisi | Isi lalu restart `npm run dev` |
| Login admin gagal | Akun belum dibuat / password salah | Buat/reset lewat `npm run admin:create` |
| Data tidak muncul | `schema.sql` belum dijalankan | Jalankan ulang di Supabase SQL Editor |
| Real-time tidak update | Realtime belum aktif | Jalankan `database/migrations/20261110000002_enable_realtime.sql` |
| `Could not find the table 'public.push_subscriptions'` | Migration notifikasi belum dijalankan | Jalankan `database/migrations/20261121000000_create_push_subscriptions.sql` |
| Notifikasi browser tidak muncul | Izin push ditolak / bukan HTTPS | Klik ikon lonceng di header, izinkan notifikasi, gunakan HTTPS atau localhost |
| Port dipakai (`EADDRINUSE`) | Port 3001/5173 sudah dipakai | Tutup aplikasi lain atau ubah `PORT` |

**Urutan yang benar:** Database siap → Backend jalan (`:3001`) → Frontend jalan (`:5173`) → buka browser.

---

## 13. Keamanan Penting

- **Panduan lengkap & checklist:** baca [`SECURITY.md`](SECURITY.md).
- **Jangan pernah commit file `.env`** (sudah diabaikan `.gitignore`).
- **Service role key** hanya di `backend/.env`, tidak di frontend.
- **Password admin** dikelola Supabase Auth dengan hash standar industri; ganti password default segera (minimal 8 karakter).
- `VAPID_PRIVATE_KEY` adalah kunci rahasia penandatangan notifikasi — hanya di `backend/.env`, jangan pernah di frontend atau di-commit.
- Untuk pemakaian publik, jalankan backend di server (bukan laptop) dan gunakan **HTTPS**.

---

## 14. Perintah Tambahan & API

Dijalankan dari folder utama `PeTaSkanida`:

| Perintah | Fungsi |
|---|---|
| `npm run install:all` | Install kebutuhan frontend + backend sekaligus |
| `npm run dev` | Jalankan frontend & backend bersamaan |
| `npm run dev:backend` / `npm run dev:frontend` | Jalankan salah satu saja |
| `npm run build` | Buat versi produksi frontend di `frontend/dist` |
| `npm run db:sync` | Salin migration ke folder backend |
| `npm run admin:create -- <email> <pwd> [nama] [role]` | Buat/perbarui akun admin |
| `cd backend && npm run push:keys` | Buat kunci VAPID untuk notifikasi browser |

### Endpoint API utama

| Method | Endpoint | Login admin? | Keterangan |
|---|---|---|---|
| GET | `/api/health` | Tidak | Cek server hidup |
| POST | `/api/auth/login` | Tidak | Login admin |
| POST | `/api/auth/refresh` | Tidak | Perbarui token |
| POST | `/api/auth/logout` | Opsional | Cabut sesi |
| GET | `/api/auth/me` | Ya | Profil admin aktif |
| POST | `/api/requests` | Tidak | Form pengajuan tamu |
| GET | `/api/requests` | Ya | Daftar request + status |
| POST | `/api/requests/:id/approve` | Ya | Setujui |
| POST | `/api/requests/:id/reject` | Ya | Tolak |
| POST | `/api/requests/:id/complete` | Ya | Selesai → riwayat |
| PATCH | `/api/requests/:id/contacted` | Ya | Tandai sudah dihubungi |
| POST | `/api/requests/admin` | Ya | Tambah tamu oleh admin |
| PATCH / DELETE | `/api/requests/:id` | Ya | Edit / hapus tamu |
| POST / PATCH / DELETE | `/api/history` ... | Ya | Kelola arsip riwayat |
| GET / POST / PATCH / DELETE | `/api/admin/users` ... | Ya | Kelola akun admin |
| POST / GET | `/api/scans` | Ya | Catat & baca scan QR |
| GET | `/api/push/public-key` | Tidak | Kunci publik untuk langganan browser |
| POST / DELETE | `/api/push/subscribe` | Ya | Aktifkan / matikan notifikasi perangkat |

Endpoint yang butuh login memakai header: `Authorization: Bearer <token>`.

---

## 15. Pengaturan Lanjutan

### Surat tugas (opsional)

Form tamu bisa menerima PDF maks. 4 MB yang disimpan di bucket Supabase Storage **`surat-tugas`**.

```bash
cd backend && npm run storage:setup
```

Jalankan juga `database/migrations/20261120000000_add_surat_tugas_columns.sql` di SQL Editor, lalu restart backend. `SURAT_TUGAS_EMAIL` di `.env` adalah alamat tujuan yang ditampilkan ke tamu; nilai awalnya `rubikesper@gmail.com`, cukup diganti saat email sekolah sudah tersedia.

### Scan QR / barcode tamu

Setelah tamu mengirim form, halaman sukses menampilkan barcode + QR berisi `REQ-xxx`. Petugas memindainya lewat menu **Scan Tamu** di HP; hasilnya muncul sebagai notifikasi + bunyi di komputer admin dan tercatat di tabel `scan_logs`.

- Jalankan `database/migrations/20261120000001_create_scan_logs.sql`.
- Kamera browser hanya jalan lewat **HTTPS** atau `localhost` (bukan `http://192.168.x.x`).
- Data pribadi tamu tidak disimpan di `scan_logs`; detail diambil lewat backend yang wajib login.

### Notifikasi browser (Web Push)

Notifikasi dikirim ke browser admin walau dashboard sedang tidak dibuka. Pesan muncul saat tamu mendaftar dan saat status berubah menjadi **Diterima / Ditolak / Selesai**. Notifikasi ini **tidak memakai nomor WhatsApp sekolah**, jadi tidak ada risiko pembatasan akun.

**Apa itu kunci VAPID dan dari mana asalnya?**

VAPID (*Voluntary Application Server Identification*) adalah pasangan kunci yang dipakai Web Push untuk mengenali **siapa pengirim notifikasinya**.

| Kunci | Fungsi | Boleh dibagikan? |
|---|---|---|
| `VAPID_PUBLIC_KEY` | Diberikan ke browser saat admin mengaktifkan notifikasi, lalu diteruskan ke layanan push (Google/Chromium, Mozilla, Apple) agar langganan terkait dengan aplikasi sekolah | **Ya** — memang dikirim ke browser |
| `VAPID_PRIVATE_KEY` | Dipakai backend untuk **menandatangani** setiap pesan. Layanan push menolak pesan bila tanda tangannya tidak cocok dengan public key | **Tidak** — rahasia, hanya di `backend/.env` |
| `VAPID_SUBJECT` | Alamat kontak admin (format `mailto:...`) yang ikut dikirim ke layanan push | Ya |

Keduanya **sepasang** dan dibuat lokal, bukan dari WA/Supabase, serta tidak perlu pendaftaran berbayar. Cara membuatnya:

```bash
cd backend
npm run push:keys
```

Perintah itu mencetak kedua kunci; salin ke `backend/.env`. Kunci sudah dibuat di environment ini — tidak perlu dibuat lagi kecuali ingin menggantinya.

> ⚠️ Jika kunci diganti, langganan di browser lama menjadi tidak valid. Admin perlu membuka dashboard dan mengklik **lonceng** lagi untuk mendaftar ulang. Simpan kunci yang sudah ada dengan baik.

**Setup notifikasi (sekali):**

1. Pastikan `VAPID_PUBLIC_KEY` dan `VAPID_PRIVATE_KEY` terisi di `backend/.env` (cara membuat ada di atas).
2. Jalankan `database/migrations/20261121000000_create_push_subscriptions.sql` di SQL Editor, lalu restart backend.
3. Buka dashboard di **HTTPS** (atau `localhost`), klik **ikon lonceng** di header, izinkan notifikasi.

Klik **Lihat data** pada notifikasi: aplikasi langsung membuka halaman yang benar dan **menyorot barisnya** selama beberapa detik.

> **Tentang storage:** notifikasi tidak menyimpan isi pesan di database. Yang tersimpan hanya satu baris subscription per perangkat (endpoint + kunci enkripsi).

Jika izin push ditolak, notifikasi tetap muncul di dalam dashboard (cadangan pengecekan tiap 15 detik).

### Ekspor & cetak riwayat

Tombol **Ekspor & Cetak** di halaman Riwayat Kunjungan menyediakan:

- **Lihat Web** — halaman laporan rapi di tab baru, lengkap dengan tombol Cetak/Simpan PDF.
- **Excel (.xlsx)** — file Excel asli.
- **CSV (.csv)** — UTF-8, aman untuk huruf Indonesia.

Ekspor mengikuti filter/pencarian yang sedang aktif dan hanya muncul untuk akun dengan fitur **Cetak Riwayat**.

---

## 16. Lisensi

PeTa SKANIDA — SMKN 2 Kota Magelang. Dibangun untuk mempermudah pendataan kunjungan tamu sekolah.
