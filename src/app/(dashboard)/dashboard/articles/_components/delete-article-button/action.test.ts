import { expect, test, describe } from 'bun:test'
import { deleteArticleAction } from './action'

describe('deleteArticleAction', () => {
  test('rejects when confirmation text does not match the title', async () => {
    const result = await deleteArticleAction(
      '00000000-0000-0000-0000-000000000000',
      'salah'
    )
    expect(result.success).toBe(false)
  })
})
