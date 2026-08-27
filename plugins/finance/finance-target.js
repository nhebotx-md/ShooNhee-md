import { financeErrorText, formatRupiah, linkedFinance } from '../../src/finance/nhefinance-commands.js'

const pluginConfig = { name: 'finance-target', alias: ['target'], category: 'finance', description: 'Kelola target NHEfinance', usage: '.target | .target add Nama | 1000000 | 2026-12-31 | .target save ID 50000', example: '.target add Laptop | 10000000 | 2026-12-31', isOwner: false, isPremium: false, isGroup: false, isPrivate: true, cooldown: 3, energi: 1, isEnabled: true }

async function handler(m) {
  const text = (m.text || '').trim()
  try {
    if (text.toLowerCase().startsWith('add ')) {
      const [name, targetAmount, deadline] = text.slice(4).split('|').map((part) => part.trim())
      if (!name || !Number(targetAmount)) return m.reply('Format: *.target add Nama Target | 1000000 | 2026-12-31*')
      const { goal } = await linkedFinance(m.sender, 'goals.create', { name, targetAmount: Number(targetAmount), targetDate: deadline ? `${deadline}T00:00:00.000Z` : undefined })
      return m.reply(`✅ Target berhasil dibuat (ID ${goal.id}). Tambahkan progres dengan *.target save ${goal.id} 50000*.`)
    }
    const save = text.match(/^save\s+(\d+)\s+(\d+)$/i)
    if (save) {
      const { goal } = await linkedFinance(m.sender, 'goals.contribute', { goalId: Number(save[1]), amount: Number(save[2]) })
      return m.reply(`✅ Progres target diperbarui menjadi *${formatRupiah(goal.currentAmount)}*${goal.completed ? '. Target tercapai.' : ''}`)
    }
    const { goals } = await linkedFinance(m.sender, 'goals.list')
    if (!goals.length) return m.reply('Belum ada target. Buat dengan *.target add Laptop | 10000000 | 2026-12-31*.')
    return m.reply(`🎯 *Target NHEfinance*\n\n${goals.map((goal) => `#${goal.id} ${goal.name}\n${formatRupiah(goal.currentAmount)} / ${formatRupiah(goal.targetAmount)} (${goal.progress}%)${goal.targetDate ? ` · ${new Date(goal.targetDate).toLocaleDateString('id-ID')}` : ''}`).join('\n\n')}`)
  } catch (error) { return m.reply(financeErrorText(error)) }
}

export { pluginConfig as config, handler }
