import { financeErrorText, formatRupiah, linkedFinance } from '../../src/finance/nhefinance-commands.js'

const pluginConfig = { name: 'finance-insight', alias: ['insight'], category: 'finance', description: 'Insight keuangan aktual NHEfinance', usage: '.insight', example: '.insight', isOwner: false, isPremium: false, isGroup: false, isPrivate: true, cooldown: 3, energi: 1, isEnabled: true }

async function handler(m) {
  try {
    const { dashboard } = await linkedFinance(m.sender, 'dashboard')
    const largest = dashboard.expenseByCategory?.[0]
    return m.reply(`🧠 *Insight NHEfinance*\n\n${dashboard.health?.message || 'Belum cukup data untuk insight.'}\n\nArus kas: *${formatRupiah(dashboard.cashFlow)}*\nSaving rate: *${dashboard.savingRate ?? 0}%*${largest ? `\nPengeluaran kategori teratas: *${largest.name || largest.categoryName}* (${formatRupiah(largest.amount)})` : ''}\n\nInsight ini dihitung dari data aktual akun Anda.`)
  } catch (error) { return m.reply(financeErrorText(error)) }
}

export { pluginConfig as config, handler }
