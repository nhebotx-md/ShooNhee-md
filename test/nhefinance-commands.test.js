import test from 'node:test'
import assert from 'node:assert/strict'
import { parseTransactionText } from '../src/finance/nhefinance-commands.js'

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
