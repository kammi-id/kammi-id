import { pgTable, unique } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { organization } from './organization.sql'

export const member = pgTable(
  'member',
  (t) => ({
    id: t
      .uuid()
      .primaryKey()
      .default(sql`uuidv7()`),
    name: t.text('name').notNull(),
    phone: t.text('phone'),
    addressProvince: t.text('address_province'),
    addressCity: t.text('address_city'),
    addressDistrict: t.text('address_district'),
    addressSubdistrict: t.text('address_subdistrict'),
    addressProvinceCode: t.text('address_province_code'),
    addressCityCode: t.text('address_city_code'),
    addressDistrictCode: t.text('address_district_code'),
    addressSubdistrictCode: t.text('address_subdistrict_code'),
    addressLine: t.text('address_line'),
    photo: t.text('photo'),
    birthPlace: t.text('birth_place'),
    birthDate: t.date('birth_date'),
    registerNumber: t.text('register_number').notNull(),
    organizationId: t
      .uuid('organization_id')
      .notNull()
      .references(() => organization.id),
    isAlumn: t.boolean('is_alumn').default(false).notNull(),
    isSuspended: t.boolean('is_suspended').default(false).notNull(),
    isNonActive: t.boolean('is_non_active').default(false).notNull(),
    status: t.text('status', { enum: ['ab1', 'ab2', 'ab3'] }).notNull(),
    gender: t.text('gender', { enum: ['ikhwan', 'akhwat'] }).notNull(),
    isCertifiedMentor: t
      .boolean('is_certified_mentor')
      .default(false)
      .notNull(),
    isCertifiedInstructor: t
      .boolean('is_certified_instructor')
      .default(false)
      .notNull(),
    yearOfEntry: t.integer('year_of_entry').notNull(),
    deletedAt: t.timestamp('deleted_at')
  }),
  (table) => [
    /**
     * Jaring pengaman terakhir (ADR 0020) di belakang alokasi atomik pada
     * `register_number_sequence` — bukan sumber alokasinya. Dieja tangan
     * dengan alasan yang sama seperti `organization_code_unique`: penanganan
     * `23505` di jalur tulis perlu membedakannya dari pelanggaran lain.
     */
    unique('member_register_number_unique').on(table.registerNumber)
  ]
)
