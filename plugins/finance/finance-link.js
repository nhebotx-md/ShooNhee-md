import config from '../../config.js'
import { financeErrorText, linkedFinance } from '../../src/finance/nhefinance-commands.js'
import { registerFinanceReminderJid, unregisterFinanceReminderJid } from '../../src/lib/Shon-finance-reminder.js'

const pluginConfig = { name: 'nhefinance-link', alias: ['nhefinance'], category: 'finance', description: 'Tautkan akun WhatsApp ke NHEfinance', usage: '.nhefinance link|status|cancel|unlink', example: '.nhefinance link', isOwner: false, isPremium: false, isGroup: false, isPrivate: false, cooldown: 3, energi: 1, isEnabled: true }

const connectionPageUrl = () => config.nhefinance?.linkPageUrl || 'https://finorafinanc-hbyzxtda.manus.space/settings/whatsapp'
const connectionPageText = () => `*Buka halaman koneksi NHEfinance*\n${connectionPageUrl()}`

function postLinkCommands() {
  return `*Setelah terhubung, coba:*\n• *.finance* — lihat ringkasan\n• *.in 50000 Gaji | catatan* — catat pemasukan\n• *.out 30000 Makanan | catatan* — catat pengeluaran`
}

async function handler(m) {
  const action = (m.text || '').trim().toLowerCase()
  try {
    if (action === 'link') {
      const { link } = await linkedFinance(m.sender, 'link.issue')
      return m.reply(`*Hubungkan WhatsApp ke NHEfinance*\n\n*Kode penautan Anda*\n${link.code}\nBerlaku hingga ${new Date(link.expiresAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}\n\n*Lanjutkan dalam 3 langkah:*\n1. Salin kode di atas.\n2. ${connectionPageText()}\n3. Masukkan kode pada halaman *Bot WhatsApp*, lalu tekan *Hubungkan bot ke akun ini*.\n\nSetelah tersambung, command finance di chat ini menggunakan data dari akun NHEfinance yang Anda setujui. Hanya kode terbaru yang dapat dipakai. Jika tidak jadi, kirim *.nhefinance cancel*.`)
    }
    if (action === 'status') {
      const { link } = await linkedFinance(m.sender, 'link.status')
      if (link.state === 'active') {
        registerFinanceReminderJid(m.sender)
        return m.reply(`*WhatsApp sudah terhubung ke NHEfinance*\n\nNomor yang berakhir pada *${link.whatsappLast4}* terhubung sejak ${new Date(link.linkedAt).toLocaleString('id-ID')}. Setiap command finance di chat ini menggunakan data akun NHEfinance yang sama. Pengingat mengikuti pengaturan yang Anda pilih di NHEfinance.\n\n${postLinkCommands()}`)
      }
      if (link.state === 'pending') return m.reply(`*Kode penautan masih menunggu persetujuan*\n\nMasukkan kode sebelum ${new Date(link.expiresAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} pada halaman *Bot WhatsApp* di akun NHEfinance Anda.\n\n${connectionPageText()}\n\nSetelah itu, kirim *.nhefinance status*.`)
      if (link.state === 'expired') return m.reply(`*Kode penautan sudah berakhir*\n\nKirim *.nhefinance link* untuk membuat kode baru, kemudian masukkan kode tersebut pada halaman *Bot WhatsApp* di NHEfinance.\n\n${connectionPageText()}`)
      return m.reply(`*WhatsApp belum terhubung ke NHEfinance*\n\nKirim *.nhefinance link* untuk membuat kode penautan. Setelah kode diterima, buka halaman berikut, masukkan kode, lalu tekan *Hubungkan bot ke akun ini*.\n\n${connectionPageText()}`)
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
    return m.reply(`*Koneksi NHEfinance melalui WhatsApp*\n\n• *.nhefinance link* — buat kode penautan\n• *.nhefinance status* — periksa koneksi\n• *.nhefinance cancel* — batalkan kode yang belum digunakan\n• *.nhefinance unlink* — putuskan koneksi\n\nSetelah menerima kode, buka halaman *Bot WhatsApp* di NHEfinance untuk memasukkannya.\n\n${connectionPageText()}`)
  } catch (error) { return m.reply(financeErrorText(error)) }
}

export { pluginConfig as config, handler }
