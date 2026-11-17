-- Tabel admin + function verifikasi password (bcrypt via pgcrypto)
-- RLS aktif tanpa policy = semua akses langsung diblokir untuk anon/authenticated
-- Function verify_admin menggunakan SECURITY DEFINER untuk membypass RLS

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.admins (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  username text UNIQUE NOT NULL,
  email text,
  password_hash text NOT NULL,
  nama text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.verify_admin(p_username text, p_password text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_nama text;
  v_hash text;
BEGIN
  SELECT nama, password_hash INTO v_nama, v_hash
  FROM public.admins
  WHERE username = p_username;

  IF v_hash IS NULL THEN
    RETURN NULL;
  END IF;

  IF v_hash = crypt(p_password, v_hash) THEN
    RETURN v_nama;
  END IF;

  RETURN NULL;
END;
$$;

-- Admin default: username 'admin', password 'admin123'
-- GANTI password ini setelah login pertama!
INSERT INTO public.admins (username, email, password_hash, nama)
VALUES ('admin', 'admin@skanida.sch.id', crypt('admin123', gen_salt('bf')), 'Administrator')
ON CONFLICT (username) DO NOTHING;
