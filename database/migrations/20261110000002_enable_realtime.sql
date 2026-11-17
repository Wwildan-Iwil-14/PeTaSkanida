-- Aktifkan real-time (Supabase Realtime) untuk tabel request
-- Agar dashboard admin otomatis update ketika ada data baru masuk
ALTER PUBLICATION supabase_realtime ADD TABLE public.req_pending;
ALTER PUBLICATION supabase_realtime ADD TABLE public.req_acc;
ALTER PUBLICATION supabase_realtime ADD TABLE public.req_reject;
