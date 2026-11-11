import crypto from 'node:crypto'

/**
 * Token admin sederhana: payload base64url + tanda tangan HMAC-SHA256.
 * Format: <payload>.<signature>
 */
export function signToken(payload, { secret, ttlSeconds }) {
  const now = Math.floor(Date.now() / 1000)
  const body = { ...payload, iat: now, exp: now + ttlSeconds }
  const encoded = Buffer.from(JSON.stringify(body)).toString('base64url')
  const signature = crypto.createHmac('sha256', secret).update(encoded).digest('base64url')
  return `${encoded}.${signature}`
}

export function verifyToken(token, { secret }) {
  if (typeof token !== 'string' || !token.includes('.')) return null

  const [encoded, signature] = token.split('.')
  if (!encoded || !signature) return null

  const expected = crypto.createHmac('sha256', secret).update(encoded).digest('base64url')
  const given = Buffer.from(signature)
  const want = Buffer.from(expected)
  if (given.length !== want.length || !crypto.timingSafeEqual(given, want)) return null

  let payload
  try {
    payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'))
  } catch {
    return null
  }

  if (!payload || typeof payload.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000)) {
    return null
  }
  return payload
}
