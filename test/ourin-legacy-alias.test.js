import assert from 'node:assert/strict'
import test from 'node:test'

test('alias legacy ShooNhee memuat surface Ourin untuk import runtime yang belum direfactor', async () => {
  const [legacy, ourin] = await Promise.all([
    import('ShooNhee'),
    import('ourin-baileys')
  ])

  for (const exportName of [
    'makeWASocket',
    'downloadMediaMessage',
    'generateWAMessageFromContent',
    'jidDecode'
  ]) {
    assert.equal(typeof legacy[exportName], typeof ourin[exportName], `surface alias tidak cocok: ${exportName}`)
    assert.notEqual(typeof legacy[exportName], 'undefined', `export alias tidak tersedia: ${exportName}`)
  }
})
