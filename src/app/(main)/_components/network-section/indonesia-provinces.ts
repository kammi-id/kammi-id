// Indonesia provinces — simplified SVG paths
// viewBox "0 0 880 400"
// Coordinate system: x = (lon - 95) * 19.13, y = (6 - lat) * 23.53
// Paths are simplified polygons; geographically approximate, not GIS-precise.

export type ProvinceData = {
  id: string
  name: string
  path: string
  /** Centroid x for tooltip anchor */
  cx: number
  /** Centroid y for tooltip anchor */
  cy: number
  /** Island group for visual grouping */
  island: 'sumatra' | 'java' | 'kalimantan' | 'sulawesi' | 'bali-ntt' | 'maluku' | 'papua'
}

// Province-name fragments used to fuzzy-match PW org names from the DB.
// The first matching PW whose name contains any of the tokens wins.
export const PROVINCE_MATCH_TOKENS: Record<string, string[]> = {
  aceh: ['Aceh', 'NAD'],
  'sumatera-utara': ['Sumatera Utara', 'Sumut', 'Sumatra Utara'],
  'sumatera-barat': ['Sumatera Barat', 'Sumbar', 'Sumatra Barat'],
  riau: ['Riau'],
  'kepulauan-riau': ['Kepulauan Riau', 'Kepri'],
  jambi: ['Jambi'],
  'sumatera-selatan': ['Sumatera Selatan', 'Sumsel', 'Sumatra Selatan'],
  'bangka-belitung': ['Bangka Belitung', 'Babel'],
  bengkulu: ['Bengkulu'],
  lampung: ['Lampung'],
  banten: ['Banten'],
  'dki-jakarta': ['Jakarta', 'DKI'],
  'jawa-barat': ['Jawa Barat', 'Jabar'],
  'jawa-tengah': ['Jawa Tengah', 'Jateng'],
  'di-yogyakarta': ['Yogyakarta', 'DIY', 'Jogja'],
  'jawa-timur': ['Jawa Timur', 'Jatim'],
  bali: ['Bali'],
  ntb: ['Nusa Tenggara Barat', 'NTB'],
  ntt: ['Nusa Tenggara Timur', 'NTT'],
  'kalimantan-barat': ['Kalimantan Barat', 'Kalbar'],
  'kalimantan-tengah': ['Kalimantan Tengah', 'Kalteng'],
  'kalimantan-selatan': ['Kalimantan Selatan', 'Kalsel'],
  'kalimantan-timur': ['Kalimantan Timur', 'Kaltim'],
  'kalimantan-utara': ['Kalimantan Utara', 'Kaltara'],
  'sulawesi-utara': ['Sulawesi Utara', 'Sulut'],
  gorontalo: ['Gorontalo'],
  'sulawesi-tengah': ['Sulawesi Tengah', 'Sulteng'],
  'sulawesi-barat': ['Sulawesi Barat', 'Sulbar'],
  'sulawesi-selatan': ['Sulawesi Selatan', 'Sulsel'],
  'sulawesi-tenggara': ['Sulawesi Tenggara', 'Sultra'],
  'maluku-utara': ['Maluku Utara', 'Malut'],
  maluku: ['Maluku'],
  'papua-barat-daya': ['Papua Barat Daya', 'PBD'],
  'papua-barat': ['Papua Barat', 'Papbar'],
  'papua-tengah': ['Papua Tengah'],
  'papua-pegunungan': ['Papua Pegunungan'],
  papua: ['Papua'],
  'papua-selatan': ['Papua Selatan'],
}

export const INDONESIA_PROVINCES: ProvinceData[] = [
  // ── SUMATRA ──────────────────────────────────────────────────────────────
  {
    id: 'aceh',
    name: 'Aceh',
    path: 'M 4,4 L 68,22 L 68,92 L 28,94 L 16,80 Z',
    cx: 37,
    cy: 52,
    island: 'sumatra'
  },
  {
    id: 'sumatera-utara',
    name: 'Sumatera Utara',
    path: 'M 28,94 L 68,92 L 118,102 L 122,150 L 92,154 L 58,142 L 30,120 Z',
    cx: 80,
    cy: 122,
    island: 'sumatra'
  },
  {
    id: 'sumatera-barat',
    name: 'Sumatera Barat',
    path: 'M 30,120 L 58,142 L 64,168 L 60,198 L 42,200 L 24,184 L 22,148 Z',
    cx: 44,
    cy: 164,
    island: 'sumatra'
  },
  {
    id: 'riau',
    name: 'Riau',
    path: 'M 92,154 L 122,150 L 150,156 L 166,174 L 164,196 L 132,200 L 96,196 L 84,178 Z',
    cx: 128,
    cy: 177,
    island: 'sumatra'
  },
  {
    id: 'kepulauan-riau',
    name: 'Kepulauan Riau',
    path: 'M 176,150 L 202,144 L 212,158 L 206,172 L 188,174 L 174,162 Z',
    cx: 193,
    cy: 159,
    island: 'sumatra'
  },
  {
    id: 'jambi',
    name: 'Jambi',
    path: 'M 84,178 L 96,196 L 132,200 L 146,222 L 124,232 L 94,230 L 76,212 Z',
    cx: 108,
    cy: 209,
    island: 'sumatra'
  },
  {
    id: 'sumatera-selatan',
    name: 'Sumatera Selatan',
    path: 'M 96,196 L 164,196 L 184,212 L 194,236 L 192,264 L 158,270 L 122,262 L 108,248 L 124,232 L 146,222 Z',
    cx: 150,
    cy: 237,
    island: 'sumatra'
  },
  {
    id: 'bangka-belitung',
    name: 'Kepulauan Bangka Belitung',
    path: 'M 196,244 L 220,238 L 232,254 L 228,268 L 206,272 L 192,260 Z',
    cx: 212,
    cy: 256,
    island: 'sumatra'
  },
  {
    id: 'bengkulu',
    name: 'Bengkulu',
    path: 'M 22,184 L 42,200 L 50,224 L 46,252 L 28,252 L 14,234 L 12,208 Z',
    cx: 31,
    cy: 221,
    island: 'sumatra'
  },
  {
    id: 'lampung',
    name: 'Lampung',
    path: 'M 54,252 L 78,248 L 108,248 L 122,262 L 116,288 L 90,296 L 64,286 L 52,268 Z',
    cx: 88,
    cy: 272,
    island: 'sumatra'
  },

  // ── JAVA ─────────────────────────────────────────────────────────────────
  {
    id: 'banten',
    name: 'Banten',
    path: 'M 188,262 L 218,258 L 226,268 L 222,286 L 204,292 L 190,278 Z',
    cx: 208,
    cy: 274,
    island: 'java'
  },
  {
    id: 'dki-jakarta',
    name: 'DKI Jakarta',
    path: 'M 222,258 L 238,254 L 244,264 L 238,272 L 224,268 Z',
    cx: 233,
    cy: 264,
    island: 'java'
  },
  {
    id: 'jawa-barat',
    name: 'Jawa Barat',
    path: 'M 226,268 L 278,258 L 294,262 L 290,280 L 268,290 L 238,292 L 222,286 Z',
    cx: 258,
    cy: 277,
    island: 'java'
  },
  {
    id: 'jawa-tengah',
    name: 'Jawa Tengah',
    path: 'M 294,262 L 346,258 L 356,265 L 354,280 L 334,288 L 294,286 Z',
    cx: 324,
    cy: 275,
    island: 'java'
  },
  {
    id: 'di-yogyakarta',
    name: 'DI Yogyakarta',
    path: 'M 334,282 L 354,280 L 358,290 L 344,298 L 330,294 Z',
    cx: 344,
    cy: 289,
    island: 'java'
  },
  {
    id: 'jawa-timur',
    name: 'Jawa Timur',
    path: 'M 356,265 L 434,258 L 448,268 L 448,292 L 420,304 L 382,306 L 354,296 L 354,280 Z',
    cx: 402,
    cy: 284,
    island: 'java'
  },

  // ── KALIMANTAN ───────────────────────────────────────────────────────────
  {
    id: 'kalimantan-barat',
    name: 'Kalimantan Barat',
    path: 'M 228,194 L 248,102 L 270,58 L 296,44 L 308,72 L 300,114 L 312,150 L 308,196 L 280,210 L 254,206 Z',
    cx: 276,
    cy: 132,
    island: 'kalimantan'
  },
  {
    id: 'kalimantan-tengah',
    name: 'Kalimantan Tengah',
    path: 'M 254,206 L 280,210 L 308,196 L 340,196 L 376,206 L 398,222 L 390,260 L 354,266 L 310,260 L 276,244 Z',
    cx: 330,
    cy: 231,
    island: 'kalimantan'
  },
  {
    id: 'kalimantan-selatan',
    name: 'Kalimantan Selatan',
    path: 'M 376,206 L 406,206 L 430,220 L 440,242 L 434,264 L 408,272 L 390,262 L 390,260 L 398,222 Z',
    cx: 408,
    cy: 238,
    island: 'kalimantan'
  },
  {
    id: 'kalimantan-timur',
    name: 'Kalimantan Timur',
    path: 'M 340,196 L 376,206 L 398,222 L 390,260 L 408,272 L 440,257 L 470,220 L 482,180 L 468,130 L 440,86 L 406,64 L 364,64 L 338,82 L 326,120 L 330,156 L 336,180 Z',
    cx: 410,
    cy: 162,
    island: 'kalimantan'
  },
  {
    id: 'kalimantan-utara',
    name: 'Kalimantan Utara',
    path: 'M 364,64 L 406,64 L 440,86 L 468,130 L 452,120 L 418,98 L 388,74 L 366,68 Z',
    cx: 412,
    cy: 94,
    island: 'kalimantan'
  },

  // ── SULAWESI ─────────────────────────────────────────────────────────────
  // Sulawesi has a distinctive K/orchid shape with four peninsulas
  {
    id: 'sulawesi-tengah',
    name: 'Sulawesi Tengah',
    path: 'M 490,66 L 520,58 L 532,68 L 528,82 L 558,90 L 572,108 L 562,150 L 540,166 L 505,170 L 472,154 L 468,132 L 476,100 Z',
    cx: 518,
    cy: 116,
    island: 'sulawesi'
  },
  {
    id: 'gorontalo',
    name: 'Gorontalo',
    path: 'M 530,70 L 548,64 L 556,70 L 552,82 L 540,86 L 528,82 Z',
    cx: 542,
    cy: 76,
    island: 'sulawesi'
  },
  {
    id: 'sulawesi-utara',
    name: 'Sulawesi Utara',
    path: 'M 556,62 L 602,58 L 614,70 L 600,84 L 567,88 L 556,80 Z',
    cx: 582,
    cy: 73,
    island: 'sulawesi'
  },
  {
    id: 'sulawesi-barat',
    name: 'Sulawesi Barat',
    path: 'M 468,154 L 505,170 L 502,202 L 485,220 L 462,220 L 452,200 L 455,174 Z',
    cx: 476,
    cy: 191,
    island: 'sulawesi'
  },
  {
    id: 'sulawesi-selatan',
    name: 'Sulawesi Selatan',
    path: 'M 505,170 L 540,166 L 562,150 L 568,172 L 563,204 L 546,226 L 526,234 L 503,230 L 488,214 L 502,202 Z',
    cx: 530,
    cy: 198,
    island: 'sulawesi'
  },
  {
    id: 'sulawesi-tenggara',
    name: 'Sulawesi Tenggara',
    path: 'M 526,234 L 546,226 L 563,204 L 578,214 L 580,240 L 565,260 L 541,264 L 518,250 L 514,234 Z',
    cx: 549,
    cy: 237,
    island: 'sulawesi'
  },

  // ── BALI & NUSA TENGGARA ──────────────────────────────────────────────────
  {
    id: 'bali',
    name: 'Bali',
    path: 'M 450,268 L 470,264 L 478,278 L 472,290 L 450,288 Z',
    cx: 464,
    cy: 278,
    island: 'bali-ntt'
  },
  {
    id: 'ntb',
    name: 'Nusa Tenggara Barat',
    path: 'M 480,266 L 508,262 L 526,268 L 524,284 L 505,292 L 478,290 Z',
    cx: 501,
    cy: 278,
    island: 'bali-ntt'
  },
  {
    id: 'ntt',
    name: 'Nusa Tenggara Timur',
    path: 'M 528,268 L 580,264 L 626,272 L 642,288 L 624,304 L 590,312 L 554,312 L 524,302 L 518,286 Z',
    cx: 578,
    cy: 290,
    island: 'bali-ntt'
  },

  // ── MALUKU ───────────────────────────────────────────────────────────────
  {
    id: 'maluku-utara',
    name: 'Maluku Utara',
    path: 'M 614,70 L 654,68 L 670,84 L 662,110 L 640,120 L 614,114 L 602,92 Z',
    cx: 637,
    cy: 94,
    island: 'maluku'
  },
  {
    id: 'maluku',
    name: 'Maluku',
    path: 'M 614,122 L 648,118 L 664,134 L 667,164 L 650,182 L 622,180 L 605,162 L 602,136 Z',
    cx: 635,
    cy: 153,
    island: 'maluku'
  },

  // ── PAPUA ─────────────────────────────────────────────────────────────────
  // Bird's head is roughly x=668-730, y=100-175
  {
    id: 'papua-barat-daya',
    name: 'Papua Barat Daya',
    path: 'M 668,132 L 702,120 L 722,124 L 730,146 L 720,166 L 698,174 L 676,160 Z',
    cx: 703,
    cy: 148,
    island: 'papua'
  },
  {
    id: 'papua-barat',
    name: 'Papua Barat',
    path: 'M 676,160 L 698,174 L 720,166 L 736,180 L 736,212 L 715,228 L 690,226 L 672,210 L 666,184 Z',
    cx: 701,
    cy: 194,
    island: 'papua'
  },
  {
    id: 'papua-tengah',
    name: 'Papua Tengah',
    path: 'M 732,90 L 782,86 L 818,102 L 822,132 L 806,160 L 774,170 L 742,164 L 730,146 L 722,124 Z',
    cx: 774,
    cy: 132,
    island: 'papua'
  },
  {
    id: 'papua-pegunungan',
    name: 'Papua Pegunungan',
    path: 'M 774,170 L 806,160 L 842,170 L 856,198 L 850,228 L 822,244 L 790,244 L 763,230 L 752,207 L 745,184 Z',
    cx: 806,
    cy: 205,
    island: 'papua'
  },
  {
    id: 'papua',
    name: 'Papua',
    path: 'M 822,244 L 856,230 L 880,242 L 880,302 L 861,330 L 826,340 L 794,334 L 768,314 L 760,282 L 770,257 L 790,244 Z',
    cx: 831,
    cy: 289,
    island: 'papua'
  },
  {
    id: 'papua-selatan',
    name: 'Papua Selatan',
    path: 'M 736,212 L 763,230 L 790,244 L 770,257 L 760,282 L 740,294 L 718,287 L 703,270 L 699,244 L 711,226 L 715,228 Z',
    cx: 740,
    cy: 257,
    island: 'papua'
  }
]

/** Match a PW organization name to a province id */
export const matchProvinceId = (pwName: string): string | null => {
  const upper = pwName.toUpperCase()
  for (const [id, tokens] of Object.entries(PROVINCE_MATCH_TOKENS)) {
    if (tokens.some((t) => upper.includes(t.toUpperCase()))) return id
  }
  return null
}
