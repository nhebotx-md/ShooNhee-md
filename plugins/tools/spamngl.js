import axios from 'axios'
import { parseHttpUrl } from '../../src/lib/Shon-media-safety.js'

const MAX_SENDS = 3
const pluginConfig = {
  name: 'spamngl',
  alias: ['ngltest'],
  category: 'tools',
  description: 'Uji pengiriman NGL terbatas untuk owner',
  usage: '.spamngl <ngl.link> | <pesan> | <1-3>',
  example: '.spamngl https://ngl.link/xxxx | hai | 2',
  isOwner: true,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 30,
  energi: 0,
  isEnabled: true,
}

async function handler(m) {
  if (!m.isOwner) return m.reply('⛔ Perintah ini hanya tersedia untuk owner bot.')
  const [linkInput, messageInput, countInput] = (m.text || '').split('|').map((value) => value?.trim())
  if (!linkInput || !messageInput || !countInput) {
    return m.reply(`Contoh: \`${m.prefix}spamngl https://ngl.link/xxxx | hai | 2\` (maksimal ${MAX_SENDS})`)
  }

  let link
  try {
    link = parseHttpUrl(linkInput, { allowedHosts: ['ngl.link'] }).toString()
  } catch {
    return m.reply('❌ Gunakan URL publik dari domain ngl.link.')
  }
  if (messageInput.length > 300) return m.reply('❌ Pesan terlalu panjang. Batas maksimal 300 karakter.')
  const count = Number(countInput)
  if (!Number.isInteger(count) || count < 1 || count > MAX_SENDS) {
    return m.reply(`❌ Jumlah harus bilangan bulat 1–${MAX_SENDS}.`)
  }

  await m.react('🎴')
  let sent = 0
  try {
    for (let i = 0; i < count; i++) {
      const { data } = await axios.get('https://api.cuki.biz.id/api/tools/sendngl', {
        params: { apikey: 'cuki-x', link, text: messageInput },
        timeout: 30000,
        maxContentLength: 1024 * 1024,
      })
      if (data?.status === false || data?.success === false) throw new Error('Penyedia menolak permintaan.')
      sent++
      if (i < count - 1) await new Promise((resolve) => setTimeout(resolve, 3000))
    }
    await m.react('✅')
    await m.reply(`✅ Selesai: ${sent} dari ${count} pesan berhasil dikirim.`)
  } catch (error) {
    console.error('[SpamNGL] Permintaan gagal:', error.message)
    await m.react('❌')
    await m.reply(`⚠️ Berhasil dikirim: ${sent}. Permintaan berikutnya gagal; proses dihentikan.`)
  }
}

export { pluginConfig as config, handler }
