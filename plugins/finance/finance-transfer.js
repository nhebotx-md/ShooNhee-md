import { accountForTransaction, financeErrorText, linkedFinance } from '../../src/finance/nhefinance-commands.js'
import { formatRupiah } from '../../src/finance/nhefinance-api.js'

const pluginConfig = { name: 'finance-transfer', alias: ['transfer', 'tf'], category: 'finance', description: 'Transfer antar akun NHEfinance', usage: '.transfer 50000 Cash > Bank | catatan', example: '.transfer 100000 Cash > Tabungan | setoran', isOwner: false, isPremium: false, isGroup: false, isPrivate: false, cooldown: 3, energi: 1, isEnabled: true }
const norm = (value) => String(value || '').trim().toLocaleLowerCase('id-ID')

async function handler(m) {
  try {
    const [head, note = ''] = String(m.text || '').split('|', 2).map((value) => value.trim())
    const match = head.match(/^(\d+)\s+(.+?)\s*>\s*(.+)$/)
    if (!match) return m.reply('Format: *.transfer 50000 Cash > Bank | catatan*')
    const [, amountText, sourceName, targetName] = match
    const { accounts } = await linkedFinance(m.sender, 'accounts.list')
    const source = accounts.find((account) => norm(account.name) === norm(sourceName))
    const target = accounts.find((account) => norm(account.name) === norm(targetName))
    if (!source || !target) return m.reply('Akun asal atau tujuan tidak ditemukan. Gunakan *.account* untuk melihat nama akun.')
    const { transaction } = await linkedFinance(m.sender, 'transactions.transfer', { messageId: m.id, amount: Number(amountText), accountId: source.id, transferAccountId: target.id, note, occurredAt: new Date().toISOString() })
    return m.reply(transaction.duplicate ? 'ℹ️ Transfer ini sudah pernah dicatat.' : `✅ Transfer *${formatRupiah(Number(amountText))}* dari *${source.name}* ke *${target.name}* tercatat. Ini tidak dihitung sebagai pemasukan atau pengeluaran.`)
  } catch (error) { return m.reply(financeErrorText(error)) }
}

export { pluginConfig as config, handler }
