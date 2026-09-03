import { beforeEach, describe, expect, it, mock } from 'bun:test'

let organizationId: string | null = 'org-1'
let identity: { id: string; name: string; slug: string; type: string } | null =
  { id: 'org-1', name: 'PW Jabar', slug: 'pw-jabar', type: 'pw' }
let leadershipSettings: {
  periodLabel: string
  heading: string
  triumvirate: {
    ketua: { name: string; photoUrl: string }
    sekretaris: { name: string; photoUrl: string }
    bendahara: { name: string; photoUrl: string }
  }
  leaders: Array<{ name: string; role: string; photoUrl: string }>
  leaderBlocks: Array<{
    id: string
    title: string
    members: Array<{ id: string; name: string; role: string; photoUrl: string }>
  }>
} = {
  periodLabel: 'Masa Jabatan 2026-2028',
  heading: 'Mengenal Pengurus',
  triumvirate: {
    ketua: { name: 'Budi Santoso', photoUrl: '' },
    sekretaris: { name: 'Siti Aminah', photoUrl: '' },
    bendahara: { name: 'Andi Wijaya', photoUrl: '' }
  },
  leaders: [],
  leaderBlocks: [
    {
      id: 'b1',
      title: 'Bidang Kaderisasi',
      members: [{ id: 'm1', name: 'Rudi Hartono', role: 'Ketua Bidang', photoUrl: '' }]
    }
  ]
}
let lastUpdate: Date | undefined = new Date('2026-08-03T00:00:00.000Z')

mock.module('~/app/(main)/_data/struktur', () => ({
  resolveStrukturIdFromParams: async () => organizationId,
  getStrukturIdentity: async () => identity
}))

mock.module('~/app/(main)/_data/site-settings', () => ({
  getLeadershipSettings: async () => leadershipSettings
}))

mock.module('~/db/query/site-settings', () => ({
  readLatestSettingsUpdate: async () => lastUpdate
}))

const { GET } = await import('./route')

beforeEach(() => {
  organizationId = 'org-1'
  identity = { id: 'org-1', name: 'PW Jabar', slug: 'pw-jabar', type: 'pw' }
  leadershipSettings = {
    periodLabel: 'Masa Jabatan 2026-2028',
    heading: 'Mengenal Pengurus',
    triumvirate: {
      ketua: { name: 'Budi Santoso', photoUrl: '' },
      sekretaris: { name: 'Siti Aminah', photoUrl: '' },
      bendahara: { name: 'Andi Wijaya', photoUrl: '' }
    },
    leaders: [],
    leaderBlocks: [
      {
        id: 'b1',
        title: 'Bidang Kaderisasi',
        members: [
          { id: 'm1', name: 'Rudi Hartono', role: 'Ketua Bidang', photoUrl: '' }
        ]
      }
    ]
  }
  lastUpdate = new Date('2026-08-03T00:00:00.000Z')
})

describe('GET /tentang/pengurus.md (Salinan Markdown Pengurus)', () => {
  it('membalas 200 dengan Content-Type dan header Link canonical ke /tentang/pengurus', async () => {
    const res = await GET(
      new Request('https://pw-jabar.kammi.id/tentang/pengurus.md'),
      { params: Promise.resolve({ strukturSlug: 'pw-jabar' }) }
    )

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('text/markdown; charset=utf-8')
    expect(res.headers.get('link')).toBe(
      '<https://pw-jabar.kammi.id/tentang/pengurus>; rel="canonical"'
    )
  })

  it('menuliskan periode, triumvirat, dan leaderBlocks sebagai daftar bernama', async () => {
    const res = await GET(
      new Request('https://pw-jabar.kammi.id/tentang/pengurus.md'),
      { params: Promise.resolve({ strukturSlug: 'pw-jabar' }) }
    )

    const text = await res.text()
    expect(text).toContain('Masa Jabatan 2026-2028')
    expect(text).toContain('Ketua: Budi Santoso')
    expect(text).toContain('Sekretaris: Siti Aminah')
    expect(text).toContain('Bendahara: Andi Wijaya')
    expect(text).toContain('## Bidang Kaderisasi')
    expect(text).toContain('- Rudi Hartono — Ketua Bidang')
  })

  it('menuliskan bagian yang terisi saja ketika Pengaturan Situs kosong', async () => {
    leadershipSettings = {
      periodLabel: '',
      heading: '',
      triumvirate: {
        ketua: { name: '', photoUrl: '' },
        sekretaris: { name: '', photoUrl: '' },
        bendahara: { name: '', photoUrl: '' }
      },
      leaders: [],
      leaderBlocks: []
    }

    const res = await GET(
      new Request('https://pw-jabar.kammi.id/tentang/pengurus.md'),
      { params: Promise.resolve({ strukturSlug: 'pw-jabar' }) }
    )

    expect(res.status).toBe(200)
    const text = await res.text()
    expect(text).not.toContain('Ketua:')
    expect(text).not.toContain('##')
  })

  it('menjawab 404 ketika Situs tidak dapat dinavigasi', async () => {
    organizationId = null

    const res = await GET(
      new Request('https://pw-jabar.kammi.id/tentang/pengurus.md'),
      { params: Promise.resolve({ strukturSlug: 'pw-jabar' }) }
    )

    expect(res.status).toBe(404)
  })
})
