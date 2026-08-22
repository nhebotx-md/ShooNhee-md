import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const testDir = path.dirname(fileURLToPath(import.meta.url))
const connectionSource = fs.readFileSync(
  path.join(testDir, '../src/connection.js'),
  'utf8'
)

test('pairing memakai kode yang dibuat Baileys, bukan kode kustom tetap', () => {
  assert.match(connectionSource, /requestPairingCode\(normalizedPairingNumber\)/)
  assert.doesNotMatch(connectionSource, /"SHOONHEE"/)
})
