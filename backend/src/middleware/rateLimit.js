/**
 * Rate limiter sederhana berbasis memori untuk membatasi percobaan login.
 * Cukup untuk kebutuhan aplikasi sekolah; ganti dengan Redis jika butuh multi-instance.
 */
export function createRateLimiter({ windowMs = 60_000, max = 10 } = {}) {
  const hits = new Map()

  return (req, res, next) => {
    const key = req.ip || 'unknown'
    const now = Date.now()
    const entry = hits.get(key)

    if (!entry || now >= entry.resetAt) {
      hits.set(key, { count: 1, resetAt: now + windowMs })
      return next()
    }

    entry.count += 1
    if (entry.count > max) {
      const waitSeconds = Math.ceil((entry.resetAt - now) / 1000)
      res.set('Retry-After', String(waitSeconds))
      return res.status(429).json({
        error: `Terlalu banyak percobaan. Coba lagi dalam ${waitSeconds} detik.`,
      })
    }

    next()
  }
}
