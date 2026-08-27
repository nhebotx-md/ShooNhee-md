import config from '../../config.js'
import { financeErrorText, linkedFinance } from '../../src/finance/nhefinance-commands.js'
import { registerFinanceReminderJid, unregisterFinanceReminderJid } from '../../src/lib/Shon-finance-reminder.js'

const pluginConfig = { name: 'nhefinance-link', alias: ['nhefinance'], category: 'finance', description: 'Tautkan dan buka sesi NHEfinance', usage: '.nhefinance link|unlock <kode>|status|lock|cancel|unlink', example: '.nhefinance link', isOwner: false, isPremium: false, isGroup: false, isPrivate: true, cooldown: 3, energi: 1, isEnabled: true }

const connectionPageUrl = () => config.nhefinance?.linkPageUrl || 'https://finorafinanc-hbyzxtda.manus.space/settings/whatsapp'
const connectionPageText = () => `*Buka halaman koneksi NHEfinance*\n${connectionPageUrl()}`

function postUnlockCommands() {
  return `*Setelah sesi dibuka, coba:*\n• *.finance* — lihat ringkasan\n• *.in 50000 Gaji | catatan* — catat pemasukan\n• *.out 30000 Makanan | catatan* — catat pengeluaran\n\nGunakan *.nhefinance lock* setelah selesai untuk menutup sesi lebih cepat.`
}

/** Financial replies intentionally bypass reply variants and source-message quoting. */
async function secureReply(m, context, text) {
  if (context?.sock?.sendMessage) return context.sock.sendMessage(m.chat, { text })
  return m.reply(text, { quoted: false, contextInfo: {} })
}

function sessionText(session) {
  if (session?.state === 'active') {
    return `*Sesi finance aktif*\nBerlaku hingga ${new Date(session.expiresAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}, selama tetap digunakan.\n\n${postUnlockCommands()}`
  }
  if (session?.state === 'access_code_required') return `*Kode akses belum dibuat*\nBuka halaman *Bot WhatsApp* di NHEfinance untuk membuat kode akses pribadi, lalu jalankan *.nhefinance unlock <kode-akses>* di chat ini.\n\n${connectionPageText()}`
  if (session?.state === 'expired') return `*Sesi finance sudah berakhir*\nJalankan *.nhefinance unlock <kode-akses>* di chat pribadi ini untuk membuka sesi baru.`
  if (session?.state === 'revoked') return `*Sesi finance perlu dibuka ulang*\nKode akses atau tautan telah berubah. Jalankan *.nhefinance unlock <kode-akses>* untuk melanjutkan.`
  return `*Sesi finance terkunci*\nJalankan *.nhefinance unlock <kode-akses>* di chat pribadi ini sebelum memakai command finance.`
}

async function handler(m, context) {
  const reply = (text) => secureReply(m, context, text)
  const [actionInput = '', ...accessCodeParts] = (m.text || '').trim().split(/\s+/)
  const action = actionInput.toLowerCase()
  const accessCode = accessCodeParts.join(' ')
  try {
    if (action === 'link') {
      const { link } = await linkedFinance(m.sender, 'link.issue')
      return reply(`*Hubungkan WhatsApp ke NHEfinance*\n\n*Kode penautan Anda*\n${link.code}\nBerlaku hingga ${new Date(link.expiresAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}\n\n*Lanjutkan dalam 3 langkah:*\n1. Salin kode di atas.\n2. ${connectionPageText()}\n3. Masukkan kode pada halaman *Bot WhatsApp*, lalu tekan *Hubungkan bot ke akun ini*.\n\nSetelah tersambung, buat kode akses pribadi di NHEfinance dan jalankan *.nhefinance unlock <kode-akses>* melalui chat ini. Hanya kode penautan terbaru yang dapat dipakai. Jika tidak jadi, kirim *.nhefinance cancel*.`)
    }
    if (action === 'unlock') {
      if (!accessCode) return reply('🔐 Masukkan kode akses setelah command, misalnya: *.nhefinance unlock kode-akses-anda*\n\nJalankan hanya di chat pribadi dengan bot. Kode tidak akan ditampilkan kembali.')
      const { session } = await linkedFinance(m.sender, 'session.unlock', { accessCode })
      return reply(`🔐 *Sesi finance dibuka*\n\nAkses finance WhatsApp aktif hingga ${new Date(session.expiresAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}, selama masih digunakan. Kode akses tidak disimpan atau ditampilkan oleh bot.\n\n${postUnlockCommands()}`)
    }
    if (action === 'lock') {
      const { session } = await linkedFinance(m.sender, 'session.lock')
      return reply(session.locked ? '🔒 Sesi finance WhatsApp telah ditutup. Jalankan *.nhefinance unlock <kode-akses>* saat ingin memakai finance lagi.' : '🔒 Tidak ada sesi finance aktif yang perlu ditutup.')
    }
    if (action === 'status') {
      const { link } = await linkedFinance(m.sender, 'link.status')
      if (link.state === 'active') {
        registerFinanceReminderJid(m.sender)
        return reply(`*WhatsApp sudah terhubung ke NHEfinance*\n\nNomor yang berakhir pada *${link.whatsappLast4}* terhubung sejak ${new Date(link.linkedAt).toLocaleString('id-ID')}. Data finance tetap berada di akun NHEfinance yang sama. Pengingat mengikuti pengaturan yang Anda pilih di NHEfinance.\n\n${sessionText(link.session)}`)
      }
      if (link.state === 'pending') return reply(`*Kode penautan masih menunggu persetujuan*\n\nMasukkan kode sebelum ${new Date(link.expiresAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} pada halaman *Bot WhatsApp* di akun NHEfinance Anda.\n\n${connectionPageText()}\n\nSetelah itu, kirim *.nhefinance status*.`)
      if (link.state === 'expired') return reply(`*Kode penautan sudah berakhir*\n\nKirim *.nhefinance link* untuk membuat kode baru, kemudian masukkan kode tersebut pada halaman *Bot WhatsApp* di NHEfinance.\n\n${connectionPageText()}`)
      return reply(`*WhatsApp belum terhubung ke NHEfinance*\n\nKirim *.nhefinance link* untuk membuat kode penautan. Setelah kode diterima, buka halaman berikut, masukkan kode, lalu tekan *Hubungkan bot ke akun ini*.\n\n${connectionPageText()}`)
    }
    if (action === 'cancel') {
      const { link } = await linkedFinance(m.sender, 'link.cancel')
      return reply(link.cancelled ? 'Kode yang belum digunakan sudah dibatalkan. Anda dapat membuat kode baru kapan saja dengan *.nhefinance link*.' : 'Tidak ada kode yang belum digunakan untuk dibatalkan.')
    }
    if (action === 'unlink') {
      const { link } = await linkedFinance(m.sender, 'link.unlink')
      unregisterFinanceReminderJid(m.sender)
      return reply(link.removed ? 'Koneksi bot WhatsApp sudah diputus dan sesi finance ditutup. Bot tidak lagi dapat melihat atau mencatat data NHEfinance Anda.' : 'Bot ini belum memiliki koneksi aktif yang dapat diputus.')
    }
    return reply(`*Koneksi NHEfinance melalui WhatsApp*\n\n• *.nhefinance link* — buat kode penautan\n• *.nhefinance unlock <kode-akses>* — buka sesi finance sementara\n• *.nhefinance status* — periksa koneksi dan sesi\n• *.nhefinance lock* — tutup sesi finance\n• *.nhefinance cancel* — batalkan kode penautan\n• *.nhefinance unlink* — putuskan koneksi\n\nBuat atau ganti kode akses di halaman *Bot WhatsApp* NHEfinance. Jangan pernah mengirimkan kode akses di grup.\n\n${connectionPageText()}`)
  } catch (error) { return reply(financeErrorText(error)) }
}

export { pluginConfig as config, handler }
