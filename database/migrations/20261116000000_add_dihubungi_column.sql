  -- Tandai tamu yang sudah dihubungi admin (mis. lewat WhatsApp).
  -- Dipakai halaman Kelola Tamu untuk membedakan tamu yang sudah
  -- dihubungi dan yang belum dihubungi.

  ALTER TABLE public.req_pending
    ADD COLUMN IF NOT EXISTS dihubungi boolean NOT NULL DEFAULT false;

  ALTER TABLE public.req_pending
    ADD COLUMN IF NOT EXISTS dihubungi_at timestamptz;
