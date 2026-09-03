import { describe, expect, it } from 'bun:test'
import { requestOriginFromHost } from './request-origin'

describe('requestOriginFromHost', () => {
  it('menerima host tenant yang dikenal', () => {
    expect(requestOriginFromHost('pw-jabar.kammi.id')).toBe(
      'https://pw-jabar.kammi.id'
    )
  })

  it('menolak host asing agar metadata tidak membentuk URL penyerang', () => {
    expect(requestOriginFromHost('attacker.example')).toBeNull()
  })
})
