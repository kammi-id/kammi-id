import { spawn } from 'bun'
import { resolve } from 'node:path'
import { mkdir } from 'node:fs/promises'

// Sama seperti UPLOADS_DIR (lihat src/lib/api/storage.ts): dibaca langsung
// dari process.env, sengaja tidak masuk src/env.ts karena ini urusan skrip,
// bukan aplikasi.
const host = process.env.PRODUCTION_ASSETS_HOST
const volume = process.env.PRODUCTION_ASSETS_VOLUME || 'kammi-uploads'
const uploadsDir = resolve(process.env.UPLOADS_DIR || './.uploads')

const main = async () => {
  if (!host) {
    console.error('❌ PRODUCTION_ASSETS_HOST belum diset.')
    console.error(
      '   Contoh: PRODUCTION_ASSETS_HOST=user@host bun run assets:pull'
    )
    process.exit(1)
  }

  await mkdir(uploadsDir, { recursive: true })

  console.log(`📦 Menarik volume "${volume}" dari ${host} ke ${uploadsDir}...`)

  // ssh <host> 'docker run --rm -v <volume>:/d -w /d alpine tar cz .' | tar xz -C .uploads
  const ssh = spawn({
    cmd: ['ssh', host, `docker run --rm -v ${volume}:/d -w /d alpine tar cz .`],
    stdout: 'pipe',
    stderr: 'inherit'
  })

  const tar = spawn({
    cmd: ['tar', 'xz', '-C', uploadsDir],
    stdin: ssh.stdout,
    stdout: 'inherit',
    stderr: 'inherit'
  })

  const [sshExit, tarExit] = await Promise.all([ssh.exited, tar.exited])

  if (sshExit !== 0) {
    console.error(`❌ ssh gagal (exit ${sshExit})`)
    process.exit(1)
  }
  if (tarExit !== 0) {
    console.error(`❌ tar gagal (exit ${tarExit})`)
    process.exit(1)
  }

  console.log('✅ Selesai. Berkas ada di', uploadsDir)
}

main().catch((err) => {
  console.error('❌ assets:pull gagal!')
  console.error(err)
  process.exit(1)
})
