import { financeErrorText, linkedFinance } from '../../src/finance/nhefinance-commands.js'

const pluginConfig = { name: 'finance-reminder', alias: ['reminder', 'pengingat'], category: 'finance', description: 'Atur reminder keuangan WhatsApp', usage: '.reminder set 07:00 | .reminder off', example: '.reminder set 07:00', isOwner: false, isPremium: false, isGroup: false, isPrivate: true, cooldown: 3, energi: 1, isEnabled: true }

async function handler(m) {
  const text = (m.text || '').trim().toLowerCase()
  try {
    if (text === 'off') {
      await linkedFinance(m.sender, 'reminders.update', { isEnabled: false, dailyTime: '07:00', timezone: 'Asia/Jakarta' })
      return m.reply('✅ Reminder WhatsApp dinonaktifkan.')
    }
    const match = text.match(/^set\s+(\d{2}:\d{2})(?:\s+([\w+/_-]+))?$/)
    if (match) {
      await linkedFinance(m.sender, 'reminders.update', { isEnabled: true, dailyTime: match[1], timezone: match[2] || 'Asia/Jakarta' })
      return m.reply(`✅ Reminder WhatsApp aktif setiap hari pada *${match[1]}* (${match[2] || 'Asia/Jakarta'}).`)
    }
    return m.reply('Format: *.reminder set 07:00* atau *.reminder off*.')
  } catch (error) { return m.reply(financeErrorText(error)) }
}

export { pluginConfig as config, handler }
