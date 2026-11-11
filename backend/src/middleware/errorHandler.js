export function notFoundHandler(req, res) {
  res.status(404).json({
    error: `Endpoint ${req.method} ${req.originalUrl} tidak ditemukan.`,
  })
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const status = err.status || 500

  if (status >= 500) {
    console.error('[backend]', err)
  }

  res.status(status).json({
    error: err.message || 'Terjadi kesalahan pada server.',
  })
}
