import { describe, expect, test } from 'bun:test'
import {
  footerContentSchema,
  isSiteLink,
  normalizeFooter,
  renameEventLink
} from './site-links'

describe('footer compatibility', () => {
  test('preserves link ordering and social destinations while merging old menus', () => {
    const first = [{ label: 'Events', href: '/event?year=2026' }]
    const second = [{ label: 'News', href: '/berita' }]
    const third = [{ label: 'Custom', href: 'https://example.com' }]
    const footer = normalizeFooter({
      footerKAMMI: first,
      footerBeritaData: second,
      footerIkutiKami: third,
      socialIG: 'https://instagram.com/demo',
      socialTwitter: '#',
      socialTelegram: ''
    })
    expect(footer.menus[0].links).toEqual([
      { label: 'Events', href: '/events?year=2026' }
    ])
    expect(footer.menus[1].links).toEqual([...second, ...third])
    expect(footer.socials).toEqual([
      {
        label: 'Instagram',
        href: 'https://instagram.com/demo',
        icon: 'instagram'
      }
    ])
    expect(normalizeFooter(footer)).toEqual(footer)
    expect(first[0].href).toBe('/event?year=2026')
  })
  test('retains empty menus/socials instead of restoring defaults', () => {
    const footer = normalizeFooter({
      menus: [
        { title: '', links: [] },
        { title: '', links: [] }
      ],
      socials: [],
      footerKAMMI: [{ label: 'Old', href: '/' }]
    })
    expect(footer.menus.every((menu) => !menu.links.length)).toBe(true)
    expect(footer.socials).toEqual([])
    expect(footerContentSchema.safeParse(footer).success).toBe(true)
  })
  test('only rewrites the old local route', () => {
    expect(renameEventLink('/event#next')).toBe('/events#next')
    for (const value of [
      '/events',
      '/event-detail',
      'https://example.com/event'
    ])
      expect(renameEventLink(value)).toBe(value)
  })
  test('rejects executable and protocol-relative links', () => {
    for (const value of [
      'javascript:alert(1)',
      'data:text/html,test',
      '//evil.example',
      '/\\evil.example',
      'https://example.com\n'
    ])
      expect(isSiteLink(value)).toBe(false)
    for (const value of [
      '/events',
      '#contact',
      'https://example.com',
      'mailto:demo@example.com',
      'tel:+62215550123'
    ])
      expect(isSiteLink(value)).toBe(true)
  })
})
