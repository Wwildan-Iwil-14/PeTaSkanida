/**
 * Pastikan bucket Supabase Storage untuk surat tugas tersedia.
 * Aman dijalankan berulang kali.
 *
 * Jalankan: npm run storage:setup
 */
import { supabase } from '../src/lib/supabase.js'
import { SURAT_TUGAS_BUCKET } from '../src/lib/storage.js'

const { data: buckets, error: listError } = await supabase.storage.listBuckets()
if (listError) {
  console.error('Gagal membaca daftar bucket:', listError.message)
  process.exit(1)
}

if (buckets.some(bucket => bucket.name === SURAT_TUGAS_BUCKET)) {
  console.log(`Bucket "${SURAT_TUGAS_BUCKET}" sudah ada.`)
  process.exit(0)
}

const { error } = await supabase.storage.createBucket(SURAT_TUGAS_BUCKET, {
  public: true,
  fileSizeLimit: 4 * 1024 * 1024,
  allowedMimeTypes: ['application/pdf'],
})

if (error) {
  console.error('Gagal membuat bucket:', error.message)
  process.exit(1)
}

console.log(`Bucket "${SURAT_TUGAS_BUCKET}" berhasil dibuat (public, PDF maks. 4 MB).`)
