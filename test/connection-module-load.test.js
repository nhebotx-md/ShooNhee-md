import assert from 'node:assert/strict'
import test from 'node:test'

test('modul koneksi dapat dimuat dengan Baileys upstream', async () => {
  const connection = await import('../src/connection.js')
  assert.equal(typeof connection.startConnection, 'function')
})
