export function notFoundHandler(req, res) {
  res.status(404).json({
    error: `Endpoint ${req.method} ${req.originalUrl} tidak ditemukan.`,
  })
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  let status = err.status || 500
  let message = err.message || 'Terjadi kesalahan pada server.'

  // Multer tidak menyertakan `status`, jadi pesannya diterjemahkan di sini.
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      status = 413
      message = 'Ukuran surat tugas melebihi 4 MB.'
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      status = 422
      message = 'Field upload tidak dikenali.'
    } else {
      status = 422
      message = 'File surat tugas tidak valid.'
    }
  }

  if (status >= 500) console.error('[backend]', err)

  res.status(status).json({ error: message })
}
