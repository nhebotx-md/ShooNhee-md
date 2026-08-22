import assert from 'node:assert/strict'
import test from 'node:test'

const financePlugins = [
  'plugins/finance/finance-history.js',
  'plugins/finance/finance-in.js',
  'plugins/finance/finance-insight.js',
  'plugins/finance/finance-out.js',
  'plugins/finance/finance-report.js',
  'plugins/finance/finance-target.js'
]

for (const pluginPath of financePlugins) {
  test(`plugin dapat mengimpor helper finance: ${pluginPath}`, async () => {
    const plugin = await import(`../${pluginPath}`)
    assert.ok(plugin)
  })
}
