import { financeErrorText, linkedFinance, listAccountsMessage } from '../../src/finance/nhefinance-commands.js'

const pluginConfig = { name: 'finance-account', alias: ['account', 'akun'], category: 'finance', description: 'Kelola akun/dompet NHEfinance', usage: '.account | .account add Nama | cash | 0', example: '.account add Cash | cash | 0', isOwner: false, isPremium: false, isGroup: false, isPrivate: true, cooldown: 3, energi: 1, isEnabled: true }

async function handler(m) {
  const text = (m.text || '').trim()
  try {
    if (text.toLowerCase().startsWith('add ')) {
      const [name, type = 'cash', openingBalance = '0'] = text.slice(4).split('|').map((item) => item.trim())
      const { account } = await linkedFinance(m.sender, 'accounts.create', { name, type: type.toLowerCase(), openingBalance: Number(openingBalance) })
      return m.reply(`✅ Akun NHEfinance berhasil dibuat (ID ${account.id}).`)
    }
    const { accounts } = await linkedFinance(m.sender, 'accounts.list')
    return m.reply(listAccountsMessage(accounts))
  } catch (error) { return m.reply(financeErrorText(error)) }
}

export { pluginConfig as config, handler }
