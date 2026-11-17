/**
 * Menyalin file SQL dari folder database/ ke backend/supabase/migrations/
 * supaya perintah `supabase db push` (Supabase CLI) bisa dipakai.
 *
 * Sumber kebenaran tetap folder database/, folder supabase/ hanya hasil generate.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const backendRoot = path.resolve(here, '..')
const repoRoot = path.resolve(backendRoot, '..')

const sourceDir = path.join(repoRoot, 'database', 'migrations')
const targetDir = path.join(backendRoot, 'supabase', 'migrations')

function copyIfChanged(source, target) {
  const sourceContent = fs.readFileSync(source)
  if (fs.existsSync(target) && fs.readFileSync(target).equals(sourceContent)) {
    return false
  }
  fs.writeFileSync(target, sourceContent)
  return true
}

fs.mkdirSync(targetDir, { recursive: true })

const files = fs
  .readdirSync(sourceDir)
  .filter(name => name.endsWith('.sql'))
  .sort()

let copied = 0
for (const name of files) {
  if (copyIfChanged(path.join(sourceDir, name), path.join(targetDir, name))) {
    copied += 1
    console.log(`[db:sync] diperbarui: ${name}`)
  }
}

console.log(`[db:sync] ${files.length} migration tersedia di ${targetDir} (${copied} diperbarui).`)
