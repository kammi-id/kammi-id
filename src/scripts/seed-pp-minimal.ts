import { createOrganization } from '../db/query/organization'

// CI (`ci.yml`, job `test`) menjalankan E2E melawan Postgres kosong yang baru
// dimigrasi — tanpa baris organisasi apa pun. `src/proxy.ts` merewrite host
// apex ke slug PP lewat `readOrganization({ type: ['pp'] })`; kalau PP tidak
// ada, ia sengaja jatuh tanpa merewrite (lihat komentarnya) dan Next.js
// menjawab 404 di `/` selamanya — bikin `wait-on` di CI menggantung tanpa
// batas, bukan gagal cepat. `src/scripts/seed.ts` yang penuh (500+ organisasi,
// hashing password per user) benar untuk data pengembangan lokal tapi terlalu
// lambat dipakai di sini; yang dibutuhkan cuma satu PP untuk rewrite apex.
const main = async () => {
  await createOrganization({
    name: 'PP KAMMI (CI)',
    slug: 'kammi',
    type: 'pp',
    code: 'KAMMI',
    parentId: undefined
  })
  console.log('✅ PP minimal untuk E2E CI berhasil dibuat.')
}

main().catch((err) => {
  console.error('❌ Seed PP minimal gagal!')
  console.error(err)
  process.exit(1)
})
