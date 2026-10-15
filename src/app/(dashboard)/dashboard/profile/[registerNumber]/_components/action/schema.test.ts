import { describe, expect, test } from 'bun:test'
import { memberManagedSchema, memberSelfEditSchema } from './schema'

/**
 * ADR 0027 — satu tabel, dua skema, dipecah menurut **asal-usul** datanya.
 * `memberSelfEditSchema` memuat apa yang seorang Kader ketahui tentang
 * dirinya; `memberManagedSchema` menambahkan apa yang organisasi berikan
 * kepadanya.
 *
 * Yang paling penting diuji di sini bukan bahwa skema pengurus menerima
 * kolomnya — itu perilaku lama — melainkan bahwa skema sunting-sendiri
 * **menjatuhkannya**. Zod membuang kunci asing tanpa mengeluh, jadi sebuah
 * POST rakitan tangan yang membawa `status: 'ab3'` lolos `safeParse` dan tetap
 * tidak boleh sampai ke `updateMember`. Yang diperiksa adalah hasil parse-nya,
 * bukan keberhasilannya.
 */

const baseSelfEdit = {
  name: 'Fulan',
  gender: 'ikhwan'
}

const baseManaged = {
  ...baseSelfEdit,
  status: 'ab2',
  yearOfEntry: '2020'
}

/**
 * Kolom yang ADR 0027 taruh di sisi kanan garis — **diturunkan** dari selisih
 * kedua skema, bukan disalin. Sebuah kolom pengurus yang ditambahkan kelak
 * ikut teruji di bawah tanpa siapa pun harus ingat mendaftarkannya di sini.
 */
const MANAGED_ONLY_FIELDS = Object.keys(memberManagedSchema.shape).filter(
  (field) => !(field in memberSelfEditSchema.shape)
)

describe('memberSelfEditSchema — apa yang Kader ketahui tentang dirinya', () => {
  test('menerima seluruh kolom sisi kiri', () => {
    const result = memberSelfEditSchema.safeParse({
      ...baseSelfEdit,
      phone: '08123456789',
      photo: '/uploads/foto.webp',
      birthPlace: 'Bandung',
      birthDate: '1998-05-12',
      addressProvince: 'Jawa Barat',
      addressCity: 'Kota Bandung',
      addressDistrict: 'Coblong',
      addressSubdistrict: 'Dago',
      addressProvinceCode: '32',
      addressCityCode: '3273',
      addressDistrictCode: '3273.11',
      addressSubdistrictCode: '3273.11.1001',
      addressLine: 'Jl. Dago No. 1'
    })

    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.name).toBe('Fulan')
    expect(result.data.birthPlace).toBe('Bandung')
    expect(result.data.addressLine).toBe('Jl. Dago No. 1')
  })

  // Inti ADR 0027: seorang Kader yang merakit POST-nya sendiri tidak menaikkan
  // jenjangnya, tidak menandai dirinya Instruktur, dan tidak mencabut
  // Sanksi-nya — bukan karena parse-nya gagal, melainkan karena kolomnya tidak
  // pernah sampai ke hasil.
  // Penjaga bagi daftar yang diturunkan di atas: kalau selisihnya suatu saat
  // menyusut jadi kosong, gelung di bawah berhenti membangkitkan tes dan
  // seluruh berkas ini tetap hijau tanpa menguji apa pun. Daftar eksplisit di
  // sini bukan salinan melainkan isi keputusan ADR 0027 — kolom pengurus baru
  // memang harus menjatuhkannya dengan sadar.
  test('garis pemisahnya persis seperti yang ADR 0027 tetapkan', () => {
    expect(MANAGED_ONLY_FIELDS).toEqual([
      'status',
      'yearOfEntry',
      'isAlumn',
      'isSuspended',
      'isNonActive',
      'isCertifiedMentor',
      'isCertifiedInstructor'
    ])
  })

  for (const field of MANAGED_ONLY_FIELDS) {
    test(`menjatuhkan kolom ${field}`, () => {
      const result = memberSelfEditSchema.parse({
        ...baseManaged,
        isAlumn: 'true',
        isSuspended: 'true',
        isNonActive: 'true',
        isCertifiedMentor: 'true',
        isCertifiedInstructor: 'true'
      })

      expect(result).not.toHaveProperty(field)
    })
  }

  // Sisi kiri tidak punya `status`, jadi aturan AB1 tidak punya apa pun untuk
  // diadili di sini — dan tidak boleh diam-diam menolak lewat kolom yang sudah
  // dijatuhkan.
  test('tidak menegakkan aturan AB1 yang bukan urusannya', () => {
    const result = memberSelfEditSchema.safeParse({
      ...baseSelfEdit,
      status: 'ab1',
      isCertifiedMentor: 'true'
    })

    expect(result.success).toBe(true)
  })

  test('tetap menuntut nama', () => {
    const result = memberSelfEditSchema.safeParse({ ...baseSelfEdit, name: '' })

    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.error.flatten().fieldErrors.name).toEqual([
      'Nama wajib diisi.'
    ])
  })
})

describe('memberSelfEditSchema — tanggal lahir opsional', () => {
  test('koreksi nama dengan tanggal lahir kosong menghasilkan NULL untuk database', () => {
    const formData = new FormData()
    for (const [key, value] of Object.entries({
      ...baseSelfEdit,
      name: 'Nama Dikoreksi',
      birthDate: ''
    })) {
      formData.set(key, value)
    }

    const result = memberSelfEditSchema.parse(
      Object.fromEntries(formData.entries())
    )
    expect(result.name).toBe('Nama Dikoreksi')
    expect(result.birthDate).toBeNull()
  })

  test.each([null, undefined, '1998-05-12', '2000-02-29'])(
    'mempertahankan tanggal lahir %s',
    (birthDate) => {
      expect(
        memberSelfEditSchema.parse({ ...baseSelfEdit, birthDate }).birthDate
      ).toBe(birthDate)
    }
  )

  test.each(['bukan-tanggal', '12/05/1998', '2023-02-29', '2024-04-31'])(
    'tanggal tidak valid %s menjadi galat field',
    (birthDate) => {
      const result = memberSelfEditSchema.safeParse({
        ...baseSelfEdit,
        birthDate
      })
      expect(result.success).toBe(false)
      if (result.success) return
      expect(result.error.flatten().fieldErrors.birthDate).toEqual([
        'Tanggal lahir tidak valid. Gunakan format YYYY-MM-DD.'
      ])
    }
  )
})

describe('memberManagedSchema — apa yang organisasi berikan kepadanya', () => {
  test('memuat kolom sisi kiri sekaligus sisi kanan', () => {
    const result = memberManagedSchema.parse({
      ...baseManaged,
      birthPlace: 'Bandung',
      isSuspended: 'true'
    })

    expect(result.birthPlace).toBe('Bandung')
    expect(result.status).toBe('ab2')
    expect(result.yearOfEntry).toBe(2020)
    expect(result.isSuspended).toBe(true)
  })

  test('menuntut jenjang dan tahun masuk yang tidak dituntut sisi kiri', () => {
    expect(memberManagedSchema.safeParse(baseSelfEdit).success).toBe(false)
    expect(memberSelfEditSchema.safeParse(baseSelfEdit).success).toBe(true)
  })
})

describe('memberManagedSchema — AB1 tidak pernah Pemandu maupun Instruktur', () => {
  test('AB1 + Pemandu ditolak', () => {
    const result = memberManagedSchema.safeParse({
      ...baseManaged,
      status: 'ab1',
      isCertifiedMentor: 'true'
    })
    expect(result.success).toBe(false)
  })

  test('AB1 + Instruktur ditolak', () => {
    const result = memberManagedSchema.safeParse({
      ...baseManaged,
      status: 'ab1',
      isCertifiedInstructor: 'true'
    })
    expect(result.success).toBe(false)
  })

  test('galat menempel pada kedua field sertifikasi', () => {
    const result = memberManagedSchema.safeParse({
      ...baseManaged,
      status: 'ab1',
      isCertifiedMentor: 'true',
      isCertifiedInstructor: 'true'
    })
    if (result.success) throw new Error('seharusnya gagal')

    const fieldErrors = result.error.flatten().fieldErrors
    expect(fieldErrors.isCertifiedMentor).toBeDefined()
    expect(fieldErrors.isCertifiedInstructor).toBeDefined()
  })

  test('AB1 tanpa sertifikasi tetap sah', () => {
    const result = memberManagedSchema.safeParse({
      ...baseManaged,
      status: 'ab1'
    })
    expect(result.success).toBe(true)
  })

  test('AB1 tanpa field sertifikasi sama sekali (block dihilangkan dari form) default ke false dan tetap sah', () => {
    const result = memberManagedSchema.safeParse({
      name: 'Fulan',
      gender: 'ikhwan',
      status: 'ab1',
      yearOfEntry: '2020'
    })
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.isCertifiedMentor).toBe(false)
    expect(result.data.isCertifiedInstructor).toBe(false)
  })

  test('AB2/AB3 dengan sertifikasi tetap sah', () => {
    expect(
      memberManagedSchema.safeParse({
        ...baseManaged,
        status: 'ab2',
        isCertifiedMentor: 'true'
      }).success
    ).toBe(true)
    expect(
      memberManagedSchema.safeParse({
        ...baseManaged,
        status: 'ab3',
        isCertifiedInstructor: 'true'
      }).success
    ).toBe(true)
  })
})
