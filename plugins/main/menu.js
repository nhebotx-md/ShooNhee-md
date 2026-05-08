import config from "../../config.js";
import {
  formatUptime,
  getTimeGreeting,
} from "../../src/lib/Shon-formatter.js";
import {
  getCommandsByCategory,
  getCategories,
} from "../../src/lib/Shon-plugins.js";
import { getDatabase } from "../../src/lib/Shon-database.js";

import fs from "fs";
import path from "path";
import axios from "axios";
import { generateWAMessageFromContent, proto } from "ShooNhee";

/* ─────────────────────────────────────────────────────────────────────────────
 *  LAZY MODULE LOADER
 *  Sharp is loaded on‑demand to keep startup time minimal.
 * ───────────────────────────────────────────────────────────────────────────── */
let _sharp = null;

async function getSharp() {
  if (!_sharp) _sharp = (await import("sharp")).default;
  return _sharp;
}

/* ═══════════════════════════════════════════════════════════════════════════════
 *  SECTION 1 — PLUGIN CONFIGURATION
 * ═══════════════════════════════════════════════════════════════════════════════ */
const pluginConfig = {
  name: "menu",
  alias: ["help", "bantuan", "commands", "m"],
  category: "main",
  description: "Menampilkan menu utama bot",
  usage: ".menu",
  example: ".menu",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  energi: 0,
  isEnabled: true,
};

/* ═══════════════════════════════════════════════════════════════════════════════
 *  SECTION 2 — CATEGORY VISUAL ASSETS
 *  Premium emoji mapping for every command category.
 * ═══════════════════════════════════════════════════════════════════════════════ */
const CATEGORY_EMOJIS = {
  owner: "👑",
  main: "🏠",
  utility: "🔧",
  fun: "🎮",
  group: "👥",
  download: "📥",
  search: "🔍",
  tools: "🛠️",
  sticker: "🖼️",
  ai: "🤖",
  game: "🎯",
  media: "🎬",
  info: "ℹ️",
  religi: "☪️",
  panel: "🖥️",
  user: "📊",
  linode: "☁️",
  random: "🎲",
  canvas: "🎨",
  vps: "🌊",
};

/* ═══════════════════════════════════════════════════════════════════════════════
 *  SECTION 3 — UNICODE TYPOGRAPHY ENGINE
 *  Convert plain text into premium Unicode variants for WhatsApp rendering.
 * ═══════════════════════════════════════════════════════════════════════════════ */

/**
 * Convert text to small‑caps Unicode glyphs.
 * @param {string} text
 * @returns {string}
 */
function toSmallCaps(text) {
  const smallCapsMap = {
    a: "ᴀ", b: "ʙ", c: "ᴄ", d: "ᴅ", e: "ᴇ",
    f: "ꜰ", g: "ɢ", h: "ʜ", i: "ɪ", j: "ᴊ",
    k: "ᴋ", l: "ʟ", m: "ᴍ", n: "ɴ", o: "ᴏ",
    p: "ᴘ", q: "ǫ", r: "ʀ", s: "s", t: "ᴛ",
    u: "ᴜ", v: "ᴠ", w: "ᴡ", x: "x", y: "ʏ",
    z: "ᴢ",
  };
  return text
    .toLowerCase()
    .split("")
    .map((char) => smallCapsMap[char] || char)
    .join("");
}

/**
 * Convert text to bold‑uppercase sans‑serif Unicode glyphs.
 * @param {string} text
 * @returns {string}
 */
const toMonoUpperBold = (text) => {
  const boldUpperMap = {
    A: "𝗔", B: "𝗕", C: "𝗖", D: "𝗗", E: "𝗘",
    F: "𝗙", G: "𝗚", H: "𝗛", I: "𝗜", J: "𝗝",
    K: "𝗞", L: "𝗟", M: "𝗠", N: "𝗡", O: "𝗢",
    P: "𝗣", Q: "𝗤", R: "𝗥", S: "𝗦", T: "𝗧",
    U: "𝗨", V: "𝗩", W: "𝗪", X: "𝗫", Y: "𝗬",
    Z: "𝗭",
  };
  return text
    .toUpperCase()
    .split("")
    .map((char) => boldUpperMap[char] || char)
    .join("");
};

/* ═══════════════════════════════════════════════════════════════════════════════
 *  SECTION 4 — VISUAL STYLE SYSTEM
 *  Consistent premium separators, symbols & whitespace for menu rendering.
 * ═══════════════════════════════════════════════════════════════════════════════ */

/** Premium border characters for WhatsApp box‑drawing. */
const STYLE = Object.freeze({
  CORNER_TL: "╭",
  CORNER_TR: "╮",
  CORNER_BL: "╰",
  CORNER_BR: "╯",
  EDGE_H: "─",
  EDGE_V: "│",
  BRANCH_R: "├",
  BRANCH_L: "┤",
  END_H: "┈",
  END_V: "┊",
  BULLET: "◦",
  DIAMOND: "◈",
  DIAMOND_O: "◇",
  STAR: "✦",
  STAR_O: "✧",
  ARROW_R: "➤",
  ARROW_L: "◄",
  PIPE: "┃",
  DASH: "━",
  DOT: "•",
  CROSS: "✛",
  SPARKLE: "✶",
  HEXAGON: "⬡",
  HEXAGON_F: "⬢",
  CIRCLE: "◉",
  CIRCLE_O: "◎",
  ARROW_S: "➔",
  ARROW_D: "➣",
  TRI_R: "▸",
  TRI_L: "◂",
  CHEVRON_R: "›",
  CHEVRON_L: "‹",
  BAR: "▕",
  BAR_L: "▏",
  BLOCK: "█",
  BLOCK_S: "▓",
  BLOCK_F: "░",
});

/** Pick a random element from an array (seeded once per render). */
const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

/** Whatsapp‑safe premium symbol pool.  */
const PREMIUM_SYMBOLS = [
  "⭔", "⌬", "〆", "»", "✧", "✪", "✹", "✦", "♢", "✯",
  "❖", "◆", "★", "⊗", "⊕", "⊙", "⌖", "⌕", "⌘", "⌙",
  "⌝", "⌞", "⎈", "⎯", "⎱", "⟊", "⟐", "⟫", "⟁", "⬣",
];

/* ═══════════════════════════════════════════════════════════════════════════════
 *  SECTION 5 — CATEGORY SORTING ENGINE
 *  Returns categories filtered by bot mode, ordered by priority list.
 * ═══════════════════════════════════════════════════════════════════════════════ */

/** Canonical display order for menu categories. */
const CATEGORY_PRIORITY = [
  "owner", "main", "utility", "tools", "fun",
  "game", "download", "search", "sticker", "media",
  "ai", "group", "religi", "info", "cek",
  "economy", "user", "canvas", "random", "premium",
  "ephoto", "jpm", "pushkontak", "panel", "store",
];

/** Default mode filters when botmode.js plugin is absent. */
const DEFAULT_MODE_ALLOWED = {
  md: null,
  cpanel: ["main", "group", "sticker", "owner", "tools", "panel"],
  store: ["main", "group", "sticker", "owner", "store"],
  pushkontak: ["main", "group", "sticker", "owner", "pushkontak"],
};

const DEFAULT_MODE_EXCLUDED = {
  md: ["panel", "pushkontak", "store"],
  cpanel: null,
  store: null,
  pushkontak: null,
};

/**
 * Build a sorted, filtered category list for the current user & bot mode.
 * @param {Object} m            — message context
 * @param {string} botMode      — current mode (md | cpanel | store | pushkontak | …)
 * @returns {{sorted: Array, totalCmds: number, commandsByCategory: Object}}
 */
function getSortedCategories(m, botMode) {
  const categories = getCategories();
  const commandsByCategory = getCommandsByCategory();

  let modeAllowedMap = { ...DEFAULT_MODE_ALLOWED };
  let modeExcludeMap = { ...DEFAULT_MODE_EXCLUDED };

  const allowedCategories = modeAllowedMap[botMode];
  const excludedCategories = modeExcludeMap[botMode] || [];

  const sortedCats = [...categories].sort((a, b) => {
    const indexA = CATEGORY_PRIORITY.indexOf(a);
    const indexB = CATEGORY_PRIORITY.indexOf(b);
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });

  const result = [];
  let totalCmds = 0;

  for (const category of sortedCats) {
    if (category === "owner" && !m.isOwner) continue;
    if (allowedCategories && !allowedCategories.includes(category.toLowerCase())) continue;
    if (excludedCategories && excludedCategories.includes(category.toLowerCase())) continue;

    const cmds = commandsByCategory[category] || [];
    if (cmds.length === 0) continue;

    const emoji = CATEGORY_EMOJIS[category] || "📁";
    result.push({ cat: category, cmds, emoji });
  }

  for (const category of categories) {
    totalCmds += (commandsByCategory[category] || []).length;
  }

  return { sorted: result, totalCmds, commandsByCategory };
}

/* ═══════════════════════════════════════════════════════════════════════════════
 *  SECTION 6 — TIME FORMATTER HELPERS
 * ═══════════════════════════════════════════════════════════════════════════════ */

async function formatTime(date) {
  const timeHelper = await import("../../src/lib/Shon-time.js");
  return timeHelper.formatTime("HH:mm");
}

async function formatDateShort(date) {
  const timeHelper = await import("../../src/lib/Shon-time.js");
  return timeHelper.formatFull("dddd, DD MMMM YYYY");
}

/* ═══════════════════════════════════════════════════════════════════════════════
 *  SECTION 7 — MENU TEXT BUILDER
 *  Constructs the premium text block used by every menu variant.
 * ═══════════════════════════════════════════════════════════════════════════════ */

/**
 * Compose the complete menu text payload.
 * @param {Object}   m
 * @param {Object}   botConfig
 * @param {Object}   db
 * @param {number}   uptime
 * @param {string}   botMode
 * @returns {Promise<string>}
 */
async function buildMenuText(m, botConfig, db, uptime, botMode = "md") {
  const prefix = botConfig.command?.prefix || ".";
  const user = db.getUser(m.sender);

  const timeHelper = await import("../../src/lib/Shon-time.js");
  const timeStr = timeHelper.formatTime("HH:mm");
  const dateStr = timeHelper.formatFull("dddd, DD MMMM YYYY");

  const categories = getCategories();
  const commandsByCategory = getCommandsByCategory();

  let totalCommands = 0;
  for (const category of categories) {
    totalCommands += (commandsByCategory[category] || []).length;
  }

  const { getCaseCount, getCasesByCategory } =
    await import("../../case/ShooNhee.js");
  const totalCases = getCaseCount();
  const casesByCategory = getCasesByCategory();
  const totalFeatures = totalCommands + totalCases;

  /* ── user role resolution ── */
  let userRole = "User";
  let roleEmoji = "👤";
  if (m.isOwner) {
    userRole = "Owner";
    roleEmoji = "👑";
  } else if (m.isPremium) {
    userRole = "Premium";
    roleEmoji = "💎";
  }

  const greeting = getTimeGreeting();
  const uptimeFormatted = formatUptime(uptime);
  const totalUsers = db.getUserCount();

  const greetEmoji = greeting.includes("pagi")
    ? "🌅"
    : greeting.includes("siang")
      ? "☀️"
      : greeting.includes("sore")
        ? "🌇"
        : "🌙";

  const selectedSymbol = pickRandom(PREMIUM_SYMBOLS);

  /* ═══════════════════════════════════════════════════════════════════════════
   *  HEADER — Greeting & Introduction
   * ═══════════════════════════════════════════════════════════════════════════ */
  let menuText =
    `Hai *@${m.pushName || "User"}* 🪸\n\n` +
    `Aku ${botConfig.bot?.name || "ShooNhee-AI"}, bot WhatsApp yang siap bantu kamu.\n\n` +
    `Kamu bisa pakai aku buat cari info, ambil data, atau bantu hal-hal ` +
    `sederhana langsung lewat WhatsApp — praktis tanpa ribet.`;

  /* ═══════════════════════════════════════════════════════════════════════════
   *  PANEL — Bot Information
   * ═══════════════════════════════════════════════════════════════════════════ */
  menuText +=
    `\n\n${STYLE.CORNER_TL}${STYLE.EDGE_H}〔 🤖 *ʙᴏᴛ ɪɴꜰᴏ* 〕\n` +
    `*${STYLE.EDGE_V}* ${greetEmoji} ɴᴀᴍᴀ      : *${botConfig.bot?.name || "ShooNhee-AI"}*\n` +
    `*${STYLE.EDGE_V}* 🔑 ᴠᴇʀsɪ    : *v${botConfig.bot?.version || "1.2.0"}*\n` +
    `*${STYLE.EDGE_V}* ⚙️ ᴍᴏᴅᴇ     : *${(botConfig.mode || "public").toUpperCase()}*\n` +
    `*${STYLE.EDGE_V}* 🧶 ᴘʀᴇꜰɪx   : *[ ${prefix} ]*\n` +
    `*${STYLE.EDGE_V}* ⏱ ᴜᴘᴛɪᴍᴇ  : *${uptimeFormatted}*\n` +
    `*${STYLE.EDGE_V}* 👥 ᴛᴏᴛᴀʟ   : *${totalUsers} Users*\n` +
    `*${STYLE.EDGE_V}* 🏷 ɢʀᴏᴜᴘ    : *${botMode.toUpperCase()}*\n` +
    `*${STYLE.EDGE_V}* 👑 ᴏᴡɴᴇʀ   : *${botConfig.owner?.name || "ShooNhee-AI"}*\n` +
    `${STYLE.CORNER_BL}${STYLE.EDGE_H}${STYLE.EDGE_H}${STYLE.EDGE_H}${STYLE.EDGE_H}` +
    `${STYLE.EDGE_H}${STYLE.EDGE_H}${STYLE.EDGE_H}${STYLE.EDGE_H}${STYLE.EDGE_H}` +
    `${STYLE.EDGE_H}${STYLE.EDGE_H}${STYLE.EDGE_H}${STYLE.EDGE_H}${STYLE.EDGE_H}` +
    `${STYLE.EDGE_H}${STYLE.EDGE_H}${selectedSymbol}\n\n`;

  /* ═══════════════════════════════════════════════════════════════════════════
   *  PANEL — User Information
   * ═══════════════════════════════════════════════════════════════════════════ */
  menuText +=
    `${STYLE.CORNER_TL}${STYLE.EDGE_H}〔 👤 *ᴜsᴇʀ ɪɴꜰᴏ* 〕\n` +
    `*${STYLE.EDGE_V}* 🙋 ɴᴀᴍᴀ     : *${m.pushName}*\n` +
    `*${STYLE.EDGE_V}* 🎭 ʀᴏʟᴇ     : *${roleEmoji} ${userRole}*\n` +
    `*${STYLE.EDGE_V}* 🎟 ᴇɴᴇʀɢɪ  : *${m.isOwner || m.isPremium ? "∞ Unlimited" : (user?.energi ?? 25)}*\n` +
    `*${STYLE.EDGE_V}* ⚡ ʟᴇᴠᴇʟ   : *${user?.rpg?.level || user?.level || 1}*\n` +
    `*${STYLE.EDGE_V}* ✨ ᴇxᴘ      : *${(user?.exp ?? 0).toLocaleString()}*\n` +
    `*${STYLE.EDGE_V}* 💰 ᴋᴏɪɴ    : *${(user?.koin ?? 0).toLocaleString()}*\n`;

  const rpg = user?.rpg || {};
  if (rpg.health !== undefined) {
    menuText +=
      `*${STYLE.EDGE_V}* ❤️ ʜᴘ       : *${rpg.health}/${rpg.maxHealth || rpg.health}*\n` +
      `*${STYLE.EDGE_V}* 🔮 ᴍᴀɴᴀ    : *${rpg.mana}/${rpg.maxMana || rpg.mana}*\n` +
      `*${STYLE.EDGE_V}* 🏃 sᴛᴀᴍɪɴᴀ : *${rpg.stamina}/${rpg.maxStamina || rpg.stamina}*\n`;
  }

  const inventory = user?.inventory || {};
  const inventoryCount = Object.values(inventory).reduce(
    (sum, val) => sum + (typeof val === "number" ? val : 0),
    0,
  );
  if (inventoryCount > 0) {
    menuText += `*${STYLE.EDGE_V}* 🎒 ɪɴᴠᴇɴᴛᴏʀʏ : *${inventoryCount} items*\n`;
  }

  menuText +=
    `*${STYLE.EDGE_V}* 🕒 ᴡᴀᴋᴛᴜ   : *${timeStr} WIB*\n` +
    `*${STYLE.EDGE_V}* 📅 ᴛᴀɴɢɢᴀʟ : *${dateStr}*\n` +
    `${STYLE.CORNER_BL}${STYLE.EDGE_H}${STYLE.EDGE_H}${STYLE.EDGE_H}${STYLE.EDGE_H}` +
    `${STYLE.EDGE_H}${STYLE.EDGE_H}${STYLE.EDGE_H}${STYLE.EDGE_H}${STYLE.EDGE_H}` +
    `${STYLE.EDGE_H}${STYLE.EDGE_H}${STYLE.EDGE_H}${STYLE.EDGE_H}${STYLE.EDGE_H}` +
    `${STYLE.EDGE_H}${STYLE.EDGE_H}${selectedSymbol}\n\n`;

  /* ═══════════════════════════════════════════════════════════════════════════
   *  CATEGORY LIST — Filtered & Sorted
   * ═══════════════════════════════════════════════════════════════════════════ */
  const sortedCategories = [...categories].sort((a, b) => {
    const indexA = CATEGORY_PRIORITY.indexOf(a);
    const indexB = CATEGORY_PRIORITY.indexOf(b);
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });

  /* ── dynamic mode maps (overridden if botmode.js exists) ── */
  let modeAllowedMap = { ...DEFAULT_MODE_ALLOWED };
  let modeExcludeMap = { ...DEFAULT_MODE_EXCLUDED };

  try {
    const botmodePlugin = await import("../group/botmode.js");
    if (botmodePlugin?.MODES) {
      modeAllowedMap = {};
      modeExcludeMap = {};
      for (const [key, value] of Object.entries(botmodePlugin.MODES)) {
        modeAllowedMap[key] = value.allowedCategories;
        modeExcludeMap[key] = value.excludeCategories;
      }
    }
  } catch (_e) { /* plugin not installed — safe to ignore */ }

  const allowedCategories = modeAllowedMap[botMode];
  const excludedCategories = modeExcludeMap[botMode] || [];

  menuText += `📂 *ᴅᴀꜰᴛᴀʀ ᴍᴇɴᴜ*\n`;

  for (const category of sortedCategories) {
    if (category === "owner" && !m.isOwner) continue;
    if (
      allowedCategories &&
      !allowedCategories.includes(category.toLowerCase())
    )
      continue;
    if (
      excludedCategories &&
      excludedCategories.includes(category.toLowerCase())
    )
      continue;

    const pluginCmds = commandsByCategory[category] || [];
    const caseCmds = casesByCategory[category] || [];
    const totalCmds = pluginCmds.length + caseCmds.length;
    if (totalCmds === 0) continue;

    const emoji = CATEGORY_EMOJIS[category] || "📁";

    menuText +=
      `- \`${selectedSymbol}\` ${prefix}${toSmallCaps(`menucat ${category}`)} ${emoji}\n`;
  }

  return menuText;
}


/* ═══════════════════════════════════════════════════════════════════════════════
 *  SECTION 8 — MESSAGE CONTEXT BUILDERS
 *  Reusable context-info & quoted-message factories for every variant.
 * ═══════════════════════════════════════════════════════════════════════════════ */

/**
 * Build the contextInfo object attached to outgoing messages.
 * @param {Object}  botConfig
 * @param {Object}  m
 * @param {Buffer}  thumbBuffer
 * @param {boolean} renderLargerThumbnail
 * @returns {Object}
 */
function getContextInfo(
  botConfig,
  m,
  thumbBuffer,
  renderLargerThumbnail = false,
) {
  const saluranId = botConfig.saluran?.id || "120363208449943317@newsletter";
  const saluranName =
    botConfig.saluran?.name || botConfig.bot?.name || "ShooNhee-AI";
  const saluranLink = botConfig.saluran?.link || "";

  const ctx = {
    mentionedJid: [m.sender],
    forwardingScore: 9,
    isForwarded: true,
    externalAdReply: {
      title: botConfig.bot?.name || "ShooNhee-AI",
      body: `BOT WHATSAPP MULTI DEVICE`,
      sourceUrl: saluranLink,
      previewType: "VIDEO",
      showAdAttribution: false,
      renderLargerThumbnail,
    },
  };

  if (thumbBuffer) ctx.externalAdReply.thumbnail = thumbBuffer;
  return ctx;
}

/**
 * Build a verified quoted message skeleton.
 * @param {Object} botConfig
 * @returns {Object}
 */
function getVerifiedQuoted(botConfig) {
  return {
    key: {
      participant: `13135550002@s.whatsapp.net`,
      remoteJid: `13135550002@s.whatsapp.net`,
    },
    message: {
      contactMessage: {
        displayName: `🪸 ${botConfig.bot?.name}`,
        vcard:
          `BEGIN:VCARD\n` +
          `VERSION:3.0\n` +
          `N:XL;ttname,;;;\n` +
          `FN:ttname\n` +
          `item1.TEL;waid=13135550002:+1 (313) 555-0002\n` +
          `item1.X-ABLabel:Ponsel\n` +
          `END:VCARD`,
        sendEphemeral: true,
      },
    },
  };
}

/* ═══════════════════════════════════════════════════════════════════════════════
 *  SECTION 9 — FALLBACK SENDER
 *  Graceful degradation when a variant fails to render.
 * ═══════════════════════════════════════════════════════════════════════════════ */

/**
 * Send a fallback message when the primary variant errors out.
 * @param {Object}   m
 * @param {Object}   sock
 * @param {string}   text
 * @param {Buffer}   imageBuffer
 * @param {Buffer}   thumbBuffer
 * @param {Object}   botConfig
 * @param {string}   errorName   — variant identifier for logging
 */
async function sendFallback(
  m,
  sock,
  text,
  imageBuffer,
  thumbBuffer,
  botConfig,
  errorName,
) {
  if (errorName) console.error(`[Menu Error] ${errorName}`);

  const fallbackMsg = {
    contextInfo: getContextInfo(botConfig, m, thumbBuffer),
  };

  let fallbackText = text;

  if (errorName === "V5") {
    const { sorted } = getSortedCategories(m, "md");
    let categoryText = `📋 *ᴋᴀᴛᴇɢᴏʀɪ ᴍᴇɴᴜ*\n\n`;
    for (const { cat, cmds, emoji } of sorted) {
      categoryText +=
        `> ${emoji} \`${botConfig.command?.prefix || "."}menucat ${cat}\` ` +
        `- ${toMonoUpperBold(cat)} (${cmds.length})\n`;
    }
    categoryText += `\n_Ketik perintah kategori untuk melihat command_`;
    fallbackText = text + "\n\n" + categoryText;
  }

  if (imageBuffer) {
    fallbackMsg.image = imageBuffer;
    fallbackMsg.caption = fallbackText;
  } else {
    fallbackMsg.text = fallbackText;
  }

  await sock.sendMessage(m.chat, fallbackMsg, {
    quoted: getVerifiedQuoted(botConfig),
  });
}

/* ═══════════════════════════════════════════════════════════════════════════════
 *  SECTION 10 — ASSET LOADER
 *  Centralised disk I/O for menu media assets.
 * ═══════════════════════════════════════════════════════════════════════════════ */

/**
 * Resolve and read an asset file from disk.
 * @param {string} basePath
 * @param {string} assetDir
 * @param {string} fileName
 * @returns {Buffer|null}
 */
function loadAsset(basePath, assetDir, fileName) {
  const fullPath = path.join(basePath, assetDir, fileName);
  return fs.existsSync(fullPath) ? fs.readFileSync(fullPath) : null;
}

/**
 * Read menu media buffers in one shot.
 * @returns {{imageBuffer: Buffer|null, thumbBuffer: Buffer|null, videoBuffer: Buffer|null}}
 */
function loadMenuAssets() {
  const cwd = process.cwd();
  return {
    imageBuffer: loadAsset(cwd, "assets/images", "ShooNhee.jpg"),
    thumbBuffer: loadAsset(cwd, "assets/images", "ShooNhee2.jpg"),
    videoBuffer: loadAsset(cwd, "assets/video", "ShooNhee.mp3"),
  };
}

/* ═══════════════════════════════════════════════════════════════════════════════
 *  SECTION 11 — MAIN HANDLER
 *  Orchestrates 15 menu display variants + audio appendix.
 * ═══════════════════════════════════════════════════════════════════════════════ */

async function handler(m, { sock, config: botConfig, db, uptime }) {
  /* ── configuration lookup ── */
  const savedVariant = db.setting("menuVariant");
  const menuVariant = savedVariant || botConfig.ui?.menuVariant || 2;
  const groupData = m.isGroup ? db.getGroup(m.chat) || {} : {};
  const botMode = groupData.botMode || "md";

  /* ── shared text & data ── */
  const text = await buildMenuText(m, botConfig, db, uptime, botMode);
  const { imageBuffer, thumbBuffer, videoBuffer } = loadMenuAssets();

  const prefix = botConfig.command?.prefix || ".";
  const saluranId = botConfig.saluran?.id || "120363208449943317@newsletter";
  const saluranName =
    botConfig.saluran?.name || botConfig.bot?.name || "ShooNhee-AI";
  const saluranLink =
    botConfig.saluran?.link ||
    "https://whatsapp.com/channel/0029VbB37bgBfxoAmAlsgE0t";

  const {
    sorted: menuSorted,
    totalCmds,
    commandsByCategory,
  } = getSortedCategories(m, botMode);

  const greeting = getTimeGreeting();
  const uptimeFormatted = formatUptime(uptime);

  /* ═══════════════════════════════════════════════════════════════════════════
   *  VARIANT ROUTER
   * ═══════════════════════════════════════════════════════════════════════════ */
  try {
    switch (menuVariant) {
      /* ─────────────────────────── VARIANT 1 — Plain Image ─────────────────────────── */
      case 1:
        if (imageBuffer) {
          await sock.sendMessage(m.chat, { image: imageBuffer, caption: text });
        } else {
          await m.reply(text);
        }
        break;

      /* ─────────────────────────── VARIANT 2 — Context Image ─────────────────────────── */
      case 2: {
        const msgV2 = {
          contextInfo: getContextInfo(botConfig, m, thumbBuffer),
        };
        if (imageBuffer) {
          msgV2.image = imageBuffer;
          msgV2.caption = text;
        } else {
          msgV2.text = text;
        }
        await sock.sendMessage(m.chat, msgV2, {
          quoted: getVerifiedQuoted(botConfig),
        });
        break;
      }

      /* ─────────────────────────── VARIANT 3 — Document Mode ─────────────────────────── */
      case 3: {
        let resizedThumb = thumbBuffer;
        if (thumbBuffer) {
          try {
            resizedThumb = await (await getSharp())(thumbBuffer)
              .resize(300, 300, { fit: "cover" })
              .jpeg({ quality: 80 })
              .toBuffer();
          } catch (_e) {
            resizedThumb = thumbBuffer;
          }
        }

        let contextThumb = thumbBuffer;
        try {
          const shooNheePath = path.join(
            process.cwd(),
            "assets",
            "images",
            "ShooNhee.jpg",
          );
          if (fs.existsSync(shooNheePath)) {
            contextThumb = fs.readFileSync(shooNheePath);
          }
        } catch (_e) {
          /* keep default */
        }

        await sock.sendMessage(
          m.chat,
          {
            document: imageBuffer || Buffer.from(""),
            mimetype: "image/png",
            fileLength: 999999999999,
            fileSize: 999999999999,
            fileName: `ɴᴏ ᴘᴀɪɴ ɴᴏ ɢᴀɪɴ`,
            caption: text,
            jpegThumbnail: resizedThumb,
            contextInfo: getContextInfo(botConfig, m, contextThumb, true),
          },
          { quoted: getVerifiedQuoted(botConfig) },
        );
        break;
      }

      /* ─────────────────────────── VARIANT 4 — GIF Video ─────────────────────────── */
      case 4:
        if (videoBuffer) {
          await sock.sendMessage(
            m.chat,
            {
              video: videoBuffer,
              caption: text,
              gifPlayback: true,
              contextInfo: getContextInfo(botConfig, m, thumbBuffer),
            },
            { quoted: getVerifiedQuoted(botConfig) },
          );
        } else {
          const fallback = {
            contextInfo: getContextInfo(botConfig, m, thumbBuffer),
          };
          if (imageBuffer) {
            fallback.image = imageBuffer;
            fallback.caption = text;
          } else {
            fallback.text = text;
          }
          await sock.sendMessage(m.chat, fallback, {
            quoted: getVerifiedQuoted(botConfig),
          });
        }
        break;

      /* ─────────────────────────── VARIANT 5 — Interactive Single Select ─────────────────────────── */
      case 5: {
        const categoryRows = menuSorted.map(({ cat, cmds, emoji }) => ({
          title: `${emoji} ${toMonoUpperBold(cat)}`,
          id: `${prefix}menucat ${cat}`,
          description: `${cmds.length} commands`,
        }));

        let headerText =
          `*@${m.pushName || "User"}* 🪸\n\n` +
          `Aku ${botConfig.bot?.name || "ShooNhee-AI"}, bot WhatsApp yang siap bantu kamu.\n\n` +
          `Kamu bisa pakai aku buat cari info, ambil data, atau bantu hal-hal ` +
          `sederhana langsung lewat WhatsApp — praktis tanpa ribet.\n\n`;

        headerText +=
          `${STYLE.CORNER_TL}${STYLE.EDGE_H}〔 🤖 *ʙᴏᴛ ɪɴꜰᴏ* 〕\n` +
          `*${STYLE.EDGE_V}* \`${STYLE.BULLET}\` ɴᴀᴍᴀ: *${botConfig.bot?.name || "ShooNhee-AI"}*\n` +
          `*${STYLE.EDGE_V}* \`${STYLE.BULLET}\` ᴠᴇʀsɪ: *v${botConfig.bot?.version || "1.2.0"}*\n` +
          `*${STYLE.EDGE_V}* \`${STYLE.BULLET}\` ᴍᴏᴅᴇ: *${(botConfig.mode || "public").toUpperCase()}*\n` +
          `*${STYLE.EDGE_V}* \`${STYLE.BULLET}\` ᴜᴘᴛɪᴍᴇ: *${uptimeFormatted}*\n` +
          `*${STYLE.EDGE_V}* \`${STYLE.BULLET}\` ᴛᴏᴛᴀʟ ᴄᴍᴅ: *${totalCmds}*\n` +
          `${STYLE.CORNER_BL}${STYLE.EDGE_H}${STYLE.EDGE_H}${STYLE.EDGE_H}` +
          `${STYLE.EDGE_H}${STYLE.EDGE_H}${STYLE.EDGE_H}${STYLE.EDGE_H}${STYLE.EDGE_H}` +
          `${STYLE.EDGE_H}${STYLE.EDGE_H}${STYLE.EDGE_H}${STYLE.EDGE_H}${STYLE.EDGE_H}${STYLE.SPARKLE}\n\n`;

        headerText += `📋 *Pilih kategori di bawah untuk melihat daftar command*`;

        try {
          const { generateWAMessageFromContent, proto } =
            await import("ShooNhee");

          const buttons = [
            {
              name: "single_select",
              buttonParamsJson: JSON.stringify({
                title: "📁 ᴘɪʟɪʜ ᴍᴇɴᴜ",
                sections: [
                  {
                    title: "📋 PILIH CATEGORY",
                    rows: categoryRows,
                  },
                ],
              }),
            },
            {
              name: "quick_reply",
              buttonParamsJson: JSON.stringify({
                display_text: "📊 TOTAL SEMUA FITUR",
                id: `${prefix}totalfitur`,
              }),
            },
            {
              name: "quick_reply",
              buttonParamsJson: JSON.stringify({
                display_text: "📊 SEMUA MENU",
                id: `${prefix}allmenu`,
              }),
            },
          ];

          let headerMedia = null;
          if (imageBuffer) {
            try {
              const { prepareWAMessageMedia } = await import("ShooNhee");
              headerMedia = await prepareWAMessageMedia(
                { image: imageBuffer },
                { upload: sock.waUploadToServer },
              );
            } catch (_e) { /* media prep failed */ }
          }

          const msg = generateWAMessageFromContent(
            m.chat,
            {
              viewOnceMessage: {
                message: {
                  messageContextInfo: {
                    deviceListMetadata: {},
                    deviceListMetadataVersion: 2,
                  },
                  interactiveMessage:
                    proto.Message.InteractiveMessage.fromObject({
                      body: proto.Message.InteractiveMessage.Body.fromObject({
                        text: headerText,
                      }),
                      footer:
                        proto.Message.InteractiveMessage.Footer.fromObject({
                          text:
                            `© ${botConfig.bot?.name || "ShooNhee-AI"} | ` +
                            `${menuSorted.length} Categories`,
                        }),
                      header:
                        proto.Message.InteractiveMessage.Header.fromObject({
                          title: `${botConfig.bot?.name || "ShooNhee-AI"}`,
                          hasMediaAttachment: !!headerMedia,
                          ...(headerMedia || {}),
                        }),
                      nativeFlowMessage:
                        proto.Message.InteractiveMessage.NativeFlowMessage.fromObject(
                          { buttons },
                        ),
                      contextInfo: {
                        mentionedJid: [m.sender],
                        forwardingScore: 9999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                          newsletterJid: saluranId,
                          newsletterName: saluranName,
                          serverMessageId: 127,
                        },
                      },
                    }),
                },
              },
            },
            { userJid: m.sender, quoted: getVerifiedQuoted(botConfig) },
          );

          await sock.relayMessage(m.chat, msg.message, {
            messageId: msg.key.id,
          });
        } catch (_btnError) {
          await sendFallback(
            m,
            sock,
            headerText,
            imageBuffer,
            thumbBuffer,
            botConfig,
            "V5",
          );
        }
        break;
      }

      /* ─────────────────────────── VARIANT 6 — PDF Document ─────────────────────────── */
      case 6: {
        const thumbPathV6 = path.join(
          process.cwd(),
          "assets",
          "images",
          "ShooNhee3.jpg",
        );

        const saluranIdV6 =
          botConfig.saluran?.id || "120363208449943317@newsletter";
        const saluranNameV6 =
          botConfig.saluran?.name || botConfig.bot?.name || "ShooNhee-AI";
        const saluranLinkV6 =
          botConfig.saluran?.link ||
          "https://whatsapp.com/channel/0029VbB37bgBfxoAmAlsgE0t";

        let bannerThumbV6 = null;

        try {
          const sourceBuffer = fs.existsSync(thumbPathV6)
            ? fs.readFileSync(thumbPathV6)
            : thumbBuffer || imageBuffer;

          if (sourceBuffer) {
            bannerThumbV6 = await (await getSharp())(sourceBuffer)
              .resize(200, 200, { fit: "inside" })
              .jpeg({ quality: 90 })
              .toBuffer();
          }
        } catch (resizeErr) {
          console.error("[Menu V6] Resize error:", resizeErr.message);
          bannerThumbV6 = thumbBuffer;
        }

        const contextInfoV6 = {
          mentionedJid: [m.sender],
          forwardingScore: 9999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: saluranIdV6,
            newsletterName: saluranNameV6,
            serverMessageId: 127,
          },
          externalAdReply: {
            title: botConfig.bot?.name || "ShooNhee-AI",
            body: `v${botConfig.bot?.version || "1.0.1"} • Fast Response Bot`,
            sourceUrl: saluranLinkV6,
            mediaType: 1,
            showAdAttribution: false,
            renderLargerThumbnail: true,
            thumbnail: thumbBuffer || imageBuffer,
          },
        };

        try {
          await sock.sendMessage(
            m.chat,
            {
              document: imageBuffer || Buffer.from("ShooNhee-AI Menu"),
              mimetype: "application/pdf",
              fileName: `ɴᴏ ᴘᴀɪɴ ɴᴏ ɢᴀɪɴ`,
              fileLength: 9999999999,
              caption: text,
              jpegThumbnail: bannerThumbV6,
              contextInfo: contextInfoV6,
            },
            { quoted: getVerifiedQuoted(botConfig) },
          );
        } catch (v6Error) {
          console.error("[Menu V6] Error:", v6Error.message);
          const fallbackV6 = {
            contextInfo: getContextInfo(botConfig, m, thumbBuffer),
          };
          if (imageBuffer) {
            fallbackV6.image = imageBuffer;
            fallbackV6.caption = text;
          } else {
            fallbackV6.text = text;
          }
          await sock.sendMessage(m.chat, fallbackV6, {
            quoted: getVerifiedQuoted(botConfig),
          });
        }
        break;
      }

      /* ─────────────────────────── VARIANT 7 — Carousel Cards ─────────────────────────── */
      case 7: {
        try {
          const { prepareWAMessageMedia, generateWAMessageFromContent, proto } =
            await import("ShooNhee");

          const carouselCards = [];

          for (const { cat, cmds, emoji } of menuSorted) {
            const categoryName = toSmallCaps(cat);
            const starSymbol = pickRandom(PREMIUM_SYMBOLS);

            let cardBody =
              `${STYLE.DASH}${STYLE.DASH}${STYLE.DASH}${STYLE.DASH}` +
              `${STYLE.DASH}${STYLE.DASH}${STYLE.DASH}${STYLE.DASH}` +
              `${STYLE.DASH}${STYLE.DASH}${STYLE.DASH}${STYLE.DASH}\n`;

            for (const cmd of cmds.slice(0, 15)) {
              cardBody += `◦ \`${prefix}${toSmallCaps(cmd)}\`\n`;
            }

            if (cmds.length > 15) {
              cardBody +=
                `\n_...dan ${cmds.length - 15} command lainnya_`;
            }

            cardBody += `\n\n> Total: ${cmds.length} commands`;

            let cardMedia = null;
            try {
              const catThumbPath = path.join(
                process.cwd(),
                "assets",
                "images",
                `cat-${cat}.jpg`,
              );
              const defaultV7Path = path.join(
                process.cwd(),
                "assets",
                "images",
                "ShoNhe-v7.jpg",
              );

              let sourceImage = fs.existsSync(defaultV7Path)
                ? fs.readFileSync(defaultV7Path)
                : thumbBuffer;

              if (fs.existsSync(catThumbPath)) {
                sourceImage = fs.readFileSync(catThumbPath);
              }

              if (sourceImage) {
                const resizedImage = await (await getSharp())(sourceImage)
                  .resize(300, 300, { fit: "cover" })
                  .jpeg({ quality: 80 })
                  .toBuffer();

                cardMedia = await prepareWAMessageMedia(
                  { image: resizedImage },
                  { upload: sock.waUploadToServer },
                );
              }
            } catch (e) {
              console.error("[Menu V7] Card media error:", e.message);
            }

            const cardMessage = {
              header: proto.Message.InteractiveMessage.Header.fromObject({
                title: `${emoji} ${categoryName.toUpperCase()}`,
                hasMediaAttachment: !!cardMedia,
                ...(cardMedia || {}),
              }),
              body: proto.Message.InteractiveMessage.Body.fromObject({
                text: cardBody,
              }),
              footer: proto.Message.InteractiveMessage.Footer.create({
                text:
                  `${botConfig.bot?.name || "ShooNhee-AI"} • ${cat}`,
              }),
              nativeFlowMessage:
                proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                  buttons: [
                    {
                      name: "quick_reply",
                      buttonParamsJson: JSON.stringify({
                        display_text: `📋 Lihat ${categoryName}`,
                        id: `${prefix}menucat ${cat}`,
                      }),
                    },
                  ],
                }),
            };

            carouselCards.push(cardMessage);
          }

          if (carouselCards.length === 0) {
            await m.reply(text);
            break;
          }

          const msg = await generateWAMessageFromContent(
            m.chat,
            {
              viewOnceMessage: {
                message: {
                  messageContextInfo: {
                    deviceListMetadata: {},
                    deviceListMetadataVersion: 2,
                  },
                  interactiveMessage:
                    proto.Message.InteractiveMessage.fromObject({
                      body: proto.Message.InteractiveMessage.Body.fromObject({
                        text:
                          `${greeting} *${m.pushName}!*\n\n` +
                          `> Geser untuk melihat kategori menu\n` +
                          `> Ketuk tombol untuk melihat detail`,
                      }),
                      footer:
                        proto.Message.InteractiveMessage.Footer.fromObject({
                          text:
                            `${botConfig.bot?.name || "ShooNhee-AI"} ` +
                            `v${botConfig.bot?.version || "1.0"}`,
                        }),
                      carouselMessage:
                        proto.Message.InteractiveMessage.CarouselMessage.fromObject(
                          { cards: carouselCards },
                        ),
                    }),
                },
              },
            },
            { userJid: m.sender, quoted: getVerifiedQuoted(botConfig) },
          );

          await sock.relayMessage(m.chat, msg.message, {
            messageId: msg.key.id,
          });
        } catch (carouselError) {
          await sendFallback(
            m,
            sock,
            text,
            imageBuffer,
            thumbBuffer,
            botConfig,
            "V7",
          );
        }
        break;
      }

      /* ─────────────────────────── VARIANT 8 — RPG Profile Menu ─────────────────────────── */
      case 8: {
        const timeHelper = await import("../../src/lib/Shon-time.js");
        const time = timeHelper.formatTime("HH:mm");
        const date = timeHelper.formatFull("DD/MM/YYYY");
        const user = db.getUser(m.sender);

        let role = "𝙐𝙨𝙚𝙧";
        let emojiRole = "◈";
        if (m.isOwner) {
          role = "𝙊𝙬𝙣𝙚𝙧";
          emojiRole = "♚";
        } else if (m.isPremium) {
          role = "𝙋𝙧𝙚𝙢𝙞𝙪𝙢";
          emojiRole = "✦";
        }

        let menuText = "";
        const sparkles = ["✦", "✧", "⋆", "˚", "✵", "⊹"];
        const randomSparkle = () =>
          sparkles[Math.floor(Math.random() * sparkles.length)];

        const spk1 = randomSparkle();
        const spk2 = randomSparkle();
        const spk3 = randomSparkle();
        const spk4 = randomSparkle();

        menuText +=
          `${spk1}━━━━━━━━━━━━━━━━━━━━━${spk2}\n` +
          `*${botConfig.bot?.name || "𝗢𝗨𝗥𝗜𝗡-𝗔𝗜"}*\n` +
          `${spk3}━━━━━━━━━━━━━━━━━━━━━${spk4}\n\n`;

        menuText +=
          `┏━━━〔 ${emojiRole} *𝗣𝗥𝗢𝗙𝗜𝗟𝗘* 〕━━━┓\n` +
          `┃ 👤 *${m.pushName}*\n` +
          `┃ 🏷️ ${role}\n` +
          `┃ 🎫 Energi  ${STYLE.ARROW_R} ` +
          `${m.isOwner || m.isPremium ? "∞ Unlimited" : (user?.energi ?? 25)}\n` +
          `┃ ⚡ Level   ${STYLE.ARROW_R} ${user?.rpg?.level || user?.level || 1}\n` +
          `┃ ✨ Exp     ${STYLE.ARROW_R} ${(user?.exp ?? 0).toLocaleString()}\n` +
          `┃ 💰 Koin    ${STYLE.ARROW_R} ${(user?.koin ?? 0).toLocaleString()}\n`;

        const v8rpg = user?.rpg || {};
        if (v8rpg.health !== undefined) {
          menuText +=
            `┃ ❤️ HP      ${STYLE.ARROW_R} ${v8rpg.health}/${v8rpg.maxHealth}\n` +
            `┃ 🔮 Mana    ${STYLE.ARROW_R} ${v8rpg.mana}/${v8rpg.maxMana}\n` +
            `┃ 🏃 Stamina ${STYLE.ARROW_R} ${v8rpg.stamina}/${v8rpg.maxStamina}\n`;
        }

        menuText +=
          `┃ ⏰ ${time} WIB\n` +
          `┃ 📅 ${date}\n` +
          `┗━━━━━━━━━━━━━━━┛\n\n`;

        menuText +=
          `┏━━〔 ${STYLE.STAR} *𝗦𝗬𝗦𝗧𝗘𝗠 𝗦𝗧𝗔𝗧𝗦* 〕━━┓\n` +
          `┃ ⏱️ Uptime  ${STYLE.ARROW_R} ${uptimeFormatted}\n` +
          `┃ 🔧 Mode    ${STYLE.ARROW_R} ${botMode.toUpperCase()}\n` +
          `┃ 📊 Total   ${STYLE.ARROW_R} ${totalCmds} Commands\n` +
          `┃ 👥 Users   ${STYLE.ARROW_R} ${db.getUserCount()} Aktif\n` +
          `┗━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;

        menuText +=
          `╭══════════════════════╮\n` +
          `║  📋 *𝗖𝗢𝗠𝗠𝗔𝗡𝗗 𝗟𝗜𝗦𝗧*    ║\n` +
          `╰══════════════════════╯\n\n`;

        for (const { cat, cmds, emoji } of menuSorted) {
          menuText +=
            `┌─────「 ${emoji} *${cat.toUpperCase()}* 」\n` +
            `│ ${STYLE.STAR} Total: ${cmds.length} commands\n` +
            `│\n`;

          for (const cmd of cmds) {
            menuText += `│ ${STYLE.BRANCH_R}${STYLE.ARROW_R} ${prefix}${cmd}\n`;
          }

          menuText += `│\n└───────────────────\n\n`;
        }

        menuText +=
          `╭━━〔 💡 *𝗧𝗜𝗣𝗦* 〕━━╮\n` +
          `│ ❸ Follow channel ${saluranLink}\n` +
          `╰━━━━━━━━━━━━━━━━━━╯\n\n`;

        menuText +=
          `> ${spk1} *${botConfig.bot?.name || "ShooNhee"}* ` +
          `v${botConfig.bot?.version || "1.7.1"} ${spk2}`;

        let thumbV8 = thumbBuffer;
        if (thumbBuffer) {
          try {
            thumbV8 = await (await getSharp())(thumbBuffer)
              .resize(300, 300, { fit: "cover" })
              .jpeg({ quality: 80 })
              .toBuffer();
          } catch (_e) {
            thumbV8 = thumbBuffer;
          }
        }

        const ftroliQuoted = {
          key: {
            fromMe: false,
            participant: "13135550002@s.whatsapp.net",
            remoteJid: "13135550002@s.whatsapp.net",
          },
          message: {
            orderMessage: {
              orderId: "1337",
              thumbnail: thumbV8 || null,
              itemCount: totalCmds,
              status: "INQUIRY",
              surface: "CATALOG",
              message: `${botConfig.bot?.name || "ShooNhee-AI"} Menu`,
              orderTitle: `📋 ${totalCmds} Commands`,
              sellerJid: botConfig.botNumber
                ? `${botConfig.botNumber}@s.whatsapp.net`
                : m.sender,
              token: "Shon-menu-v8",
              totalAmount1000: 0,
              totalCurrencyCode: "IDR",
              contextInfo: {
                isForwarded: true,
                forwardingScore: 9999,
                forwardedNewsletterMessageInfo: {
                  newsletterJid: saluranId,
                  newsletterName: saluranName,
                  serverMessageId: 127,
                },
              },
            },
          },
        };

        await sock.sendMessage(
          m.chat,
          {
            image: fs.existsSync("assets/images/ShoNhe-v8.jpg")
              ? fs.readFileSync("assets/images/ShoNhe-v8.jpg")
              : imageBuffer || thumbBuffer,
            caption: menuText,
            contextInfo: getContextInfo(botConfig, m, imageBuffer, true),
          },
          { quoted: ftroliQuoted },
        );
        break;
      }

      /* ─────────────────────────── VARIANT 9 — Product Card ─────────────────────────── */
      case 9: {
        try {
          const { prepareWAMessageMedia, generateWAMessageFromContent, proto } =
            await import("ShooNhee");

          let headerMedia = null;
          if (imageBuffer) {
            try {
              const resized = await (
                await getSharp()
              )(
                fs.readFileSync("./assets/images/ShoNhe-v9.jpg"),
              )
                .resize(300, 300, { fit: "cover" })
                .jpeg({ quality: 80 })
                .toBuffer();

              headerMedia = await prepareWAMessageMedia(
                { image: resized },
                { upload: sock.waUploadToServer },
              );
            } catch (e) {
              console.error("[Menu V9] Media prep error:", e.message);
            }
          }

          const zannerz =
            "https://wa.me/" +
            (botConfig.owner?.number?.[0] || "6281234567890");

          const buttons = [
            {
              name: "single_select",
              buttonParamsJson: JSON.stringify({
                has_multiple_buttons: true,
              }),
            },
            {
              name: "cta_url",
              buttonParamsJson: JSON.stringify({
                display_text: "Nomor Owner ku",
                url: zannerz,
                merchant_url: zannerz,
              }),
            },
            {
              name: "quick_reply",
              buttonParamsJson: JSON.stringify({
                display_text: "🧾 Tampilkan Semua Menu",
                id: `${prefix}allmenu`,
              }),
            },
          ];

          const msg = generateWAMessageFromContent(
            m.chat,
            {
              viewOnceMessage: {
                message: {
                  messageContextInfo: {
                    deviceListMetadata: {},
                    deviceListMetadataVersion: 2,
                  },
                  interactiveMessage:
                    proto.Message.InteractiveMessage.fromObject({
                      body: proto.Message.InteractiveMessage.Body.fromObject({
                        text,
                      }),
                      footer:
                        proto.Message.InteractiveMessage.Footer.fromObject({
                          text:
                            `© ${botConfig.bot?.name || "ShooNhee-AI"} ` +
                            `v${botConfig.bot?.version || "1.9.0"}`,
                        }),
                      header:
                        proto.Message.InteractiveMessage.Header.fromObject({
                          hasMediaAttachment: !!headerMedia,
                          ...(headerMedia || {}),
                        }),
                      nativeFlowMessage:
                        proto.Message.InteractiveMessage.NativeFlowMessage.fromObject(
                          {
                            messageParamsJson: JSON.stringify({
                              limited_time_offer: {
                                text: botConfig.bot?.name || "ShooNhee-AI",
                                url: saluranLink,
                                copy_code:
                                  botConfig.owner?.name || "ShooNhee-AI",
                                expiration_time: Date.now() * 999,
                              },
                              bottom_sheet: {
                                in_thread_buttons_energi: 2,
                                divider_indices: [1, 2, 3, 4, 5, 999],
                                list_title:
                                  botConfig.bot?.name || "ShooNhee-AI",
                                button_title: "🍀 ριℓιн кαтєgσяι",
                              },
                            }),
                            buttons,
                          },
                        ),
                      contextInfo: {
                        mentionedJid: [m.sender],
                        forwardingScore: 9999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                          newsletterJid: saluranId,
                          newsletterName: saluranName,
                          serverMessageId: 127,
                        },
                      },
                    }),
                },
              },
            },
            { userJid: m.sender, quoted: getVerifiedQuoted(botConfig) },
          );

          await sock.relayMessage(m.chat, msg.message, {
            messageId: msg.key.id,
          });
        } catch (v9Error) {
          await sendFallback(
            m,
            sock,
            text,
            imageBuffer,
            thumbBuffer,
            botConfig,
            "V9",
          );
        }
        break;
      }

      /* ─────────────────────────── VARIANT 10 — Product Message ─────────────────────────── */
      case 10: {
        try {
          const { prepareWAMessageMedia, generateWAMessageFromContent, proto } =
            await import("ShooNhee");

          let productImage = null;
          try {
            const imgPath = path.join(
              process.cwd(),
              "assets",
              "images",
              "ShoNhe-v9.jpg",
            );
            const imgBuffer = fs.existsSync(imgPath)
              ? fs.readFileSync(imgPath)
              : imageBuffer || thumbBuffer;

            if (imgBuffer) {
              const resized = await (await getSharp())(imgBuffer)
                .resize(736, 890, { fit: "cover" })
                .jpeg({ quality: 85 })
                .toBuffer();

              productImage = await prepareWAMessageMedia(
                { image: resized },
                { upload: sock.waUploadToServer },
              );
            }
          } catch (e) {
            console.error("[Menu V10] Media prep error:", e.message);
          }

          const footerText =
            `Hai *@${m.pushName || "User"}* 🪸\n\n` +
            `Aku ${botConfig.bot?.name || "ShooNhee-AI"}, bot WhatsApp ` +
            `yang siap bantu kamu.\n\n` +
            `Kamu bisa pakai aku buat cari info, ambil data, atau bantu ` +
            `hal-hal sederhana langsung lewat WhatsApp — praktis tanpa ribet.\n\n` +
            `─────────────────────────\n` +
            `Nama    : ${botConfig.bot?.name || "ShooNhee-AI"}\n` +
            `Versi   : v${botConfig.bot?.version || "1.9.0"}\n` +
            `Runtime : Node.js ${process.version}\n` +
            `Bot Up  : ${uptimeFormatted}\n\n` +
            `Owner ku kak : ${botConfig.owner?.name || "Lucky Archz"}\n` +
            `─────────────────────────\n` +
            `Klik tombol di bawah untuk menampilkan menu`;

          const buttons = [
            {
              name: "quick_reply",
              buttonParamsJson: JSON.stringify({
                display_text: botConfig.bot?.name || "ShooNhee-AI",
                id: `${prefix}allmenu`,
              }),
            },
          ];

          const productId = `Zann Zann Zann Zann Zann :)`;
          const businessJid = botConfig.botNumber
            ? `${botConfig.botNumber}@s.whatsapp.net`
            : m.botJid || sock.user?.id;

          const msg = generateWAMessageFromContent(
            m.chat,
            {
              viewOnceMessage: {
                message: {
                  messageContextInfo: {
                    deviceListMetadata: {},
                    deviceListMetadataVersion: 2,
                  },
                  interactiveMessage:
                    proto.Message.InteractiveMessage.fromObject({
                      header:
                        proto.Message.InteractiveMessage.Header.fromObject({
                          title:
                            `${botConfig.bot?.name || "ShooNhee-AI"} Menu`,
                          hasMediaAttachment: !!productImage,
                          productMessage: {
                            product: {
                              productImage:
                                productImage?.imageMessage || null,
                              productId,
                              title:
                                `${botConfig.bot?.name || "ShooNhee-AI"} Menu`,
                              description: "Menu",
                              currencyCode: "USD",
                              priceAmount1000: "1000000000000000",
                              retailerId:
                                botConfig.bot?.name || "ShooNhee",
                              productImageCount: 1,
                            },
                            businessOwnerJid: businessJid,
                          },
                        }),
                      body: proto.Message.InteractiveMessage.Body.fromObject({
                        text: `*© ${botConfig.bot?.name || "ShooNhee-AI"} 2026*`,
                      }),
                      footer:
                        proto.Message.InteractiveMessage.Footer.fromObject({
                          text: footerText,
                        }),
                      nativeFlowMessage:
                        proto.Message.InteractiveMessage.NativeFlowMessage.fromObject(
                          { buttons },
                        ),
                      contextInfo: {
                        mentionedJid: [m.sender],
                        forwardingScore: 9999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                          newsletterJid: saluranId,
                          newsletterName: saluranName,
                          serverMessageId: 127,
                        },
                      },
                    }),
                },
              },
            },
            { userJid: m.sender, quoted: getVerifiedQuoted(botConfig) },
          );

          await sock.relayMessage(m.chat, msg.message, {
            messageId: msg.key.id,
          });
        } catch (v10Error) {
          await sendFallback(
            m,
            sock,
            text,
            imageBuffer,
            thumbBuffer,
            botConfig,
            "V10",
          );
        }
        break;
      }

      /* ─────────────────────────── VARIANT 11 — Document Interactive ─────────────────────────── */
      case 11: {
        try {
          const docuThumb =
            thumbBuffer ||
            imageBuffer ||
            fs.readFileSync(
              path.join(
                process.cwd(),
                "assets",
                "images",
                "ShoNhe-allmenu.jpg",
              ),
            );

          const catRows = menuSorted.map(({ cat, cmds }) => ({
            header: "",
            title: `🍀 ${toMonoUpperBold(cat)}`,
            id: `${prefix}menucat ${cat}`,
            description: `Berisi ${cmds.length} Perintah`,
          }));

          const titleText =
            `Hallo Kak *@${m.pushName}*\n\n` +
            `Sebelumnya, terima kasih yak sudah menggunakan bot kami\n\n` +
            `${STYLE.CORNER_TL} \`INFORMASI BOT\` 𝜗ৎ\n` +
            `┆ ᵎᵎ Nama Bot : *${botConfig.bot?.name || "ShooNhee-AI"}*\n` +
            `┆ ᵎᵎ Owner Bot : *${botConfig.owner?.name || "ShooNhee-AI"}*\n` +
            `┆ ᵎᵎ Prefix : *${prefix}*\n` +
            `┆ ᵎᵎ Total Perintah : *${totalCmds}*\n` +
            `┆ ᵎᵎ Role Kamu : ` +
            `${m.isOwner ? "Owner" : m.isPremium ? "Premium" : "User Biasa"}\n` +
            `${STYLE.CORNER_BL}─────\n\n` +
            `silahkan tekan tombol dibawah untuk memilih menu`;

          await sock.sendMessage(
            m.chat,
            {
              interactiveMessage: {
                title: titleText,
                footer:
                  botConfig.settings?.footer ||
                  `© ${botConfig.bot?.name || "ShooNhee-AI"} 2026`,
                document: fs.readFileSync("./package.json"),
                mimetype: "image/png",
                fileName: `${greeting}`,
                jpegThumbnail: await (await getSharp())(docuThumb)
                  .resize({ width: 300, height: 300 })
                  .toBuffer(),
                contextInfo: {
                  mentionedJid: [m.sender],
                  forwardingScore: 777,
                  isForwarded: true,
                  forwardedNewsletterMessageInfo: {
                    newsletterJid: saluranId,
                    newsletterName: saluranName,
                    serverMessageId: 127,
                  },
                },
                externalAdReply: {
                  title: botConfig.bot?.name || "ShooNhee-AI",
                  body: "Runtime: " + process.uptime() + "s",
                  mediaType: 1,
                  thumbnail: fs.existsSync("./assets/images/ShoNhe-v11.jpg")
                    ? fs.readFileSync("./assets/images/ShoNhe-v11.jpg")
                    : thumbBuffer || imageBuffer,
                  mediaUrl: saluranLink,
                  sourceUrl: saluranLink,
                  renderLargerThumbnail: true,
                },
                nativeFlowMessage: {
                  messageParamsJson: JSON.stringify({
                    limited_time_offer: {
                      text: `Gunakan bot ini dengan bijak yak`,
                      url: saluranLink,
                      copy_code: botConfig.bot?.name || "ShooNhee-AI",
                      expiration_time: Date.now() * 999,
                    },
                    bottom_sheet: {
                      in_thread_buttons_limit: 2,
                      divider_indices: [1, 2, 3, 4, 5, 999],
                      list_title: "Pilih Menu",
                      button_title: "🍀 Pilih Menu Disini",
                    },
                    tap_target_configuration: {
                      title: " X ",
                      description: "bomboclard",
                      canonical_url: "https://ShooNhee.site",
                      domain: "shop.example.com",
                      button_index: 0,
                    },
                  }),
                  buttons: [
                    {
                      name: "single_select",
                      buttonParamsJson: JSON.stringify({
                        has_multiple_buttons: true,
                      }),
                    },
                    {
                      name: "call_permission_request",
                      buttonParamsJson: JSON.stringify({
                        has_multiple_buttons: true,
                      }),
                    },
                    {
                      name: "single_select",
                      buttonParamsJson: JSON.stringify({
                        title: "Pilihan Menu",
                        sections: [
                          {
                            title: "🍀 Silahkan pilih menu yang kamu inginkan",
                            highlight_label:
                              botConfig.bot?.name || "ShooNhee-AI",
                            rows: catRows,
                          },
                        ],
                        has_multiple_buttons: true,
                      }),
                    },
                    {
                      name: "cta_url",
                      buttonParamsJson: JSON.stringify({
                        display_text: "🌏 Kunjungi Saluran Kami",
                        url: saluranLink,
                        merchant_url: saluranLink,
                      }),
                    },
                    {
                      name: "quick_reply",
                      buttonParamsJson: JSON.stringify({
                        display_text: "🖐 Owner Kami",
                        id: `${prefix}owner`,
                      }),
                    },
                    {
                      name: "quick_reply",
                      buttonParamsJson: JSON.stringify({
                        display_text: "🌺 Lihat Semua Menu",
                        id: `${prefix}allmenu`,
                      }),
                    },
                  ],
                },
              },
            },
            { quoted: getVerifiedQuoted(botConfig) },
          );
        } catch (v11Error) {
          await sendFallback(
            m,
            sock,
            text,
            imageBuffer,
            thumbBuffer,
            botConfig,
            "V11",
          );
        }
        break;
      }

      /* ─────────────────────────── VARIANT 12 — Profile + Native Flow ─────────────────────────── */
      case 12: {
        try {
          const docuThumb =
            thumbBuffer ||
            imageBuffer ||
            fs.readFileSync(
              path.join(
                process.cwd(),
                "assets",
                "images",
                "ShoNhe-allmenu.jpg",
              ),
            );

          const catButtons = menuSorted.map(({ cat }) => ({
            name: "quick_reply",
            buttonParamsJson: JSON.stringify({
              display_text: `${toMonoUpperBold(cat)}`,
              id: `${prefix}menucat ${cat}`,
            }),
          }));

          /**
           * Format byte count into human-readable units.
           * @param {number} bytes
           * @param {number} [decimals=2]
           * @returns {string}
           */
          function formatBytes(bytes, decimals = 2) {
            if (!Number.isFinite(bytes) || bytes < 0) return "0 B";
            if (bytes === 0) return "0 B";
            const k = 1024;
            const units = ["B", "KB", "MB", "GB", "TB"];
            const idx = Math.min(
              Math.floor(Math.log(bytes) / Math.log(k)),
              units.length - 1,
            );
            const value = bytes / Math.pow(k, idx);
            const fixed = value.toFixed(decimals);
            const pretty = fixed
              .replace(/\.0+$/, "")
              .replace(/(\.\d*[1-9])0+$/, "$1");
            return `${pretty} ${units[idx]}`;
          }

          const userDb = JSON.parse(
            fs.readFileSync("./database/main/users.json"),
          );
          const userDbBytes = Buffer.byteLength(
            JSON.stringify(userDb),
            "utf8",
          );

          let profilePic;
          try {
            profilePic = Buffer.from(
              (
                await axios.get(
                  await sock.profilePictureUrl(m.sender, "image"),
                  { responseType: "arraybuffer" },
                )
              ).data,
            );
          } catch (_error) {
            profilePic = fs.readFileSync("./assets/images/pp-kosong.jpg");
          }

          const zanton = [
            {
              name: "single_select",
              buttonParamsJson: JSON.stringify({
                has_multiple_buttons: true,
              }),
            },
            {
              name: "call_permission_request",
              buttonParamsJson: JSON.stringify({
                has_multiple_buttons: true,
              }),
            },
            {
              name: "quick_reply",
              buttonParamsJson: JSON.stringify({
                display_text: "Lihat Semua Menu",
                id: `${m.prefix}allmenu`,
              }),
            },
          ];
          zanton.push(...catButtons);

          await sock.sendMessage(
            m.chat,
            {
              interactiveMessage: {
                title:
                  `🌾 *𝘏𝘪! ${m.pushName}*\n\n` +
                  `𝘛𝘩𝘢𝘯𝘬𝘴 𝘧𝘰𝘳 𝘮𝘦𝘴𝘴𝘢𝘨𝘪𝘯𝘨 𝘶𝘴. 𝘠𝘰𝘶’𝘳𝘦 𝘯𝘰𝘸 ` +
                  `𝘤𝘩𝘢𝘵𝘵𝘪𝘯𝘨 𝘸𝘪𝘵𝘩 𝘰𝘶𝘳 𝘈𝘶𝘵𝘰𝘮𝘢𝘵𝘪𝘤 ` +
                  `𝘞𝘩𝘢𝘵𝘴𝘈𝘱𝘱 𝘉𝘰𝘵. \n\n` +
                  `${STYLE.CORNER_TL}「 *${m.pushName}* 」\n` +
                  `│ • Bot Version : *${botConfig.bot?.version || "2.1.0"}*\n` +
                  `│ • Database    : ${formatBytes(userDbBytes)}\n` +
                  `${STYLE.CORNER_BL}──`,
                footer:
                  botConfig.settings?.footer ||
                  `© ${botConfig.bot?.name || "ShooNhee-AI"} 2026`,
                document: fs.readFileSync("./package.json"),
                mimetype: "image/png",
                fileName: `${getTimeGreeting()}`,
                jpegThumbnail: await (await getSharp())(profilePic)
                  .resize({ width: 300, height: 300 })
                  .toBuffer(),
                contextInfo: {
                  mentionedJid: [m.sender],
                  forwardingScore: 777,
                  isForwarded: true,
                  forwardedNewsletterMessageInfo: {
                    newsletterJid: saluranId,
                    newsletterName: saluranName,
                    serverMessageId: 127,
                  },
                },
                externalAdReply: {
                  title: botConfig.bot?.name || "ShooNhee-AI",
                  body:
                    `🍃 OWNER BOT: ` +
                    `${botConfig.owner?.name || "ShooNhee-AI"}`,
                  mediaType: 1,
                  thumbnail: fs.existsSync("./assets/images/ShoNhe-v11.jpg")
                    ? fs.readFileSync("./assets/images/ShoNhe-v11.jpg")
                    : thumbBuffer || imageBuffer,
                  mediaUrl: botConfig?.info?.website || saluranLink,
                  sourceUrl: botConfig?.info?.website || saluranLink,
                  renderLargerThumbnail: true,
                },
                nativeFlowMessage: {
                  messageParamsJson: JSON.stringify({
                    bottom_sheet: {
                      in_thread_buttons_limit: 2,
                      divider_indices: [1, 2, 3, 4, 5, 999],
                      list_title:
                        "Silahkan pilih category yang ingin dilihat",
                      button_title: "🧾 Tap Here!",
                    },
                    tap_target_configuration: {
                      title: " X ",
                      description: "bomboclard",
                      canonical_url: "https://ShooNhee.site",
                      domain: "shop.example.com",
                      button_index: 0,
                    },
                  }),
                  buttons: zanton,
                },
              },
            },
            {
              quoted: {
                key: {
                  remoteJid: "13135550002@s.whatsapp.net",
                  fromMe: false,
                  id: `ownername`,
                  participant: "13135550002@s.whatsapp.net",
                },
                message: {
                  requestPaymentMessage: {
                    currencyCodeIso4217: "USD",
                    amount1000: 999999999,
                    requestFrom: "13135550002@s.whatsapp.net",
                    noteMessage: {
                      extendedTextMessage: {
                        text: `${botConfig?.bot?.name}`,
                      },
                    },
                    expiryTimestamp: 999999999,
                    amount: {
                      value: 91929291929,
                      offset: 1000,
                      currencyCode: "USD",
                    },
                  },
                },
              },
            },
          );
        } catch (v12Error) {
          await sendFallback(
            m,
            sock,
            text,
            imageBuffer,
            thumbBuffer,
            botConfig,
            "V12",
          );
        }
        break;
      }

      /* ─────────────────────────── VARIANT 13 — Canvas Profile Card ─────────────────────────── */
      case 13: {
        const thumbPathV13 = path.join(
          process.cwd(),
          "assets",
          "images",
          "ShooNhee3.jpg",
        );
        const saluranIdV13 =
          botConfig.saluran?.id || "120363208449943317@newsletter";
        const saluranNameV13 =
          botConfig.saluran?.name || botConfig.bot?.name || "ShooNhee-AI";
        const saluranLinkV13 =
          botConfig.saluran?.link ||
          "https://whatsapp.com/channel/0029VbB37bgBfxoAmAlsgE0t";

        let totalCmdsV13 = totalCmds;
        let bannerThumbV13 = null;
        const userV13 = db.getUser(m.sender);

        /* ── embedded canvas profile-card generator ── */
        try {
          const { createCanvas, loadImage } =
            await import("@napi-rs/canvas");

          /**
           * Render a premium HUD-style profile card.
           * @param {Object} data  — user profile payload
           * @returns {Promise<Buffer>} JPEG buffer
           */
          async function createProfileCard(data) {
            /* ── canvas setup ── */
            const canvas = createCanvas(800, 250);
            const ctx = canvas.getContext("2d");

            /* ── colour theme ── */
            const accentColor = "#CCFF00";
            const fgColor = "#FFFFFF";

            /* ── base background ── */
            ctx.fillStyle = "#09090B";
            ctx.fillRect(0, 0, 800, 250);

            /* ── background image with cover-fit ── */
            try {
              const bgImage = await loadImage(data.backgroundUrl);
              const canvasRatio = 800 / 250;
              const imgRatio = bgImage.width / bgImage.height;
              let drawW, drawH, drawX, drawY;

              if (imgRatio > canvasRatio) {
                drawH = 250;
                drawW = bgImage.width * (250 / bgImage.height);
                drawX = (800 - drawW) / 2;
                drawY = 0;
              } else {
                drawW = 800;
                drawH = bgImage.height * (800 / bgImage.width);
                drawX = 0;
                drawY = (250 - drawH) / 2;
              }
              ctx.drawImage(bgImage, drawX, drawY, drawW, drawH);
            } catch (_error) {
              ctx.fillStyle = "#09090B";
              ctx.fillRect(0, 0, 800, 250);
            }

            /* ── dark overlay ── */
            ctx.fillStyle = "rgba(9, 9, 11, 0.85)";
            ctx.fillRect(0, 0, 800, 250);

            /* ── decorative slanted shape ── */
            ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(400, 0);
            ctx.lineTo(320, 250);
            ctx.lineTo(0, 250);
            ctx.fill();

            /* ── accent stroke line ── */
            ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(410, 0);
            ctx.lineTo(330, 250);
            ctx.stroke();

            /* ── large watermark text ── */
            ctx.fillStyle = "rgba(204, 255, 0, 0.05)";
            ctx.font = "900 150px sans-serif";
            ctx.fillText(`LV${data.level}`, 300, 220);

            /* ── system labels (top-left) ── */
            ctx.fillStyle = "#666666";
            ctx.font = "10px monospace";
            ctx.fillText("// SYS_ONLINE : USER_PROFILE", 30, 25);
            ctx.fillText(
              "ID_HASH: " +
                Math.random()
                  .toString(36)
                  .substring(2, 10)
                  .toUpperCase(),
              30,
              40,
            );

            /* ── barcode accent (top-right) ── */
            ctx.fillStyle = accentColor;
            ctx.fillRect(770, 20, 6, 40);
            ctx.fillRect(760, 20, 2, 40);
            ctx.fillRect(752, 20, 3, 40);

            /* ── avatar (circular clip) ── */
            const avatarSize = 130;
            const avatarX = 50;
            const avatarY = 60;
            const centerX = avatarX + avatarSize / 2;
            const centerY = avatarY + avatarSize / 2;
            const radius = avatarSize / 2;

            ctx.save();
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.clip();

            try {
              const avatar = await loadImage(data.avatarUrl);
              ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
            } catch (_error) {
              ctx.fillStyle = "#333333";
              ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);
            }
            ctx.restore();

            /* ── avatar ring ── */
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2, true);
            ctx.lineWidth = 4;
            ctx.strokeStyle = accentColor;
            ctx.stroke();

            /* ── user name ── */
            ctx.fillStyle = fgColor;
            ctx.font = "900 42px sans-serif";
            let displayName = data.name || "User";
            if (displayName.length > 15)
              displayName = displayName.substring(0, 15) + "...";
            ctx.fillText(displayName, 230, 100);

            /* ── rank badge ── */
            ctx.save();
            ctx.translate(230, 115);
            ctx.fillStyle = accentColor;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(120, 0);
            ctx.lineTo(110, 24);
            ctx.lineTo(-10, 24);
            ctx.fill();

            ctx.fillStyle = "#000000";
            ctx.font = "bold 14px sans-serif";
            ctx.fillText(data.rank.toUpperCase(), 10, 17);
            ctx.restore();

            /* ── segmented XP progress bar ── */
            const barX = 230;
            const barY = 172;
            const barWidth = 500;
            const segments = 25;
            const gap = 3;
            const segmentWidth = (barWidth - gap * (segments - 1)) / segments;

            const xpRatio = Math.min(data.currentXp / data.requiredXp, 1);
            const activeSegments = Math.floor(xpRatio * segments);

            /* background segments */
            ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
            for (let i = 0; i < segments; i++) {
              ctx.fillRect(
                barX + i * (segmentWidth + gap),
                barY,
                segmentWidth,
                8,
              );
            }

            /* active segments */
            ctx.fillStyle = accentColor;
            for (let i = 0; i < activeSegments; i++) {
              ctx.fillRect(
                barX + i * (segmentWidth + gap),
                barY,
                segmentWidth,
                8,
              );
            }

            /* ── XP detail panel ── */
            const dataY = barY + 18;

            /* panel background */
            ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
            ctx.beginPath();
            ctx.moveTo(barX, dataY);
            ctx.lineTo(barX + 210, dataY);
            ctx.lineTo(barX + 198, dataY + 26);
            ctx.lineTo(barX, dataY + 26);
            ctx.fill();

            /* accent strip */
            ctx.fillStyle = accentColor;
            ctx.fillRect(barX, dataY, 4, 26);

            /* label */
            ctx.fillStyle = "#FFFFFF";
            ctx.font = "bold 13px sans-serif";
            ctx.textAlign = "left";
            ctx.fillText("EXP", barX + 15, dataY + 18);

            /* current XP */
            ctx.fillStyle = accentColor;
            ctx.font = "bold 14px monospace";
            ctx.fillText(data.currentXp.toString(), barX + 50, dataY + 18);

            /* separator + max XP */
            const currentXpWidth = ctx.measureText(
              data.currentXp.toString(),
            ).width;
            ctx.fillStyle = "#888888";
            ctx.font = "14px monospace";
            ctx.fillText(
              ` / ${data.requiredXp}`,
              barX + 50 + currentXpWidth,
              dataY + 18,
            );

            /* ── level badge ── */
            const badgeW = 90;
            ctx.save();
            ctx.translate(barX + barWidth - badgeW, dataY);

            ctx.fillStyle = accentColor;
            ctx.beginPath();
            ctx.moveTo(12, 0);
            ctx.lineTo(badgeW, 0);
            ctx.lineTo(badgeW, 26);
            ctx.lineTo(0, 26);
            ctx.fill();

            ctx.fillStyle = "#000000";
            ctx.font = "900 16px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(`LVL ${data.level}`, 48, 19);
            ctx.restore();

            return canvas.toBuffer("image/jpeg");
          }

          /* ── resolve user data for profile card ── */
          const levelHelper = await import("../../src/lib/Shon-level.js");
          const profileUser = db.getUser(m.sender) || {};
          const exp = profileUser.exp || 0;
          const level = levelHelper.calculateLevel(exp);
          const currentLevelExp = levelHelper.expForLevel(level);
          const nextLevelExp = levelHelper.expForLevel(level + 1);

          let resolvedAvatarUrl =
            "https://i.ibb.co/3Fh9Q6M/empty-profile.png";
          try {
            const ppUrl = await sock.profilePictureUrl(m.sender, "image");
            if (ppUrl) resolvedAvatarUrl = ppUrl;
          } catch (_e) {
            /* use default avatar */
          }

          bannerThumbV13 = await createProfileCard({
            name: m.pushName || profileUser.name || "User",
            level,
            currentXp: exp - currentLevelExp,
            requiredXp: nextLevelExp - currentLevelExp,
            rank: levelHelper.getRole(level),
            avatarUrl: resolvedAvatarUrl,
            backgroundUrl: "https://i.ibb.co/4YZnk48/default-bg.jpg",
          });
        } catch (canvasErr) {
          console.error("[Menu V13] Canvas error:", canvasErr.message);
          bannerThumbV13 = thumbBuffer || imageBuffer;
        }

        const contextInfoV13 = {
          mentionedJid: [m.sender],
          forwardingScore: 99,
          isForwarded: true,
          externalAdReply: {
            title: botConfig.bot?.name || "ShooNhee-AI",
            body: `WhatsApp Bot Multi Device`,
            sourceUrl:
              botConfig.saluran?.link ||
              "https://whatsapp.com/channel/0029VbB37bgBfxoAmAlsgE0t",
            mediaType: 1,
            showAdAttribution: false,
            renderLargerThumbnail: true,
            thumbnail: fs.readFileSync("./assets/images/ShooNhee.jpg"),
          },
        };

        try {
          /**
           * Compact number formatter (1.2K, 3.4M, 1.1B).
           * @param {number} number
           * @returns {string}
           */
          const formatNumber = (number) => {
            if (number >= 1e9)
              return (number / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
            if (number >= 1e6)
              return (number / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
            if (number >= 1e3)
              return (number / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
            return number.toString();
          };

          await sock.sendMessage(
            m.chat,
            {
              image: bannerThumbV13,
              caption:
                `🎄 ʜᴀʟʟᴏ *${m.pushName}*\n\n` +
                `${STYLE.CORNER_TL} *${STYLE.STAR}* \`${toMonoUpperBold("biodata bot")}\` *${STYLE.STAR}*\n` +
                `${STYLE.EDGE_V} ʙᴏᴛ : *${botConfig.bot?.name || "ShooNhee-AI"}*\n` +
                `${STYLE.EDGE_V} ᴠᴇʀsɪᴏɴ : *${botConfig.bot?.version || "2.1.0"}*\n` +
                `${STYLE.CORNER_BL}───\n\n` +
                `${STYLE.CORNER_TL} *${STYLE.STAR}* \`${toMonoUpperBold("list category")}\` *${STYLE.STAR}*\n` +
                `${menuSorted.map(({ cat }) => `${STYLE.EDGE_V} *${prefix}menucat ${cat}*`).join("\n")}\n` +
                `${STYLE.CORNER_BL}─────────────`,
              contextInfo: contextInfoV13,
              footer: `${botConfig.bot?.name || "ShooNhee-AI"}`,
            },
            { quoted: getVerifiedQuoted(botConfig) },
          );
        } catch (v13Error) {
          console.error("[Menu V13] Error:", v13Error.message);
          const fallbackV13 = {
            contextInfo: getContextInfo(botConfig, m, thumbBuffer),
          };
          if (imageBuffer) {
            fallbackV13.image = imageBuffer;
            fallbackV13.caption = text;
          } else {
            fallbackV13.text = text;
          }
          await sock.sendMessage(m.chat, fallbackV13, {
            quoted: getVerifiedQuoted(botConfig),
          });
        }
        break;
      }

      /* ─────────────────────────── VARIANT 14 — Location Header Interactive ─────────────────────────── */
      case 14: {
        try {
          const saluranIdV14 =
            botConfig.saluran?.id || "120363208449943317@newsletter";
          const saluranNameV14 =
            botConfig.saluran?.name || botConfig.bot?.name || "ShooNhee-AI";
          const docuThumbV14 = fs.readFileSync(
            path.join(process.cwd(), "assets", "images", "ShoNhe-v11.jpg"),
          );

          const catButtons = menuSorted.map(({ cat }) => ({
            name: "quick_reply",
            buttonParamsJson: JSON.stringify({
              display_text: `${toMonoUpperBold(cat)}`,
              id: `${prefix}menucat ${cat}`,
            }),
          }));

          const zanton = [
            {
              name: "single_select",
              buttonParamsJson: JSON.stringify({
                has_multiple_buttons: true,
              }),
            },
            {
              name: "call_permission_request",
              buttonParamsJson: JSON.stringify({
                has_multiple_buttons: true,
              }),
            },
            {
              name: "quick_reply",
              buttonParamsJson: JSON.stringify({
                display_text: "Lihat Semua Menu",
                id: `${m.prefix}allmenu`,
              }),
            },
          ];
          zanton.push(...catButtons);

          const msg = generateWAMessageFromContent(
            m.chat,
            {
              viewOnceMessage: {
                message: {
                  messageContextInfo: {
                    deviceListMetadata: {},
                    deviceListMetadataVersion: 2,
                  },
                  interactiveMessage:
                    proto.Message.InteractiveMessage.create({
                      contextInfo: {
                        mentionedJid: [m.sender],
                        forwardingScore: 19,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                          newsletterId: saluranIdV14,
                          newsletterName: `- ${saluranNameV14}`,
                          serverMessageId: -1,
                        },
                        externalAdReply: {
                          title: botConfig?.bot?.name,
                          body: `🌾 Dikembangkan oleh ${botConfig?.bot?.developer}`,
                          thumbnail: fs.readFileSync(
                            "./assets/images/ShooNhee.jpg",
                          ),
                          sourceUrl: `https://instagram.com/ShooNhee.md`,
                          mediaUrl: `https://instagram.com/ShooNhee.md`,
                          mediaType: 2,
                          renderLargerThumbnail: true,
                        },
                      },
                      header: {
                        title: null,
                        locationMessage: {
                          degreesLatitude: 0,
                          degreesLongitude: 0,
                          name: `꫶ᥫ᭡꫶ ${m.pushName || "User"}`,
                          url: `https://ss.ss`,
                          address: `Semoga harimu menyenangkan :3`,
                          jpegThumbnail: await (
                            await getSharp()
                          )(docuThumbV14)
                            .resize({ width: 300, height: 300 })
                            .toBuffer(),
                        },
                        subtitle: "",
                        hasMediaAttachment: false,
                      },
                      body: { text: null },
                      footer: {
                        text:
                          `Halo kak *${m.pushName}* ≽^• ˕ • ྀི≼\n` +
                          `*⌞ INFO USER ⌝*\n` +
                          `‧ Number : +${m.sender.split("@")[0]}\n` +
                          `‧ Name   : ${m.pushName}\n\n` +
                          `*⌞ INFO BOT ⌝*\n` +
                          `‧ Name    : ${botConfig.bot?.name || "Bot"}\n` +
                          `‧ Version : ${botConfig.bot?.version || "v1.0.0"}\n` +
                          `‧ Prefix  : ${m.prefix || "No Prefix"}\n\n` +
                          `*⌞ CARA PAKAI ⌝*\n` +
                          `‧ Klik tombol untuk melihat menu kategori\n` +
                          `‧ Klik *LIHAT SEMUA MENU* untuk seluruh fitur`,
                      },
                      nativeFlowMessage:
                        proto.Message.InteractiveMessage.NativeFlowMessage.create(
                          {
                            buttons: zanton,
                            messageParamsJson: JSON.stringify({
                              bottom_sheet: {
                                in_thread_buttons_limit: 1,
                                divider_indices: [1],
                                list_title: getTimeGreeting(),
                                button_title: "𖤍",
                              },
                            }),
                          },
                        ),
                    }),
                },
              },
            },
            {
              quoted: m,
              userJid: sock.user?.id,
            },
          );

          await sock.relayMessage(msg.key.remoteJid, msg.message, {
            messageId: msg.key.id,
            quoted: m,
          });
        } catch (v14Error) {
          await sendFallback(
            m,
            sock,
            text,
            imageBuffer,
            thumbBuffer,
            botConfig,
            "V14",
          );
        }
        break;
      }

      /* ─────────────────────────── VARIANT 15 — Weather + Full Interactive ─────────────────────────── */
      case 15: {
        try {
          const catRows = menuSorted.map(({ cat, emoji }) => ({
            title: `[ ${emoji} ] - ${toMonoUpperBold(`${cat} MENU`)}`,
            description: `Klik untuk membuka ${cat}`,
            id: `${prefix}menucat ${cat}`,
          }));

          /* ── user database stats ── */
          const userDbRaw = fs.readFileSync(
            "./database/main/users.json",
          );
          const userDb = JSON.parse(userDbRaw);
          const userDbStr = JSON.stringify(userDb);
          const userDbBytes = Buffer.byteLength(userDbStr, "utf8");

          /* ── profile picture fetch ── */
          let profilePic;
          try {
            profilePic = Buffer.from(
              (
                await axios.get(
                  await sock.profilePictureUrl(m.sender, "image"),
                  { responseType: "arraybuffer" },
                )
              ).data,
            );
          } catch (_error) {
            profilePic = fs.readFileSync("./assets/images/pp-kosong.jpg");
          }

          /* ── button definitions ── */
          const zanton = [
            {
              name: "single_select",
              buttonParamsJson: JSON.stringify({
                has_multiple_buttons: true,
              }),
            },
            {
              name: "call_permission_request",
              buttonParamsJson: JSON.stringify({
                has_multiple_buttons: true,
              }),
            },
            {
              name: "quick_reply",
              buttonParamsJson: JSON.stringify({
                display_text: "🎄 Lihat Semua Menu",
                id: `${m.prefix}allmenu`,
              }),
            },
            {
              name: "single_select",
              buttonParamsJson: JSON.stringify({
                title: "📁 Lihat Kategori",
                sections: [
                  {
                    title: "📋 PILIH CATEGORY",
                    rows: catRows,
                  },
                ],
                has_multiple_buttons: true,
              }),
            },
            {
              name: "quick_reply",
              buttonParamsJson: JSON.stringify({
                display_text: "🌾 Owner Dari Bot ini",
                id: `${m.prefix}owner`,
              }),
            },
          ];

          /* ── quoted order message ── */
          const ftroliQuoted = {
            key: {
              fromMe: false,
              participant: "13135550002@s.whatsapp.net",
              remoteJid: "13135550002@s.whatsapp.net",
            },
            message: {
              orderMessage: {
                orderId: "44444444444444",
                thumbnail:
                  (await (
                    await getSharp()
                  )(profilePic)
                    .resize({ width: 300, height: 300 })
                    .toBuffer()) || null,
                itemCount: totalCmds,
                status: "INQUIRY",
                surface: "CATALOG",
                message: `★ Terima kasih\n✦ Ada Error? Lapor owner`,
                orderTitle: `📋 ${totalCmds} Commands`,
                sellerJid: botConfig.botNumber
                  ? `${botConfig.botNumber}@s.whatsapp.net`
                  : m.sender,
                token: "Shon-menu-v8",
                totalAmount1000: 3333333,
                totalCurrencyCode: "IDR",
                contextInfo: {
                  isForwarded: true,
                  forwardingScore: 9,
                  forwardedNewsletterMessageInfo: {
                    newsletterJid: saluranId,
                    newsletterName: saluranName,
                    serverMessageId: 127,
                  },
                },
              },
            },
          };

          /* ── weather API call ── */
          const weatherRes = await axios.get(
            "https://bmkg-restapi.vercel.app/v1/weather/33.26.16.2005",
          );
          const weatherData = weatherRes.data.data;
          const todayForecast = weatherData.forecast[0];
          const currentEntry = todayForecast.entries[0];
          const cuaca = currentEntry.weather;
          const suhu = currentEntry.temperature_c;

          const weatherEmojiMap = {
            Cerah: "☀️",
            "Cerah Berawan": "🌤️",
            Berawan: "☁️",
            "Berawan Tebal": "🌥️",
            Hujan: "🌧️",
            "Hujan Petir": "⛈️",
            Kabut: "🌫️",
          };
          const emojiCuaca = weatherEmojiMap[cuaca] || "🌤️";
          const weatherTitle = `🌡️ ${suhu}°C | ${emojiCuaca} ${cuaca}`;

          /* ── RPG status helper ── */
          const rpgV15 = () => {
            const r = db.getUser(m.sender)?.rpg || {};
            return r.health !== undefined
              ? `→ *HP*: ${r.health}/${r.maxHealth}\n` +
                  `→ *Mana*: ${r.mana}/${r.maxMana}\n` +
                  `→ *Stamina*: ${r.stamina}/${r.maxStamina}`
              : "";
          };

          /* ── user data for footer ── */
          const currentUser = db.getUser(m.sender);

          await sock.sendMessage(
            m.chat,
            {
              interactiveMessage: {
                title: "",
                footer:
                  `🌿 Halo *${m.pushName}* 👋\n\n` +
                  `Selamat datang di *${botConfig.bot?.name}* ✨\n` +
                  `Bot ini siap bantu kamu dengan berbagai fitur ` +
                  `menarik yang bisa kamu gunakan kapan saja 🚀\n\n` +
                  `Mulai dari hiburan, tools, hingga fitur keren ` +
                  `lainnya sudah tersedia di sini 🎄\n` +
                  `Jangan ragu untuk eksplor semua menu yang ada ya!\n\n` +
                  `Gunakan bot dengan bijak dan tetap sopan saat ` +
                  `berinteraksi 😊\n` +
                  `Semoga pengalaman kamu menyenangkan dan betah ` +
                  `pakai bot ini 🌟\n\n` +
                  `☁︎ *STATISTIK BOT KAMI* ☁︎\n` +
                  `→ *Nama*     : ${botConfig.bot?.name}\n` +
                  `→ *Versi*    : ${botConfig.bot?.version}\n` +
                  `→ *Total Fitur* : ${totalCmds} Fitur\n` +
                  `→ *Pemilik*  : ${botConfig?.owner?.name}\n` +
                  `→ *Prefix*   : ${m?.prefix}\n\n` +
                  `☁︎ *STATISTIK KAMU* ☁︎\n` +
                  `→ *Username* : ${m?.pushName}\n` +
                  `→ *Role*     : ` +
                  `${m?.isOwner ? "Owner" : m?.isPremium ? "Premium" : "User Biasa"}\n` +
                  `→ *Energi*   : ` +
                  `${m?.isOwner || m?.isPremium ? "∞ Unlimited" : (currentUser?.energi ?? 25)}\n` +
                  `→ *Level*    : ` +
                  `${currentUser?.rpg?.level || currentUser?.level || 1}\n` +
                  `→ *Exp*      : ` +
                  `${(currentUser?.exp ?? 0).toLocaleString()}\n` +
                  `→ *Koin*     : ` +
                  `${(currentUser?.koin ?? 0).toLocaleString()}\n` +
                  `${rpgV15()}\n\n` +
                  `Silahkan tekan tombol dibawah untuk memilih category`,
                document: fs.readFileSync("./package.json"),
                mimetype: "image/png",
                fileName: `${greeting}`,
                jpegThumbnail: await (
                  await getSharp()
                )(fs.readFileSync("./assets/images/ShooNhee2.jpg"))
                  .resize({ width: 300, height: 300 })
                  .toBuffer(),
                contextInfo: {
                  mentionedJid: [m.sender],
                  forwardingScore: 7,
                  isForwarded: true,
                },
                externalAdReply: {
                  title: weatherTitle,
                  body: `Hai ${m.pushName}! Gunakan bot ini dengan bijak`,
                  previewType: "VIDEO",
                  thumbnail: fs.readFileSync(
                    "./assets/images/ShooNhee.jpg",
                  ),
                  sourceUrl: config.info.website,
                  renderLargerThumbnail: true,
                  containsAutoReply: true,
                  showAdAttribution: false,
                },
                nativeFlowMessage: {
                  messageParamsJson: JSON.stringify({
                    limited_time_offer: {
                      text: `${botConfig?.bot?.name}`,
                      url: saluranLink,
                      copy_code: null,
                      expiration_time: null,
                    },
                    bottom_sheet: {
                      in_thread_buttons_limit: 2,
                      divider_indices: [1, 2, 3, 4, 5, 999],
                      list_title:
                        "Silahkan pilih menu yang kamu inginkan",
                      button_title: "🌥️ Lebih Lengkap",
                    },
                    tap_target_configuration: {
                      title: " X ",
                      description: "bomboclard",
                      canonical_url: "https://ShooNhee.site",
                      domain: "shop.example.com",
                      button_index: 0,
                    },
                  }),
                  buttons: zanton,
                },
              },
            },
            { quoted: ftroliQuoted },
          );
        } catch (v15Error) {
          console.log(v15Error);
          await sendFallback(
            m,
            sock,
            text,
            imageBuffer,
            thumbBuffer,
            botConfig,
            "V15",
          );
        }
        break;
      }

      /* ─────────────────────────── DEFAULT — Plain Text Fallback ─────────────────────────── */
      default:
        await m.reply(text);
        break;
    }

    /* ═══════════════════════════════════════════════════════════════════════════
     *  AUDIO APPENDIX — Menu Sound Effect
     * ═══════════════════════════════════════════════════════════════════════════ */
    const audioEnabled = db.setting("audioMenu") !== false;
    if (audioEnabled) {
      const audioPath = path.join(
        process.cwd(),
        "assets",
        "audio",
        "ShooNhee.mp3",
      );
      if (fs.existsSync(audioPath)) {
        try {
          await sock.sendMessage(
            m.chat,
            {
              audio: fs.readFileSync(audioPath),
              mimetype: "audio/mpeg",
              contextInfo: getContextInfo(botConfig, m, thumbBuffer),
            },
            { quoted: getVerifiedQuoted(botConfig) },
          );
        } catch (_ffmpegErr) {
          /* retry without special flags */
          await sock.sendMessage(
            m.chat,
            {
              audio: fs.readFileSync(audioPath),
              mimetype: "audio/mpeg",
              contextInfo: getContextInfo(botConfig, m, thumbBuffer),
            },
            { quoted: getVerifiedQuoted(botConfig) },
          );
        }
      }
    }
  } catch (error) {
    console.error("[Menu] Error on command execution:", error.message);
  }
}

/* ═══════════════════════════════════════════════════════════════════════════════
 *  SECTION 12 — MODULE EXPORT
 * ═══════════════════════════════════════════════════════════════════════════════ */

export default {
  config: pluginConfig,
  handler,
};
