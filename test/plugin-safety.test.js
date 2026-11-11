import test from 'node:test'
import assert from 'node:assert/strict'
import { parseHttpUrl, assertBufferSize, sanitizeFilename, isBlockedHostname } from '../src/lib/Shon-media-safety.js'
import { validateArguments } from '../src/lib/Shon-ffmpeg.js'

test('URL downloader hanya menerima scheme dan host platform yang diizinkan', () => {
  assert.equal(
    parseHttpUrl('https://vt.tiktok.com/abc', { allowedHosts: ['tiktok.com'] }).hostname,
    'vt.tiktok.com',
  )
  assert.throws(() => parseHttpUrl('http://vt.tiktok.com/abc', { allowedHosts: ['tiktok.com'] }), /HTTPS/)
  assert.throws(() => parseHttpUrl('https://not-tiktok.com/abc', { allowedHosts: ['tiktok.com'] }), /Domain/)
  assert.throws(() => parseHttpUrl('https://tiktok.com@127.0.0.1/abc'), /kredensial|Host lokal/i)
})

test('host lokal dan alamat privat ditolak', () => {
  for (const host of ['localhost', 'service.local', '127.0.0.1', '10.2.3.4', '192.168.1.2', '169.254.10.1', '::1', '::ffff:127.0.0.1']) {
    assert.equal(isBlockedHostname(host), true, `${host} harus ditolak`)
  }
  assert.throws(() => parseHttpUrl('https://127.0.0.1/'), /Host lokal/)
})

test('batas buffer menolak file kosong dan terlalu besar', () => {
  assert.equal(assertBufferSize(Buffer.from('ok'), 2).length, 2)
  assert.throws(() => assertBufferSize(Buffer.alloc(0), 2), /kosong/)
  assert.throws(() => assertBufferSize(Buffer.alloc(3), 2), /batas ukuran/)
})

test('nama file dibersihkan dari separator dan kontrol', () => {
  assert.equal(sanitizeFilename('../foto:tes?.png'), '_foto_tes_.png')
  assert.equal(sanitizeFilename(''), 'media')
})

test('antrean FFmpeg hanya menerima array argumen, bukan string command shell', () => {
  assert.deepEqual(validateArguments(['-y', '-i', '/tmp/a b.mp4']), ['-y', '-i', '/tmp/a b.mp4'])
  assert.throws(() => validateArguments('ffmpeg -y -i input'), /daftar argumen/)
  assert.throws(() => validateArguments(['-i', 'bad\u0000path']), /aman/)
})
