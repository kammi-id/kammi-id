/**
 * Satu pembantu terpusat untuk menurunkan tahun/bulan Asia/Jakarta dari
 * `article.published_at`, dan untuk membangunnya kembali dari jam dinding
 * Asia/Jakarta. ADR 0014 mewajibkan derivasi ini hidup di satu tempat, dipakai
 * jalur tulis maupun jalur baca — jangan dihitung ulang di pemanggil.
 *
 * ## Kenapa `getUTC*`, bukan `get*`
 *
 * Kolom `published_at` bertipe `timestamp` (tanpa zona waktu) dan **angka
 * mentahnya adalah jam dinding Asia/Jakarta itu sendiri** — bukan UTC yang
 * perlu dikonversi (ADR 0014). Driver basis data di sini (`Bun.SQL`, dipakai
 * lewat `drizzle-orm/bun-sql`, lihat `src/db/db.ts`) membaca dan menulis
 * kolom `timestamp` semacam ini dengan memetakan digit mentah langsung ke
 * slot **UTC** milik `Date`, sama sekali tanpa konversi zona waktu apa pun.
 * Dibuktikan empiris: menyimpan literal `06:00:00` menghasilkan `Date` di
 * mana `getUTCHours() === 6`, dan menulis `Date` semacam itu balik
 * menghasilkan baris `06:00:00` — simetris pada kedua arah.
 *
 * Konsekuensinya: pembantu ini SELALU memakai getter `getUTC*`. Getter
 * lokal (`getFullYear()`, `getHours()`, dst.) ikut bergantung pada zona
 * waktu proses yang menjalankannya — begitu proses itu tidak lagi berzona
 * waktu Asia/Jakarta (produksi bisa jadi UTC), `get*` biasa diam-diam
 * menggeser tanggal. Itu persis bug yang diperingatkan ADR 0014: Berita
 * pukul 06.00 WIB tanggal 1 Januari jatuh ke alamat Desember tahun
 * sebelumnya.
 */

/** Asia/Jakarta (WIB) selalu UTC+7, tanpa DST — tidak pernah berubah. */
const WIB_OFFSET_MS = 7 * 60 * 60 * 1000

/**
 * Menurunkan tahun dan bulan (1–12) Asia/Jakarta dari sebuah `published_at`
 * tersimpan. Dipakai jalur baca — Permalink dan pengalihan kanoniknya.
 */
export const deriveTahunBulanTerbit = (
  publishedAt: Date
): { tahun: number; bulan: number } => ({
  tahun: publishedAt.getUTCFullYear(),
  bulan: publishedAt.getUTCMonth() + 1
})

/**
 * Instan UTC sungguhan yang diwakili sebuah `published_at` — dipakai untuk
 * membandingkan "apakah tanggal terbitnya sudah lewat" terhadap waktu
 * sekarang. WIB = UTC+7, dan nilai pseudo-UTC yang tersimpan sudah berupa jam
 * dinding WIB, jadi instan sungguhannya didapat dengan **mengurangi** 7 jam.
 */
const toInstanSungguhan = (publishedAt: Date): Date =>
  new Date(publishedAt.getTime() - WIB_OFFSET_MS)

/**
 * Terbit menuntut dua hal (spec §"Artikel di permukaan publik"): dinyatakan
 * terbit **dan** tanggal terbitnya sudah lewat. Fungsi ini menjawab separuh
 * kedua — perbandingan waktu murni, lepas dari status. `now` bisa disuntik
 * untuk pengujian; defaultnya `new Date()` (instan UTC sungguhan saat ini,
 * TZ-independent — `Date` selalu menyimpan epoch UTC di dalam, apa pun zona
 * waktu proses).
 */
export const isTerbit = (
  publishedAt: Date | null,
  now: Date = new Date()
): boolean => {
  if (!publishedAt) return false
  return toInstanSungguhan(publishedAt).getTime() <= now.getTime()
}

/**
 * Kebalikan `toInstanSungguhan`: nilai yang bisa dibandingkan langsung
 * (`<=`) terhadap kolom `published_at` mentah di dalam SQL — dipakai ketika
 * gerbang Terbit perlu ditegakkan di jalur query, bukan lewat baris yang
 * sudah ditarik ke JS (mis. cek "apakah Struktur ini punya Berita Terbit"
 * tanpa menarik semua barisnya). `stored <= terbitCutoffForQuery(now)` setara
 * dengan `isTerbit(stored, now)` — lihat komentar `toInstanSungguhan` untuk
 * aljabarnya.
 */
export const terbitCutoffForQuery = (now: Date = new Date()): Date =>
  new Date(now.getTime() + WIB_OFFSET_MS)

const WIB_WALL_CLOCK_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/

/**
 * Sisi tulis: sebuah jam dinding Asia/Jakarta ("YYYY-MM-DDTHH:mm", persis
 * nilai `<input type="datetime-local">`, tanpa info zona) menjadi `Date`
 * yang siap disimpan ke `published_at`.
 *
 * Angka-angkanya ditaruh **langsung** ke slot UTC `Date` lewat `Date.UTC`,
 * meniru simetri driver di atas — bukan dikonversi lewat zona waktu proses
 * yang menjalankan kode ini. Itulah akar bug yang sama: `new Date(localString)`
 * biasa membaca string tanpa-zona sebagai waktu LOKAL proses, yang benar hanya
 * kebetulan kalau prosesnya sendiri berzona waktu Asia/Jakarta.
 */
export const wibWallClockToPublishedAt = (
  localDatetime: string
): Date | null => {
  const match = WIB_WALL_CLOCK_PATTERN.exec(localDatetime)
  if (!match) return null
  const [, y, mo, d, h, mi, s] = match
  return new Date(
    Date.UTC(
      Number(y),
      Number(mo) - 1,
      Number(d),
      Number(h),
      Number(mi),
      s ? Number(s) : 0
    )
  )
}

/**
 * Kebalikan `wibWallClockToPublishedAt`: memformat jam dinding Asia/Jakarta
 * ("YYYY-MM-DDTHH:mm") dari sebuah `published_at` tersimpan, untuk mengisi
 * kembali `<input type="datetime-local">` di form dasbor.
 */
export const publishedAtToWibWallClock = (publishedAt: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${publishedAt.getUTCFullYear()}-${pad(
    publishedAt.getUTCMonth() + 1
  )}-${pad(publishedAt.getUTCDate())}T${pad(publishedAt.getUTCHours())}:${pad(
    publishedAt.getUTCMinutes()
  )}`
}

const NAMA_BULAN = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember'
]

/**
 * Tanggal terbit yang enak dibaca ("1 Januari 2026") untuk permukaan publik.
 *
 * SENGAJA tidak memakai `Intl.DateTimeFormat(..., { timeZone: 'Asia/Jakarta' })`
 * — itu akan mengonversi instan UTC SUNGGUHAN sebuah `Date` ke Asia/Jakarta,
 * padahal `publishedAt` yang masuk ke sini bukan instan UTC sungguhan:
 * digitnya SUDAH jam dinding Asia/Jakarta, ditaruh di slot UTC (lihat komentar
 * di atas berkas ini). Memakai `Intl` + `timeZone` akan menggeser sekali lagi
 * di atas pergeseran yang sudah "dibatalkan" oleh cara driver membaca kolom
 * ini — persis kelas bug yang diperingatkan ADR 0014, hanya di sisi tampilan.
 */
export const formatTanggalTerbit = (publishedAt: Date): string =>
  `${publishedAt.getUTCDate()} ${
    NAMA_BULAN[publishedAt.getUTCMonth()]
  } ${publishedAt.getUTCFullYear()}`

/**
 * String ISO 8601 dengan offset `+07:00` eksplisit — dipakai atribut
 * `dateTime` sebuah elemen `<time>`. Dibangun dari getter UTC yang sama
 * (bukan `toISOString()`, yang akan mengaku `Z`/UTC padahal digitnya WIB).
 */
export const toWibIsoString = (publishedAt: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${publishedAt.getUTCFullYear()}-${pad(
    publishedAt.getUTCMonth() + 1
  )}-${pad(publishedAt.getUTCDate())}T${pad(publishedAt.getUTCHours())}:${pad(
    publishedAt.getUTCMinutes()
  )}:${pad(publishedAt.getUTCSeconds())}+07:00`
}
