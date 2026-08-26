import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const testDir = path.dirname(fileURLToPath(import.meta.url))
const packageJson = JSON.parse(
  fs.readFileSync(path.join(testDir, '../package.json'), 'utf8')
)

test('branch eksperimen mem-pin Ourin Baileys dan alias kompatibilitas runtime', () => {
  assert.equal(packageJson.dependencies['ourin-baileys'], '9.0.21')
  assert.equal(packageJson.dependencies.ShooNhee, 'npm:ourin-baileys@9.0.21')
  assert.equal(packageJson.dependencies.jimp, '^1.6.0')
})
