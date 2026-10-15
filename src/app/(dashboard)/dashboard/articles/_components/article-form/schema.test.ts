import { describe, expect, test } from 'bun:test'
import { ArticleInputSchema } from './schema'

const input = {
  organizationId: 'org',
  type: 'event',
  title: 'Seminar',
  slug: 'seminar',
  body: {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'Pengumuman seminar' }]
      }
    ]
  },
  featuredImage: 'poster.png',
  status: 'published',
  publishedAt: '2026-01-01T00:00:00Z',
  eventStartsAt: '2026-09-20T01:00:00Z',
  eventLocation: 'Via Zoom',
  eventTimezone: 'Asia/Jakarta'
}
describe('Event fields', () => {
  test('requires schedule, location, poster, description and publication independently', () => {
    expect(ArticleInputSchema.safeParse(input).success).toBe(true)
    for (const key of [
      'eventStartsAt',
      'eventLocation',
      'featuredImage',
      'publishedAt'
    ])
      expect(
        ArticleInputSchema.safeParse({ ...input, [key]: undefined }).success
      ).toBe(false)
    expect(
      ArticleInputSchema.safeParse({
        ...input,
        body: { type: 'doc', content: [{ type: 'paragraph' }] }
      }).success
    ).toBe(false)
    expect(
      ArticleInputSchema.safeParse({
        ...input,
        eventEndsAt: '2026-01-01T00:00:00Z'
      }).success
    ).toBe(false)
    expect(
      ArticleInputSchema.safeParse({
        ...input,
        eventUrl: 'javascript:alert(1)'
      }).success
    ).toBe(false)
    expect(
      ArticleInputSchema.safeParse({
        ...input,
        eventUrl: 'https://example.com/register',
        eventCancelled: true
      }).success
    ).toBe(true)
  })
})

describe('Publication instants', () => {
  test('accepts explicit offsets, rejects ambiguous local datetimes', () => {
    expect(
      ArticleInputSchema.safeParse({
        ...input,
        publishedAt: '2026-10-15T14:53:00+08:00'
      }).success
    ).toBe(true)
    expect(
      ArticleInputSchema.safeParse({
        ...input,
        publishedAt: '2026-10-15T14:53:00'
      }).success
    ).toBe(false)
  })
  test('publish now requires published status and can omit a manual date', () => {
    expect(
      ArticleInputSchema.safeParse({
        ...input,
        publishNow: true,
        publishedAt: undefined
      }).success
    ).toBe(true)
    expect(
      ArticleInputSchema.safeParse({
        ...input,
        publishNow: true,
        status: 'draft',
        publishedAt: undefined
      }).success
    ).toBe(false)
  })
})
