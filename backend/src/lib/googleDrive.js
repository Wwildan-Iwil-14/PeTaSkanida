import { Readable } from 'node:stream'
import { google } from 'googleapis'
import { config, isGoogleDriveConfigured } from '../config.js'
import { httpError } from './httpError.js'

// Scope penuh agar service account bisa menemukan folder "doc_kunjungan"
// yang dibagikan (share) dari akun Gmail personal.
const SCOPES = ['https://www.googleapis.com/auth/drive']

let cachedFolderId = (config.googleDriveFolderId || '').trim() || null
let driveClient = null

function getDrive() {
  if (!isGoogleDriveConfigured) {
    throw httpError(
      503,
      'Upload surat tugas belum tersedia: kredensial Google Drive belum dikonfigurasi pada server.',
    )
  }

  if (!driveClient) {
    const auth = new google.auth.JWT({
      email: config.googleServiceAccountEmail,
      key: config.googlePrivateKey,
      scopes: SCOPES,
    })
    driveClient = google.drive({ version: 'v3', auth })
  }

  return driveClient
}

function escapeQuery(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

async function ensureFolder(drive) {
  if (cachedFolderId) return cachedFolderId

  const folderName = config.googleDriveFolderName || 'doc_kunjungan'
  const query = `mimeType='application/vnd.google-apps.folder' and name='${escapeQuery(folderName)}' and trashed=false`

  const { data } = await drive.files.list({
    q: query,
    fields: 'files(id, name)',
    spaces: 'drive',
    pageSize: 10,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  })

  if (data.files?.length) {
    cachedFolderId = data.files[0].id
    return cachedFolderId
  }

  const created = await drive.files.create({
    requestBody: { name: folderName, mimeType: 'application/vnd.google-apps.folder' },
    fields: 'id',
    supportsAllDrives: true,
  })

  cachedFolderId = created.data.id
  return cachedFolderId
}

/**
 * Unggah surat tugas (PDF) ke Google Drive.
 * Email tujuan diambil dari konfigurasi (SURAT_TUGAS_EMAIL) dan dicatat
 * pada deskripsi berkas agar bisa diganti ke email sekolah tanpa ubah kode.
 * @returns {{ id: string, name: string, url: string, tujuanEmail: string }}
 */
export async function uploadSuratTugas({ buffer, originalName, nama }) {
  const drive = getDrive()
  const folderId = await ensureFolder(drive)

  const safeNama = String(nama || 'tamu')
    .replace(/[^\w\-]+/g, '_')
    .slice(0, 60)
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const name = `surat_tugas_${safeNama || 'tamu'}_${timestamp}.pdf`

  try {
    const created = await drive.files.create({
      requestBody: {
        name,
        parents: [folderId],
        description: `Surat tugas kunjungan — ditujukan ke ${config.suratTugasEmail}`,
      },
      media: { mimeType: 'application/pdf', body: Readable.from(buffer) },
      fields: 'id, webViewLink, webContentLink',
      supportsAllDrives: true,
    })

    const fileId = created.data.id

    if (config.googleDrivePublicLink) {
      await drive.permissions.create({
        fileId,
        requestBody: { role: 'reader', type: 'anyone' },
        supportsAllDrives: true,
        sendNotificationEmail: false,
      })
    }

    return {
      id: fileId,
      name: name || originalName || 'surat_tugas.pdf',
      url:
        created.data.webViewLink ||
        created.data.webContentLink ||
        `https://drive.google.com/file/d/${fileId}/view`,
      tujuanEmail: config.suratTugasEmail,
    }
  } catch (err) {
    throw httpError(502, `Gagal mengunggah surat tugas ke Google Drive: ${err.message}`)
  }
}
