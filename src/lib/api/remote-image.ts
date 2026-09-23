import { lookup } from 'node:dns/promises'

import { getLogger } from '~/lib/logger'
import {
  ACCEPTED_IMAGE_MIME_TYPES,
  MAX_UPLOAD_BYTES
} from '~/lib/api/upload-constraints'

const logger = getLogger(['app', 'remote-image'])

const ACCEPTED_MIME_TYPES = new Set(ACCEPTED_IMAGE_MIME_TYPES.split(','))

const MAX_REDIRECTS = 3
const FETCH_TIMEOUT_MS = 10_000

/**
 * Rentang IPv4 yang tidak boleh dijangkau: selain jaringan privat yang sudah
 * jelas, juga 169.254/16 (tempat tinggal metadata penyedia awan, jalur
 * pencurian kredensial yang paling sering dipakai) dan 100.64/10 (CGNAT,
 * jaringan internal penyedia).
 */
const BLOCKED_IPV4_RANGES: [base: string, bits: number][] = [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.88.99.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4]
]

const ipv4ToInt = (ip: string): number | null => {
  const parts = ip.split('.')
  if (parts.length !== 4) return null
  let value = 0
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null
    const octet = Number(part)
    if (octet > 255) return null
    value = value * 256 + octet
  }
  return value
}

const isPublicIpv4 = (ip: string): boolean => {
  const value = ipv4ToInt(ip)
  if (value === null) return false
  return !BLOCKED_IPV4_RANGES.some(([base, bits]) => {
    const baseValue = ipv4ToInt(base)
    if (baseValue === null) return false
    return (value ^ baseValue) >>> (32 - bits) === 0
  })
}

const isPublicIpv6 = (ip: string): boolean => {
  // Indeks zona (`fe80::1%en0`) dibuang: yang menentukan alamatnya, bukan
  // antarmuka tempat ia dipakai.
  const address = ip.toLowerCase().split('%')[0]

  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/.exec(address)
  if (mapped) return isPublicIpv4(mapped[1])

  const head = address.split('::')[0].split(':')[0]
  const first = head ? Number.parseInt(head, 16) : 0
  if (Number.isNaN(first)) return false

  if (first === 0) return false // ::, ::1, dan sisa 0000::/16 yang direservasi
  if ((first & 0xfe00) === 0xfc00) return false // fc00::/7 — unique local
  if ((first & 0xffc0) === 0xfe80) return false // fe80::/10 — link local
  if ((first & 0xff00) === 0xff00) return false // ff00::/8 — multicast
  return true
}

/**
 * Apakah sebuah alamat IP boleh dihubungi. Dipisah dari pengambilan berkasnya
 * supaya bisa diuji tanpa jaringan — inilah pagar yang menjaga fitur "salin
 * gambar dari URL" agar tidak menjadi SSRF: tanpa ia, seorang Humas cukup
 * menempel `http://169.254.169.254/...` untuk membuat server membacakan isi
 * jaringan dalamnya sendiri.
 */
export const isPublicIpAddress = (ip: string): boolean =>
  ip.includes(':') ? isPublicIpv6(ip) : isPublicIpv4(ip)

const assertPublicHost = async (hostname: string): Promise<void> => {
  // Hostname berupa IP literal pun lewat sini: `lookup` mengembalikannya apa
  // adanya, jadi tidak ada jalan pintas yang melewatkan pemeriksaan.
  let addresses: { address: string }[]
  try {
    addresses = await lookup(hostname, { all: true })
  } catch {
    throw new Error(`Alamat ${hostname} tidak dapat ditemukan.`)
  }
  if (
    addresses.length === 0 ||
    !addresses.every((a) => isPublicIpAddress(a.address))
  )
    throw new Error(`Alamat ${hostname} tidak boleh diakses dari server.`)
}

const readCappedBytes = async (response: Response): Promise<ArrayBuffer> => {
  const declared = Number(response.headers.get('content-length') ?? '')
  if (Number.isFinite(declared) && declared > MAX_UPLOAD_BYTES)
    throw new Error('Gambar di alamat itu melebihi batas 5MB.')

  const reader = response.body?.getReader()
  if (!reader) throw new Error('Gambar di alamat itu tidak dapat dibaca.')

  const chunks: Uint8Array[] = []
  let total = 0
  // Dibaca bertahap, bukan `arrayBuffer()`: `content-length` datang dari
  // server orang lain dan boleh saja berbohong atau tidak ada sama sekali.
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.length
    if (total > MAX_UPLOAD_BYTES) {
      await reader.cancel()
      throw new Error('Gambar di alamat itu melebihi batas 5MB.')
    }
    chunks.push(value)
  }

  const buffer = new ArrayBuffer(total)
  const bytes = new Uint8Array(buffer)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.length
  }
  return buffer
}

/**
 * Mengambil gambar dari alamat publik dan mengembalikannya sebagai `File`,
 * siap diserahkan ke `storage.uploadFile`.
 *
 * Setiap loncatan pengalihan divalidasi ulang — pengalihan adalah cara paling
 * umum melewati pemeriksaan yang cuma dilakukan sekali di URL pertama. Yang
 * TIDAK ditutup di sini: DNS rebinding, karena antara pemeriksaan dan
 * penyambungan `fetch` melakukan resolusinya sendiri. Menutup celah itu butuh
 * penyambungan ke IP yang sudah diverifikasi dengan header `Host` manual, dan
 * baik `fetch` Bun maupun Node tidak menyediakan kaitnya. Diterima dengan
 * sadar: pemanggilnya sudah harus punya sesi aktif, dan alamatnya diketik
 * seorang Humas, bukan pengunjung anonim.
 */
export const fetchRemoteImage = async (rawUrl: string): Promise<File> => {
  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    throw new Error('Alamat gambar tidak sah.')
  }

  let response: Response | null = null
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    if (url.protocol !== 'https:' && url.protocol !== 'http:')
      throw new Error('Alamat gambar harus http:// atau https://.')
    await assertPublicHost(url.hostname)

    response = await fetch(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { accept: 'image/*' }
    })

    if (response.status < 300 || response.status >= 400) break

    const location = response.headers.get('location')
    if (!location) break
    await response.body?.cancel()
    url = new URL(location, url)
    response = null
  }

  if (!response) throw new Error('Alamat gambar terlalu banyak dialihkan.')
  if (!response.ok) {
    await response.body?.cancel()
    throw new Error(
      `Gambar di alamat itu tidak dapat diambil (${response.status}).`
    )
  }

  const mime = (response.headers.get('content-type') ?? '')
    .split(';')[0]
    .trim()
    .toLowerCase()
  if (!ACCEPTED_MIME_TYPES.has(mime)) {
    await response.body?.cancel()
    throw new Error(
      `Alamat itu bukan gambar yang didukung${mime ? ` (${mime})` : ''}. Gunakan JPG, PNG, WebP, atau HEIC.`
    )
  }

  const bytes = await readCappedBytes(response)
  const name = url.pathname.split('/').pop() || 'gambar'
  logger.info('Gambar jauh disalin', {
    host: url.hostname,
    bytes: bytes.byteLength
  })
  return new File([bytes], name, { type: mime })
}
