import { readMemberByRegisterNumber } from '~/db/query/member'
import {
  authenticateVerificationKey,
  consumeVerificationRateLimit,
  recordVerificationAccess
} from '~/db/query/verification-key'

const response = (status: number) =>
  new Response(null, {
    status,
    headers: { 'Cache-Control': 'no-store' }
  })

const notFound = () => response(404)

const bearerSecret = (request: Request): string | null => {
  const authorization = request.headers.get('authorization')
  if (!authorization?.startsWith('Bearer ')) return null

  const secret = authorization.slice('Bearer '.length).trim()
  return secret || null
}

export const GET = async (
  request: Request,
  context: RouteContext<'/api/v1/members/[nia]'>
) => {
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
      reason: 'rate_limited'
    })
    return response(429)
  }

  const { nia } = await context.params
  const member = await readMemberByRegisterNumber(nia)
  const isVerifiable =
    member && !member.isSuspended && !member.isNonActive && member.organization

  if (!isVerifiable) {
    await recordVerificationAccess({
      keyId: key.id,
      outcome: 'not_found',
      reason: member ? 'not_verifiable' : 'not_found'
    })
    return notFound()
  }

  await recordVerificationAccess({ keyId: key.id, outcome: 'found' })

  return Response.json(
    {
      nia: member.registerNumber,
      nama: member.name,
      keadaanKader: member.isAlumn ? 'alumni' : 'aktif',
      jenjangKaderisasi: member.status.toUpperCase(),
      struktur: {
        nama: member.organization.name,
        jenjang: member.organization.type
      }
    },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}
