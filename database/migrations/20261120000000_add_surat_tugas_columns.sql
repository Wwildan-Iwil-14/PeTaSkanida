-- Surat tugas tamu (opsional, PDF maks. 4 MB) diunggah ke bucket Supabase
-- Storage "surat-tugas". Tautan & metadata disimpan supaya admin bisa
-- membuka berkas dari tabel request.

ALTER TABLE public.req_pending
  ADD COLUMN IF NOT EXISTS surat_tugas_url text,
  ADD COLUMN IF NOT EXISTS surat_tugas_drive_id text,
  ADD COLUMN IF NOT EXISTS surat_tugas_nama text;

ALTER TABLE public.req_acc
  ADD COLUMN IF NOT EXISTS surat_tugas_url text,
  ADD COLUMN IF NOT EXISTS surat_tugas_drive_id text,
  ADD COLUMN IF NOT EXISTS surat_tugas_nama text;

ALTER TABLE public.req_reject
  ADD COLUMN IF NOT EXISTS surat_tugas_url text,
  ADD COLUMN IF NOT EXISTS surat_tugas_drive_id text,
  ADD COLUMN IF NOT EXISTS surat_tugas_nama text;

ALTER TABLE public.riwayat
  ADD COLUMN IF NOT EXISTS surat_tugas_url text,
  ADD COLUMN IF NOT EXISTS surat_tugas_drive_id text,
  ADD COLUMN IF NOT EXISTS surat_tugas_nama text;
