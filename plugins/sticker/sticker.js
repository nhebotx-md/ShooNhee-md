import fs from 'node:fs'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { randomUUID } from 'node:crypto'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'
import config from '../../config.js'
import te from '../../src/lib/Shon-error.js'
import { assertBufferSize } from '../../src/lib/Shon-media-safety.js'

const execFileAsync = promisify(execFile)
const FFMPEG_BIN = process.env.FFMPEG_PATH || ffmpegInstaller.path || 'ffmpeg'
const MAX_INPUT_BYTES = 16 * 1024 * 1024
const MAX_OUTPUT_BYTES = 16 * 1024 * 1024
const MAX_VIDEO_SECONDS = 10
const PROCESS_TIMEOUT_MS = 30_000

const pluginConfig = {
  name: 'sticker',
  alias: ['s', 'stiker', 'stickergif'],
  category: 'sticker',
  description: 'Membuat sticker dari gambar/video dengan opsi crop/resize',
  usage: '.s [--crop] [--resize WxH] [--circle] [--rounded]',
  example: '.s --crop\n.s --resize 256x256\n.s --circle\n.s --rounded',
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  energi: 1,
  isEnabled: true,
}

function parseOptions(args) {
  const options = { crop: false, resize: null, circle: false, rounded: false, packname: null, author: null }
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--crop' || arg === '-c') options.crop = true
    else if (arg === '--resize' || arg === '-r') {
      const value = args[i + 1]
      if (!value || !/^\d{1,3}x\d{1,3}$/i.test(value)) throw new Error('Format resize harus WxH, misalnya 256x256.')
      const [width, height] = value.toLowerCase().split('x').map(Number)
      if (width < 32 || height < 32 || width > 512 || height > 512) throw new Error('Ukuran resize harus 32–512 piksel untuk setiap sisi.')
      options.resize = `${width}x${height}`
      i++
    } else if (arg === '--circle') options.circle = true
    else if (arg === '--rounded') options.rounded = true
    else if (!arg.startsWith('-') && !options.packname) options.packname = arg.slice(0, 64)
    else if (!arg.startsWith('-') && !options.author) options.author = arg.slice(0, 64)
  }
  return options
}

function runFFmpeg(args) {
  return execFileAsync(FFMPEG_BIN, args, { timeout: PROCESS_TIMEOUT_MS, maxBuffer: 4 * 1024 * 1024, windowsHide: true })
}

async function processImage(inputPath, outputPath, options) {
  const filters = []
  if (options.resize) {
    const [width, height] = options.resize.split('x').map(Number)
    filters.push(`scale=${width}:${height}:force_original_aspect_ratio=decrease`)
    filters.push(`pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=0x00000000`)
  }
  if (options.crop) {
    filters.push("crop='min(iw,ih)':'min(iw,ih)'")
    filters.push('scale=512:512')
  }
  if (options.circle) {
    filters.push('format=rgba')
    filters.push("geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='if(gt(pow(X-W/2,2)+pow(Y-H/2,2),pow(min(W,H)/2,2)),0,255)'")
  }
  if (options.rounded) {
    const radius = 50
    filters.push('format=rgba')
    filters.push(`geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='if(lt(X,${radius})*lt(Y,${radius})*gt(pow(${radius}-X,2)+pow(${radius}-Y,2),pow(${radius},2)),0,if(gt(X,W-${radius})*lt(Y,${radius})*gt(pow(X-W+${radius},2)+pow(${radius}-Y,2),pow(${radius},2)),0,if(lt(X,${radius})*gt(Y,H-${radius})*gt(pow(${radius}-X,2)+pow(Y-H+${radius},2),pow(${radius},2)),0,if(gt(X,W-${radius})*gt(Y,H-${radius})*gt(pow(X-W+${radius},2)+pow(Y-H+${radius},2),pow(${radius},2)),0,255))))'`)
  }
  const args = ['-y', '-i', inputPath]
  if (filters.length) args.push('-vf', filters.join(','))
  args.push('-frames:v', '1', outputPath)
  await runFFmpeg(args)
}

async function processVideo(inputPath, outputPath, options) {
  const filters = []
  if (options.resize) {
    const [width, height] = options.resize.split('x').map(Number)
    filters.push(`scale=${width}:${height}:force_original_aspect_ratio=decrease`)
    filters.push(`pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=black`)
  }
  if (options.crop) {
    filters.push("crop='min(iw,ih)':'min(iw,ih)'")
    filters.push('scale=512:512')
  }
  const args = ['-y', '-i', inputPath, '-t', String(MAX_VIDEO_SECONDS)]
  if (filters.length) args.push('-vf', filters.join(','))
  args.push('-c:a', 'copy', outputPath)
  await runFFmpeg(args)
}

async function getVideoDuration(filePath) {
  const { stdout } = await execFileAsync('ffprobe', [
    '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', filePath,
  ], { timeout: 10_000, maxBuffer: 256 * 1024, windowsHide: true })
  const duration = Number.parseFloat(stdout.trim())
  if (!Number.isFinite(duration) || duration < 0) throw new Error('Durasi video tidak dapat diverifikasi.')
  return duration
}

function getKnownMediaSize(m, isVideo) {
  const message = m.quoted?.message || m.message || {}
  const media = isVideo ? message.videoMessage : message.imageMessage
  const bytes = Number(media?.fileLength ?? m.quoted?.fileLength ?? m.fileLength)
  return Number.isFinite(bytes) && bytes > 0 ? bytes : null
}

async function handler(m, { sock, config: botConfig = config }) {
  const isImage = Boolean(m.isImage || m.quoted?.type === 'imageMessage' || m.quoted?.isImage)
  const isVideo = Boolean(m.isVideo || m.quoted?.type === 'videoMessage' || m.quoted?.isVideo)
  if (!isImage && !isVideo) {
    return m.reply(
      `🖼️ *sᴛɪᴄᴋᴇʀ ᴍᴀᴋᴇʀ*\n\n` +
      `Reply gambar atau video (maksimal ${MAX_VIDEO_SECONDS} detik) dengan caption \`${m.prefix}s\`.\n\n` +
      `Opsi: \`--crop\`, \`--resize WxH\` (32–512), \`--circle\`, \`--rounded\`.`,
    )
  }

  let options
  try {
    options = parseOptions(m.args || [])
  } catch (error) {
    return m.reply(`⚠️ ${error.message}`)
  }
  const knownSize = getKnownMediaSize(m, isVideo)
  if (knownSize && knownSize > MAX_INPUT_BYTES) {
    return m.reply('❌ Media terlalu besar. Batas ukuran masukan 16 MiB.')
  }

  await m.react('🕕')
  const tempDir = path.join(process.cwd(), 'temp')
  fs.mkdirSync(tempDir, { recursive: true })
  const id = randomUUID()
  const inputPath = path.join(tempDir, `sticker_in_${id}.${isVideo ? 'mp4' : 'img'}`)
  const outputPath = path.join(tempDir, `sticker_out_${id}.${isVideo ? 'mp4' : 'webp'}`)

  try {
    let buffer
    if (m.quoted?.isMedia || m.quoted) buffer = await m.quoted.download()
    else if (m.isMedia || m.download) buffer = await m.download()
    assertBufferSize(buffer, MAX_INPUT_BYTES, 'Media masukan')

    if (isVideo) {
      fs.writeFileSync(inputPath, buffer, { flag: 'wx' })
      const duration = await getVideoDuration(inputPath)
      if (duration > MAX_VIDEO_SECONDS) throw new Error(`Video terlalu panjang (${duration.toFixed(1)} detik). Batas maksimal 10 detik.`)
    }

    const packname = options.packname || botConfig.sticker?.packname || botConfig.bot?.name || 'ShooNhee-AI'
    const author = options.author || botConfig.sticker?.author || botConfig.owner?.name || 'Bot'
    const hasProcessing = options.crop || options.resize || options.circle || options.rounded

    if (hasProcessing) {
      if (!isVideo) fs.writeFileSync(inputPath, buffer, { flag: 'wx' })
      if (isImage) await processImage(inputPath, outputPath, options)
      else await processVideo(inputPath, outputPath, options)
      buffer = fs.readFileSync(outputPath)
      assertBufferSize(buffer, MAX_OUTPUT_BYTES, 'Hasil sticker')
    }

    if (isImage) await sock.sendImageAsSticker(m.chat, buffer, m, { packname, author })
    else await sock.sendVideoAsSticker(m.chat, buffer, m, { packname, author })
    await m.react('✅')
  } catch (error) {
    console.error('[Sticker] Gagal memproses:', error.message)
    await m.react('❌')
    await m.reply(`❌ ${error.message || te(m.prefix, m.command, m.pushName)}`)
  } finally {
    for (const file of [inputPath, outputPath]) {
      try { if (fs.existsSync(file)) fs.unlinkSync(file) } catch {}
    }
  }
}

export { pluginConfig as config, handler, parseOptions }
