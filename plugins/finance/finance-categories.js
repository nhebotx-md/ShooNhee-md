import { financeErrorText, linkedFinance } from '../../src/finance/nhefinance-commands.js'

const pluginConfig = { name: 'finance-categories', alias: ['categories', 'kategori'], category: 'finance', description: 'Lihat kategori transaksi NHEfinance', usage: '.categories in|out', example: '.categories out', isOwner: false, isPremium: false, isGroup: false, isPrivate: false, cooldown: 2, energi: 1, isEnabled: true }

async function handler(m) {
  const type = (m.text || '').trim().toLowerCase() === 'in' ? 'income' : 'expense'
  try {
    const { categories } = await linkedFinance(m.sender, 'categories.list', { kind: type })
    return m.reply(`🏷️ *Kategori ${type === 'income' ? 'Pemasukan' : 'Pengeluaran'}*\n\n${categories.map((category) => `• ${category.name}`).join('\n') || 'Belum ada kategori.'}\n\nGunakan nama kategori dalam format: *.${type === 'income' ? 'in' : 'out'} 50000 Nama Kategori | catatan*`)
  } catch (error) { return m.reply(financeErrorText(error)) }
}

export { pluginConfig as config, handler }
