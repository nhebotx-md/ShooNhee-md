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

test('command penautan menyediakan pemeriksaan dan pembatalan kode tertunda', () => {
  assert.match(linkPluginConfig.usage, /status/)
  assert.match(linkPluginConfig.usage, /cancel/)
  assert.match(linkPluginConfig.usage, /unlink/)
})

test('bantuan finance mengarahkan ke halaman Bot WhatsApp tanpa membocorkan detail teknis', () => {
  assert.match(financeIntegrationHelp(), /halaman \*Bot WhatsApp\*/)
  const message = financeErrorText(new NHEfinanceApiError('belum siap', { code: 'NOT_CONFIGURED' }))
  assert.doesNotMatch(message, /secret|Termux|runner|runtime/i)
})
