import chalk from 'chalk'
import gradient from 'gradient-string'
import figlet from 'figlet'
import * as timeHelper from './Shon-time.js'

/* =========================================================
 * COLOR & THEME
 * ======================================================= */
const g = gradient(["#A855F7", "#06B6D4", "#10B981"])

const k = {
  p: chalk.hex("#7C3AED"),
  s: chalk.hex("#06B6D4"),
  a: chalk.hex("#F59E0B"),
  t: chalk.white,
  d: chalk.hex("#6B7280"),
  m: chalk.hex("#4B5563"),

  ok: chalk.hex("#34D399"),
  no: chalk.hex("#F87171"),
  wn: chalk.hex("#FBBF24"),
  in: chalk.hex("#60A5FA"),

  db: chalk.hex("#525252"),
  bd: chalk.hex("#374151"),

  tg: chalk.hex("#C084FC"),
  cy: chalk.hex("#22D3EE"),
  pk: chalk.hex("#F472B6"),
  or: chalk.hex("#FB923C"),
  lm: chalk.hex("#A3E635"),
}

const theme = {
  ...k,
  primary: k.p,
  secondary: k.s,
  accent: k.a,
  text: k.t,
  dim: k.d,
  muted: k.m,
  success: k.ok,
  error: k.no,
  warning: k.wn,
  info: k.in,
  debug: k.db,
  border: k.bd,
  tag: k.tg,
}

/* =========================================================
 * SYMBOLS
 * ======================================================= */
const SYM = {
  ok: k.ok("✓"),
  no: k.no("✗"),
  wn: k.wn("!"),
  info: k.in("›"),
  dot: k.d("·"),
  arr: k.p("»"),
  bar: k.d("│"),
  cmd: k.cy("⚡"),
}

/* =========================================================
 * TIME HELPERS
 * ======================================================= */
const ts = (fmt = "HH:mm:ss") => k.d(timeHelper.formatTime(fmt))
const dt = () => k.d(timeHelper.formatTime("DD/MM/YYYY"))

const getTimestamp = () => ts()

/* =========================================================
 * FORMAT HELPERS
 * ======================================================= */
const pad = (label, n = 13) =>
  k.d(label.toLowerCase().padEnd(n))

const divider = () =>
  console.log(k.bd("─".repeat(46)))

/* =========================================================
 * LOGGER CORE
 * ======================================================= */
const logger = {
  info: (label, detail = "") =>
    console.log(`  ${SYM.info} ${pad(label)} ${k.t(detail)}`),

  success: (label, detail = "") =>
    console.log(`  ${SYM.ok} ${pad(label)} ${k.t(detail)}`),

  warn: (label, detail = "") =>
    console.log(`  ${SYM.wn} ${pad(label)} ${k.wn(detail)}`),

  error: (label, detail = "") =>
    console.log(`  ${SYM.no} ${pad(label)} ${k.no(detail)}`),

  system: (label, detail = "") =>
    console.log(`  ${SYM.dot} ${pad(label)} ${k.d(detail)}`),

  debug: (label, detail = "") =>
    console.log(`  ${SYM.dot} ${pad(label)} ${k.db(detail)}`),

  tag: (label, msg, detail = "") =>
    console.log(`  ${SYM.info} ${pad(label)} ${k.t(msg)} ${k.d(detail)}`),
}

/* =========================================================
 * MESSAGE TYPE MAP
 * ======================================================= */
const TYPE_MAP = {
  imageMessage: ["Gambar", "#34D399"],
  videoMessage: ["Video", "#60A5FA"],
  audioMessage: ["Audio", "#C084FC"],
  stickerMessage: ["Stiker", "#FBBF24"],
  documentMessage: ["Dokumen", "#F87171"],
  contactMessage: ["Kontak", "#A855F7"],
  locationMessage: ["Lokasi", "#10B981"],
  liveLocationMessage: ["Lokasi Saat Ini", "#10B981"],
  viewOnceMessageV2: ["1x Lihat", "#F59E0B"],
  extendedTextMessage: ["Pesan Extended", "#9CA3AF"],
  conversation: ["Pesan", "#9CA3AF"],
  interactiveResponseMessage: ["Menekan Tombol", "#22D3EE"],
  pollCreationMessage: ["Pesan Poll", "#FB923C"],
  reactionMessage: ["Reaksi", "#F472B6"],
}

/* =========================================================
 * TAG RESOLVERS
 * ======================================================= */
function getTypeTag(msgType, isNewsletter) {
  if (isNewsletter) return chalk.hex("#F59E0B")("CH")
  const entry = TYPE_MAP[msgType]
  return entry
    ? chalk.hex(entry[1])(entry[0])
    : k.d("Pesan Biasa")
}

function getRoleTag(info) {
  if (info.isOwner) return chalk.hex("#F87171").bold("OWNER")
  if (info.isPartner) return chalk.hex("#FB923C").bold("PARTNER")
  if (info.isPremium) return chalk.hex("#FBBF24").bold("PREMIUM")
  if (info.isAdmin) return chalk.hex("#60A5FA").bold("ADMIN")
  return k.d("MEMBER")
}

function getDeviceTag(device) {
  if (!device) return k.d("???")

  const d = device.toLowerCase()

  if (d.includes("android") || d.includes("smba")) return k.lm("Android")
  if (d.includes("iphone") || d.includes("ios")) return k.t("iPhone")
  if (d.includes("web") || d.includes("multi")) return k.cy("Web")
  if (d.includes("desktop") || d.includes("windows")) return k.in("Desktop")

  return k.d(device)
}

/* =========================================================
 * MESSAGE LOGGER
 * ======================================================= */
function logMessage(info) {
  if (typeof info === "string") {
    const [chatType, sender, message] = arguments
    info = {
      chatType,
      sender,
      message,
      pushName: sender,
      groupName: chatType === "group" ? "Unknown" : "Private",
    }
  }

  const {
    chatType,
    groupName,
    pushName,
    sender,
    message,
    messageType,
    isNewsletter,
    isOwner,
    isPremium,
    isPartner,
    isAdmin,
    device,
  } = info

  if (!message || message.trim() === "" || !sender) return

  const isGroup = chatType === "group"
  const isNL = chatType === "newsletter"

  const num = sender.replace("@s.whatsapp.net", "")
  const msg =
    message.replace(/\n/g, " ").substring(0, 70) +
    (message.length > 70 ? "..." : "")

  const time = timeHelper.formatTime("HH:mm:ss")
  const date = timeHelper.formatTime("DD/MM/YYYY")

  const typeTag = getTypeTag(messageType, isNewsletter || isNL)
  const roleTag = getRoleTag(info)
  const devTag = getDeviceTag(device)

  const chatTag = isNL
    ? chalk.hex("#F59E0B").bold("CHANNEL")
    : isGroup
    ? chalk.hex("#06B6D4").bold("GROUP")
    : chalk.hex("#F43F5E").bold("PRIVATE")

  const title = isNL
    ? groupName || "Channel"
    : isGroup
    ? groupName || "Group"
    : pushName || "User"

  const br = k.d
  const line = k.bd("─".repeat(48))

  console.log("")
  console.log(`  ${k.bd("╭" + "─".repeat(48) + "╮")}`)

  // HEADER
  console.log(
    `  ${k.bd("│")} ${chatTag} ${k.d("•")} ${chalk.white.bold(title).padEnd(34)} ${k.d(time)} ${k.bd("│")}`
  )

  console.log(`  ${k.bd("├" + "─".repeat(48) + "┤")}`)

  // META INFO (2 column feel)
  console.log(
    `  ${k.bd("│")} 👤 ${chalk.white(pushName || "User").padEnd(20)} 📱 ${k.d(devTag).padEnd(15)} ${k.bd("│")}`
  )
  console.log(
    `  ${k.bd("│")} 📞 +${chalk.green(num).padEnd(18)} 🏷 ${roleTag.padEnd(18)} ${k.bd("│")}`
  )
  console.log(
    `  ${k.bd("│")} 📅 ${k.d(date).padEnd(20)} 💬 ${br("[")}${typeTag}${br("]").padEnd(12)} ${k.bd("│")}`
  )

  console.log(`  ${k.bd("├" + "─".repeat(48) + "┤")}`)

  // MESSAGE BODY
  console.log(
    `  ${k.bd("│")} ${chalk.white(msg.padEnd(48))} ${k.bd("│")}`
  )

  console.log(`  ${k.bd("╰" + "─".repeat(48) + "╯")}`)
}

/* =========================================================
 * SYSTEM LOGS
 * ======================================================= */
function logPlugin(name, category) {
  const label = chalk.white(name)
  const cat = k.d(`[${category}]`)

  console.log(
    `  ${k.bd("│")} ${k.p("●")} ${label.padEnd(22)} ${cat}`
  )
}

function logConnection(status, info = "") {
  const w = 50

  const label =
    status === "connected"
      ? chalk.hex("#10B981").bold("CONNECTED")
      : status === "connecting"
      ? chalk.hex("#F59E0B").bold("CONNECTING")
      : chalk.hex("#EF4444").bold("DISCONNECTED")

  const icon =
    status === "connected"
      ? chalk.hex("#10B981")("●")
      : status === "connecting"
      ? chalk.hex("#F59E0B")("◐")
      : chalk.hex("#EF4444")("○")

  const br = k.bd
  const dim = k.d

  console.log("")
  console.log(`  ${br("╭" + "─".repeat(w) + "╮")}`)

  // HEADER
  console.log(
    `  ${br("│")} ${icon} ${label}${" ".repeat(w - label.length - 4)}${br("│")}`
  )

  console.log(`  ${br("├" + "─".repeat(w) + "┤")}`)

  // INFO LINE
  console.log(
    `  ${br("│")} ${dim("INFO".padEnd(8))}: ${k.t(info).padEnd(w - 13)}${br("│")}`
  )

  console.log(`  ${br("╰" + "─".repeat(w) + "╯")}`)
}

function logErrorBox(title, message) {
  const w = 58
  const br = k.bd

  console.log("")
  console.log(`  ${br("╭" + "─".repeat(w) + "╮")}`)

  // TITLE
  console.log(
    `  ${br("│")} ${chalk.red.bold("ERROR")} ${chalk.white.bold(title)}${" ".repeat(w - title.length - 8)}${br("│")}`
  )

  console.log(`  ${br("├" + "─".repeat(w) + "┤")}`)

  // MESSAGE
  console.log(
    `  ${br("│")} ${chalk.gray(message).padEnd(w - 1)}${br("│")}`
  )

  console.log(`  ${br("╰" + "─".repeat(w) + "╯")}`)
}

/* =========================================================
 * UI / BANNER
 * ======================================================= */
function printBanner(mini = false) {
  console.clear()
  if (mini) return console.log("")

  console.log("")

  const ascii = figlet.textSync("SHOONHEE", {
    font: "ANSI Shadow",
    horizontalLayout: "fitted",
  })

  // gradient title
  console.log(g(ascii))

  // subtle underline
  console.log(k.bd("  " + "─".repeat(60)))

  console.log("")
}

function printStartup(info = {}) {
  const { name, version, mode } = info

  const br = k.bd
  const dim = k.d

  const w = 52

  console.log(`  ${br("╭" + "─".repeat(w) + "╮")}`)

  // TITLE
  const title = `${chalk.white.bold(name)} ${dim("v" + version)}`
  console.log(
    `  ${br("│")} ${title.padEnd(w - 1)}${br("│")}`
  )

  // MODE LINE
  console.log(
    `  ${br("│")} ${dim("MODE".padEnd(8))}: ${k.t(mode).padEnd(w - 12)}${br("│")}`
  )

  console.log(`  ${br("╰" + "─".repeat(w) + "╯")}`)
  console.log("")
}

function createBanner(lines) {
  const maxLen = Math.max(...lines.map((l) => l.length))
  const padded = lines.map((l) => l.padEnd(maxLen))

  const br = k.bd
  const dim = k.d

  let res = br(`╭${"─".repeat(maxLen + 4)}╮`) + "\n"

  // HEADER STRIP (biar beda dari box biasa)
  res += br("│") + " " + dim("INFO".padEnd(maxLen + 2)) + br("│") + "\n"
  res += br(`├${"─".repeat(maxLen + 4)}┤`) + "\n"

  for (const line of padded) {
    res += br("│") + " " + chalk.white(line) + "  " + br("│") + "\n"
  }

  res += br(`╰${"─".repeat(maxLen + 4)}╯`)
  return res
}

/* =========================================================
 * LEGACY COLOR WRAPPER (NO CHANGE)
 * ======================================================= */
const CODES = {
  reset: "", bold: "", dim: "", italic: "", underline: "",
  green: "", purple: "", white: "", gray: "", phantom: "",
  lime: "", silver: "", red: "", yellow: "", blue: "",
  cyan: "", magenta: "", bgBlack: "", bgGray: "",
}

const c = {
  green: chalk.green,
  purple: chalk.hex("#9B30FF"),
  white: chalk.white,
  gray: chalk.gray,
  bold: chalk.bold,
  dim: chalk.dim,

  greenBold: (v) => chalk.green.bold(v),
  purpleBold: (v) => chalk.hex("#9B30FF").bold(v),
  whiteBold: (v) => chalk.white.bold(v),
  grayDim: (v) => chalk.gray.dim(v),

  red: chalk.red,
  yellow: chalk.yellow,
  cyan: chalk.cyan,
  blue: chalk.blue,
  magenta: chalk.magenta,
}

/* =========================================================
 * EXPORT
 * ======================================================= */
export {
  c,
  CODES,
  logger,
  logMessage,
  logPlugin,
  logConnection,
  logErrorBox,
  printBanner,
  printStartup,
  createBanner,
  getTimestamp,
  divider,
  theme,
  chalk,
  gradient,
}