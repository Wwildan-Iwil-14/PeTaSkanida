/* Service worker PeTa SKANIDA — menerima notifikasi Web Push dari backend. */

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()))

const assetUrl = name => new URL(name, self.registration.scope).href

self.addEventListener('push', event => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { body: event.data ? event.data.text() : '' }
  }

  const title = data.title || 'PeTa SKANIDA'
  const options = {
    body: data.body || '',
    icon: assetUrl('logo-peta-skanida.png'),
    badge: assetUrl('favicon.svg'),
    tag: data.tag || 'peta-skanida',
    renotify: true,
    data: { url: data.url || self.registration.scope },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  const target = event.notification.data?.url || self.registration.scope

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async clients => {
      for (const client of clients) {
        if (new URL(client.url).origin === self.location.origin) {
          await client.focus()
          if (typeof client.navigate === 'function') await client.navigate(target)
          return
        }
      }
      return self.clients.openWindow(target)
    }),
  )
})
