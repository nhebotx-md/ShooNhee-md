import { pinterestdl } from '../../src/lib/Shon-pinterest.js'
import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { queueFFmpeg } from '../../src/lib/Shon-ffmpeg.js'
import { f } from '../../src/lib/Shon-http.js'
import te from '../../src/lib/Shon-error.js'
import { assertBufferSize, parseHttpUrl } from '../../src/lib/Shon-media-safety.js'

const pluginConfig = {
  name: 'pindl',
  alias: ['pinterestdl', 'pindownload', 'pintdl'],
  category: 'download',
  description: 'Download gambar/video dari Pinterest',
  usage: '.pindl <url>',
  example: '.pindl https://pin.it/xxx',
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  energi: 1,
  isEnabled: true,
}

const PINTEREST_HOSTS = ['pinterest.com', 'pinterest.ca', 'pinterest.co.uk', 'pinterest.de', 'pinterest.fr', 'pin.it']

async function handler(m, { sock }) {
  let url
  try {
    url = parseHttpUrl(m.text?.trim(), { allowedHosts: PINTEREST_HOSTS }).toString()
  } catch {
    return m.reply(`📌 Masukkan tautan Pinterest yang valid. Contoh: \`${m.prefix}pindl https://pin.it/xxx\``)
  }

  await m.react('🕕')
  try {
    const result = await pinterestdl(url)
    if (!Array.isArray(result?.media) || result.media.length === 0) throw new Error('Media Pinterest tidak ditemukan.')

    for (const media of result.media.slice(0, 10)) {
      const mediaUrl = parseHttpUrl(media.url, { requireHttps: true }).toString()
      if (media.type === 'video') {
        await sock.sendMedia(m.chat, mediaUrl, null, m, { type: 'video', contextInfo: { forwardingScore: 99, isForwarded: true } })
        continue
      }

      const isGif = /\.gif(?:$|\?)/i.test(new URL(mediaUrl).pathname)
      if (!isGif) {
        await sock.sendMedia(m.chat, mediaUrl, null, m, { type: 'image', contextInfo: { forwardingScore: 99, isForwarded: true } })
        continue
      }

      const tempDir = path.join(process.cwd(), 'temp')
      fs.mkdirSync(tempDir, { recursive: true })
      const id = randomUUID()
      const gifPath = path.join(tempDir, `pin-${id}.gif`)
      const mp4Path = path.join(tempDir, `pin-${id}.mp4`)
      try {
        const raw = await f(mediaUrl, 'buffer')
        assertBufferSize(raw, 30 * 1024 * 1024, 'GIF Pinterest')
        fs.writeFileSync(gifPath, raw, { flag: 'wx' })
        await queueFFmpeg([
          '-y', '-ignore_loop', '0', '-i', gifPath, '-t', '30',
          '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', '-c:v', 'libx264',
          '-pix_fmt', 'yuv420p', '-movflags', 'faststart', '-preset', 'ultrafast', '-an', mp4Path,
        ])
        if (!fs.existsSync(mp4Path)) throw new Error('FFmpeg tidak menghasilkan video.')
        const output = assertBufferSize(fs.readFileSync(mp4Path), 50 * 1024 * 1024, 'Video Pinterest')
        await sock.sendMedia(m.chat, output, null, m, { type: 'video', gifPlayback: true, contextInfo: { forwardingScore: 99, isForwarded: true } })
      } catch (error) {
        console.error('[PinDL] Konversi GIF gagal:', error.message)
        await sock.sendMedia(m.chat, mediaUrl, null, m, { type: 'image' })
      } finally {
        for (const file of [gifPath, mp4Path]) {
          try { if (fs.existsSync(file)) fs.unlinkSync(file) } catch {}
        }
      }
    }
    await m.react('✅')
  } catch (error) {
    console.error('[PinDL] Gagal:', error.message)
    await m.react('❌')
    await m.reply(te(m.prefix, m.command, m.pushName))
  }
}

export { pluginConfig as config, handler }
