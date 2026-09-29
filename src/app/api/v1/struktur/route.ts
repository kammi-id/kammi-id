import {
  readOrganizationIdByReference,
  readStrukturDirectory
} from '~/db/query/organization'
import {
  authenticateVerificationKey,
  consumeVerificationRateLimit,
  recordVerificationAccess
} from '~/db/query/verification-key'

const noStore = { 'Cache-Control': 'no-store' }

const response = (status: number) =>
  new Response(null, { status, headers: noStore })

const bearerSecret = (request: Request): string | null => {
  const authorization = request.headers.get('authorization')
  if (!authorization?.startsWith('Bearer ')) return null

  const secret = authorization.slice('Bearer '.length).trim()
  return secret || null
}

const typesFor = (jenis: string): Array<'pw' | 'pdln' | 'pd' | 'pk'> =>
  jenis === 'pd' ? ['pd', 'pdln'] : [jenis as 'pw' | 'pk']

export const GET = async (request: Request) => {
  const secret = bearerSecret(request)
  const key = secret ? await authenticateVerificationKey(secret) : null

  if (!key) {
    await recordVerificationAccess({
      keyId: null,
      outcome: 'unauthorized',
      reason: 'invalid_key'
    })
    return response(401)
  }

  if (!(await consumeVerificationRateLimit(key.id))) {
    await recordVerificationAccess({
      keyId: key.id,
      outcome: 'rate_limited',
      reason: 'directory_rate_limited'
    })
    return response(429)
  }

  const url = new URL(request.url)
  const jenis = url.searchParams.get('jenis')?.trim().toLowerCase()

  if (!jenis || !['pw', 'pd', 'pk'].includes(jenis)) {
    await recordVerificationAccess({
      keyId: key.id,
      outcome: 'found',
      reason: 'directory'
    })
    return Response.json(
      { error: 'Parameter jenis wajib dan harus pw, pd, atau pk.' },
      { status: 400, headers: noStore }
    )
  }

  const ancestor = url.searchParams.get('ancestor')?.trim()
  const ancestorId = ancestor
    ? await readOrganizationIdByReference(ancestor)
    : undefined

  if (ancestor && !ancestorId) {
    await recordVerificationAccess({
      keyId: key.id,
      outcome: 'not_found',
      reason: 'directory_not_found'
    })
    return response(404)
  }

  const search = url.searchParams.get('search')?.trim() || undefined
  const struktur = await readStrukturDirectory({
    types: typesFor(jenis),
    ancestorId,
    search
  })

  await recordVerificationAccess({
    keyId: key.id,
    outcome: 'found',
    reason: 'directory'
  })

  return Response.json(
    struktur.map(({ id, name, slug, type }) => ({
      id,
      nama: name,
      slug,
      jenis: type === 'pdln' ? 'pd' : type
    })),
    { headers: noStore }
  )
}
