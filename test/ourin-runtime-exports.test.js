import assert from 'node:assert/strict'
import test from 'node:test'

test('Ourin menyediakan export runtime yang diperlukan adapter koneksi', async () => {
  const ourin = await import('ourin-baileys')

  for (const exportName of [
    'makeWASocket',
    'useMultiFileAuthState',
    'makeCacheableSignalKeyStore',
    'fetchLatestBaileysVersion',
    'Browsers'
  ]) {
    assert.ok(exportName in ourin, `export wajib tidak tersedia: ${exportName}`)
  }

  assert.equal(typeof ourin.makeWASocket, 'function')
  assert.equal(typeof ourin.useMultiFileAuthState, 'function')
  assert.equal(typeof ourin.makeCacheableSignalKeyStore, 'function')
  assert.equal(typeof ourin.fetchLatestBaileysVersion, 'function')
  assert.equal(typeof ourin.Browsers.ubuntu, 'function')
})
