import assert from 'node:assert/strict'
import test from 'node:test'

test('Sharp dapat diimpor untuk helper media Ourin', async () => {
  const sharpModule = await import('sharp')
  const sharp = sharpModule.default || sharpModule

  assert.equal(typeof sharp, 'function')
})
