import { createHmac, randomBytes } from 'node:crypto'
import config from '../../config.js'

export class NHEfinanceApiError extends Error {
  constructor(message, { status = 500, code = 'NHEFINANCE_API_ERROR' } = {}) {
    super(message)
    this.name = 'NHEfinanceApiError'
    this.status = status
    this.code = code
  }
}

function integrationConfig() {
  const settings = config.nhefinance || {}
  if (!settings.enabled) throw new NHEfinanceApiError('Integrasi NHEfinance sedang dinonaktifkan oleh pengelola bot.', { status: 503, code: 'DISABLED' })
  if (!settings.baseUrl || !settings.serviceSecret) throw new NHEfinanceApiError('Integrasi NHEfinance belum dikonfigurasi aman oleh pengelola bot.', { status: 503, code: 'NOT_CONFIGURED' })
  return settings
}

export function isNHEfinanceConfigured() {
  const settings = config.nhefinance || {}
  return Boolean(settings.enabled && settings.baseUrl && settings.serviceSecret)
}

export async function callNHEfinance(jid, action, payload = {}) {
  const settings = integrationConfig()
  const requestId = randomBytes(20).toString('hex')
  const body = JSON.stringify({ action, jid, requestId, payload })
  const timestamp = String(Date.now())
  const signature = createHmac('sha256', settings.serviceSecret).update(`${timestamp}.${body}`, 'utf8').digest('hex')
  let response
  try {
    response = await fetch(`${settings.baseUrl.replace(/\/$/, '')}/api/bot/whatsapp`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-nhefinance-timestamp': timestamp,
        'x-nhefinance-signature': signature
      },
      body,
      signal: AbortSignal.timeout(15_000)
    })
  } catch {
    throw new NHEfinanceApiError('NHEfinance tidak dapat dihubungi. Coba ulangi beberapa saat lagi.', { status: 503, code: 'UNREACHABLE' })
  }

  let data
  try {
    data = await response.json()
  } catch {
    throw new NHEfinanceApiError('NHEfinance mengirim respons yang tidak valid.', { status: 502, code: 'INVALID_RESPONSE' })
  }
  if (!response.ok || !data?.ok) throw new NHEfinanceApiError(data?.error || 'Permintaan ke NHEfinance gagal.', { status: response.status, code: data?.code || 'REQUEST_REJECTED' })
  return data
}

export function financeIntegrationHelp() {
  return `Tautkan akun NHEfinance terlebih dahulu dengan *.nhefinance link*. Setelah menerima kode, buka ${config.nhefinance?.linkPageUrl || 'halaman Bot WhatsApp di NHEfinance'} saat login, masukkan kode pada halaman *Bot WhatsApp*, lalu tekan *Hubungkan bot ke akun ini*.`
}

export function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(amount) || 0)
}
