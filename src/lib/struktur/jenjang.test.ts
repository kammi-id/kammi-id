import { describe, expect, it } from 'bun:test'
import { jenjangLabel } from './jenjang'

describe('jenjangLabel', () => {
  it('labels every Jenjang in CONTEXT.md wording', () => {
    expect(jenjangLabel('pp')).toBe('Pusat')
    expect(jenjangLabel('pw')).toBe('Wilayah')
    expect(jenjangLabel('pd')).toBe('Daerah')
    expect(jenjangLabel('pdln')).toBe('Daerah Luar Negeri')
    expect(jenjangLabel('pk')).toBe('Komisariat')
  })
})
