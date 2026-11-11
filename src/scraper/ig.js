import { parseHttpUrl } from '../lib/Shon-media-safety.js'

function normalizeInstagramUrl(input) {
  const url = parseHttpUrl(input, { allowedHosts: ['instagram.com', 'instagr.am'] })
  if (!/^\/(p|reel|reels|stories|tv)\//i.test(url.pathname)) {
    throw new Error('Gunakan tautan postingan, reel, atau story Instagram.')
  }
  return url.toString()
}

async function instagramDownloader(input) {
  const url = normalizeInstagramUrl(input)
  const { default: axios } = await import('axios')
  const response = await axios.get('https://api.azbry.com/api/download/instagramv2', {
    params: { url },
    timeout: 30000,
    maxContentLength: 2 * 1024 * 1024,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
    },
  })
  const data = response.data
  if (!data?.status || !Array.isArray(data.links) || data.links.length === 0) {
    throw new Error('Layanan Instagram tidak mengembalikan media.')
  }

  const media = data.links.map((item) => {
    const mediaUrl = parseHttpUrl(item?.url, { requireHttps: true }).toString()
    const type = String(item?.type || '').toLowerCase()
    const isVideo = type === 'video' || type === 'mp4' || /\.mp4(?:$|\?)/i.test(mediaUrl)
    return {
      type: isVideo ? 'video' : 'image',
      url: mediaUrl,
      thumbnail: item?.thumbnail ? parseHttpUrl(item.thumbnail, { requireHttps: true }).toString() : '',
    }
  })

  const first = data.links[0] || {}
  const caption = typeof first.text === 'string' && first.text !== 'null' ? first.text.trim() : ''
  return {
    status: true,
    username: typeof data.author === 'string' && data.author !== 'Unknown' ? data.author : '-',
    title: caption || String(data.author || 'Instagram'),
    caption,
    thumbnail: data.thumbnail ? parseHttpUrl(data.thumbnail, { requireHttps: true }).toString() : '',
    avatar: data.avatar ? parseHttpUrl(data.avatar, { requireHttps: true }).toString() : '',
    media,
  }
}

export { instagramDownloader, normalizeInstagramUrl }
export default instagramDownloader
