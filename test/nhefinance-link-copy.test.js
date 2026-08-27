import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const source = await readFile(new URL('../plugins/finance/finance-link.js', import.meta.url), 'utf8')

test('pesan tautkan mengikuti alur web Bot WhatsApp dan memberi panduan sesi setelah aktif', () => {
  assert.match(source, /Kode penautan Anda/)
  assert.match(source, /Buka halaman koneksi NHEfinance/)
  assert.match(source, /halaman \*Bot WhatsApp\*/)
  assert.match(source, /Hubungkan bot ke akun ini/)
  assert.match(source, /Data finance tetap berada di akun NHEfinance yang sama/)
  assert.match(source, /Sesi finance terkunci/)
  assert.match(source, /nhefinance unlock/)
  assert.doesNotMatch(source, /Termux|runner|runtime/i)
})
