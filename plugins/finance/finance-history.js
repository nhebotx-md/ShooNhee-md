import { financeErrorText, formatRupiah, linkedFinance } from '../../src/finance/nhefinance-commands.js'

const pluginConfig = { name: 'finance-history', alias: ['history', 'riwayat'], category: 'finance', description: 'Riwayat transaksi NHEfinance', usage: '.history', example: '.history', isOwner: false, isPremium: false, isGroup: false, isPrivate: false, cooldown: 2, energi: 1, isEnabled: true }

async function handler(m) {
  try {
    const { transactions } = await linkedFinance(m.sender, 'transactions.list', { limit: 10 })
    if (!transactions.length) return m.reply('Belum ada transaksi NHEfinance.')
    return m.reply(`🧾 *10 Transaksi Terbaru*\n\n${transactions.map((item) => `${item.type === 'income' ? '+' : item.type === 'expense' ? '-' : '↔'} *${formatRupiah(item.amount)}* — ${item.category?.name || 'Transfer'}\n${item.note || '-'} · ${new Date(item.occurredAt).toLocaleDateString('id-ID')}`).join('\n\n')}`)
  } catch (error) { return m.reply(financeErrorText(error)) }
}

export { pluginConfig as config, handler }
