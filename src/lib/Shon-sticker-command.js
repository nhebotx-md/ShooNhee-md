import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const STICKER_CMD_FILE = path.join(__dirname, '../../database/stickerCommands.json')
let stickerCommands = Object.create(null)

function normalizeHash(value) {
  if (Buffer.isBuffer(value) || value instanceof Uint8Array) value = Buffer.from(value).toString('base64')
  if (typeof value !== 'string') return null
  const hash = value.trim()
  return hash.length >= 32 && hash.length <= 128 && /^[A-Za-z0-9+/=_-]+$/.test(hash) ? hash : null
}

function getStickerMessage(m, quotedOnly = false) {
  if (!m) return null
  if (quotedOnly) return m.quoted?.message?.stickerMessage || null
  return m.message?.stickerMessage ||
    m.quoted?.message?.stickerMessage ||
    m.message?.documentWithCaptionMessage?.message?.stickerMessage || null
}

function getStickerHash(m) {
  const sticker = getStickerMessage(m)
  return normalizeHash(sticker?.fileSha256)
}

function getQuotedStickerHash(m) {
  const sticker = getStickerMessage(m, true)
  return normalizeHash(sticker?.fileSha256)
}

function loadStickerCommands() {
  try {
    if (!fs.existsSync(STICKER_CMD_FILE)) {
      stickerCommands = Object.create(null)
      return stickerCommands
    }
    const parsed = JSON.parse(fs.readFileSync(STICKER_CMD_FILE, 'utf8'))
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Format database mapping tidak valid')
    stickerCommands = Object.assign(Object.create(null), parsed)
  } catch (error) {
    console.error('[StickerCommand] Database mapping tidak dapat dimuat:', error.message)
    stickerCommands = Object.create(null)
  }
  return stickerCommands
}

function saveStickerCommands() {
  const tempFile = `${STICKER_CMD_FILE}.${process.pid}.${crypto.randomBytes(6).toString('hex')}.tmp`
  try {
    fs.mkdirSync(path.dirname(STICKER_CMD_FILE), { recursive: true })
    fs.writeFileSync(tempFile, JSON.stringify(stickerCommands, null, 2), { encoding: 'utf8', flag: 'wx', mode: 0o600 })
    fs.renameSync(tempFile, STICKER_CMD_FILE)
    return true
  } catch (error) {
    console.error('[StickerCommand] Mapping tidak dapat disimpan:', error.message)
    try { if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile) } catch {}
    return false
  }
}

function normalizeCommand(value) {
  if (typeof value !== 'string') return null
  const command = value.trim().toLowerCase().replace(/^\.+/, '')
  return /^[a-z0-9][a-z0-9_-]{0,63}$/.test(command) ? command : null
}

function addStickerCommand(stickerHash, command, addedBy) {
  const hash = normalizeHash(stickerHash)
  const normalizedCommand = normalizeCommand(command)
  if (!hash || !normalizedCommand) return false
  loadStickerCommands()
  const previous = stickerCommands[hash]
  stickerCommands[hash] = {
    command: normalizedCommand,
    addedBy: typeof addedBy === 'string' ? addedBy.slice(0, 128) : '',
    addedAt: Date.now(),
  }
  if (saveStickerCommands()) return true
  if (previous) stickerCommands[hash] = previous
  else delete stickerCommands[hash]
  return false
}

function deleteStickerCommand(stickerHash) {
  const hash = normalizeHash(stickerHash)
  if (!hash) return false
  loadStickerCommands()
  if (!Object.prototype.hasOwnProperty.call(stickerCommands, hash)) return false
  const previous = stickerCommands[hash]
  delete stickerCommands[hash]
  if (saveStickerCommands()) return true
  stickerCommands[hash] = previous
  return false
}

function getStickerCommand(stickerHash) {
  const hash = normalizeHash(stickerHash)
  return hash ? stickerCommands[hash] || null : null
}

function listStickerCommands() {
  return Object.entries(stickerCommands).map(([hash, data]) => ({
    hash: `${hash.slice(0, 10)}...`,
    fullHash: hash,
    command: data.command,
    addedBy: data.addedBy,
    addedAt: data.addedAt,
  }))
}

function findByCommand(commandName) {
  const command = normalizeCommand(commandName)
  if (!command) return null
  for (const [hash, data] of Object.entries(stickerCommands)) {
    if (data.command === command) return { hash, ...data }
  }
  return null
}

function checkStickerCommand(m) {
  const hash = getStickerHash(m)
  return hash ? getStickerCommand(hash)?.command || null : null
}

loadStickerCommands()

export {
  getStickerHash,
  getQuotedStickerHash,
  addStickerCommand,
  deleteStickerCommand,
  getStickerCommand,
  listStickerCommands,
  findByCommand,
  checkStickerCommand,
  loadStickerCommands,
  saveStickerCommands,
}
