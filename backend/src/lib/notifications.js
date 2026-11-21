import { config } from '../config.js'
import {
  notifyNewRequest as notifyWhatsappNew,
  notifyStatusChange as notifyWhatsappStatus,
} from './whatsapp.js'
import {
  notifyNewRequest as notifyPushNew,
  notifyStatusChange as notifyPushStatus,
} from './push.js'

// Satu pintu notifikasi untuk semua kanal. Kanal dipilih lewat NOTIFY_CHANNELS
// di .env: "push" (default), "whatsapp", atau "push,whatsapp".
// Setiap kanal bersifat fail-soft dan tidak melempar error ke pemanggil.

const useChannel = name => config.notificationChannels.includes(name)

export async function notifyNewRequest(request) {
  if (useChannel('whatsapp')) await notifyWhatsappNew(request)
  if (useChannel('push')) await notifyPushNew(request)
}

export async function notifyStatusChange(request, status) {
  if (useChannel('whatsapp')) await notifyWhatsappStatus(request, status)
  if (useChannel('push')) await notifyPushStatus(request, status)
}
