import multer from 'multer'
import { httpError } from '../lib/httpError.js'

export const MAX_SURAT_TUGAS_SIZE = 4 * 1024 * 1024 // 4 MB

// memoryStorage: file langsung diteruskan ke Supabase Storage dari buffer,
// tidak bergantung pada filesystem (aman untuk Vercel).
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SURAT_TUGAS_SIZE, files: 1 },
  fileFilter(req, file, cb) {
    const isPdf =
      file.mimetype === 'application/pdf' || /\.pdf$/i.test(file.originalname || '')
    if (!isPdf) return cb(httpError(415, 'Surat tugas harus berformat PDF.'))
    cb(null, true)
  },
})

// Field "suratTugas" opsional — request tanpa file tetap valid.
export const uploadSuratTugas = upload.single('suratTugas')
