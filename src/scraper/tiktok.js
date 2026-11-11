import axios from 'axios'
import * as cheerio from 'cheerio'
import { parseHttpUrl } from '../lib/Shon-media-safety.js'

const USER_AGENT = 'Mozilla/5.0 (Linux; Android 15; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'
const TIKTOK_HOSTS = ['tiktok.com']

function normalizeTikTokUrl(input) {
  const url = parseHttpUrl(input, { allowedHosts: TIKTOK_HOSTS })
  if (!/(^|\.)tiktok\.com$/i.test(url.hostname)) throw new Error('Gunakan link TikTok yang valid.')
  return url.toString()
}

function validateMediaUrl(input) {
  return parseHttpUrl(input, { requireHttps: true }).toString()
}

function normalizeDownloads(downloads) {
  return downloads
    .filter((item) => item && item.url)
    .map((item) => ({
      type: String(item.type || '').toLowerCase(),
      label: String(item.label || ''),
      url: validateMediaUrl(item.url),
    }))
}

async function ttdownFromYuuLabs(url) {
  const { data } = await axios.get('https://api.yuulabs.web.id/api/downloader/tiktok', {
    params: { url },
    timeout: 30000,
    maxContentLength: 2 * 1024 * 1024,
    headers: { 'User-Agent': USER_AGENT },
  })

  if (!data?.status || !data?.result) throw new Error('YuuLabs response tidak valid.')
  const result = data.result
  const downloads = []
  if (result.videoUrl) downloads.push({ type: 'nowatermark', label: 'Video tanpa watermark', url: result.videoUrl })
  if (result.hdVideo) downloads.push({ type: 'nowatermark_hd', label: 'Video HD', url: result.hdVideo })
  if (result.audioUrl) downloads.push({ type: 'mp3', label: 'Audio MP3', url: result.audioUrl })

  const normalized = normalizeDownloads(downloads)
  if (!normalized.length) throw new Error('YuuLabs tidak mengembalikan media.')
  return {
    title: String(result.description || ''),
    author: { username: String(result.author || ''), avatar: null },
    cover: null,
    downloads: normalized,
  }
}

async function ttdownFromMusicalDown(url) {
  const { data: html, headers } = await axios.get('https://musicaldown.com/en', {
    timeout: 30000,
    maxContentLength: 3 * 1024 * 1024,
    headers: { 'User-Agent': USER_AGENT },
  })
  const $ = cheerio.load(html)
  const payload = {}
  $('#submit-form input').each((_, element) => {
    const name = $(element).attr('name')
    const value = $(element).attr('value')
    if (name) payload[name] = value || ''
  })

  const urlField = Object.keys(payload).find((key) => !payload[key])
  if (!urlField) throw new Error('Form downloader TikTok berubah.')
  payload[urlField] = url

  const cookies = Array.isArray(headers['set-cookie'])
    ? headers['set-cookie'].map((cookie) => cookie.split(';', 1)[0]).join('; ')
    : ''
  const { data } = await axios.post('https://musicaldown.com/download', new URLSearchParams(payload).toString(), {
    timeout: 30000,
    maxContentLength: 3 * 1024 * 1024,
    headers: {
      'User-Agent': USER_AGENT,
      'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
      cookie: cookies,
      origin: 'https://musicaldown.com',
      referer: 'https://musicaldown.com/',
    },
  })

  const $$ = cheerio.load(data)
  const downloads = []
  $$('a.download').each((_, element) => {
    const link = $$(element)
    const rawUrl = link.attr('href')
    if (!rawUrl) return
    const absoluteUrl = new URL(rawUrl, 'https://musicaldown.com').toString()
    downloads.push({
      type: link.data('event')?.replace('_download_click', '') || '',
      label: link.text().trim(),
      url: absoluteUrl,
    })
  })

  const normalized = normalizeDownloads(downloads)
  if (!normalized.length) throw new Error('MusicalDown tidak mengembalikan media.')
  const coverStyle = $$('.video-header').attr('style') || ''
  const coverMatch = coverStyle.match(/url\((['"]?)(.*?)\1\)/)
  let cover = null
  if (coverMatch?.[2]) {
    try { cover = validateMediaUrl(new URL(coverMatch[2], 'https://musicaldown.com').toString()) } catch {}
  }

  return {
    title: $$('.video-desc').text().trim(),
    author: { username: $$('.video-author b').text().trim(), avatar: null },
    cover,
    downloads: normalized,
  }
}

async function ttdown(input) {
  const url = normalizeTikTokUrl(input)
  try {
    return await ttdownFromYuuLabs(url)
  } catch (primaryError) {
    try {
      return await ttdownFromMusicalDown(url)
    } catch (fallbackError) {
      const error = new Error('Semua layanan pengunduh TikTok gagal. Coba lagi nanti.')
      error.cause = fallbackError
      error.primaryCause = primaryError
      throw error
    }
  }
}

export { ttdown, normalizeTikTokUrl }
export default ttdown
