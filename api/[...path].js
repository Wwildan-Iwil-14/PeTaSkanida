/**
 * Vercel Function: meneruskan semua permintaan /api/* ke aplikasi Express.
 *
 * Express app sudah berisi prefix /api pada routenya (lihat
 * backend/src/routes/index.js), sehingga fungsi ini tinggal meneruskan
 * request/response tanpa mengubah path.
 */
import app from '../backend/index.js'

export default app
