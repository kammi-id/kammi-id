import { describe, it, expect } from 'bun:test'
import { checkHeifDecoderAtBoot } from '~/lib/api/heif-decoder'

describe('checkHeifDecoderAtBoot', () => {
  it('tidak pernah melempar, di lingkungan mana pun decoder HEIF-nya berada', async () => {
    await expect(checkHeifDecoderAtBoot()).resolves.toBeUndefined()
  })
})
