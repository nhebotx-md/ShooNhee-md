import config from '../../config.js'
import { financeErrorText, linkedFinance } from '../../src/finance/nhefinance-commands.js'
import { registerFinanceReminderJid, unregisterFinanceReminderJid } from '../../src/lib/Shon-finance-reminder.js'

const pluginConfig = { name: 'nhefinance-link', alias: ['nhefinance'], category: 'finance', description: 'Tautkan akun WhatsApp ke NHEfinance', usage: '.nhefinance link|status|cancel|unlink', example: '.nhefinance link', isOwner: false, isPremium: false, isGroup: false, isPrivate: false, cooldown: 3, energi: 1, isEnabled: true }

async function handler(m) {
  const action = (m.text || '').trim().toLowerCase()
  try {
    if (action === 'link') {
      const { link } = await linkedFinance(m.sender, 'link.issue')
      return m.reply(`🔐 *Tautkan NHEfinance*\n\nKode Anda: *${link.code}*\nBerlaku hingga: ${new Date(link.expiresAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}\n\nBuka ${config.nhefinance.linkPageUrl} dalam keadaan login, lalu masukkan kode ini. Hanya kode terbaru yang aktif. Gunakan *.nhefinance cancel* jika ingin membatalkan sebelum disetujui. Nomor WhatsApp tidak dipakai sebagai metode login.`)
    }
    if (action === 'status') {
      const { link } = await linkedFinance(m.sender, 'link.status')
      if (link.state === 'active') {
        registerFinanceReminderJid(m.sender)
        return m.reply(`✅ WhatsApp dengan akhir nomor *${link.whatsappLast4}* sudah tertaut ke NHEfinance sejak ${new Date(link.linkedAt).toLocaleString('id-ID')}. Reminder akan memakai pengaturan NHEfinance Anda.`)
      }
      if (link.state === 'pending') return m.reply(`⏳ Kode penautan masih menunggu persetujuan di NHEfinance hingga ${new Date(link.expiresAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}.`)
      if (link.state === 'expired') return m.reply('⌛ Kode penautan telah kedaluwarsa. Buat kode baru dengan *.nhefinance link*.')
      return m.reply('Belum ada tautan WhatsApp aktif. Gunakan *.nhefinance link* untuk membuat kode penautan.')
    }
    if (action === 'cancel') {
      const { link } = await linkedFinance(m.sender, 'link.cancel')
      return m.reply(link.cancelled ? '✅ Kode penautan tertunda telah dibatalkan. Anda dapat membuat kode baru kapan saja.' : 'Tidak ada kode penautan tertunda yang dapat dibatalkan.')
    }
    if (action === 'unlink') {
      const { link } = await linkedFinance(m.sender, 'link.unlink')
      unregisterFinanceReminderJid(m.sender)
      return m.reply(link.removed ? '✅ Tautan WhatsApp telah dicabut. Bot tidak lagi dapat mengakses data NHEfinance Anda.' : 'Tidak ada tautan aktif yang dapat dicabut.')
    }
    return m.reply('Gunakan *.nhefinance link* untuk membuat kode, *.nhefinance status* untuk memeriksa, *.nhefinance cancel* untuk membatalkan kode tertunda, atau *.nhefinance unlink* untuk mencabut tautan.')
  } catch (error) { return m.reply(financeErrorText(error)) }
}

export { pluginConfig as config, handler }
