import config from '../../config.js'
import { financeErrorText, linkedFinance } from '../../src/finance/nhefinance-commands.js'
import { registerFinanceReminderJid, unregisterFinanceReminderJid } from '../../src/lib/Shon-finance-reminder.js'

const pluginConfig = { name: 'nhefinance-link', alias: ['nhefinance'], category: 'finance', description: 'Tautkan akun WhatsApp ke NHEfinance', usage: '.nhefinance link|status|cancel|unlink', example: '.nhefinance link', isOwner: false, isPremium: false, isGroup: false, isPrivate: false, cooldown: 3, energi: 1, isEnabled: true }

async function handler(m) {
  const action = (m.text || '').trim().toLowerCase()
  try {
    if (action === 'link') {
      const { link } = await linkedFinance(m.sender, 'link.issue')
      return m.reply(`*Hubungkan bot WhatsApp ke akun NHEfinance*\n\nKode khusus untuk nomor WhatsApp ini:\n*${link.code}*\nBerlaku sampai ${new Date(link.expiresAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}\n\nLakukan 3 langkah ini:\n1. Salin kode di atas.\n2. Buka ${config.nhefinance.linkPageUrl} dan masuk ke akun NHEfinance yang ingin Anda kelola lewat bot.\n3. Buka Pengaturan → WhatsApp, tempel kode, lalu tekan *Hubungkan bot ke akun ini*.\n\nSetelah berhasil, setiap perintah finance di bot langsung memakai data akun NHEfinance yang sama. Hanya kode terbaru yang dapat digunakan. Jika batal, kirim *.nhefinance cancel*.`)
    }
    if (action === 'status') {
      const { link } = await linkedFinance(m.sender, 'link.status')
      if (link.state === 'active') {
        registerFinanceReminderJid(m.sender)
        return m.reply(`Bot WhatsApp dengan akhir nomor *${link.whatsappLast4}* sudah terhubung ke akun NHEfinance Anda sejak ${new Date(link.linkedAt).toLocaleString('id-ID')}. Semua command finance langsung memakai data akun yang sama. Reminder mengikuti pengaturan yang Anda buat di NHEfinance.`)
      }
      if (link.state === 'pending') return m.reply(`Kode bot untuk nomor ini sudah dibuat dan menunggu Anda memasukkannya di NHEfinance hingga ${new Date(link.expiresAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}. Buka Pengaturan → WhatsApp di akun NHEfinance Anda, lalu tekan *Hubungkan bot ke akun ini*.`)
      if (link.state === 'expired') return m.reply('Kode sudah kedaluwarsa. Buat kode baru dengan *.nhefinance link*, lalu masukkan kode tersebut di Pengaturan → WhatsApp pada NHEfinance.')
      return m.reply('Bot ini belum terhubung ke akun NHEfinance. Kirim *.nhefinance link* untuk membuat kode khusus, lalu masukkan kode itu di Pengaturan → WhatsApp pada NHEfinance.')
    }
    if (action === 'cancel') {
      const { link } = await linkedFinance(m.sender, 'link.cancel')
      return m.reply(link.cancelled ? 'Kode yang belum digunakan sudah dibatalkan. Anda dapat membuat kode baru kapan saja dengan *.nhefinance link*.' : 'Tidak ada kode yang belum digunakan untuk dibatalkan.')
    }
    if (action === 'unlink') {
      const { link } = await linkedFinance(m.sender, 'link.unlink')
      unregisterFinanceReminderJid(m.sender)
      return m.reply(link.removed ? 'Koneksi bot WhatsApp sudah diputus. Bot tidak lagi dapat melihat atau mencatat data NHEfinance Anda.' : 'Bot ini belum memiliki koneksi aktif yang dapat diputus.')
    }
    return m.reply('Gunakan *.nhefinance link* untuk membuat kode khusus, lalu masukkan kodenya di Pengaturan → WhatsApp pada NHEfinance. Gunakan *.nhefinance status* untuk memeriksa koneksi, *.nhefinance cancel* untuk membatalkan kode, atau *.nhefinance unlink* untuk memutus koneksi bot.')
  } catch (error) { return m.reply(financeErrorText(error)) }
}

export { pluginConfig as config, handler }
