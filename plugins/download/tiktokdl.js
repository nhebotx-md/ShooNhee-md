import axios from 'axios'
import { parseHttpUrl } from '../../src/lib/Shon-media-safety.js'

const API_URL = 'https://www.tikwm.com/api/'
const TIKWM_HOSTS = ['tikwm.com']

function normalizeMediaUrl(value) {
  if (!value) return null
  try {
    return parseHttpUrl(new URL(String(value), 'https://www.tikwm.com').toString(), { allowedHosts: TIKWM_HOSTS, requireHttps: true }).toString()
  } catch {
    try {
      return parseHttpUrl(String(value), { requireHttps: true }).toString()
    } catch {
      return null
    }
  }
}

async function tiktokDl(url) {
  const response = await axios.get(API_URL, {
    params: { url, count: 12, cursor: 0, web: 1, hd: 1 },
    timeout: 30000,
    maxContentLength: 2 * 1024 * 1024,
    headers: {
      Accept: 'application/json',
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36',
    },
  })
  const raw = response.data?.data
  if (!raw || response.data?.code !== 0) throw new Error(response.data?.msg || 'TikWM tidak mengembalikan media.')

  const duration = Number(raw.duration) || 0
  const data = duration === 0 && Array.isArray(raw.images)
    ? raw.images.map((image) => ({ type: 'photo', url: normalizeMediaUrl(image) })).filter((item) => item.url)
    : [
        { type: 'watermark', url: normalizeMediaUrl(raw.wmplay) },
        { type: 'nowatermark', url: normalizeMediaUrl(raw.play) },
        { type: 'nowatermark_hd', url: normalizeMediaUrl(raw.hdplay) },
      ].filter((item) => item.url)

  if (!data.length) throw new Error('TikWM tidak memiliki tautan media yang dapat digunakan.')

  const normalizeImage = (value) => normalizeMediaUrl(value)
  const musicUrl = normalizeMediaUrl(raw.music || raw.music_info?.play)
  return {
    status: true,
    title: String(raw.title || ''),
    taken_at: raw.create_time ? new Date(Number(raw.create_time) * 1000).toISOString() : '',
    region: raw.region || '',
    id: raw.id || '',
    durations: duration,
    duration: `${duration} Seconds`,
    cover: normalizeImage(raw.cover),
    data,
    music_info: {
      id: raw.music_info?.id || '',
      title: raw.music_info?.title || '',
      author: raw.music_info?.author || '',
      album: raw.music_info?.album || null,
      url: musicUrl,
    },
    stats: {
      views: Number(raw.play_count) || 0,
      likes: Number(raw.digg_count) || 0,
      comment: Number(raw.comment_count) || 0,
      share: Number(raw.share_count) || 0,
      download: Number(raw.download_count) || 0,
    },
    author: {
      id: raw.author?.id || '',
      fullname: raw.author?.unique_id || '',
      nickname: raw.author?.nickname || '',
      avatar: normalizeImage(raw.author?.avatar),
    },
  }
}

const pluginConfig = {
  name: ['tiktok', 'tt'],
  alias: ['tiktokdl', 'ttdown'],
  category: 'download',
  description: 'Download video/slide TikTok tanpa watermark',
  usage: '.tiktok <url>',
  example: '.tiktok https://vt.tiktok.com/xxx',
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
    url = parseHttpUrl(m.text?.trim(), { allowedHosts: ['tiktok.com'] }).toString()
  } catch {
    return m.reply(`📌 Contoh: *${m.prefix}${m.command} https://vt.tiktok.com/...*`)
  }

  await m.react('🕕')
  try {
    const result = await tiktokDl(url)
    if (result.durations > 0) {
      const selected = result.data.find((item) => item.type === 'nowatermark_hd') || result.data.find((item) => item.type === 'nowatermark')
      if (!selected) throw new Error('Video TikTok tidak ditemukan.')
      await sock.sendMedia(m.chat, selected.url, result.title, m, { type: 'video' })
    } else {
      for (const item of result.data) {
        await sock.sendMessage(m.chat, { image: { url: item.url } }, { quoted: m })
      }
    }
    await m.react('✅')
  } catch (error) {
    console.error('[TikTokDL] Gagal:', error.message)
    await m.react('❌')
    await m.reply('Gagal mengunduh media TikTok. Coba lagi nanti atau gunakan .tt2.')
  }
}

export { pluginConfig as config, handler, tiktokDl }
