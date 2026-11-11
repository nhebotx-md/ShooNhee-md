import ttdown from '../../src/scraper/tiktok.js'
import axios from 'axios'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'
import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { assertBufferSize, parseHttpUrl } from '../../src/lib/Shon-media-safety.js'

ffmpeg.setFfmpegPath(ffmpegInstaller.path)

const MAX_VIDEO_BYTES = 60 * 1024 * 1024
const MAX_AUDIO_BYTES = 24 * 1024 * 1024

const pluginConfig = {
  name: ['ttmp3'],
  alias: ['ttmusic', 'tiktokmusic'],
  category: 'download',
  description: 'Download audio TikTok',
  usage: '.ttmp3 <url>',
  example: '.ttmp3 https://vt.tiktok.com/xxx',
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  energi: 1,
  isEnabled: true,
}

async function downloadBuffer(url, maxBytes) {
  const safeUrl = parseHttpUrl(url, { requireHttps: true }).toString()
  const response = await axios.get(safeUrl, {
    responseType: 'arraybuffer',
    timeout: 60000,
    maxContentLength: maxBytes,
    maxBodyLength: maxBytes,
    maxRedirects: 3,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36',
      Referer: 'https://www.tiktok.com/',
    },
  })
  return assertBufferSize(Buffer.from(response.data), maxBytes, 'Media TikTok')
}

async function extractAudioFromVideo(videoUrl, tempDir) {
  const id = randomUUID()
  const inputFile = path.join(tempDir, `ttmp3_${id}.mp4`)
  const outputFile = path.join(tempDir, `ttmp3_${id}.mp3`)
  try {
    const videoBuffer = await downloadBuffer(videoUrl, MAX_VIDEO_BYTES)
    fs.writeFileSync(inputFile, videoBuffer, { flag: 'wx' })
    await new Promise((resolve, reject) => {
      ffmpeg(inputFile)
        .noVideo()
        .audioCodec('libmp3lame')
        .format('mp3')
        .outputOptions('-map_metadata', '-1')
        .on('end', resolve)
        .on('error', reject)
        .save(outputFile)
    })
    const audioBuffer = fs.readFileSync(outputFile)
    return assertBufferSize(audioBuffer, MAX_AUDIO_BYTES, 'Audio hasil konversi')
  } finally {
    for (const file of [inputFile, outputFile]) {
      try { if (fs.existsSync(file)) fs.unlinkSync(file) } catch {}
    }
  }
}

async function handler(m, { sock }) {
  const url = m.text?.trim()
  if (!url) {
    return m.reply(
      `╭┈┈⬡「 🎵 *ᴛɪᴋᴛᴏᴋ ᴀᴜᴅɪᴏ* 」\n` +
      `┃ ᴘᴀᴋᴀɪ: \`${m.prefix}ttmp3 <url>\`\n` +
      `╰┈┈⬡\n\n> Contoh: ${m.prefix}ttmp3 https://vt.tiktok.com/xxx`,
    )
  }

  await m.react('🕕')
  const tempDir = path.join(process.cwd(), 'temp')
  fs.mkdirSync(tempDir, { recursive: true })

  try {
    const result = await ttdown(url)
    const directAudio = result.downloads.find((item) => item.type === 'mp3' && item.url)
    let audioBuffer
    if (directAudio) {
      audioBuffer = await downloadBuffer(directAudio.url, MAX_AUDIO_BYTES)
    } else {
      const video = result.downloads.find((item) => item.type === 'nowatermark_hd' && item.url) ||
        result.downloads.find((item) => item.type === 'nowatermark' && item.url)
      if (!video) throw new Error('Tautan audio/video TikTok tidak ditemukan.')
      audioBuffer = await extractAudioFromVideo(video.url, tempDir)
    }

    await sock.sendMedia(m.chat, audioBuffer, null, m, {
      type: 'audio',
      mimetype: 'audio/mpeg',
      fileName: `TikTok_Audio_${Date.now()}.mp3`,
    })
    await m.react('✅')
  } catch (error) {
    console.error('[TikTok Audio] Gagal memproses unduhan:', error.message)
    await m.react('❌')
    await m.reply('❌ Unduhan audio TikTok gagal. Periksa tautannya atau coba lagi nanti.')
  }
}

export { pluginConfig as config, handler }
