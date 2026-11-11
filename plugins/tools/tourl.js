import FormData from 'form-data'
import fetch from 'node-fetch'
import mime from 'mime-types'
import { fileTypeFromBuffer } from 'file-type'
import { downloadMediaMessage, getContentType } from 'ShooNhee'
import te from '../../src/lib/Shon-error.js'
import { assertBufferSize, parseHttpUrl, sanitizeFilename } from '../../src/lib/Shon-media-safety.js'

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024
const pluginConfig = {
  name: 'tourl',
  alias: ['upload', 'catbox', 'url'],
  category: 'tools',
  description: 'Upload media ke satu host pilihan dan dapatkan URL',
  usage: '.tourl [catbox|litterbox|tmpfiles|gofile|quax|ypnk|puticu] (reply/kirim media)',
  example: '.tourl litterbox',
  cooldown: 10,
  energi: 1,
  isEnabled: true,
}

function extensionFor(mimetype, detected) {
  return detected?.ext || mime.extension(mimetype || '') || 'bin'
}

function extractHttpResponseUrl(value, allowedHosts) {
  const url = parseHttpUrl(String(value || '').trim(), { requireHttps: true, allowedHosts })
  return url.toString()
}

async function postForm(url, form, timeout = 60_000) {
  const response = await fetch(url, {
    method: 'POST',
    body: form,
    headers: form.getHeaders(),
    timeout,
    size: MAX_UPLOAD_BYTES,
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response
}

async function uploadToCatbox(buffer, filename) {
  const form = new FormData()
  form.append('reqtype', 'fileupload')
  form.append('fileToUpload', buffer, { filename, contentType: mime.lookup(filename) || 'application/octet-stream' })
  const response = await postForm('https://catbox.moe/user/api.php', form)
  const url = extractHttpResponseUrl(await response.text(), ['catbox.moe'])
  return { host: 'Catbox', url, expires: 'Tidak ada masa kedaluwarsa yang dinyatakan' }
}

async function uploadToLitterbox(buffer, filename) {
  const form = new FormData()
  form.append('reqtype', 'fileupload')
  form.append('time', '72h')
  form.append('fileToUpload', buffer, { filename, contentType: mime.lookup(filename) || 'application/octet-stream' })
  const response = await postForm('https://litterbox.catbox.moe/resources/internals/api.php', form)
  const url = extractHttpResponseUrl(await response.text(), ['litter.catbox.moe', 'catbox.moe'])
  return { host: 'Litterbox', url, expires: '72 jam' }
}

async function uploadToTmpFiles(buffer, filename) {
  const form = new FormData()
  form.append('file', buffer, { filename, contentType: mime.lookup(filename) || 'application/octet-stream' })
  const response = await postForm('https://tmpfiles.org/api/v1/upload', form)
  const data = await response.json()
  const rawUrl = data?.data?.url
  if (!rawUrl) throw new Error('Respons TmpFiles tidak valid.')
  const match = String(rawUrl).match(/tmpfiles\.org\/(?:dl\/)?(\d+)/i)
  if (!match) throw new Error('Tautan TmpFiles tidak valid.')
  const url = extractHttpResponseUrl(`https://tmpfiles.org/dl/${match[1]}/${encodeURIComponent(filename)}`, ['tmpfiles.org'])
  return { host: 'TmpFiles', url, expires: 'Berlaku terbatas; durasi dapat berubah sesuai kebijakan layanan' }
}

async function uploadToGofile(buffer, filename) {
  const serverResponse = await fetch('https://api.gofile.io/servers', { timeout: 15_000, size: 1024 * 1024 })
  if (!serverResponse.ok) throw new Error('Gagal mendapatkan server GoFile.')
  const serverData = await serverResponse.json()
  const server = String(serverData?.data?.servers?.[0]?.name || '')
  if (!/^[a-z0-9-]{1,40}$/i.test(server)) throw new Error('Nama server GoFile tidak valid.')

  const form = new FormData()
  form.append('file', buffer, { filename, contentType: mime.lookup(filename) || 'application/octet-stream' })
  const response = await postForm(`https://${server}.gofile.io/uploadFile`, form)
  const data = await response.json()
  const url = extractHttpResponseUrl(data?.data?.downloadPage, ['gofile.io'])
  return { host: 'GoFile', url, expires: 'Bervariasi mengikuti kebijakan layanan' }
}

async function uploadToQuax(buffer, filename) {
  const form = new FormData()
  form.append('files[]', buffer, { filename, contentType: mime.lookup(filename) || 'application/octet-stream' })
  const response = await postForm('https://qu.ax/upload.php', form)
  const data = await response.json()
  if (!data?.success || !data.files?.[0]?.url) throw new Error('Respons Qu.ax tidak valid.')
  const url = extractHttpResponseUrl(data.files[0].url, ['qu.ax'])
  return { host: 'Qu.ax', url, expires: 'Tidak diketahui' }
}

async function uploadToYpnk(buffer, filename) {
  const form = new FormData()
  form.append('files', buffer, { filename, contentType: mime.lookup(filename) || 'application/octet-stream' })
  const response = await postForm('https://cdn.ypnk.biz.id/upload', form, 90_000)
  const data = await response.json()
  const raw = data?.files?.[0]?.url
  if (!data?.success || !raw) throw new Error('Respons YPNK tidak valid.')
  const url = extractHttpResponseUrl(new URL(raw, 'https://cdn.ypnk.biz.id').toString(), ['ypnk.biz.id'])
  return { host: 'YPNK', url, expires: 'Tidak diketahui' }
}

async function uploadToPutIcu(buffer, filename) {
  const response = await fetch('https://put.icu/upload/', {
    method: 'PUT',
    body: buffer,
    headers: { Accept: 'application/json', 'Content-Type': mime.lookup(filename) || 'application/octet-stream' },
    timeout: 90_000,
    size: MAX_UPLOAD_BYTES,
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const data = await response.json()
  const url = extractHttpResponseUrl(data?.direct_url || data?.url, ['put.icu'])
  return { host: 'Put.icu', url, expires: 'Sekitar 1 hari menurut konfigurasi provider' }
}

const UPLOADERS = new Map([
  ['catbox', uploadToCatbox],
  ['litterbox', uploadToLitterbox],
  ['tmpfiles', uploadToTmpFiles],
  ['gofile', uploadToGofile],
  ['quax', uploadToQuax],
  ['ypnk', uploadToYpnk],
  ['puticu', uploadToPutIcu],
])

if (process.env.SHON_TERMAI_KEY) {
  UPLOADERS.set('termai', async (buffer, filename) => {
    const form = new FormData()
    form.append('file', buffer, { filename })
    const endpoint = new URL('https://c.termai.cc/api/upload')
    endpoint.searchParams.set('key', process.env.SHON_TERMAI_KEY)
    const response = await postForm(endpoint.toString(), form, 90_000)
    const data = await response.json()
    const url = extractHttpResponseUrl(data?.path, ['termai.cc'])
    if (!data?.status || !url) throw new Error('Respons Termai tidak valid.')
    return { host: 'Termai', url, expires: 'Tidak diketahui' }
  })
}

function getMediaContent(message) {
  const actualMessage = message?.documentWithCaptionMessage?.message || message
  const type = getContentType(actualMessage)
  if (!type || type === 'conversation' || type === 'extendedTextMessage') return null
  return { type, content: actualMessage[type] || {} }
}

async function handler(m, { sock }) {
  const hostName = String(m.args?.[0] || 'catbox').toLowerCase().replace(/[^a-z0-9]/g, '')
  if (!UPLOADERS.has(hostName)) {
    const choices = [...UPLOADERS.keys()].join(', ')
    return m.reply(`Pilih satu host: \`${m.prefix}tourl [${choices}]\`. Default: catbox.`)
  }

  const selectedHost = [...UPLOADERS.keys()].find((key) => key === hostName)
  const quoted = m.quoted?.message ? { key: m.quoted.key, message: m.quoted.message } : null
  const sourceMessage = quoted || (m.message ? { key: m.key, message: m.message } : null)
  if (!sourceMessage) return m.reply('⚠️ Reply media, atau kirim media dengan caption `.tourl [host]`.')

  const details = getMediaContent(sourceMessage.message)
  if (!details) return m.reply('⚠️ Reply/kirim gambar, video, audio, atau dokumen.')
  const declaredLength = Number(details.content?.fileLength)
  if (Number.isFinite(declaredLength) && declaredLength > MAX_UPLOAD_BYTES) {
    return m.reply('❌ Ukuran file melebihi batas 20 MiB.')
  }

  await m.reply(`ℹ️ File akan diunggah hanya ke layanan pihak ketiga *${selectedHost}*. Pastikan file boleh dibagikan ke layanan tersebut.`)
  await m.react('🕕')

  try {
    const media = await downloadMediaMessage(sourceMessage, 'buffer', {})
    assertBufferSize(media, MAX_UPLOAD_BYTES, 'Media')
    const mimetype = details.content?.mimetype || 'application/octet-stream'
    const detected = await fileTypeFromBuffer(media)
    const extension = extensionFor(mimetype, detected)
    const originalName = details.content?.fileName || `file.${extension}`
    let filename = sanitizeFilename(originalName, `file.${extension}`)
    if (!/\.[a-z0-9]{1,10}$/i.test(filename)) filename = `${filename}.${extension}`

    const uploaded = await UPLOADERS.get(selectedHost)(media, filename)
    await m.reply(
      `✅ *Upload berhasil*\n\n` +
      `Host: ${uploaded.host}\n` +
      `Retensi: ${uploaded.expires}\n` +
      `URL: ${uploaded.url}`,
    )
    await m.react('✅')
  } catch (error) {
    console.error('[TOURL] Upload gagal:', error.message)
    await m.react('❌')
    await m.reply(`❌ Upload ke ${selectedHost} gagal. Coba host lain atau ulangi nanti.\n${te(m.prefix, m.command, m.pushName)}`)
  }
}

export { pluginConfig as config, handler, UPLOADERS }
