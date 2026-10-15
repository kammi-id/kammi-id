import { describe, it, expect } from 'bun:test'
import {
  massCredentialRowsToCsv,
  sanitizeMassCredentialFilename
} from './utils'

describe('massCredentialRowsToCsv', () => {
  it('menulis header Nama, NIA, Password lalu satu baris per Akun', () => {
    const csv = massCredentialRowsToCsv([
      {
        name: 'Siti Rahmawati',
        registerNumber: '99.PK-1.001',
        password: 'kata-ab12c'
      }
    ])

    const lines = csv.trim().split('\n')
    expect(lines[0]).toBe('Nama,NIA,Password')
    expect(lines[1]).toBe('Siti Rahmawati,99.PK-1.001,kata-ab12c')
  })

  it('membungkus Nama yang mengandung koma dalam tanda kutip', () => {
    const csv = massCredentialRowsToCsv([
      { name: 'Rahmawati, Siti', registerNumber: 'NIA-1', password: 'x' }
    ])

    expect(csv).toContain('"Rahmawati, Siti"')
  })

  it('menyamarkan Nama yang diawali karakter formula supaya tidak dieksekusi Excel', () => {
    const csv = massCredentialRowsToCsv([
      { name: '=SUM(1+1)', registerNumber: 'NIA-2', password: 'x' }
    ])

    const lines = csv.trim().split('\n')
    expect(lines[1].startsWith("'=SUM(1+1)")).toBe(true)
  })

  it('tidak menyamarkan NIA atau Password sekalipun berupa angka', () => {
    const csv = massCredentialRowsToCsv([
      { name: 'Kader Biasa', registerNumber: '012345', password: '007-xyz' }
    ])

    const lines = csv.trim().split('\n')
    expect(lines[1]).toBe('Kader Biasa,012345,007-xyz')
  })
})

describe('sanitizeMassCredentialFilename', () => {
  it('menghasilkan nama berkas .csv yang aman dari kode Struktur', () => {
    const filename = sanitizeMassCredentialFilename('99.PK-1')

    expect(filename.startsWith('regenerasi-kredensial-99-pk-1-')).toBe(true)
    expect(filename.endsWith('.csv')).toBe(true)
  })
})
