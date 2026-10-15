// Front-matter YAML Salinan Markdown (ADR 0024, tiket 06): `title`, `date`,
// `author`, `organization`, `canonical`, `tags` — persis enam kunci yang
// tiket minta, tidak lebih (mis. TIDAK ada `summary` — itu keputusan
// eksplisit tiket, ringkasan cuma dipakai indeks `/berita.md`).
//
// Tidak ada dependensi YAML (dicek `package.json` sebelum menulis berkas
// ini) — escaping-nya sengaja sempit: setiap nilai string SELALU dikutip
// ganda, jadi titik dua di dalam judul tidak pernah dibaca sebagai
// pemisah key:value YAML, dan satu-satunya karakter yang perlu di-escape
// dalam bentuk kutip-ganda adalah backslash dan kutip ganda itu sendiri.

const escapeYamlDoubleQuoted = (value: string): string =>
  value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')

const yamlString = (value: string): string =>
  `"${escapeYamlDoubleQuoted(value)}"`

export type ArticleFrontMatterFields = {
  title: string
  /** String ISO 8601 tak ambigu (lihat `toWibIsoString`) — bukan format tampilan manusia. */
  date: string
  /** `Penulis` (CONTEXT.md) — teks bebas, nullable (Halaman/Berita lama tidak wajib mengisinya). */
  author: string | null
  organization: string
  /** Permalink HTML absolut — bertahan setelah berkasnya disalin keluar dari HTTP. */
  canonical: string
  tags: string[]
}

export const buildArticleFrontMatter = (
  fields: ArticleFrontMatterFields
): string => {
  const lines = [
    '---',
    `title: ${yamlString(fields.title)}`,
    `date: ${yamlString(fields.date)}`,
    `author: ${fields.author ? yamlString(fields.author) : 'null'}`,
    `organization: ${yamlString(fields.organization)}`,
    `canonical: ${yamlString(fields.canonical)}`,
    `tags: [${fields.tags.map(yamlString).join(', ')}]`,
    '---',
    ''
  ]
  return lines.join('\n')
}
