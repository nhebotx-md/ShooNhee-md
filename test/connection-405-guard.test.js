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

test('koneksi memakai profil browser Baileys yang resmi', () => {
  assert.match(connectionSource, /Browsers\.macOS\("ShooNhee"\)/)
  assert.match(connectionSource, /connectTimeoutMs:\s*60_000/)
})

test('error handshake 405 memiliki batas reconnect khusus', () => {
  assert.match(connectionSource, /if \(statusCode === 405\)/)
  assert.match(connectionSource, /const max405Attempts = 2/)
})
