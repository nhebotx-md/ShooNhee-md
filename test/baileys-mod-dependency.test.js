import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const testDir = path.dirname(fileURLToPath(import.meta.url))
const packageJson = JSON.parse(
  fs.readFileSync(path.join(testDir, '../package.json'), 'utf8')
)

test('runtime memakai Baileys mod Itsukichann pada commit yang dipin', () => {
  assert.match(
    packageJson.dependencies.ShooNhee,
    /^github:Itsukichann\/Baileys#2071f8a8604ec56666177984c6f4a18df8ed192b$/
  )
})
