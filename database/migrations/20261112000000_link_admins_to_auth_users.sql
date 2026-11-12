-- Perkuat autentikasi admin memakai Supabase Auth (schema auth / GoTrue).
--
-- Sebelumnya password admin diverifikasi oleh fungsi verify_admin yang berupa
-- SECURITY DEFINER dan bisa dipanggil langsung oleh anon lewat PostgREST
-- (/rest/v1/rpc/verify_admin) sehingga rentan brute-force. Dengan Supabase Auth:
--
--   1. Login (email + password) diurus GoTrue: rate limit, hash, & sesi standar.
--   2. public.admins menjadi PROFIL admin (nama, role) yang dihubungkan ke
--      auth.users lewat kolom user_id — hanya user yang punya baris profil
--      yang diterima sebagai admin oleh backend.
--   3. Jalur verifikasi lama (verify_admin + password_hash) dihapus.
--
-- Prasyarat: jalankan file ini di Supabase SQL Editor, lalu buat akun admin
-- dengan skrip backend (dari folder backend):
--   npm run admin:create -- admin@skanida.sch.id admin123 "Administrator"

-- 1) Hubungkan profil admin ke akun Supabase Auth
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'admins' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.admins ADD COLUMN user_id uuid;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public' AND table_name = 'admins' AND constraint_name = 'admins_user_id_fkey'
  ) THEN
    ALTER TABLE public.admins
      ADD CONSTRAINT admins_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS admins_user_id_key ON public.admins (user_id);

-- 2) Role admin (untuk pembagian hak akses di masa depan)
ALTER TABLE public.admins
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'admin';

-- 3) Username lama hanya arsip — login sekarang memakai email
ALTER TABLE public.admins
  ALTER COLUMN username DROP NOT NULL;

-- 4) Password tidak lagi disimpan di tabel ini (diurus Supabase Auth)
ALTER TABLE public.admins
  DROP COLUMN IF EXISTS password_hash;

-- 5) Hapus jalur verifikasi lama agar tidak bisa dipanggil lewat PostgREST
DROP FUNCTION IF EXISTS public.verify_admin(text, text);

-- 6) Policy RLS: anon dilarang membaca, tetapi admin yang terautentikasi
-- diizinkan membaca profil miliknya sendiri (auth.uid() = user_id)
DROP POLICY IF EXISTS "select_own_admin_profile" ON public.admins;
CREATE POLICY "select_own_admin_profile" ON public.admins
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
