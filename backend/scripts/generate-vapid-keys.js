import webpush from 'web-push'

const keys = webpush.generateVAPIDKeys()

console.log('Kunci VAPID baru untuk notifikasi browser.\n')
console.log('Salin ke backend/.env:')
console.log(`VAPID_PUBLIC_KEY=${keys.publicKey}`)
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`)
console.log('VAPID_SUBJECT=mailto:admin@petaskanida.sch.id')
console.log('\nJangan bagikan VAPID_PRIVATE_KEY ke publik.')
