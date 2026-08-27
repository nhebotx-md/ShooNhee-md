import { financeErrorText, formatRupiah, linkedFinance } from '../../src/finance/nhefinance-commands.js'

const pluginConfig = { name: 'finance-budget', alias: ['budget', 'anggaran'], category: 'finance', description: 'Pantau anggaran NHEfinance', usage: '.budget [YYYY-MM]', example: '.budget', isOwner: false, isPremium: false, isGroup: false, isPrivate: true, cooldown: 3, energi: 1, isEnabled: true }

async function handler(m) {
  const periodMonth = (m.text || '').trim() || new Date().toISOString().slice(0, 7)
  try {
    const { budgets } = await linkedFinance(m.sender, 'budgets.progress', { periodMonth })
    if (!budgets.length) return m.reply(`Belum ada anggaran aktif untuk ${periodMonth}. Buat anggaran di NHEfinance, lalu pantau di sini.`)
    return m.reply(`📌 *Anggaran ${periodMonth}*\n\n${budgets.map((budget) => `${budget.category?.name || 'Kategori'}\n${formatRupiah(budget.spent)} / ${formatRupiah(budget.limitAmount)} · ${budget.percentUsed ?? 0}% · *${budget.status}*`).join('\n\n')}`)
  } catch (error) { return m.reply(financeErrorText(error)) }
}

export { pluginConfig as config, handler }
