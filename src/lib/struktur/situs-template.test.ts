import { describe, expect, it } from 'bun:test'
import {
  isSitusSectionVisible,
  resolveSitusTemplateVariant,
  situsSectionsFor
} from './situs-template'

describe('resolveSitusTemplateVariant', () => {
  it('gives PP the full template', () => {
    expect(resolveSitusTemplateVariant('pp')).toBe('lengkap')
  })

  it('gives every other Jenjang the lean template', () => {
    expect(resolveSitusTemplateVariant('pw')).toBe('ramping')
    expect(resolveSitusTemplateVariant('pd')).toBe('ramping')
    expect(resolveSitusTemplateVariant('pdln')).toBe('ramping')
    expect(resolveSitusTemplateVariant('pk')).toBe('ramping')
  })
})

describe('situsSectionsFor', () => {
  it('gives PP every section — nothing may be dropped from the full template', () => {
    expect(situsSectionsFor('pp')).toEqual([
      'hero-items',
      'about',
      'extra-items',
      'nav',
      'footer',
      'metadata'
    ])
  })

  it('gives a lean Jenjang only the sections its template actually renders', () => {
    expect(situsSectionsFor('pw')).toEqual(['nav', 'footer', 'metadata'])
    expect(situsSectionsFor('pd')).toEqual(['nav', 'footer', 'metadata'])
    expect(situsSectionsFor('pdln')).toEqual(['nav', 'footer', 'metadata'])
    expect(situsSectionsFor('pk')).toEqual(['nav', 'footer', 'metadata'])
  })
})

describe('isSitusSectionVisible', () => {
  it('hides full-template-only sections for a lean Jenjang', () => {
    expect(isSitusSectionVisible('pw', 'about')).toBe(false)
    expect(isSitusSectionVisible('pw', 'hero-items')).toBe(false)
    expect(isSitusSectionVisible('pw', 'extra-items')).toBe(false)
  })

  it('shows sections common to every template for a lean Jenjang', () => {
    expect(isSitusSectionVisible('pk', 'nav')).toBe(true)
    expect(isSitusSectionVisible('pk', 'footer')).toBe(true)
    expect(isSitusSectionVisible('pk', 'metadata')).toBe(true)
  })

  it('shows every section for PP', () => {
    expect(isSitusSectionVisible('pp', 'about')).toBe(true)
    expect(isSitusSectionVisible('pp', 'hero-items')).toBe(true)
    expect(isSitusSectionVisible('pp', 'extra-items')).toBe(true)
    expect(isSitusSectionVisible('pp', 'nav')).toBe(true)
  })
})
