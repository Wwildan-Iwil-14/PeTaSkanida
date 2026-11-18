-- Mengetatkan aturan akses tabel request.
--
-- Sebelumnya anon & authenticated boleh melakukan semua operasi (FOR ALL),
-- sehingga siapa pun yang punya anon key bisa menyetujui/menolak request
-- langsung dari browser. Sekarang operasi tulis dipindahkan ke backend
-- (folder backend/) yang memakai service role key.
--
-- Sisa aturan: anon & authenticated hanya boleh MEMBACA (dipakai real-time).

DROP POLICY IF EXISTS "enable_all_req_pending" ON public.req_pending;
DROP POLICY IF EXISTS "enable_all_req_acc" ON public.req_acc;
DROP POLICY IF EXISTS "enable_all_req_reject" ON public.req_reject;
DROP POLICY IF EXISTS "enable_all_riwayat" ON public.riwayat;

DROP POLICY IF EXISTS "select_req_pending" ON public.req_pending;
DROP POLICY IF EXISTS "select_req_acc" ON public.req_acc;
DROP POLICY IF EXISTS "select_req_reject" ON public.req_reject;
DROP POLICY IF EXISTS "select_riwayat" ON public.riwayat;

CREATE POLICY "select_req_pending" ON public.req_pending
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "select_req_acc" ON public.req_acc
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "select_req_reject" ON public.req_reject
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "select_riwayat" ON public.riwayat
  FOR SELECT TO anon, authenticated USING (true);
