/**
 * Pra-terbang duplikat `code`/`slug` — pembacaan murni, nol tulis.
 *
 * DIJALANKAN SESAAT SEBELUM MIGRASI CONSTRAINT, terhadap basis data yang akan
 * dimigrasi — oleh orang yang men-deploy migrasinya, bukan sekali saat
 * perencanaan. Jendela antara inspeksi dan deploy adalah jendela pendaftaran
 * Struktur baru, jadi hasil yang berumur berhari-hari tidak menjamin apa pun.
 *
 * Menghitung duplikat `code`, `slug`, dan `code_slug` di tabel `organization`,
 * lalu untuk tiap duplikat mencatat Strukturnya, Jenjangnya, dan berapa Member
 * yang terdaftar di sana. Member yang sudah dihapus lunak dihitung TERPISAH:
 * ADR 0004 bergantung pada fakta bahwa Member terhapus masih memegang Nomor
 * Induk Anggota yang tersusun dari `code` itu.
 *
 * --- Pohon keputusan (spec §4.6) ------------------------------------------
 *
 *   | Temuan             | Putusan                                          |
 *   | ------------------ | ------------------------------------------------ |
 *   | nol duplikat       | jalan; kedua migrasi constraint berangkat         |
 *   | `slug` duplikat    | perbaiki mekanis (ganti nama yang kalah), lalu    |
 *   |   saja             | jalan                                             |
 *   | `code` duplikat    | BERHENTI. Kirim migrasi `slug` saja; `code`       |
 *   |                    | menunggu putusan manusia                          |
 *   | `code_slug`        | abaikan — ia tidak dipasangi constraint           |
 *   |   duplikat         |                                                   |
 *
 * Kenapa `slug` dan `code` tidak setara: `slug` cuma URL dan bebas dipungut
 * ulang, jadi yang kalah tinggal diganti namanya. `code` TIDAK BISA DIPERBAIKI
 * SECARA MEKANIS, TITIK — ADR 0004 mengunci `code` selamanya, jadi menggantinya
 * demi memuaskan constraint justru melanggar ADR yang melahirkan constraint
 * itu. `code` duplikat bukan pekerjaan migrasi; ia insiden data yang menuntut
 * putusan manusia.
 *
 * --------------------------------------------------------------------------
 *
 * Sengaja lewat `requireDatabaseConsent` yang sama dengan `db:migrate`, supaya
 * skrip ini tidak jadi pintu belakang yang melewati guard.
 *
 * Percobaan pertama mati dengan `relation "organization" does not exist`, jadi
 * skrip ini MENGORIENTASI DIRI lebih dulu — versi server, search_path, dan di
 * skema mana `organization` sebenarnya berada — sebelum menghitung apa pun.
 * Kalau tabelnya memang tidak ada, ia bilang begitu dan berhenti dengan tenang
 * alih-alih melempar galat mentah.
 */
import { SQL } from 'bun'
import { requireDatabaseConsent } from '~/lib/db-guard/consent'

requireDatabaseConsent()

const sql = new SQL(process.env.DATABASE_URL as string)

// --- Orientasi -------------------------------------------------------------

const [where] = await sql`
  SELECT current_database()                AS basis_data,
         current_schema()                  AS skema_aktif,
         current_setting('search_path')    AS search_path,
         current_setting('server_version') AS versi_server
`
console.log('\n=== di mana kita ===')
console.table([where])

const hosts = await sql`
  SELECT schemaname AS skema, tablename AS tabel
    FROM pg_tables
   WHERE tablename = 'organization'
   ORDER BY schemaname
`

if (hosts.length === 0) {
  console.log('\n=== tabel `organization` TIDAK ADA di basis data ini ===')

  const tables = await sql`
    SELECT schemaname AS skema, tablename AS tabel
      FROM pg_tables
     WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
     ORDER BY schemaname, tablename
  `

  if (tables.length === 0) {
    console.log('Basis data ini kosong melompong — nol tabel di luar katalog.')
  } else {
    console.log(`Yang ada cuma ${tables.length} tabel berikut:`)
    console.table(tables)
  }

  await sql.end()
  process.exit(0)
}

if (hosts.length > 1) {
  console.log('\n⚠️  `organization` ada di LEBIH DARI SATU skema:')
  console.table(hosts)
  console.log('Yang dibaca di bawah ini yang pertama menurut search_path.')
}

const schema = hosts[0].skema as string
console.log(`\nmembaca \`${schema}.organization\`.`)

// --- Hitungan --------------------------------------------------------------

const q = (name: string) => `"${schema}"."${name}"`

const duplicatesOf = async (column: 'code' | 'slug' | 'code_slug') =>
  sql.unsafe(`
    SELECT o.${column} AS value,
           count(*)    AS rows
      FROM ${q('organization')} o
     GROUP BY o.${column}
    HAVING count(*) > 1
     ORDER BY count(*) DESC, o.${column}
  `)

const rowsSharing = async (column: 'code' | 'slug' | 'code_slug') =>
  sql.unsafe(`
    SELECT o.id,
           o.name,
           o.type,
           o.code,
           o.slug,
           o.is_non_active,
           (SELECT count(*) FROM ${q('member')} m
             WHERE m.organization_id = o.id
               AND m.deleted_at IS NULL)     AS member_hidup,
           (SELECT count(*) FROM ${q('member')} m
             WHERE m.organization_id = o.id
               AND m.deleted_at IS NOT NULL) AS member_terhapus
      FROM ${q('organization')} o
     WHERE o.${column} IN (
             SELECT ${column} FROM ${q('organization')}
              GROUP BY ${column} HAVING count(*) > 1
           )
     ORDER BY o.${column}, o.type, o.name
  `)

const report = async (column: 'code' | 'slug' | 'code_slug') => {
  const groups = await duplicatesOf(column)
  console.log(`\n=== ${column} ===`)
  console.log(`kelompok duplikat: ${groups.length}`)

  if (groups.length === 0) {
    console.log('nol duplikat.')
    return 0
  }

  console.table(groups)
  console.log(`\nbaris yang terlibat (${column}):`)
  console.table(await rowsSharing(column))

  return groups.length
}

const [{ total }] = await sql.unsafe(
  `SELECT count(*) AS total FROM ${q('organization')}`
)
console.log(`total baris organization: ${total}`)

const duplicateCode = await report('code')
const duplicateSlug = await report('slug')
await report('code_slug')

// --- Putusan ---------------------------------------------------------------

/**
 * Pohon keputusan spec §4.6, dicetak apa adanya supaya orang yang menjalankan
 * migrasi membacanya tanpa harus membuka spec.
 */
console.log(`
=== pohon keputusan (spec §4.6) ===

  temuan                | putusan
  ----------------------+--------------------------------------------------
  nol duplikat          | jalan; kedua migrasi constraint berangkat
  \`slug\` duplikat saja  | perbaiki mekanis (ganti nama yang kalah), lalu jalan
  \`code\` duplikat       | BERHENTI. Kirim migrasi \`slug\` saja; \`code\`
                        | menunggu putusan manusia
  \`code_slug\` duplikat  | abaikan — ia tidak dipasangi constraint

\`code\` duplikat TIDAK BISA diperbaiki secara mekanis, titik. ADR 0004 mengunci
\`code\` selamanya, jadi menggantinya demi memuaskan constraint justru melanggar
ADR yang melahirkan constraint itu. Ia insiden data yang menuntut putusan
manusia, bukan pekerjaan migrasi.`)

console.log('\n=== putusan untuk basis data ini ===')

if (duplicateCode > 0) {
  console.log(
    `BERHENTI. ${duplicateCode} kelompok \`code\` duplikat ditemukan.\n` +
      'Kirim migrasi `slug` saja; migrasi unique `code` menunggu putusan manusia.'
  )
} else if (duplicateSlug > 0) {
  console.log(
    `${duplicateSlug} kelompok \`slug\` duplikat, nol duplikat \`code\`.\n` +
      'Perbaiki `slug` yang kalah secara mekanis lebih dulu, lalu jalan.'
  )
} else {
  console.log(
    'Nol duplikat `code` dan `slug` — kedua migrasi constraint boleh berangkat.'
  )
}

await sql.end()
