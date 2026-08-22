import { dashboardMessage, financeErrorText, linkedFinance } from '../../src/finance/nhefinance-commands.js'

const pluginConfig = { name: 'finance-summary', alias: ['summary'], category: 'finance', description: 'Ringkasan keuangan NHEfinance', usage: '.summary', example: '.summary', isOwner: false, isPremium: false, isGroup: false, isPrivate: false, cooldown: 2, energi: 1, isEnabled: true }

async function handler(m) {
  try {
    const { dashboard } = await linkedFinance(m.sender, 'dashboard')
    return m.reply(dashboardMessage(dashboard))
  } catch (error) { return m.reply(financeErrorText(error)) }
}

export { pluginConfig as config, handler }
