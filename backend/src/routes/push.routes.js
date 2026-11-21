import { Router } from 'express'
import { config } from '../config.js'
import { supabase } from '../lib/supabase.js'
import { asyncHandler } from '../lib/asyncHandler.js'
import { httpError } from '../lib/httpError.js'
import { requireAdmin } from '../middleware/auth.js'
import { isPushEnabled, canReceiveNotifications } from '../lib/push.js'

const router = Router()

/** GET /api/push/public-key — kunci publik VAPID untuk langganan browser. */
router.get('/public-key', (req, res) => {
  res.json({ publicKey: config.vapidPublicKey || '', enabled: isPushEnabled() })
})

/**
 * POST /api/push/subscribe — simpan subscription browser milik admin yang login.
 * Subscription tidak mengandung pesan, hanya alamat perangkat + kunci enkripsi.
 */
router.post(
  '/subscribe',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const subscription = req.body?.subscription
    const endpoint = subscription?.endpoint
    const p256dh = subscription?.keys?.p256dh
    const auth = subscription?.keys?.auth

    if (
      typeof endpoint !== 'string' ||
      endpoint.length > 2048 ||
      !endpoint.startsWith('https://') ||
      typeof p256dh !== 'string' || p256dh.length > 512 ||
      typeof auth !== 'string' || auth.length > 256 ||
      !p256dh || !auth
    ) {
      throw httpError(422, 'Data subscription browser tidak valid.')
    }

    if (!canReceiveNotifications(req.admin.features || [])) {
      throw httpError(403, 'Akun ini tidak memiliki fitur yang memerlukan notifikasi.')
    }

    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        endpoint,
        subscription,
        admin_user_id: req.admin.userId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'endpoint' },
    )

    if (error) throw httpError(502, `Gagal menyimpan subscription: ${error.message}`)
    res.json({ ok: true })
  }),
)

/** DELETE /api/push/subscribe — berhenti mengirim notifikasi ke perangkat ini. */
router.delete(
  '/subscribe',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const endpoint = req.body?.endpoint
    if (typeof endpoint !== 'string' || !endpoint) {
      throw httpError(422, 'Endpoint subscription wajib diisi.')
    }

    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('endpoint', endpoint)
      .eq('admin_user_id', req.admin.userId)

    if (error) throw httpError(502, `Gagal menghapus subscription: ${error.message}`)
    res.json({ ok: true })
  }),
)

export default router
