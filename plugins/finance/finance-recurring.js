import { accountForTransaction, categoryForTransaction, financeErrorText, linkedFinance } from '../../src/finance/nhefinance-commands.js'
import { formatRupiah } from '../../src/finance/nhefinance-api.js'

const pluginConfig = { name: 'finance-recurring', alias: ['recurring', 'rutin'], category: 'finance', description: 'Kelola transaksi berulang NHEfinance', usage: '.recurring list | .recurring add in|out | nominal | kategori | monthly | YYYY-MM-DD | catatan', example: '.recurring add out | 100000 | Internet | monthly | 2026-09-01 | paket bulanan', isOwner: false, isPremium: false, isGroup: false, isPrivate: false, cooldown: 3, energi: 1, isEnabled: true }
const frequencies = new Set(['weekly', 'monthly', 'quarterly', 'yearly', 'one_time'])

async function handler(m) {
  try {
    const raw = String(m.text || '').trim()
    if (!raw || raw === 'list') {
      const { recurring } = await linkedFinance(m.sender, 'recurring.list')
      if (!recurring?.length) return m.reply('Belum ada transaksi berulang. Tambah dengan *.recurring add in|out | nominal | kategori | monthly | YYYY-MM-DD | catatan*.')
      return m.reply(`🔁 *Transaksi Berulang NHEfinance*\n\n${recurring.map((item) => `#${item.id} · ${item.type === 'income' ? 'Pemasukan' : 'Pengeluaran'} *${formatRupiah(item.amount)}*\n${item.frequency} · berikutnya ${new Date(item.nextDueAt).toLocaleDateString('id-ID')}${item.note ? `\n${item.note}` : ''}`).join('\n\n')}`)
    }
    const [verb, typeText, amountText, categoryText, frequency, startDate, note = ''] = raw.split('|').map((value) => value.trim())
    if (verb.toLowerCase() !== 'add') return m.reply('Format: *.recurring add in|out | nominal | kategori | monthly | YYYY-MM-DD | catatan*')
    const type = ['in', 'income', 'pemasukan'].includes((typeText || '').toLowerCase()) ? 'income' : ['out', 'expense', 'pengeluaran'].includes((typeText || '').toLowerCase()) ? 'expense' : null
    if (!type || !/^\d+$/.test(amountText || '') || !categoryText || !frequencies.has(frequency) || !/^\d{4}-\d{2}-\d{2}$/.test(startDate || '')) return m.reply('Format: *.recurring add in|out | nominal | kategori | weekly|monthly|quarterly|yearly|one_time | YYYY-MM-DD | catatan*')
    const [account, category] = await Promise.all([accountForTransaction(m.sender), categoryForTransaction(m.sender, type, categoryText, note)])
    const nextDueAt = new Date(`${startDate}T00:00:00.000Z`).toISOString()
    const { recurring } = await linkedFinance(m.sender, 'recurring.create', { type, amount: Number(amountText), accountId: account.id, categoryId: category.id, frequency, startDate: nextDueAt, nextDueAt, note, paymentMethod: 'auto_debit', isEnabled: true })
    return m.reply(`✅ Transaksi rutin tersimpan (ID #${recurring.id}): *${formatRupiah(Number(amountText))}* ${frequency}.`)
  } catch (error) { return m.reply(financeErrorText(error)) }
}

export { pluginConfig as config, handler }
