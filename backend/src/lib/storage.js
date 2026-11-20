import { supabase } from './supabase.js'
import { config } from '../config.js'
import { httpError } from './httpError.js'

export const SURAT_TUGAS_BUCKET = 'surat-tugas'

function safeName(value) {
  return String(value || 'tamu')
    .replace(/[^\w\-]+/g, '_')
    .slice(0, 60)
}

/**
 * Unggah surat tugas (PDF) ke Supabase Storage.
 * Bucket bersifat public agar petugas bisa langsung membuka tautan untuk
 * dicetak tanpa perlu login Google.
 * @returns {{ id: string, name: string, url: string, tujuanEmail: string }}
 */
export async function uploadSuratTugas({ buffer, originalName, nama }) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const path = `surat_tugas_${safeName(nama) || 'tamu'}_${timestamp}.pdf`

  const { error } = await supabase.storage.from(SURAT_TUGAS_BUCKET).upload(path, buffer, {
    contentType: 'application/pdf',
    cacheControl: '3600',
    upsert: false,
  })

  if (error) {
    throw httpError(502, `Gagal mengunggah surat tugas ke penyimpanan: ${error.message}`)
  }

  const { data } = supabase.storage.from(SURAT_TUGAS_BUCKET).getPublicUrl(path)

  return {
    id: path,
    name: originalName || path,
    url: data.publicUrl,
    tujuanEmail: config.suratTugasEmail,
  }
}
