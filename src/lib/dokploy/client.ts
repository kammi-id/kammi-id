/**
 * Thin HTTP client for the Dokploy API. Bare I/O, deliberately untested.
 */

export type DokployCredentials = {
  baseUrl: string
  apiKey: string
}

const request = async (
  { baseUrl, apiKey }: DokployCredentials,
  path: string,
  init?: RequestInit
) => {
  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/${path}`, {
    ...init,
    headers: {
      'x-api-key': apiKey,
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers
    }
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Dokploy ${path} gagal (HTTP ${response.status}): ${body}`)
  }

  return response.json()
}

export const saveDockerProvider = (
  credentials: DokployCredentials,
  params: {
    applicationId: string
    dockerImage: string
    username: string
    password: string
  }
) =>
  request(credentials, 'application.saveDockerProvider', {
    method: 'POST',
    body: JSON.stringify({ ...params, registryUrl: 'ghcr.io' })
  })

export const deployApplication = (
  credentials: DokployCredentials,
  applicationId: string
) =>
  request(credentials, 'application.deploy', {
    method: 'POST',
    body: JSON.stringify({ applicationId })
  })

export const getApplicationStatus = async (
  credentials: DokployCredentials,
  applicationId: string
): Promise<string> => {
  const data = await request(
    credentials,
    `application.one?applicationId=${encodeURIComponent(applicationId)}`
  )
  return data.applicationStatus
}
