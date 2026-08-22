import test from 'node:test'
import assert from 'node:assert/strict'
import { reminderText } from '../src/lib/Shon-finance-reminder.js'

test('format reminder mempertahankan judul dan isi pemberitahuan NHEfinance', () => {
  const result = reminderText({ severity: 'warning', title: 'Budget hampir habis', body: 'Sisa Rp50.000.' })
  assert.match(result, /NHEfinance — Perhatian/)
  assert.match(result, /Budget hampir habis/)
  assert.match(result, /Sisa Rp50\.000\./)
})

test('format reminder tidak membocorkan JID atau secret layanan', () => {
  const result = reminderText({ severity: 'danger', title: 'Tagihan', body: 'Segera ditinjau.' })
  assert.equal(result.includes('@s.whatsapp.net'), false)
  assert.equal(result.includes('NHEFINANCE_BOT_SERVICE_SECRET'), false)
})
