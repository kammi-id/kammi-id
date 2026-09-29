import { expect, test, describe } from 'bun:test'
import { deleteArticleAction } from './action'

describe('deleteArticleAction', () => {
  test('rejects for an unknown article id', async () => {
    const result = await deleteArticleAction(
      '00000000-0000-0000-0000-000000000000',
      'salah'
    )
    expect(result.success).toBe(false)
  })
})
