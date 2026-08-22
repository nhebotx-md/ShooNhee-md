import config from '../../config.js'
import { getDatabase } from './Shon-database.js'
import { logger } from './Shon-logger.js'
import { callNHEfinance, isNHEfinanceConfigured } from '../finance/nhefinance-api.js'

const TRACKED_JIDS_KEY = 'nhefinanceReminderTrackedJids'
const DEFAULT_POLL_MS = 60_000

let sock = null
let interval = null
let running = false

function trackedJids() {
  const value = getDatabase().setting(TRACKED_JIDS_KEY)
  return value && typeof value === 'object' ? value : {}
}

function saveTrackedJids(value) {
  getDatabase().setting(TRACKED_JIDS_KEY, value)
}

export function registerFinanceReminderJid(jid) {
  if (!/^\d{6,20}@s\.whatsapp\.net$/.test(jid || '')) return false
  const values = trackedJids()
  values[jid] = { registeredAt: values[jid]?.registeredAt || Date.now(), checkedAt: values[jid]?.checkedAt || null }
  saveTrackedJids(values)
  return true
}

export function unregisterFinanceReminderJid(jid) {
  const values = trackedJids()
  if (!(jid in values)) return false
  delete values[jid]
  saveTrackedJids(values)
  return true
}

function localTime(timezone) {
  const fields = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone || 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  }).formatToParts(new Date())
  const find = (type) => fields.find((item) => item.type === type)?.value || '00'
  return `${find('hour')}:${find('minute')}`
}

function hasReachedDailyTime(link) {
  try {
    return localTime(link.timezone) >= (link.dailyTime || '07:00')
  } catch {
    return localTime('Asia/Jakarta') >= (link.dailyTime || '07:00')
  }
}

function reminderText(notification) {
  const severity = notification.severity === 'danger' ? 'Penting' : notification.severity === 'warning' ? 'Perhatian' : 'Info'
  return `🔔 *NHEfinance — ${severity}*\n\n*${notification.title}*\n${notification.body}\n\nBuka NHEfinance untuk melihat rincian dan mengambil tindakan.`
}

async function deliverForJid(jid) {
  const { link } = await callNHEfinance(jid, 'link.status')
  if (link.isEnabled === false || !hasReachedDailyTime(link)) return

  const { notifications } = await callNHEfinance(jid, 'notifications.pending')
  for (const notification of notifications || []) {
    await sock.sendMessage(jid, { text: reminderText(notification) })
    await callNHEfinance(jid, 'notifications.ack', { notificationId: notification.id })
    await new Promise((resolve) => setTimeout(resolve, 350))
  }
}

async function dispatchFinanceReminders() {
  if (running || !sock || !isNHEfinanceConfigured()) return
  running = true
  try {
    const values = trackedJids()
    for (const jid of Object.keys(values)) {
      try {
        await deliverForJid(jid)
        values[jid].checkedAt = Date.now()
        saveTrackedJids(values)
      } catch (error) {
        logger.warn('FinanceReminder', `Tidak dapat memeriksa ${jid.replace(/\d(?=\d{4})/g, '•')}: ${error.message}`)
      }
    }
  } finally {
    running = false
  }
}

export function initFinanceReminderDispatcher(socketInstance) {
  sock = socketInstance
  if (interval) clearInterval(interval)
  const pollMs = Math.max(Number(config.nhefinance?.reminderPollMs) || DEFAULT_POLL_MS, 30_000)
  interval = setInterval(dispatchFinanceReminders, pollMs)
  void dispatchFinanceReminders()
  logger.info('FinanceReminder', `Dispatcher pengingat NHEfinance aktif (${Math.round(pollMs / 1000)} detik).`)
}

export function stopFinanceReminderDispatcher() {
  if (interval) clearInterval(interval)
  interval = null
  sock = null
}

export { dispatchFinanceReminders, reminderText, hasReachedDailyTime }
