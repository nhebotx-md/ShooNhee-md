import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const apiSource = readFileSync(new URL('../src/finance/nhefinance-api.js', import.meta.url), 'utf8')
const linkSource = readFileSync(new URL('../plugins/finance/finance-link.js', import.meta.url), 'utf8')
const handlerSource = readFileSync(new URL('../src/handler.js', import.meta.url), 'utf8')

test('klien NHEfinance menambahkan request ID acak pada body bertanda tangan', () => {
  assert.match(apiSource, /randomBytes\(20\)\.toString\('hex'\)/)
  assert.match(apiSource, /JSON\.stringify\(\{ action, jid, requestId, payload \}\)/)
  assert.match(apiSource, /code: data\?\.code \|\| 'REQUEST_REJECTED'/)
})

test('command unlock menggunakan pengiriman tanpa quote pesan dan tidak mencetak kode akses', () => {
  assert.match(linkSource, /if \(context\?\.sock\?\.sendMessage\) return context\.sock\.sendMessage\(m\.chat, \{ text \}\)/)
  assert.match(linkSource, /action === 'unlock'/)
  assert.match(linkSource, /linkedFinance\(m\.sender, 'session\.unlock', \{ accessCode \}\)/)
  assert.doesNotMatch(linkSource, /console\.(log|error|warn).*accessCode/i)
})

test('logger command meredaksi argumen unlock sebelum pesan dicetak ke terminal', () => {
  assert.match(handlerSource, /const isFinanceUnlock =/)
  assert.match(handlerSource, /\^unlock\(\?:\\s\|\$\)/)
  assert.match(handlerSource, /nhefinance unlock \[REDACTED\]/)
})
