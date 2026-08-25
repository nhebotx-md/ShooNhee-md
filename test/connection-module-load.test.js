import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('modul koneksi mengekspor kontrak startConnection untuk runtime Baileys mod', async () => {
  const source = await readFile(new URL('../src/connection.js', import.meta.url), 'utf8')
  assert.match(source, /async function startConnection\(options = \{\}\)/)
  assert.match(source, /export \{[\s\S]*startConnection,[\s\S]*logout,[\s\S]*\};/)
})
