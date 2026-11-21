-- Keamanan: cabut akses baca anon ke data tamu dan log scan.
--
-- Sebelumnya policy SELECT untuk anon dipakai frontend (real-time Supabase).
-- Itu membocorkan nama, email, nomor HP, dan tautan surat tugas kepada siapa
-- pun yang memiliki anon key. Backend memakai service role key dan tetap bisa
-- membaca data tanpa policy ini. Frontend sekarang mengandalkan polling REST
-- melalui backend, sehingga policy anon tidak diperlukan lagi.

DROP POLICY IF EXISTS "select_req_pending" ON public.req_pending;
DROP POLICY IF EXISTS "select_req_acc" ON public.req_acc;
DROP POLICY IF EXISTS "select_req_reject" ON public.req_reject;
DROP POLICY IF EXISTS "select_riwayat" ON public.riwayat;
DROP POLICY IF EXISTS "select_scan_logs" ON public.scan_logs;

-- Pastikan RLS tetap aktif pada tabel-tabel sensitif.
ALTER TABLE public.req_pending ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.req_acc ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.req_reject ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.riwayat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_logs ENABLE ROW LEVEL SECURITY;
