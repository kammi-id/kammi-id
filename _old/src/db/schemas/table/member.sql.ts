import { pgTable, primaryKey, index } from 'drizzle-orm/pg-core'
import { organization } from './organization.sql'
import { sql, type SQL } from 'drizzle-orm'

export const member = pgTable(
  'member',
  (f) => ({
    id: f
      .uuid()
      .primaryKey()
      .$default(() => Bun.randomUUIDv7()),
    idNo: f.text('id_number').notNull().unique(),
    name: f.text().notNull(),
    birthPlace: f.text('birth_place').notNull(),
    birthDate: f.date('birth_date', { mode: 'date' }).notNull(),
    phone: f.text(),
    photo: f.text(),
    gender: f.text({ enum: ['male', 'female'] }).notNull(),
    addressProvince: f.text('address_province').notNull(),
    addressProvinceCode: f.text('address_province_code').notNull(),
    addressCity: f.text('address_city').notNull(),
    addressCityCode: f.text('address_city_code').notNull(),
    addressDistrict: f.text('address_district'),
    addressDistrictCode: f.text('address_district_code'),
    addressVillage: f.text('address_subdistrict'),
    addressVillageCode: f.text('address_subdistrict_code'),
    addressLine: f.text('address_line'),
    addressFull: f.text('address_full').generatedAlwaysAs(
      (): SQL => sql`
        coalesce(${member.addressLine} || ', ', '') ||
        coalesce('Desa/Kel. ' || ${member.addressVillage} || ', ', '') ||
        coalesce('Kec. ' || ${member.addressDistrict} || ', ', '') ||
        coalesce(${member.addressCity} || ', ', '') ||
        ${member.addressProvince}
      `
    ),
    isAnAlumn: f.boolean('is_an_alumn').default(false),
    isSuspended: f.boolean('is_suspended').default(false),
    registeredAtOrganizationId: f
      .uuid('registered_at_organization_id')
      .notNull()
      .references(() => organization.id)
  }),
  (t) => [
    index('member_registered_at_organization_id_idx').on(
      t.registeredAtOrganizationId
    ),
    index('member_gender_idx').on(t.gender),
    index('member_name_gin_idx').using('gin', sql`${t.name} gin_trgm_ops`),
    index('member_id_number_gin_idx').using('gin', sql`${t.idNo} gin_trgm_ops`)
  ]
)

export const memberEducation = pgTable(
  'member_education',
  (f) => ({
    memberId: f
      .uuid('member_id')
      .notNull()
      .references(() => member.id),
    type: f
      .text({ enum: ['undergraduate', 'postgraduate', 'doctoral'] })
      .notNull(),
    institutionId: f.text('institution_id').notNull(),
    institutionName: f.text('institution_name').notNull(),
    major: f.text().notNull(),
    yearStart: f.smallint('year_start').notNull(),
    yearEnd: f.smallint('year_end')
  }),
  (t) => [
    primaryKey({ columns: [t.memberId, t.type, t.institutionId, t.major] }),
    index('member_education_type_idx').on(t.type),
    index('member_education_institution_id_idx').on(t.institutionId),
    index('member_education_institution_name_gin_idx').using(
      'gin',
      sql`${t.institutionName} gin_trgm_ops`
    ),
    index('member_education_major_gin_idx').using(
      'gin',
      sql`${t.major} gin_trgm_ops`
    )
  ]
)

export const memberCareer = pgTable(
  'member_career',
  (f) => ({
    memberId: f
      .uuid('member_id')
      .notNull()
      .references(() => member.id),
    type: f
      .text({
        enum: ['full-time', 'part-time', 'internship', 'entrepreneurship']
      })
      .notNull(),
    employerId: f.text('employer_id').notNull(),
    employerName: f.text('employer_name').notNull(),
    position: f.text().notNull(),
    yearStart: f.smallint('year_start').notNull(),
    yearEnd: f.smallint('year_end')
  }),
  (t) => [
    primaryKey({ columns: [t.memberId, t.employerId, t.position] }),
    index('member_career_type_idx').on(t.type),
    index('member_career_employer_id_idx').on(t.employerId),
    index('member_career_employer_name_gin_idx').using(
      'gin',
      sql`${t.employerName} gin_trgm_ops`
    ),
    index('member_career_position_gin_idx').using(
      'gin',
      sql`${t.position} gin_trgm_ops`
    )
  ]
)
