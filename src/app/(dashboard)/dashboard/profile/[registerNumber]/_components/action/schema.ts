import { z } from 'zod'
import {
  birthDateFormField,
  refineAb1Certification,
  booleanFormField as booleanField
} from '~/lib/validation/member'
import { phoneFormField } from '~/lib/validation/phone'

/**
 * ADR 0027 — apa yang seorang Kader **ketahui tentang dirinya**: identitas,
 * kontak, kelahiran, dan alamat.
 *
 * Garis pemisahnya adalah asal-usul, bukan sensitivitas. Tanggal lahir lebih
 * pribadi daripada Jenjang Kaderisasi, dan justru tanggal lahir yang ada di
 * sini — yang menentukan adalah siapa yang berhak menetapkannya.
 *
 * `member.name` sengaja ada di sini meski ia tercetak di Kartu Tanda Anggota.
 * `user.name` — NIA, sekaligus identitas login — tidak, dan dikunci di tempat
 * lain (`dashboard/user/account`).
 */
export const memberSelfEditSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi.'),
  gender: z.enum(['ikhwan', 'akhwat']),
  phone: phoneFormField,
  photo: z.string().optional().nullable(),
  birthPlace: z.string().optional().nullable(),
  birthDate: birthDateFormField,
  addressProvince: z.string().optional().nullable(),
  addressCity: z.string().optional().nullable(),
  addressDistrict: z.string().optional().nullable(),
  addressSubdistrict: z.string().optional().nullable(),
  addressProvinceCode: z.string().optional().nullable(),
  addressCityCode: z.string().optional().nullable(),
  addressDistrictCode: z.string().optional().nullable(),
  addressSubdistrictCode: z.string().optional().nullable(),
  addressLine: z.string().optional().nullable()
})

/**
 * ADR 0027 — apa yang **organisasi berikan** kepadanya, di atas segalanya yang
 * ia ketahui sendiri: Jenjang Kaderisasi, Keadaan Kader, sertifikasi
 * Perangkat, dan tahun masuk. Root dan BPK saja, di dalam Cakupan.
 *
 * Ketiga sumbu itu seluruhnya diputuskan lewat Kelulusan sebuah Daurah atau
 * keputusan kepengurusan, dan sebuah Kewenangan yang bisa menetapkan sendiri
 * jenjangnya membuat ketiganya berhenti berarti apa pun.
 *
 * Dibangun dengan `.extend()` alih-alih dua daftar kolom yang disalin, supaya
 * kolom baru di sisi kiri tidak bisa lupa muncul di sisi kanan.
 */
export const memberManagedSchema = memberSelfEditSchema
  .extend({
    status: z.enum(['ab1', 'ab2', 'ab3']),
    yearOfEntry: z.coerce.number().min(1998).max(new Date().getFullYear()),
    isAlumn: booleanField.default(false),
    isSuspended: booleanField.default(false),
    isNonActive: booleanField.default(false),
    isCertifiedMentor: booleanField.default(false),
    isCertifiedInstructor: booleanField.default(false)
  })
  .superRefine(refineAb1Certification)
