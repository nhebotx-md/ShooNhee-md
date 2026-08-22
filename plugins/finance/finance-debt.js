import { accountForTransaction, financeErrorText, linkedFinance } from '../../src/finance/nhefinance-commands.js'
import { formatRupiah } from '../../src/finance/nhefinance-api.js'

const pluginConfig = { name: 'finance-debt', alias: ['debt', 'utang', 'piutang'], category: 'finance', description: 'Kelola hutang dan piutang pribadi', usage: '.debt list | .debt add debt|piutang | Nama | Nominal | YYYY-MM-DD | catatan | .debt pay ID | nominal | catatan', example: '.debt add debt | Rina | 500000 | 2026-09-01 | cicilan laptop', isOwner: false, isPremium: false, isGroup: false, isPrivate: false, cooldown: 3, energi: 1, isEnabled: true }

function debtListMessage(debts) {
  if (!debts?.length) return 'Belum ada catatan hutang atau piutang aktif.'
  return `🤝 *Hutang & Piutang NHEfinance*\n\n${debts.map((item) => `#${item.id} · *${item.direction === 'debt' ? 'Utang' : 'Piutang'}*\n${item.counterpartyName} — sisa *${formatRupiah(item.remainingAmount)}*${item.nextDueDate ? `\nJatuh tempo: ${new Date(item.nextDueDate).toLocaleDateString('id-ID')}` : ''}`).join('\n\n')}\n\nBayar: *.debt pay ID | nominal | catatan*` }

async function handler(m) {
  try {
    const raw = String(m.text || '').trim()
    if (!raw || raw === 'list') {
      const { debts } = await linkedFinance(m.sender, 'debts.list')
      return m.reply(debtListMessage(debts))
    }
    const [verb, ...segments] = raw.split('|').map((value) => value.trim())
    if (verb.toLowerCase().startsWith('add ')) {
      const directionText = verb.slice(4).trim().toLowerCase()
      const direction = ['debt', 'utang'].includes(directionText) ? 'debt' : ['receivable', 'piutang'].includes(directionText) ? 'receivable' : null
      const [counterpartyName, amountText, dueDate = '', note = ''] = segments
      if (!direction || !counterpartyName || !/^\d+$/.test(amountText || '')) return m.reply('Format: *.debt add debt|piutang | Nama | Nominal | YYYY-MM-DD | catatan*')
      const { debt } = await linkedFinance(m.sender, 'debts.create', { direction, counterpartyName, initialAmount: Number(amountText), frequency: 'one_time', dueDate: dueDate || undefined, nextDueDate: dueDate || undefined, note })
      return m.reply(`✅ ${direction === 'debt' ? 'Utang' : 'Piutang'} kepada/dari *${counterpartyName}* sebesar *${formatRupiah(Number(amountText))}* tersimpan (ID #${debt.id}).`)
    }
    if (verb.toLowerCase().startsWith('pay ')) {
      const debtId = Number(verb.slice(4).trim())
      const [amountText, note = ''] = segments
      if (!Number.isSafeInteger(debtId) || !/^\d+$/.test(amountText || '')) return m.reply('Format: *.debt pay ID | nominal | catatan*')
      const account = await accountForTransaction(m.sender)
      const { payment } = await linkedFinance(m.sender, 'debts.pay', { messageId: m.id, debtId, accountId: account.id, amount: Number(amountText), note, paidAt: new Date().toISOString() })
      return m.reply(payment.duplicate ? 'ℹ️ Pembayaran ini sudah pernah dicatat.' : `✅ Pembayaran tercatat. Sisa: *${formatRupiah(payment.remainingAmount)}*${payment.settled ? ' — lunas.' : ''}`)
    }
    return m.reply('Gunakan *.debt list*, *.debt add debt|piutang | Nama | Nominal | YYYY-MM-DD | catatan*, atau *.debt pay ID | nominal | catatan*.')
  } catch (error) { return m.reply(financeErrorText(error)) }
}

export { pluginConfig as config, handler }
