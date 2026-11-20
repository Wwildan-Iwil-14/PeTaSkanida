/**
 * Menjalankan frontend dan backend sekaligus dari root repository.
 * Tidak membutuhkan dependency tambahan.
 */
import { spawn, execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..')

const targets = [
  { name: 'backend', cwd: path.join(root, 'backend'), color: '\x1b[36m' },
  { name: 'frontend', cwd: path.join(root, 'frontend'), color: '\x1b[35m' },
]

const children = []

// Pastikan dependency sudah terpasang sebelum menjalankan server.
// Tanpa ini, backend akan crash dengan ERR_MODULE_NOT_FOUND (express)
// dan frontend hanya mendapat ECONNREFUSED / HTTP 500 saat login.
for (const target of targets) {
  if (fs.existsSync(path.join(target.cwd, 'node_modules'))) continue

  process.stdout.write(`[${target.name}] node_modules belum ada, menjalankan npm install...\n`)
  try {
    execFileSync('npm', ['install'], { cwd: target.cwd, stdio: 'inherit', shell: process.platform === 'win32' })
  } catch {
    process.stderr.write(
      `[${target.name}] Gagal memasang dependency. Jalankan "npm --prefix ${path.relative(root, target.cwd)} install" secara manual.\n`,
    )
    process.exit(1)
  }
}

for (const target of targets) {
  const child = spawn('npm run dev', {
    cwd: target.cwd,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
  })

  const prefix = `${target.color}[${target.name}]\x1b[0m `
  const forward = stream => {
    stream.setEncoding('utf8')
    stream.on('data', chunk => {
      for (const line of chunk.split('\n')) {
        if (line.trim()) process.stdout.write(prefix + line + '\n')
      }
    })
  }

  forward(child.stdout)
  forward(child.stderr)

  child.on('exit', code => {
    process.stdout.write(prefix + `proses berhenti (kode ${code})\n`)
  })

  children.push(child)
}

function shutdown() {
  for (const child of children) {
    if (!child.killed) child.kill()
  }
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
