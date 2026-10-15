import { describe, expect, mock, spyOn, test } from 'bun:test'

import {
  credentialsToCsv,
  downloadCredentialsCsv,
  sanitizeCredentialFilename
} from './credential-utils'

describe('ekspor kredensial awal', () => {
  test('mengikuti RFC 4180 dan menetralkan formula spreadsheet', () => {
    expect(
      credentialsToCsv([
        {
          authority: 'BPD "Jawa, Barat"',
          username: '=danger',
          password: '+secret'
        }
      ])
    ).toBe(
      'Kewenangan,Username,Password\r\n"BPD ""Jawa, Barat""",\'=danger,\'+secret\r\n'
    )
  })

  test('membuat nama berkas yang aman dari slug Struktur', () => {
    expect(sanitizeCredentialFilename('../../PW Jawa Barat?.csv')).toBe(
      'kredensial-pw-jawa-barat.csv'
    )
  })

  test('mencabut Blob URL setelah memulai unduhan', () => {
    const anchor = document.createElement('a')
    const click = mock(() => undefined)
    const createElement = spyOn(document, 'createElement').mockImplementation(((
      tagName: string
    ) =>
      tagName === 'a'
        ? anchor
        : document.createElement(tagName)) as typeof document.createElement)
    const createObjectURL = spyOn(URL, 'createObjectURL').mockReturnValue(
      'blob:kredensial'
    )
    const revokeObjectURL = spyOn(URL, 'revokeObjectURL')
    anchor.click = click

    downloadCredentialsCsv(
      [
        {
          authority: 'BPH PK Test',
          username: 'bph-pk-test',
          password: 'secret'
        }
      ],
      'pk-test'
    )

    expect(createObjectURL).toHaveBeenCalledTimes(1)
    expect(anchor.download).toBe('kredensial-pk-test.csv')
    expect(click).toHaveBeenCalledTimes(1)
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:kredensial')
    createElement.mockRestore()
    createObjectURL.mockRestore()
    revokeObjectURL.mockRestore()
  })
})
