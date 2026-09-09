import {
  deployApplication,
  getApplicationStatus,
  saveDockerProvider
} from '~/lib/dokploy/client'
import { interpretApplicationStatus } from '~/lib/dokploy/status'

const POLL_INTERVAL_MS = 5_000
const TIMEOUT_MS = 5 * 60 * 1000

const requireEnv = (name: string): string => {
  const value = process.env[name]
  if (!value) throw new Error(`${name} belum diset.`)
  return value
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const main = async () => {
  const credentials = {
    baseUrl: requireEnv('DOKPLOY_NONPROD_URL'),
    apiKey: requireEnv('DOKPLOY_NONPROD_API_KEY')
  }
  const applicationId = requireEnv('DOKPLOY_NONPROD_APPLICATION_ID')
  const ghcrUsername = requireEnv('DOKPLOY_NONPROD_GHCR_USERNAME')
  const ghcrPassword = requireEnv('DOKPLOY_NONPROD_GHCR_PAT')
  const repository = requireEnv('GITHUB_REPOSITORY')
  // Matches docker/metadata-action's default `type=sha` format (7 characters),
  // which is the tag build-push actually published — see ci.yml.
  const shortSha = requireEnv('GITHUB_SHA').slice(0, 7)
  const dockerImage = `ghcr.io/${repository}:sha-${shortSha}`

  console.log(`📦 Menyetel docker provider ke ${dockerImage}...`)
  await saveDockerProvider(credentials, {
    applicationId,
    dockerImage,
    username: ghcrUsername,
    password: ghcrPassword
  })

  console.log('🚀 Memicu application.deploy...')
  await deployApplication(credentials, applicationId)

  console.log('⏳ Menunggu deploy selesai...')
  const deadline = Date.now() + TIMEOUT_MS
  for (;;) {
    const status = await getApplicationStatus(credentials, applicationId)
    const outcome = interpretApplicationStatus(status, Date.now() > deadline)

    if (outcome === 'success') {
      console.log(`✅ Deploy sukses (applicationStatus: ${status})`)
      return
    }
    if (outcome === 'failure') {
      throw new Error(`Deploy gagal (applicationStatus: ${status})`)
    }
    if (outcome === 'timeout') {
      throw new Error(
        `Deploy timeout setelah ${TIMEOUT_MS / 1000}s (applicationStatus terakhir: ${status})`
      )
    }

    await sleep(POLL_INTERVAL_MS)
  }
}

main().catch((err) => {
  console.error('❌ deploy-nonprod gagal!')
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
