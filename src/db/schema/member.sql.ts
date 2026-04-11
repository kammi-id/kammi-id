import { pgTable } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { organization } from './organization.sql'

export const member = pgTable('member', (t) => ({
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
  registerNumber: t.text('register_number').notNull(),
  registeredAt: t
    .uuid('registered_at')
    .notNull()
    .references(() => organization.id)
}))
