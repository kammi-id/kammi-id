import { expect, test, describe } from 'bun:test'
import { CategoryInputSchema } from './action'

describe('CategoryInputSchema', () => {
  test('requires name and organizationId', () => {
    const result = CategoryInputSchema.safeParse({ organizationId: 'org-a' })
    expect(result.success).toBe(false)
  })

  test('accepts valid input with optional parentId', () => {
    const result = CategoryInputSchema.safeParse({
      organizationId: 'org-a',
      name: 'Kegiatan',
      slug: 'kegiatan'
    })
    expect(result.success).toBe(true)
  })
})
