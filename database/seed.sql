-- Contoh data request kunjungan untuk kebutuhan demo/development.
-- Aman dijalankan berulang kali (ON CONFLICT DO NOTHING).

INSERT INTO public.req_pending (id, nama, email, no_hp, tujuan, keperluan, tanggal, waktu, jumlah)
VALUES
  (9001, 'Nadia Putri', 'nadia@contoh.id', '081234567890', 'Kepala SKANIDA', 'Kunjungan dinas', CURRENT_DATE, '09:00', 3),
  (9002, 'Bagas Prasetyo', 'bagas@contoh.id', '081298765432', 'Staf Administrasi', 'Keperluan administrasi', CURRENT_DATE + 1, '10:30', 1)
ON CONFLICT (id) DO NOTHING;

-- Samakan ulang sequence id supaya request baru yang masuk tidak bentrok
-- dengan id contoh di atas.
SELECT setval(
  pg_get_serial_sequence('public.req_pending', 'id'),
  GREATEST((SELECT COALESCE(MAX(id), 0) FROM public.req_pending), 1) + 1,
  false
);
