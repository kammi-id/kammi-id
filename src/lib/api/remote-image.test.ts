import { afterEach, describe, expect, mock, test } from 'bun:test'

// DNS dipalsukan supaya tes ini tidak pernah menyentuh jaringan: yang diuji
// adalah keputusan kode atas alamat yang diberikan, bukan resolusi sungguhan.
const dnsTable = new Map<string, string[]>()
mock.module('node:dns/promises', () => ({
  lookup: async (hostname: string) => {
    const addresses = dnsTable.get(hostname)
    if (!addresses) throw new Error('ENOTFOUND')
    return addresses.map((address) => ({
      address,
      family: address.includes(':') ? 6 : 4
    }))
  }
}))

const { fetchRemoteImage, isPublicIpAddress } = await import('./remote-image')

const PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a])
const realFetch = globalThis.fetch

const stubFetch = (handler: (url: string) => Response) => {
  globalThis.fetch = (async (input: string | URL) =>
    handler(String(input))) as typeof fetch
}

afterEach(() => {
  globalThis.fetch = realFetch
  dnsTable.clear()
})

// Pagar yang menjaga `importImageFromUrlAction` agar tidak menjadi SSRF.
// Diuji sebagai fungsi murni: tidak ada jaringan, tidak ada DNS, jadi
// hasilnya sama di laptop maupun di CI.
describe('isPublicIpAddress', () => {
  const blocked = [
    ['loopback IPv4', '127.0.0.1'],
    ['loopback IPv4 di ujung blok', '127.255.255.254'],
    ['metadata penyedia awan', '169.254.169.254'],
    ['jaringan privat 10/8', '10.0.0.5'],
    ['jaringan privat 172.16/12 batas bawah', '172.16.0.1'],
    ['jaringan privat 172.16/12 batas atas', '172.31.255.254'],
    ['jaringan privat 192.168/16', '192.168.1.1'],
    ['CGNAT 100.64/10', '100.64.0.1'],
    ['this-network 0/8', '0.0.0.0'],
    ['multicast', '224.0.0.1'],
    ['reserved 240/4', '240.0.0.1'],
    ['benchmark 198.18/15', '198.19.0.1'],
    ['loopback IPv6', '::1'],
    ['unspecified IPv6', '::'],
    ['unique local IPv6 fc00::/7', 'fd00::1'],
    ['link local IPv6', 'fe80::1'],
    ['link local IPv6 dengan indeks zona', 'fe80::1%en0'],
    ['multicast IPv6', 'ff02::1'],
    ['loopback lewat IPv4-mapped', '::ffff:127.0.0.1'],
    ['metadata lewat IPv4-mapped', '::ffff:169.254.169.254']
  ] as const

  for (const [label, ip] of blocked)
    test(`menolak ${label} (${ip})`, () => {
      expect(isPublicIpAddress(ip)).toBe(false)
    })

  const allowed = [
    ['IPv4 publik', '8.8.8.8'],
    ['IPv4 publik tepat di luar 172.16/12', '172.32.0.1'],
    ['IPv4 publik tepat di luar 169.254/16', '169.253.0.1'],
    ['IPv6 publik', '2606:4700:4700::1111']
  ] as const

  for (const [label, ip] of allowed)
    test(`mengizinkan ${label} (${ip})`, () => {
      expect(isPublicIpAddress(ip)).toBe(true)
    })

  test('menolak yang bukan alamat IP sama sekali', () => {
    expect(isPublicIpAddress('bukan-ip')).toBe(false)
    expect(isPublicIpAddress('999.1.1.1')).toBe(false)
    expect(isPublicIpAddress('')).toBe(false)
  })
})

describe('fetchRemoteImage', () => {
  test('menolak skema selain http/https', async () => {
    await expect(fetchRemoteImage('file:///etc/passwd')).rejects.toThrow(
      'harus http:// atau https://'
    )
  })

  test('menolak alamat yang tidak sah', async () => {
    await expect(fetchRemoteImage('bukan url')).rejects.toThrow(
      'Alamat gambar tidak sah'
    )
  })

  test('menolak host yang menunjuk ke jaringan dalam', async () => {
    // Bentuk serangan paling polos: nama yang terdengar wajar, tapi
    // resolusinya ke alamat metadata penyedia awan.
    dnsTable.set('gambar.test', ['169.254.169.254'])
    stubFetch(() => {
      throw new Error('fetch tidak boleh terpanggil')
    })

    await expect(fetchRemoteImage('https://gambar.test/a.png')).rejects.toThrow(
      'tidak boleh diakses dari server'
    )
  })

  test('menolak host yang salah satu alamatnya saja ke jaringan dalam', async () => {
    dnsTable.set('campur.test', ['93.184.216.34', '10.0.0.5'])
    stubFetch(() => {
      throw new Error('fetch tidak boleh terpanggil')
    })

    await expect(fetchRemoteImage('https://campur.test/a.png')).rejects.toThrow(
      'tidak boleh diakses dari server'
    )
  })

  test('menolak pengalihan yang berakhir di jaringan dalam', async () => {
    // Loncatan pertama bersih, loncatan kedua yang membawa ke dalam —
    // memeriksa URL pertama saja tidak cukup.
    dnsTable.set('umpan.test', ['93.184.216.34'])
    dnsTable.set('dalam.test', ['127.0.0.1'])
    stubFetch(
      () =>
        new Response(null, {
          status: 302,
          headers: { location: 'http://dalam.test/rahasia' }
        })
    )

    await expect(fetchRemoteImage('https://umpan.test/a.png')).rejects.toThrow(
      'tidak boleh diakses dari server'
    )
  })

  test('menolak isi yang bukan gambar didukung', async () => {
    dnsTable.set('gambar.test', ['93.184.216.34'])
    stubFetch(
      () =>
        new Response('<html>bukan gambar</html>', {
          headers: { 'content-type': 'text/html; charset=utf-8' }
        })
    )

    await expect(fetchRemoteImage('https://gambar.test/a.png')).rejects.toThrow(
      'bukan gambar yang didukung'
    )
  })

  test('menolak yang melebihi batas walau content-length berbohong', async () => {
    dnsTable.set('gambar.test', ['93.184.216.34'])
    stubFetch(
      () =>
        new Response(new Uint8Array(6 * 1024 * 1024), {
          headers: { 'content-type': 'image/png', 'content-length': '10' }
        })
    )

    await expect(
      fetchRemoteImage('https://gambar.test/besar.png')
    ).rejects.toThrow('melebihi batas 5MB')
  })

  test('mengembalikan File dengan tipe dan byte yang utuh', async () => {
    dnsTable.set('gambar.test', ['93.184.216.34'])
    stubFetch(
      () =>
        new Response(PNG_BYTES, { headers: { 'content-type': 'image/png' } })
    )

    const file = await fetchRemoteImage('https://gambar.test/foto.png')

    expect(file.type).toBe('image/png')
    expect(file.name).toBe('foto.png')
    expect([...new Uint8Array(await file.arrayBuffer())]).toEqual([
      ...PNG_BYTES
    ])
  })
})
