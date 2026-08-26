import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('handler eksperimen memakai alias Ourin yang tersedia tanpa meminta getBuffer', async () => {
  const source = await readFile(new URL('../src/handler.js', import.meta.url), 'utf8')
  assert.match(source, /await import\('ShooNhee'\)/)
  assert.doesNotMatch(source, /generateWAMessage, getBuffer, generateWAMessageFromContent/)
})
