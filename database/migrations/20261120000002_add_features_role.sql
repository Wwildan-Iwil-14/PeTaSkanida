-- Fitur per akun + role super_admin.
--
-- admins.features menyimpan daftar fitur yang boleh diakses akun. Bila NULL,
-- akun memakai fitur bawaan role-nya (lihat backend/src/lib/features.js).
-- Role yang didukung: petugas, admin, super_admin.

ALTER TABLE public.admins
  ADD COLUMN IF NOT EXISTS features text[];

-- Batasi nilai role agar tidak ada role asing yang lolos.
ALTER TABLE public.admins
  DROP CONSTRAINT IF EXISTS admins_role_check;

ALTER TABLE public.admins
  ADD CONSTRAINT admins_role_check
  CHECK (role IN ('petugas', 'admin', 'super_admin'));

-- Akun lama dengan role di luar daftar dianggap admin biasa.
UPDATE public.admins
SET role = 'admin'
WHERE role IS NULL OR role NOT IN ('petugas', 'admin', 'super_admin');
