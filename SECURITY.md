# Keamanan PeTa SKANIDA

Dokumen ini berisi **celah yang sudah ditutup** dan **langkah yang masih harus
dilakukan di dashboard Supabase / Vercel**. Kode saja tidak cukup — sebagian
pengamanan harus diaktifkan lewat konfigurasi layanan.

---

## 1. Yang sudah diperbaiki di kode

| Celah | Perbaikan |
|---|---|
| Fallback profil lama `username = 'admin'` bisa diklaim akun Auth mana pun | `getAdminProfile()` sekarang hanya menautkan profil jika **email cocok dan terverifikasi**. Fallback username dihapus. |
| CORS `*` / localhost bisa lolos ke produksi | `config.js` memfilter wildcard dan localhost saat `NODE_ENV=production`. Hanya origin eksplisit + `https://petaskanida.vercel.app`. |
| Data tamu & log scan bisa dibaca siapa pun yang punya anon key | Migration `20261121000001_tighten_rls_no_anon.sql` mencabut policy `SELECT` untuk `anon`. Frontend tidak lagi memakai anon key/realtime; semua lewat backend + polling. |
| Upload surat tugas hanya cek ekstensi/MIME | Backend memeriksa tanda tangan file `%PDF-` sebelum upload. |
| Password minimal 6 karakter | Dinaikkan jadi minimal 8 karakter. |
| Subscription Web Push bisa diisi data sembarangan | Endpoint harus `https://`, dibatasi panjangnya; hanya akun dengan fitur notifikasi yang boleh subscribe. |
| Header keamanan tidak ada | Backend & Vercel mengirim `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`. Respons API `no-store`. |
| Notifikasi bocor ke akun tanpa menu terkait | Filter notifikasi berdasarkan fitur akun (in-app + Web Push). |
| Refresh token gagal saat banyak request paralel → logout | Refresh dedup + refresh lebih awal + gangguan jaringan tidak menghapus sesi. |
| Request tamu bisa di-spam | Rate limit 12 request/menit per IP untuk `POST /api/requests`. |
| Input bebas panjangnya | Batas panjang nama/email/HP/tujuan/keperluan & jumlah pengunjung. |
| Impor database bisa menyisipkan `javascript:` URL | `surat_tugas_url` hanya menerima `http(s)`. |
| CSV formula injection saat dibuka di Excel | Nilai diawali `= + - @` diberi awalan `'` saat ekspor. |
| Anon key ikut terpasang di Vercel | Env `SUPABASE_ANON_KEY` dihapus dari Vercel; backend memakai service role. |

---

## 2. Langkah wajib di Supabase

1. **Matikan pendaftaran publik**
   `Authentication → Providers → Email → Enable Sign Up = OFF`.
   Ini mencegah orang membuat akun Auth sembarangan.

2. **Wajibkan verifikasi email**
   `Authentication → Settings → Confirm email = ON`.

3. **Jalankan semua migration**, terutama:
   - `database/migrations/20261111000000_tighten_rls_policies.sql`
   - `database/migrations/20261120000002_add_features_role.sql`
   - `database/migrations/20261121000000_create_push_subscriptions.sql`
   - `database/migrations/20261121000001_tighten_rls_no_anon.sql`

4. **Pastikan RLS aktif** di semua tabel:
   `req_pending`, `req_acc`, `req_reject`, `riwayat`, `admins`,
   `scan_logs`, `push_subscriptions`.

5. **Service role key hanya di backend / Vercel Environment Variables.**
   Jangan pernah memasukkan `SUPABASE_SERVICE_ROLE_KEY` ke `frontend/.env`
   atau variabel `VITE_*` (nilai `VITE_*` ikut ter-bundle ke browser).

6. **Aktifkan Leaked Password Protection**
   `Authentication → Settings → Leaked Password Protection = ON`.

7. **Periksa bucket Storage `surat-tugas`**
   Saat ini bucket bersifat public agar petugas bisa membuka tautan tanpa
   login. Ini berarti siapa pun yang punya URL bisa membaca PDF tersebut.
   Rekomendasi: jadikan bucket private dan generate **signed URL** dari
   backend saat tautan dibuka. Sampai itu dilakukan, jangan membagikan URL
   surat tugas ke luar sistem.

8. **Audit akun**
   Hapus akun Auth yang tidak dikenal, pastikan hanya 1–2 akun
   `super_admin`, dan cabut sesi lama
   (`Authentication → Users → Sign out all sessions`).

---

## 3. Langkah wajib di Vercel

1. Simpan env berikut di **Project Settings → Environment Variables**:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` (rahasia)
   - `SUPABASE_ANON_KEY`
   - `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`
   - `CORS_ORIGIN` → isi **origin eksplisit**, jangan `*`
   - `PUSH_FRONTEND_URL=https://petaskanida.vercel.app`

   Variabel `VITE_*` ikut ter-bundle ke JavaScript browser — **jangan pernah**
   memasukkan service role key atau rahasia lain ke sana.

2. **`.htaccess` tidak berlaku di Vercel.** Vercel memakai edge/Nginx, bukan
   Apache. File `.htaccess` di root dan di `frontend/public/` hanya berguna
   jika hasil build di-hosting di Apache. Proteksi utama di Vercel adalah
   Environment Variables di dashboard + aturan `.gitignore` yang menjaga
   file `.env` tidak pernah masuk git.

3. **Rotasi token** yang pernah ditempel di chat / terminal. Hapus token lama
   di `Settings → Tokens`.

4. **Batasi akses deployment**: aktifkan Deployment Protection / password
   untuk preview bila project masih dalam pengujian.

5. **Aktifkan rate limiting / WAF** di Vercel untuk `/api/auth/*` dan
   `/api/requests/*`. Rate limiter bawaan backend berbasis memori tidak
   efektif pada serverless multi-instance.

6. **Pantau log** `Functions → Logs`. Perhatikan `401/403` berulang dan
   pesan `[push]` / `[backend]`.

---

## 4. Catatan risiko yang masih ada

- **Token sesi disimpan di `localStorage`.** Jika ada XSS, token bisa dicuri.
  React sudah escape output secara default dan tidak ada
  `dangerouslySetInnerHTML`, tetapi untuk tingkat tinggi pertimbangkan
  httpOnly + Secure + SameSite cookie.
- **Polling dibanding realtime.** Setelah policy anon dicabut, pembaruan data
  mengandalkan polling 5–8 detik. Ini mengorbankan instant update demi
  kerahasiaan data tamu.
- **CSP belum diterapkan** karena halaman memakai inline script untuk tema awal
  dan widget Vercel Live. Jika widget preview tidak dipakai, tambahkan
  `Content-Security-Policy` lewat `vercel.json` dengan `script-src 'self'
  'unsafe-inline'` lalu uji menyeluruh sebelum produksi.
- **Rate limiter memori** tidak bersama antar instance serverless.
- **Cache profil admin 10 detik.** `requireAdmin` menyimpan hasil verifikasi
  token selama maksimal 10 detik di memori instance untuk mengurangi latency.
  Token yang dicabut bisa masih diterima paling lama 10 detik pada instance
  yang sama; logout sudah menghapus cache secara eksplisit.
- **Push dikirim di latar belakang.** Notifikasi tidak lagi meng-blok response,
  tetapi pada serverless pengiriman background tidak dijamin selesai bila
  function langsung di-freeze setelah response. Ini trade-off yang disengaja
  demi tombol yang responsif.

---

## 5. Checklist singkat

```
[ ] Public signup OFF
[ ] Email confirmation ON
[ ] Semua migration dijalankan (termasuk tighten_rls_no_anon)
[ ] RLS aktif di semua tabel
[ ] Service role key hanya di backend/Vercel
[ ] CORS_ORIGIN bukan *
[ ] Token Vercel lama di-rotate
[ ] Bucket surat-tugas ditinjau
[ ] Akun asing dihapus, super_admin dibatasi
[ ] Backup database dijadwalkan
```
