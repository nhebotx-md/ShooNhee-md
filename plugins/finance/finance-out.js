import { financeErrorText, recordFinanceTransaction, formatRupiah } from '../../src/finance/nhefinance-commands.js'

const pluginConfig = { name: 'finance-out', alias: ['out'], category: 'finance', description: 'Catat pengeluaran NHEfinance', usage: '.out 30000 Makanan | makan siang', example: '.out 35000 Makanan | makan siang', isOwner: false, isPremium: false, isGroup: false, isPrivate: true, cooldown: 2, energi: 1, isEnabled: true }

async function handler(m) {
  try {
    const result = await recordFinanceTransaction(m, 'expense')
    return m.reply(`${result.duplicate ? 'ℹ️' : '✅'} *Pengeluaran NHEfinance*\n\nNominal: *${formatRupiah(result.amount)}*\nKategori: ${result.category.name}\nAkun: ${result.account.name}\nCatatan: ${result.note}${result.duplicate ? '\n\nPesan ini sudah pernah dicatat; saldo tidak diubah dua kali.' : ''}`)
  } catch (error) { return m.reply(financeErrorText(error)) }
}

export { pluginConfig as config, handler }
