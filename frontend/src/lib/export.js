/**
 * Ekspor riwayat kunjungan: XLSX, CSV, dan tampilan web yang bisa dicetak.
 * XLSX dibuat tanpa library tambahan (ZIP + SpreadsheetML minimal), supaya
 * bundle frontend tetap ringan dan tidak ada dependency berat.
 */

const HEADERS = [
  'Kode', 'Nama / Instansi', 'Email', 'No. HP', 'Tujuan',
  'Keperluan', 'Tanggal', 'Waktu', 'Jumlah', 'Status', 'Surat Tugas',
]

const WIDTHS = [13, 26, 26, 18, 20, 30, 14, 10, 11, 12, 42]

function rowsFrom(items) {
  return (items || []).map(item => [
    item.id || '',
    item.name || '',
    item.email || '',
    item.phone || '',
    item.tujuan || '',
    item.keperluan || '',
    item.date || '',
    item.time || '',
    item.people ?? 1,
    item.status || '',
    item.suratTugasUrl || '',
  ])
}

function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 2000)
}

function timestamp() {
  const now = new Date()
  const pad = value => String(value).padStart(2, '0')
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`
}

// ---- CSV ----

export function downloadCsv(items, title = 'Riwayat Kunjungan') {
  const quote = value => `"${String(value ?? '').replace(/"/g, '""')}"`
  const lines = [HEADERS.map(quote).join(','), ...rowsFrom(items).map(row => row.map(quote).join(','))]
  // BOM membuat Excel membaca UTF-8 (karakter Indonesia tidak berantakan).
  const blob = new Blob(['\uFEFF', lines.join('\r\n')], { type: 'text/csv;charset=utf-8' })
  saveBlob(blob, `${title.replace(/[^\w\s-]/g, '').trim() || 'riwayat'}-${timestamp()}.csv`)
}

// ---- XLSX ----

const encoder = new TextEncoder()

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n += 1) {
    let value = n
    for (let k = 0; k < 8; k += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
    }
    table[n] = value >>> 0
  }
  return table
})()

function crc32(bytes) {
  let crc = 0xffffffff
  for (const byte of bytes) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function zipFiles(files) {
  const parts = []
  const central = []
  let offset = 0

  for (const { name, data } of files) {
    const nameBytes = encoder.encode(name)
    const crc = crc32(data)

    const local = new Uint8Array(30 + nameBytes.length + data.length)
    const view = new DataView(local.buffer)
    view.setUint32(0, 0x04034b50, true)
    view.setUint16(4, 20, true)
    view.setUint16(6, 0x0800, true) // UTF-8
    view.setUint16(8, 0, true) // tanpa kompresi
    view.setUint16(10, 0, true)
    view.setUint16(12, 0x0021, true) // 1980-01-01
    view.setUint32(14, crc, true)
    view.setUint32(18, data.length, true)
    view.setUint32(22, data.length, true)
    view.setUint16(26, nameBytes.length, true)
    view.setUint16(28, 0, true)
    local.set(nameBytes, 30)
    local.set(data, 30 + nameBytes.length)
    parts.push(local)

    const directory = new Uint8Array(46 + nameBytes.length)
    const directoryView = new DataView(directory.buffer)
    directoryView.setUint32(0, 0x02014b50, true)
    directoryView.setUint16(4, 20, true)
    directoryView.setUint16(6, 20, true)
    directoryView.setUint16(8, 0x0800, true)
    directoryView.setUint16(10, 0, true)
    directoryView.setUint16(12, 0, true)
    directoryView.setUint16(14, 0x0021, true)
    directoryView.setUint32(16, crc, true)
    directoryView.setUint32(20, data.length, true)
    directoryView.setUint32(24, data.length, true)
    directoryView.setUint16(28, nameBytes.length, true)
    directoryView.setUint32(42, offset, true)
    directory.set(nameBytes, 46)
    central.push(directory)

    offset += local.length
  }

  const centralSize = central.reduce((total, item) => total + item.length, 0)
  const end = new Uint8Array(22)
  const endView = new DataView(end.buffer)
  endView.setUint32(0, 0x06054b50, true)
  endView.setUint16(8, files.length, true)
  endView.setUint16(10, files.length, true)
  endView.setUint32(12, centralSize, true)
  endView.setUint32(16, offset, true)

  return new Blob([...parts, ...central, end], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

const escapeXml = value => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;')
  .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')

function columnName(index) {
  let number = index + 1
  let name = ''
  while (number > 0) {
    const remainder = (number - 1) % 26
    name = String.fromCharCode(65 + remainder) + name
    number = Math.floor((number - 1) / 26)
  }
  return name
}

function sheetXml(rows) {
  const cols = WIDTHS
    .map((width, index) => `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`)
    .join('')

  const cell = (index, rowNumber, value, style) =>
    `<c r="${columnName(index)}${rowNumber}"${style ? ` s="${style}"` : ''} t="inlineStr">` +
    `<is><t xml:space="preserve">${escapeXml(value)}</t></is></c>`

  const headerRow = `<row r="1">${HEADERS.map((header, index) => cell(index, 1, header, 1)).join('')}</row>`
  const bodyRows = rows
    .map((row, rowIndex) => {
      const rowNumber = rowIndex + 2
      return `<row r="${rowNumber}">${row
        .map((value, index) => cell(index, rowNumber, value))
        .join('')}</row>`
    })
    .join('')

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    `<cols>${cols}</cols><sheetData>${headerRow}${bodyRows}</sheetData></worksheet>`
}

export function buildXlsxBlob(items, title = 'Riwayat Kunjungan') {
  const xmlHeader = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
  const files = [
    {
      name: '[Content_Types].xml',
      data: encoder.encode(xmlHeader +
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
        '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
        '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
        '</Types>'),
    },
    {
      name: '_rels/.rels',
      data: encoder.encode(xmlHeader +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
        '</Relationships>'),
    },
    {
      name: 'xl/workbook.xml',
      data: encoder.encode(xmlHeader +
        '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ' +
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
        `<sheets><sheet name="${escapeXml(title).slice(0, 31)}" sheetId="1" r:id="rId1"/></sheets></workbook>`),
    },
    {
      name: 'xl/_rels/workbook.xml.rels',
      data: encoder.encode(xmlHeader +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
        '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
        '</Relationships>'),
    },
    {
      name: 'xl/styles.xml',
      data: encoder.encode(xmlHeader +
        '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
        '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font>' +
        '<font><b/><sz val="11"/><name val="Calibri"/></font></fonts>' +
        '<fills count="2"><fill><patternFill patternType="none"/></fill>' +
        '<fill><patternFill patternType="gray125"/></fill></fills>' +
        '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
        '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
        '<cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
        '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs>' +
        '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
        '</styleSheet>'),
    },
    {
      name: 'xl/worksheets/sheet1.xml',
      data: encoder.encode(sheetXml(rowsFrom(items))),
    },
  ]

  return zipFiles(files)
}

export function downloadXlsx(items, title = 'Riwayat Kunjungan') {
  saveBlob(buildXlsxBlob(items, title), `${title.replace(/[^\w\s-]/g, '').trim() || 'riwayat'}-${timestamp()}.xlsx`)
}

// ---- Tampilan web ----

const escapeHtml = value => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;')

export function openWebView(items, title = 'Riwayat Kunjungan') {
  const rows = rowsFrom(items)
  const body = rows.length
    ? rows.map(row => `<tr>${row.map(value => `<td>${escapeHtml(value)}</td>`).join('')}</tr>`).join('')
    : `<tr><td colspan="${HEADERS.length}" class="empty">Tidak ada data yang cocok.</td></tr>`

  const html = `<!doctype html>
<html lang="id"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)} — PeTa SKANIDA</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: system-ui, -apple-system, "Segoe UI", sans-serif; color: #0f172a; margin: 0; padding: 32px; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  .meta { color: #64748b; font-size: 12px; margin-bottom: 20px; }
  .toolbar { display: flex; gap: 8px; margin-bottom: 20px; }
  button { font: inherit; font-size: 13px; font-weight: 600; padding: 9px 14px; border-radius: 10px; border: 1px solid #cbd5e1; background: #fff; cursor: pointer; }
  button.primary { background: #4f46e5; border-color: #4f46e5; color: #fff; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; vertical-align: top; word-break: break-word; }
  th { background: #f1f5f9; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; }
  tr:nth-child(even) td { background: #f8fafc; }
  .empty { text-align: center; color: #94a3b8; padding: 28px; }
  @media print {
    @page { size: A4 landscape; margin: 12mm; }
    body { padding: 0; }
    .toolbar { display: none; }
    table { font-size: 10px; }
    th, td { padding: 5px 7px; }
    tr { break-inside: avoid; }
  }
</style></head><body>
<div class="toolbar no-print">
  <button class="primary" onclick="window.print()">Cetak / Simpan PDF</button>
  <button onclick="window.close()">Tutup</button>
</div>
<h1>PeTa SKANIDA — ${escapeHtml(title)}</h1>
<p class="meta">Dibuat ${new Date().toLocaleString('id-ID')} · ${rows.length} data</p>
<table><thead><tr>${HEADERS.map(header => `<th>${escapeHtml(header)}</th>`).join('')}</tr></thead>
<tbody>${body}</tbody></table>
</body></html>`

  const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }))
  const win = window.open(url, '_blank')
  if (!win) {
    URL.revokeObjectURL(url)
    throw new Error('Pop-up diblokir browser. Izinkan pop-up untuk situs ini.')
  }
  window.setTimeout(() => URL.revokeObjectURL(url), 60000)
}
