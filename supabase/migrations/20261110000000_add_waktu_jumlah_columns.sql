-- Tambah kolom waktu (jam kunjungan) dan jumlah (jumlah pengunjung)
-- ke semua tabel yang terkait dengan request kunjungan

ALTER TABLE public.req_pending ADD COLUMN IF NOT EXISTS waktu text;
ALTER TABLE public.req_pending ADD COLUMN IF NOT EXISTS jumlah integer DEFAULT 1;

ALTER TABLE public.req_acc ADD COLUMN IF NOT EXISTS waktu text;
ALTER TABLE public.req_acc ADD COLUMN IF NOT EXISTS jumlah integer DEFAULT 1;

ALTER TABLE public.req_reject ADD COLUMN IF NOT EXISTS waktu text;
ALTER TABLE public.req_reject ADD COLUMN IF NOT EXISTS jumlah integer DEFAULT 1;

ALTER TABLE public.riwayat ADD COLUMN IF NOT EXISTS waktu text;
ALTER TABLE public.riwayat ADD COLUMN IF NOT EXISTS jumlah integer DEFAULT 1;
