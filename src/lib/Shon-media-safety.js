import { isIP } from 'node:net'

const DEFAULT_MAX_URL_LENGTH = 2048

function isBlockedHostname(hostname) {
  const host = String(hostname || '').toLowerCase().replace(/^\[|\]$/g, '')
  if (!host || host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) {
    return true
  }

  const version = isIP(host)
  if (version === 4) {
    const octets = host.split('.').map(Number)
    const [a, b] = octets
    return a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127)
  }

  if (version === 6) {
    return host === '::' || host === '::1' || host.startsWith('::ffff:') || host.startsWith('fc') || host.startsWith('fd') || host.startsWith('fe8') || host.startsWith('fe9') || host.startsWith('fea') || host.startsWith('feb')
  }

  return false
}

function hostMatches(hostname, allowedHosts) {
  const host = hostname.toLowerCase().replace(/\.$/, '')
  return allowedHosts.some((allowed) => {
    const normalized = String(allowed).toLowerCase().replace(/^\./, '').replace(/\.$/, '')
    return host === normalized || host.endsWith(`.${normalized}`)
  })
}

function parseHttpUrl(input, { allowedHosts, requireHttps = true, maxLength = DEFAULT_MAX_URL_LENGTH } = {}) {
  const raw = String(input || '').trim()
  if (!raw || raw.length > maxLength) throw new Error('URL kosong atau terlalu panjang.')

  let url
  try {
    url = new URL(raw)
  } catch {
    throw new Error('Format URL tidak valid.')
  }

  if (url.protocol !== 'https:' && (requireHttps || url.protocol !== 'http:')) {
    throw new Error('URL harus menggunakan HTTPS.')
  }
  if (url.username || url.password) throw new Error('URL dengan kredensial tidak diizinkan.')
  if (isBlockedHostname(url.hostname)) throw new Error('Host lokal atau privat tidak diizinkan.')
  if (allowedHosts && !hostMatches(url.hostname, allowedHosts)) {
    throw new Error('Domain URL tidak sesuai dengan layanan yang didukung.')
  }

  return url
}

function assertBufferSize(buffer, maxBytes, label = 'Media') {
  if (!Buffer.isBuffer(buffer) && !(buffer instanceof Uint8Array)) {
    throw new TypeError(`${label} harus berupa buffer.`)
  }
  if (buffer.byteLength === 0) throw new Error(`${label} kosong.`)
  if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0) throw new RangeError('Batas ukuran tidak valid.')
  if (buffer.byteLength > maxBytes) {
    throw new Error(`${label} melewati batas ukuran ${maxBytes} byte.`)
  }
  return buffer
}

function sanitizeFilename(value, fallback = 'media') {
  const cleaned = String(value || '')
    .normalize('NFKC')
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\.+|\.+$/g, '')
    .slice(0, 100)
  return cleaned || fallback
}

export { parseHttpUrl, assertBufferSize, sanitizeFilename, isBlockedHostname }
