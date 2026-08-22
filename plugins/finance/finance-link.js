import config from '../../config.js'
import { financeErrorText, linkedFinance } from '../../src/finance/nhefinance-commands.js'
import { registerFinanceReminderJid, unregisterFinanceReminderJid } from '../../src/lib/Shon-finance-reminder.js'

const pluginConfig = { name: 'nhefinance-link', alias: ['nhefinance'], category: 'finance', description: 'Tautkan akun WhatsApp ke NHEfinance', usage: '.nhefinance link|status|unlink', example: '.nhefinance link', isOwner: false, isPremium: false, isGroup: false, isPrivate: false, cooldown: 3, energi: 1, isEnabled: true }

async function handler(m) {
  const action = (m.text || '').trim().toLowerCase()
  try {
    if (action === 'link') {
      const { link } = await linkedFinance(m.sender, 'link.issue')
      registerFinanceReminderJid(m.sender)
      return m.reply(`🔐 *Tautkan NHEfinance*\n\nKode Anda: *${link.code}*\nBerlaku hingga: ${new Date(link.expiresAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}\n\nBuka ${config.nhefinance.linkPageUrl} dalam keadaan login, lalu masukkan kode ini. Nomor WhatsApp tidak dipakai sebagai metode login.`)
    }
    if (action === 'status') {
      const { link } = await linkedFinance(m.sender, 'link.status')
      registerFinanceReminderJid(m.sender)
      return m.reply(`✅ WhatsApp dengan akhir nomor *${link.whatsappLast4}* sudah tertaut ke NHEfinance. Reminder: *${link.isEnabled === false ? 'nonaktif' : `${link.dailyTime || '07:00'} ${link.timezone || 'Asia/Jakarta'}`}*.`)
    }
    if (action === 'unlink') {
      const { link } = await linkedFinance(m.sender, 'link.unlink')
      unregisterFinanceReminderJid(m.sender)
      return m.reply(link.removed ? '✅ Tautan WhatsApp telah dicabut. Bot tidak lagi dapat mengakses data NHEfinance Anda.' : 'Tidak ada tautan aktif yang dapat dicabut.')
    }
    return m.reply('Gunakan *.nhefinance link* untuk membuat kode, *.nhefinance status* untuk memeriksa, atau *.nhefinance unlink* untuk mencabut tautan.')
  } catch (error) { return m.reply(financeErrorText(error)) }
}

export { pluginConfig as config, handler }
