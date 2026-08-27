import test from 'node:test'
import assert from 'node:assert/strict'
import { financeErrorText, formatRupiah, parseTransactionText } from '../src/finance/nhefinance-commands.js'
import { financeIntegrationHelp, NHEfinanceApiError } from '../src/finance/nhefinance-api.js'
import { config as linkPluginConfig } from '../plugins/finance/finance-link.js'

test('formatRupiah diekspor untuk plugin finance', () => {
  assert.match(formatRupiah(50000), /Rp\s*50\.000/u)
})

test('parser transaksi menerima nominal aman serta kategori dan catatan eksplisit', () => {
  assert.deepEqual(parseTransactionText('50000 Makanan | makan siang'), {
    amount: 50000,
    categoryInput: 'Makanan',
    note: 'makan siang'
  })
})

test('parser transaksi menolak nominal tidak valid agar tidak diteruskan ke API keuangan', () => {
  assert.equal(parseTransactionText('0 Makanan | salah'), null)
  assert.equal(parseTransactionText('-500 Makanan | salah'), null)
  assert.equal(parseTransactionText('lima puluh ribu'), null)
})

test('command penautan menyediakan lifecycle sesi dan hanya dapat dipakai di chat pribadi', () => {
  assert.match(linkPluginConfig.usage, /status/)
  assert.match(linkPluginConfig.usage, /cancel/)
  assert.match(linkPluginConfig.usage, /unlink/)
  assert.match(linkPluginConfig.usage, /unlock/)
  assert.match(linkPluginConfig.usage, /lock/)
  assert.equal(linkPluginConfig.isPrivate, true)
})

test('bantuan finance mengarahkan ke halaman Bot WhatsApp tanpa membocorkan detail teknis', () => {
  assert.match(financeIntegrationHelp(), /halaman \*Bot WhatsApp\*/)
  const message = financeErrorText(new NHEfinanceApiError('belum siap', { code: 'NOT_CONFIGURED' }))
  assert.doesNotMatch(message, /secret|Termux|runner|runtime/i)
})

test('error kode akses dan sesi memberi instruksi aman tanpa memantulkan input pengguna', () => {
  const submittedCode = 'kode-akses-pribadi-yang-tidak-boleh-ditampilkan'
  const invalid = financeErrorText(new NHEfinanceApiError('Kode akses tidak dapat diverifikasi.', { code: 'FINANCE_ACCESS_CODE_INVALID' }))
  const expired = financeErrorText(new NHEfinanceApiError('Sesi berakhir.', { code: 'FINANCE_SESSION_EXPIRED' }))
  assert.match(invalid, /Kode akses/i)
  assert.match(expired, /Sesi finance/i)
  assert.doesNotMatch(invalid, new RegExp(submittedCode))
  assert.doesNotMatch(expired, /hash|token|secret/i)
})
