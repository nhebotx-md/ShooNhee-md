import axios from 'axios'
import * as cheerio from 'cheerio'
import { getDatabase } from './Shon-database.js'
import { logger } from './Shon-logger.js'
import { assertBufferSize, parseHttpUrl, sanitizeFilename } from './Shon-media-safety.js'

const SUPPORTED_PLATFORMS = [
  'tiktok.com', 'instagram.com', 'fb.com', 'facebook.com', 'youtube.com', 'youtu.be',
  'telegram.me', 't.me', 'discord.gg', 'twitter.com', 'x.com',
]
const MAX_MEDIA_BYTES = 25 * 1024 * 1024
const MAX_RESULTS = 3
const USER_AGENT = 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/136.0.0.0 Mobile Safari/537.36'

function extractSupportedUrl(text) {
  const candidates = String(text || '').match(/https?:\/\/[^\s<>]+/gi) || []
  for (const candidate of candidates) {
    const cleaned = candidate.replace(/[),.;!?]+$/g, '')
    try {
      return parseHttpUrl(cleaned, { allowedHosts: SUPPORTED_PLATFORMS }).toString()
    } catch {}
  }
  return null
}

function containsSupportedLink(text) {
  return Boolean(extractSupportedUrl(text))
}

async function fetchInitialPage(initialUrl) {
  const response = await axios.get(initialUrl, {
    headers: { 'User-Agent': USER_AGENT, Referer: initialUrl },
    timeout: 15000,
    maxContentLength: 3 * 1024 * 1024,
  })
  const $ = cheerio.load(response.data)
  const csrfToken = $('meta[name="csrf-token"]').attr('content')
  if (!csrfToken) throw new Error('Token unduh tidak ditemukan')
  const cookies = Array.isArray(response.headers['set-cookie'])
    ? response.headers['set-cookie'].map((cookie) => cookie.split(';', 1)[0]).join('; ')
    : ''
  return { csrfToken, cookies }
}

async function postDownloadRequest(downloadUrl, userUrl, csrfToken, cookies) {
  const postData = new URLSearchParams({ _token: csrfToken, 'link[]': userUrl })
  const response = await axios.post(downloadUrl, postData.toString(), {
    headers: {
      'User-Agent': USER_AGENT,
      Referer: 'https://on4t.com/online-video-downloader',
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      Accept: '*/*',
      'X-Requested-With': 'XMLHttpRequest',
      Cookie: cookies,
    },
    timeout: 30000,
    maxContentLength: 3 * 1024 * 1024,
  })
  if (!Array.isArray(response.data?.result)) throw new Error('Format hasil downloader berubah')
  return response.data.result.slice(0, MAX_RESULTS).map((item) => ({
    title: sanitizeFilename(item.title || 'Media', 'Media'),
    thumb: item.image,
    url: item.video_file_url || item.videoimg_file_url,
  }))
}

async function downloadAndDetectType(inputUrl) {
  const url = parseHttpUrl(inputUrl, { requireHttps: true }).toString()
  const response = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 60000,
    maxContentLength: MAX_MEDIA_BYTES,
    maxBodyLength: MAX_MEDIA_BYTES,
    maxRedirects: 3,
  })
  const contentLength = Number(response.headers?.['content-length'])
  if (Number.isFinite(contentLength) && contentLength > MAX_MEDIA_BYTES) throw new Error('Media melewati batas ukuran.')
  const buffer = assertBufferSize(Buffer.from(response.data), MAX_MEDIA_BYTES, 'Media hasil unduhan')
  const { fileTypeFromBuffer } = await import('file-type')
  const fileInfo = await fileTypeFromBuffer(buffer)
  return { buffer, fileInfo }
}

async function handleAutoDownload(m, sock, text) {
  if (!m.isGroup) return
  const db = getDatabase()
  const groupData = db.getGroup(m.chat)
  if (!groupData?.autodl) return

  const extractedUrl = extractSupportedUrl(text)
  if (!extractedUrl) return
  await m.react('🕕')

  try {
    const initialUrl = 'https://on4t.com/online-video-downloader'
    const downloadUrl = 'https://on4t.com/all-video-download'
    const { csrfToken, cookies } = await fetchInitialPage(initialUrl)
    const results = await postDownloadRequest(downloadUrl, extractedUrl, csrfToken, cookies)
    if (!results.length) throw new Error('Tidak ada media yang bisa diunduh')

    for (const result of results) {
      if (!result.url) continue
      try {
        const { buffer, fileInfo } = await downloadAndDetectType(result.url)
        const mime = fileInfo?.mime || 'application/octet-stream'
        const extension = fileInfo?.ext || 'bin'
        const fileName = `${sanitizeFilename(result.title, 'Media')}.${extension}`
        const options = { fileName, mimetype: mime }
        if (mime.startsWith('video/')) await sock.sendMedia(m.chat, buffer, null, m, { ...options, type: 'video' })
        else if (mime.startsWith('audio/')) await sock.sendMedia(m.chat, buffer, null, m, { ...options, type: 'audio' })
        else if (mime.startsWith('image/')) await sock.sendMedia(m.chat, buffer, null, m, { ...options, type: 'image' })
        else await sock.sendMedia(m.chat, buffer, null, m, { ...options, type: 'document' })
      } catch (error) {
        logger.error('AutoDL', `Media gagal dikirim: ${error.message}`)
      }
    }
    await m.react('✅')
  } catch (error) {
    await m.react('😳')
    logger.error('AutoDL', error.message)
  }
}

export { handleAutoDownload, containsSupportedLink, extractSupportedUrl, SUPPORTED_PLATFORMS }
