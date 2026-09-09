import { describe, it, expect } from 'bun:test'
import * as XLSX from 'xlsx'
import {
  generateTemplateBuffer,
  parseXLSXFile,
  readZipEntryText
} from './bulk-upload-utils'

// Bun's runtime implements `File`/`Blob` but not `FileReader`, while
// `parseXLSXFile` (the existing, unmodified import parser) is written
// against it. This minimal shim lets the round-trip test below drive the
// real parser instead of re-implementing its logic.
class TestFileReader {
  result: ArrayBuffer | null = null
  onload: ((ev: { target: TestFileReader }) => void) | null = null
  onerror: (() => void) | null = null

  readAsArrayBuffer(file: File) {
    file
      .arrayBuffer()
      .then((buf) => {
        this.result = buf
        this.onload?.({ target: this })
      })
      .catch(() => this.onerror?.())
  }
}
globalThis.FileReader = TestFileReader as unknown as typeof FileReader

describe('generateTemplateBuffer — OOXML element order', () => {
  it('places dataValidations before the CT_Worksheet tail (pageMargins)', () => {
    const buf = generateTemplateBuffer()
    const sheetXml = readZipEntryText(buf, 'xl/worksheets/sheet2.xml')
    const dvIndex = sheetXml.indexOf('<dataValidations')
    const marginsIndex = sheetXml.indexOf('<pageMargins')

    expect(dvIndex).toBeGreaterThan(-1)
    expect(marginsIndex).toBeGreaterThan(-1)
    expect(dvIndex).toBeLessThan(marginsIndex)
  })

  it('places dataValidations before ignoredErrors too (SheetJS always writes it)', () => {
    const buf = generateTemplateBuffer()
    const sheetXml = readZipEntryText(buf, 'xl/worksheets/sheet2.xml')
    const dvIndex = sheetXml.indexOf('<dataValidations')
    const ignoredErrorsIndex = sheetXml.indexOf('<ignoredErrors')

    expect(ignoredErrorsIndex).toBeGreaterThan(-1)
    expect(dvIndex).toBeLessThan(ignoredErrorsIndex)
  })

  it('places bookViews after workbookPr closes and before sheets', () => {
    const buf = generateTemplateBuffer()
    const workbookXml = readZipEntryText(buf, 'xl/workbook.xml')
    const workbookPrMatch = workbookXml.match(
      /<workbookPr\b[^>]*\/>|<workbookPr\b[^>]*>[\s\S]*?<\/workbookPr>/
    )
    const bookViewsIndex = workbookXml.indexOf('<bookViews')
    const sheetsIndex = workbookXml.indexOf('<sheets>')

    expect(workbookPrMatch).not.toBeNull()
    expect(bookViewsIndex).toBeGreaterThan(-1)

    const workbookPrEnd =
      (workbookPrMatch?.index ?? 0) + (workbookPrMatch?.[0].length ?? 0)
    expect(bookViewsIndex).toBeGreaterThanOrEqual(workbookPrEnd)
    expect(bookViewsIndex).toBeLessThan(sheetsIndex)
  })
})

describe('generateTemplateBuffer — dropdowns and No HP column', () => {
  it('keeps all four dropdown data validations', () => {
    const buf = generateTemplateBuffer()
    const sheetXml = readZipEntryText(buf, 'xl/worksheets/sheet2.xml')

    expect(sheetXml).toContain('<dataValidations count="4">')
    expect(sheetXml).toContain('sqref="B2:B1001"') // Jenis Kelamin
    expect(sheetXml).toContain('sqref="C2:C1001"') // Jenjang Pengkaderan
    expect(sheetXml).toContain('sqref="F2:F1001"') // Pemandu
    expect(sheetXml).toContain('sqref="G2:G1001"') // Instruktur
  })

  it('forces the No HP column (E) to the built-in Text number format', () => {
    const buf = generateTemplateBuffer()
    const sheetXml = readZipEntryText(buf, 'xl/worksheets/sheet2.xml')

    const colMatch = sheetXml.match(/<col min="5" max="5"[^/]*\/>/)
    expect(colMatch).not.toBeNull()

    const styleMatch = colMatch?.[0].match(/style="(\d+)"/)
    expect(styleMatch).not.toBeNull()

    const xfIndex = Number(styleMatch?.[1])
    const stylesXml = readZipEntryText(buf, 'xl/styles.xml')
    const cellXfsBlock = stylesXml.match(
      /<cellXfs count="\d+">([\s\S]*?)<\/cellXfs>/
    )
    expect(cellXfsBlock).not.toBeNull()

    const xfs = cellXfsBlock?.[1].match(/<xf[^/]*\/>/g) ?? []
    expect(xfs[xfIndex]).toContain('numFmtId="49"')
  })
})

describe('generateTemplateBuffer — stays readable by the existing import parser', () => {
  it('round-trips through parseXLSXFile with the leading zero intact', async () => {
    const buf = generateTemplateBuffer()
    const file = new File([new Uint8Array(buf)], 'template-import-kader.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })

    const rows = await parseXLSXFile(file)

    expect(rows).toHaveLength(1)
    expect(rows[0].valid).toBe(true)
    expect(rows[0].data.name).toBe('Contoh Nama')
    expect(rows[0].data.gender).toBe('ikhwan')
    expect(rows[0].data.status).toBe('ab1')
    // The field ticket 04 depends on: Excel must not eat the leading `0`.
    expect(rows[0].data.phone).toBe('08123456789')
  })

  it('is a well-formed zip SheetJS itself can parse', () => {
    const buf = generateTemplateBuffer()
    const wb = XLSX.read(buf, { type: 'array' })
    expect(wb.SheetNames).toEqual(['Instruksi', 'Template'])
  })

  it('shows Instruksi as the active tab on open', () => {
    const buf = generateTemplateBuffer()
    const workbookXml = readZipEntryText(buf, 'xl/workbook.xml')
    const sheetsOrder = [...workbookXml.matchAll(/<sheet name="([^"]+)"/g)].map(
      (m) => m[1]
    )

    expect(sheetsOrder[0]).toBe('Instruksi')
    expect(workbookXml).toContain('activeTab="0"')
  })
})
