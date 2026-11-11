import instagramDownloader, { normalizeInstagramUrl } from '../../src/scraper/ig.js'

const pluginConfig = {
  name: 'instagramdl',
  alias: ['igdl', 'ig', 'instagram'],
  category: 'download',
  description: 'Download video/foto Instagram',
  usage: '.instagramdl <url>',
  example: '.instagramdl https://www.instagram.com/reel/xxx',
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  energi: 1,
  isEnabled: true,
}

async function handler(m, { sock }) {
  let url
  try {
    url = normalizeInstagramUrl(m.text?.trim())
  } catch {
    return m.reply(
      `📸 *ɪɴsᴛᴀɢʀᴀᴍ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ*\n\n` +
      `> Kirim tautan post/reel/story Instagram yang valid.\n\n` +
      `Contoh: \`${m.prefix}igdl https://www.instagram.com/reel/xxx\``,
    )
  }

  await m.react('🕕')
  try {
    const result = await instagramDownloader(url)
    if (!result?.media?.length) throw new Error('Media Instagram tidak ditemukan.')

    const isStory = new URL(url).pathname.includes('/stories/')
    let caption = `📸 *Instagram ${isStory ? 'Story' : 'Downloader'}*`
    if (result.username && result.username !== '-') caption += `\n👤 @${result.username}`
    if (result.caption) caption += `\n\n${result.caption.slice(0, 1000)}`

    for (const item of result.media.slice(0, 10)) {
      const payload = item.type === 'video'
        ? { video: { url: item.url }, caption }
        : { image: { url: item.url }, caption }
      await sock.sendMessage(m.chat, payload, { quoted: m })
      caption = ''
    }
    await m.react('✅')
  } catch (error) {
    console.error('[InstagramDL] Gagal:', error.message)
    await m.react('❌')
    await m.reply('❌ Pengunduhan Instagram gagal. Tautan mungkin privat atau layanan sedang tidak tersedia.')
  }
}

export { pluginConfig as config, handler }
