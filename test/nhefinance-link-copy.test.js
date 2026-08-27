import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const source = await readFile(new URL('../plugins/finance/finance-link.js', import.meta.url), 'utf8')

test('pesan tautkan menjelaskan kode bot, persetujuan web, dan sinkronisasi data akun', () => {
  assert.match(source, /Kode khusus untuk nomor WhatsApp ini/)
  assert.match(source, /akun NHEfinance yang ingin Anda kelola/)
  assert.match(source, /Pengaturan → WhatsApp/)
  assert.match(source, /langsung memakai data akun NHEfinance yang sama/)
})
