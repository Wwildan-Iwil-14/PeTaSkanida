import { api } from './api'

export function isPushSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    typeof Notification !== 'undefined'
  )
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return Uint8Array.from(raw, char => char.charCodeAt(0))
}

async function getSubscription() {
  if (!isPushSupported()) return null
  const registration = await navigator.serviceWorker.getRegistration()
  return registration ? registration.pushManager.getSubscription() : null
}

export async function getPushStatus() {
  if (!isPushSupported()) return { supported: false, permission: 'unsupported', subscribed: false }
  const subscription = await getSubscription()
  return {
    supported: true,
    permission: Notification.permission,
    subscribed: Boolean(subscription),
  }
}

/** Aktifkan notifikasi browser: izin → service worker → subscribe → simpan ke backend. */
export async function enablePush() {
  if (!isPushSupported()) {
    throw new Error('Browser ini tidak mendukung notifikasi push. Gunakan Chrome/Edge/Firefox terbaru lewat HTTPS.')
  }

  const permission = Notification.permission === 'granted'
    ? 'granted'
    : await Notification.requestPermission()
  if (permission !== 'granted') {
    throw new Error('Izin notifikasi ditolak. Aktifkan izin notifikasi di pengaturan browser.')
  }

  const { publicKey, enabled } = await api.vapidPublicKey()
  if (!enabled || !publicKey) {
    throw new Error('Notifikasi push belum dikonfigurasi di backend (VAPID key belum ada).')
  }

  const swUrl = `${import.meta.env.BASE_URL}sw.js`
  const registration = await navigator.serviceWorker.register(swUrl)
  await navigator.serviceWorker.ready

  let subscription = await registration.pushManager.getSubscription()
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    })
  }

  const plain = typeof subscription.toJSON === 'function'
    ? subscription.toJSON()
    : { endpoint: subscription.endpoint, keys: subscription.keys }

  await api.subscribePush(plain)
  return getPushStatus()
}

/** Matikan notifikasi di perangkat ini dan hapus subscription dari backend. */
export async function disablePush() {
  const subscription = await getSubscription()
  if (subscription) {
    await api.unsubscribePush(subscription.endpoint).catch(() => {})
    await subscription.unsubscribe()
  }
  return getPushStatus()
}
