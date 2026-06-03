// SSR-safe utilities — no browser imports, no Leaflet CSS
// Shared between network-section-client (RSC-rendered) and leaflet-map (client-only)

export const SLUG_MATCH_TOKENS: Record<string, string[]> = {
  'special-region-of-aceh': ['Aceh', 'NAD'],
  'north-sumatera': ['Sumatera Utara', 'Sumut'],
  'west-sumatera': ['Sumatera Barat', 'Sumbar'],
  'riau-islands': ['Kepulauan Riau', 'Kepri'],
  riau: ['Riau'],
  jambi: ['Jambi'],
  'south-sumatera': ['Sumatera Selatan', 'Sumsel'],
  'bangka-belitung-islands': ['Bangka Belitung', 'Babel'],
  bengkulu: ['Bengkulu'],
  lampung: ['Lampung'],
  banten: ['Banten'],
  'jakarta-special-capital-region': ['Jakarta', 'DKI'],
  'west-java': ['Jawa Barat', 'Jabar'],
  'central-java': ['Jawa Tengah', 'Jateng'],
  'special-region-of-yogyakarta': ['Yogyakarta', 'DIY', 'Jogja'],
  'east-java': ['Jawa Timur', 'Jatim'],
  bali: ['Bali'],
  'west-nusa-tenggara': ['Nusa Tenggara Barat', 'NTB'],
  'east-nusa-tenggara': ['Nusa Tenggara Timur', 'NTT'],
  'west-kalimantan': ['Kalimantan Barat', 'Kalbar'],
  'central-kalimantan': ['Kalimantan Tengah', 'Kalteng'],
  'south-kalimantan': ['Kalimantan Selatan', 'Kalsel'],
  'east-kalimantan': ['Kalimantan Timur', 'Kaltim'],
  'north-sulawesi': ['Sulawesi Utara', 'Sulut'],
  gorontalo: ['Gorontalo'],
  'central-sulawesi': ['Sulawesi Tengah', 'Sulteng'],
  'west-sulawesi': ['Sulawesi Barat', 'Sulbar'],
  'south-sulawesi': ['Sulawesi Selatan', 'Sulsel'],
  'southeast-sulawesi': ['Sulawesi Tenggara', 'Sultra'],
  'north-maluku': ['Maluku Utara', 'Malut'],
  maluku: ['Maluku'],
  'north-kalimantan': ['Kalimantan Utara', 'Kaltara'],
  'special-region-of-west-papua': ['Papua Barat', 'Papbar'],
  'special-region-of-papua': ['Papua']
}

export const SLUG_TO_ID_NAME: Record<string, string> = {
  'special-region-of-aceh': 'Aceh',
  'north-sumatera': 'Sumatera Utara',
  'west-sumatera': 'Sumatera Barat',
  riau: 'Riau',
  'riau-islands': 'Kepulauan Riau',
  jambi: 'Jambi',
  'south-sumatera': 'Sumatera Selatan',
  'bangka-belitung-islands': 'Kepulauan Bangka Belitung',
  bengkulu: 'Bengkulu',
  lampung: 'Lampung',
  banten: 'Banten',
  'jakarta-special-capital-region': 'DKI Jakarta',
  'west-java': 'Jawa Barat',
  'central-java': 'Jawa Tengah',
  'special-region-of-yogyakarta': 'DI Yogyakarta',
  'east-java': 'Jawa Timur',
  bali: 'Bali',
  'west-nusa-tenggara': 'Nusa Tenggara Barat',
  'east-nusa-tenggara': 'Nusa Tenggara Timur',
  'west-kalimantan': 'Kalimantan Barat',
  'central-kalimantan': 'Kalimantan Tengah',
  'south-kalimantan': 'Kalimantan Selatan',
  'east-kalimantan': 'Kalimantan Timur',
  'north-kalimantan': 'Kalimantan Utara',
  'north-sulawesi': 'Sulawesi Utara',
  gorontalo: 'Gorontalo',
  'central-sulawesi': 'Sulawesi Tengah',
  'west-sulawesi': 'Sulawesi Barat',
  'south-sulawesi': 'Sulawesi Selatan',
  'southeast-sulawesi': 'Sulawesi Tenggara',
  maluku: 'Maluku',
  'north-maluku': 'Maluku Utara',
  'special-region-of-west-papua': 'Papua Barat',
  'special-region-of-papua': 'Papua'
}

/** Fuzzy-match a PW org name from DB → single province slug (legacy) */
export const matchSlugForPW = (pwName: string): string | null => {
  const upper = pwName.toUpperCase()
  for (const [slug, tokens] of Object.entries(SLUG_MATCH_TOKENS)) {
    if (tokens.some((t) => upper.includes(t.toUpperCase()))) return slug
  }
  return null
}

/**
 * PWs that span more than one province — matched before single-slug fallback.
 * Order matters: more specific rules first.
 */
const PW_MULTI_PROVINCE_RULES: Array<{
  test: (upper: string) => boolean
  slugs: string[]
}> = [
  // PW Kalimantan Timur-Utara → Kaltim + Kaltara
  {
    test: (u) => u.includes('KALIMANTAN') && u.includes('TIMUR') && u.includes('UTARA'),
    slugs: ['east-kalimantan', 'north-kalimantan']
  },
  // PW Papua (bukan Papua Barat) → seluruh wilayah Papua termasuk Papua Barat
  {
    test: (u) => u.includes('PAPUA') && !u.includes('BARAT'),
    slugs: ['special-region-of-papua', 'special-region-of-west-papua']
  }
]

/** Match a PW org name → one or more province slugs */
export const matchSlugsForPW = (pwName: string): string[] => {
  const upper = pwName.toUpperCase()
  for (const rule of PW_MULTI_PROVINCE_RULES) {
    if (rule.test(upper)) return rule.slugs
  }
  const slug = matchSlugForPW(pwName)
  return slug ? [slug] : []
}

/** Tooltip data passed from Leaflet map up to the parent */
export interface ProvinceTooltip {
  visible: boolean
  clientX: number
  clientY: number
  idName: string
  pwName: string | null
}
