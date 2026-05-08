import config from "../../config.js";
import {
  formatUptime,
  getTimeGreeting,
} from "../../src/lib/Shon-formatter.js";
import {
  getCommandsByCategory,
  getCategories,
  getPluginCount,
  getPlugin,
  getPluginsByCategory,
} from "../../src/lib/Shon-plugins.js";
import { getDatabase } from "../../src/lib/Shon-database.js";
import { getCasesByCategory, getCaseCount } from "../../case/ShooNhee.js";

import fs from "fs";
import path from "path";

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║                        LAZY-LOADED MODULES                                   ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

let _sharp = null;

async function getSharp() {
  if (!_sharp) _sharp = (await import("sharp")).default;
  return _sharp;
}

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║                        PLUGIN CONFIGURATION                                  ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

const pluginConfig = {
  name: "allmenu",
  alias: ["fullmenu", "am", "allcommand", "semua"],
  category: "main",
  description: "Menampilkan semua command lengkap per kategori",
  usage: ".allmenu",
  example: ".allmenu",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  energi: 0,
  isEnabled: true,
};

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║                    AESTHETIC SYMBOL MANAGER v2.0                             ║
// ║  ── Per-render consistency · Cross-platform unicode · WhatsApp-safe ──       ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

const SYMBOL_SETS = [
  {
    name: "box-premium",
    tl: "╔", tr: "╗", bl: "╚", br: "╝",
    h: "═", v: "║",
    sepL: "╟", sepR: "╢", sepH: "─",
    teeL: "╠", teeB: "╩",
    bullet: "◈", arrow: "▸", diamond: "◆", star: "✦",
    bracketL: "❰", bracketR: "❱",
    dash: "─", dot: "•", marker: "◆",
  },
  {
    name: "round-soft",
    tl: "╭", tr: "╮", bl: "╰", br: "╯",
    h: "─", v: "│",
    sepL: "├", sepR: "┤", sepH: "─",
    teeL: "├", teeB: "┴",
    bullet: "⦿", arrow: "▸", diamond: "◆", star: "✦",
    bracketL: "❬", bracketR: "❭",
    dash: "─", dot: "•", marker: "◆",
  },
  {
    name: "heavy-block",
    tl: "▛", tr: "▜", bl: "▙", br: "▟",
    h: "▀", v: "▌",
    sepL: "▌", sepR: "▐", sepH: "▄",
    teeL: "▌", teeB: "▀",
    bullet: "◉", arrow: "▻", diamond: "◈", star: "✶",
    bracketL: "❰", bracketR: "❱",
    dash: "▀", dot: "·", marker: "◈",
  },
  {
    name: "geo-future",
    tl: "◤", tr: "◥", bl: "◣", br: "◢",
    h: "━", v: "┃",
    sepL: "┣", sepR: "┫", sepH: "━",
    teeL: "┣", teeB: "┻",
    bullet: "●", arrow: "→", diamond: "◆", star: "✷",
    bracketL: "〈", bracketR: "〉",
    dash: "━", dot: "·", marker: "◆",
  },
  {
    name: "elegant-thin",
    tl: "╓", tr: "╖", bl: "╙", br: "╜",
    h: "─", v: "│",
    sepL: "├", sepR: "┤", sepH: "─",
    teeL: "├", teeB: "└",
    bullet: "⬡", arrow: "▹", diamond: "◊", star: "✧",
    bracketL: "❮", bracketR: "❯",
    dash: "─", dot: "·", marker: "◊",
  },
];

function pickSymbolSet() {
  const idx = Math.floor(Math.random() * SYMBOL_SETS.length);
  return SYMBOL_SETS[idx];
}

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║                       CATEGORY DATA REGISTRY                                 ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

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
  store: "🏪",
  premium: "💎",
  convert: "🔄",
  economy: "💰",
  cek: "📋",
  ephoto: "🎨",
  jpm: "📢",
  pushkontak: "📱",
};

const CATEGORY_ORDER = [
  "owner",
  "main",
  "utility",
  "tools",
  "fun",
  "game",
  "download",
  "search",
  "sticker",
  "media",
  "ai",
  "group",
  "religi",
  "info",
  "cek",
  "economy",
  "user",
  "canvas",
  "random",
  "premium",
];

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║                        MODE FILTERING CONFIG                                 ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

const DEFAULT_MODE_ALLOWED = {
  md: null,
  store: ["main", "group", "sticker", "owner", "store"],
  pushkontak: ["main", "group", "sticker", "owner", "pushkontak"],
};

const DEFAULT_MODE_EXCLUDE = {
  md: ["panel", "pushkontak", "store"],
  store: null,
  pushkontak: null,
};

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║                        TEXT TRANSFORM UTILITIES                              ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

function toSmallCaps(text) {
  return text.toUpperCase();
}

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║                     COMMAND METADATA RESOLVER                                ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

function getCommandSymbols(cmdName) {
  const plugin = getPlugin(cmdName);
  if (!plugin || !plugin.config) return "";

  const symbols = [];
  if (plugin.config.isOwner) symbols.push("Ⓞ");
  if (plugin.config.isPremium) symbols.push("ⓟ");
  if (plugin.config.limit && plugin.config.limit > 0) symbols.push("Ⓛ");
  if (plugin.config.isAdmin) symbols.push("Ⓐ");

  return symbols.length > 0 ? " " + symbols.join(" ") : "";
}

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║                        CONTEXT INFO BUILDERS                                 ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

function buildBaseContextInfo(botConfig, m) {
  const saluranId = botConfig.saluran?.id || "120363208449943317@newsletter";
  const saluranName =
    botConfig.saluran?.name || botConfig.bot?.name || "ShooNhee-AI";

  return {
    mentionedJid: [m.sender],
    forwardingScore: 9999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
      newsletterJid: saluranId,
      newsletterName: saluranName,
      serverMessageId: 127,
    },
  };
}

function buildFullContextInfo(botConfig, m, imageBuffer) {
  const saluranId = botConfig.saluran?.id || "120363208449943317@newsletter";
  const saluranName =
    botConfig.saluran?.name || botConfig.bot?.name || "ShooNhee-AI";
  const saluranLink = botConfig.saluran?.link || "";

  return {
    mentionedJid: [m.sender],
    forwardingScore: 9999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
      newsletterJid: saluranId,
      newsletterName: saluranName,
      serverMessageId: 127,
    },
    externalAdReply: {
      title: botConfig.bot?.name || "ShooNhee-AI",
      body: `Owner: ${botConfig.owner?.name || "Lucky Archz"}`,
      sourceUrl: saluranLink,
      mediaType: 1,
      thumbnail: imageBuffer,
      renderLargerThumbnail: true,
    },
  };
}

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║                       MODE FILTER RESOLVER                                   ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

async function resolveModeFilters() {
  let modeAllowedMap = { ...DEFAULT_MODE_ALLOWED };
  let modeExcludeMap = { ...DEFAULT_MODE_EXCLUDE };

  try {
    const { default: botmodePlugin } = await import("../group/botmode.js");
    if (botmodePlugin && botmodePlugin.MODES) {
      const modes = botmodePlugin.MODES;
      modeAllowedMap = {};
      modeExcludeMap = {};
      for (const [key, val] of Object.entries(modes)) {
        modeAllowedMap[key] = val.allowedCategories;
        modeExcludeMap[key] = val.excludeCategories;
      }
    }
  } catch (_e) {
    /* deliberate no-op: fallback to default mode filters */
  }

  return { modeAllowedMap, modeExcludeMap };
}

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║                      CATEGORY CATALOG BUILDER                                ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

function buildVisibleCategories(
  sortedCategories,
  commandsByCategory,
  casesByCategory,
  m,
  allowedCategories,
  excludeCategories
) {
  return sortedCategories.filter((cat) => {
    if (cat === "owner" && !m.isOwner) return false;
    if (
      allowedCategories &&
      !allowedCategories.includes(cat.toLowerCase())
    )
      return false;
    if (
      excludeCategories &&
      excludeCategories.includes(cat.toLowerCase())
    )
      return false;

    const cmds = [
      ...(commandsByCategory[cat] || []),
      ...(casesByCategory[cat] || []),
    ];
    return cmds.length > 0;
  });
}

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║                     PREMIUM MENU RENDER ENGINE                               ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

function renderHeader(s, botConfig, m, totalFeatures, userRole, roleEmoji) {
  const botName = botConfig.bot?.name || "ShooNhee-AI";
  const greeting = getTimeGreeting();

  return (
    `${s.tl}${s.h}${s.h}${s.marker} *${botName}* ${s.marker}${s.h}${s.h}${s.tr}\n` +
    `${s.v} ${s.star} ${greeting}, *@${m.pushName || "User"}* ${s.v.padStart(2)}\n` +
    `${s.v} ${roleEmoji} Role: \`${userRole}\` ${s.v.padStart(2)}\n` +
    `${s.v} ${s.diamond} Total Fitur: \`${totalFeatures}\` cmds ${s.v.padStart(2)}\n` +
    `${s.bl}${s.dash}${s.dash}${s.teeB}${s.dash}${s.dash}${s.br}\n\n` +
    `Aku ${botName}, bot WhatsApp yang siap bantu kamu.\n` +
    `Kamu bisa pakai aku buat cari info, ambil data, atau bantu hal-hal sederhana langsung lewat WhatsApp ${s.bullet} praktis tanpa ribet.\n\n`
  );
}

function renderLegend(s) {
  return (
    `${s.tl}${s.h}${s.h}〔 *KETERANGAN* 〕${s.h}${s.h}${s.tr}\n` +
    `${s.v} ${s.dot} Ⓞ = Owner Only${s.v.padStart(2)}\n` +
    `${s.v} ${s.dot} ⓟ = Premium Only${s.v.padStart(2)}\n` +
    `${s.v} ${s.dot} Ⓛ = Limit Required${s.v.padStart(2)}\n` +
    `${s.v} ${s.dot} Ⓐ = Admin Only${s.v.padStart(2)}\n` +
    `${s.bl}${s.dash}${s.dash}${s.teeB}${s.dash}${s.dash}${s.br}\n\n`
  );
}

function renderCategorySection(s, emoji, categoryName, allCmds, prefix) {
  let section = `${s.tl}${s.h}${s.h}〔 ${emoji} *${categoryName}* 〕${s.h}${s.h}${s.tr}\n`;
  for (const cmd of allCmds) {
    const symbols = getCommandSymbols(cmd);
    section += ` ${s.v} ${s.bullet} *${prefix}${cmd}*${symbols}\n`;
  }
  section += `${s.bl}${s.dash}${s.dash}${s.teeB}${s.dash}${s.dash}${s.br}\n\n`;
  return section;
}

function renderFooter(botConfig) {
  const botName = botConfig.bot?.name || "ShooNhee-AI";
  const developer = botConfig.bot?.developer || "Lucky Archz";
  return (
    `_© ${botName} | ${new Date().getFullYear()}_\n` +
    `_ᴅᴇᴠᴇʟᴏᴘᴇʀ: ${developer}_`
  );
}

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║                     INTERACTIVE MESSAGE FACTORIES                            ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

async function buildInteractiveCategoryRows(
  visibleCategories,
  commandsByCategory,
  casesByCategory,
  prefix
) {
  return visibleCategories.map((cat) => {
    const cmds = [
      ...(commandsByCategory[cat] || []),
      ...(casesByCategory[cat] || []),
    ];
    const emoji = CATEGORY_EMOJIS[cat] || "📋";
    return {
      title: `${emoji} ${toSmallCaps(cat)}`,
      description: `${cmds.length} commands`,
      id: `${prefix}menucat ${cat}`,
    };
  });
}

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║                        MAIN HANDLER ENTRYPOINT                               ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

async function handler(m, { sock, config: botConfig, db, uptime }) {
  // ── Resolve configuration ─────────────────────────────────────────
  const prefix = botConfig.command?.prefix || ".";
  const user = db.getUser(m.sender);
  const groupData = m.isGroup ? db.getGroup(m.chat) || {} : {};
  const botMode = groupData.botMode || "md";

  // ── Resolve catalogs ──────────────────────────────────────────────
  const categories = getCategories();
  const commandsByCategory = getCommandsByCategory();
  const casesByCategory = getCasesByCategory();

  // ── Compute statistics ────────────────────────────────────────────
  let totalCommands = 0;
  for (const category of categories) {
    totalCommands += (commandsByCategory[category] || []).length;
  }
  const totalCases = getCaseCount();
  const totalFeatures = totalCommands + totalCases;

  // ── Resolve user role ─────────────────────────────────────────────
  let userRole = "User";
  let roleEmoji = "👤";
  if (m.isOwner) {
    userRole = "Owner";
    roleEmoji = "👑";
  } else if (m.isPremium) {
    userRole = "Premium";
    roleEmoji = "💎";
  }

  // ── Sort categories ───────────────────────────────────────────────
  const sortedCategories = [...categories].sort((a, b) => {
    const indexA = CATEGORY_ORDER.indexOf(a);
    const indexB = CATEGORY_ORDER.indexOf(b);
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });

  // ── Resolve mode filters ──────────────────────────────────────────
  const { modeAllowedMap, modeExcludeMap } = await resolveModeFilters();
  const allowedCategories = modeAllowedMap[botMode];
  const excludeCategories = modeExcludeMap[botMode] || [];

  // ── Bind aesthetic system ─────────────────────────────────────────
  const S = pickSymbolSet();

  // ── Render menu content ───────────────────────────────────────────
  let txt = renderHeader(S, botConfig, m, totalFeatures, userRole, roleEmoji);
  txt += renderLegend(S);

  for (const category of sortedCategories) {
    if (category === "owner" && !m.isOwner) continue;
    if (
      allowedCategories &&
      !allowedCategories.includes(category.toLowerCase())
    )
      continue;
    if (
      excludeCategories &&
      excludeCategories.includes(category.toLowerCase())
    )
      continue;

    const pluginCmds = commandsByCategory[category] || [];
    const caseCmds = casesByCategory[category] || [];
    const allCmds = [...pluginCmds, ...caseCmds];
    if (allCmds.length === 0) continue;

    const emoji = CATEGORY_EMOJIS[category] || "📋";
    const categoryName = toSmallCaps(category);

    txt += renderCategorySection(S, emoji, categoryName, allCmds, prefix);
  }

  txt += renderFooter(botConfig);

  // ── Load image assets ─────────────────────────────────────────────
  const imagePath = path.join(process.cwd(), "assets", "images", "ShooNhee.jpg");
  const thumbPath = path.join(process.cwd(), "assets", "images", "ShooNhee2.jpg");

  const imageBuffer = fs.existsSync(imagePath) ? fs.readFileSync(imagePath) : null;
  const thumbBuffer = fs.existsSync(thumbPath) ? fs.readFileSync(thumbPath) : null;

  // ── Resolve UI variant ────────────────────────────────────────────
  const savedVariant = db.setting("allmenuVariant");
  const allmenuVariant = savedVariant || botConfig.ui?.allmenuVariant || 2;

  // ── Build shared context info ─────────────────────────────────────
  const fullContextInfo = buildFullContextInfo(botConfig, m, imageBuffer);

  // ╔══════════════════════════════════════════════════════════════════╗
  // ║              DISPATCH BY UI VARIANT                              ║
  // ╚══════════════════════════════════════════════════════════════════╝

  try {
    switch (allmenuVariant) {
      // ── Variant 1 · Plain text reply ──────────────────────
      case 1:
        await m.reply(txt);
        break;

      // ── Variant 2 · Image with rich context ───────────────
      case 2:
        if (imageBuffer) {
          await sock.sendMessage(
            m.chat,
            {
              image: imageBuffer,
              caption: txt,
              contextInfo: fullContextInfo,
            },
            { quoted: m }
          );
        } else {
          await sock.sendMessage(
            m.chat,
            {
              text: txt,
              contextInfo: fullContextInfo,
            },
            { quoted: m }
          );
        }
        break;

      // ── Variant 3 · Document-style delivery ───────────────
      case 3: {
        let resizedThumb = thumbBuffer;
        if (thumbBuffer) {
          try {
            resizedThumb = await (await getSharp())(thumbBuffer)
              .resize(300, 300, { fit: "cover" })
              .jpeg({ quality: 80 })
              .toBuffer();
          } catch {
            resizedThumb = thumbBuffer;
          }
        }
        await sock.sendMessage(
          m.chat,
          {
            document: imageBuffer || Buffer.from(""),
            mimetype: "image/png",
            fileLength: 999999999999,
            fileSize: 999999999999,
            fileName: `${toSmallCaps(botConfig.bot?.name || "ShooNhee-AI")} \u2014 \u0280\u1d07\u1d4f \u1d0d\u1d07\u0500\u1d1c`,
            caption: txt,
            jpegThumbnail: resizedThumb,
            contextInfo: fullContextInfo,
          },
          { quoted: m }
        );
        break;
      }

      // ── Variant 4 · Interactive native flow ───────────────
      case 4: {
        const { generateWAMessageFromContent, proto } = await import("ShooNhee");

        const visibleCategories = buildVisibleCategories(
          sortedCategories,
          commandsByCategory,
          casesByCategory,
          m,
          allowedCategories,
          excludeCategories
        );

        const categoryRows = await buildInteractiveCategoryRows(
          visibleCategories,
          commandsByCategory,
          casesByCategory,
          prefix
        );

        const buttons = [
          {
            name: "single_select",
            buttonParamsJson: JSON.stringify({
              title: "◈ ᴘɪʟɪʜ ᴋᴀᴛᴇɢᴏʀɪ",
              sections: [{ title: "❰ DAFTAR KATEGORI ❱", rows: categoryRows }],
            }),
          },
          {
            name: "quick_reply",
            buttonParamsJson: JSON.stringify({
              display_text: "◂ ᴋᴇᴍʙᴀʟɪ ᴋᴇ ᴍᴇɴᴜ",
              id: `${prefix}menu`,
            }),
          },
        ];

        let headerMedia = null;
        if (imageBuffer) {
          try {
            const { prepareWAMessageMedia } = await import("ShooNhee");
            headerMedia = await prepareWAMessageMedia(
              { image: imageBuffer },
              { upload: sock.waUploadToServer }
            );
          } catch {}
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
                interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                  body: proto.Message.InteractiveMessage.Body.fromObject({
                    text: txt,
                  }),
                  footer: proto.Message.InteractiveMessage.Footer.fromObject({
                    text: `© ${botConfig.bot?.name || "ShooNhee-AI"}`,
                  }),
                  header: proto.Message.InteractiveMessage.Header.fromObject({
                    title: botConfig.bot?.name || "ShooNhee-AI",
                    hasMediaAttachment: !!headerMedia,
                    ...(headerMedia || {}),
                  }),
                  nativeFlowMessage:
                    proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                      buttons,
                    }),
                  contextInfo: fullContextInfo,
                }),
              },
            },
          },
          { userJid: m.sender, quoted: m }
        );

        await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
        break;
      }

      // ── Variant 5 · Interactive message alternate ─────────
      case 5: {
        await sock.sendMessage(
          m.chat,
          {
            interactiveMessage: {
              title: txt,
              footer: botConfig.bot?.name || "ShooNhee-AI",
              image: thumbBuffer,
              contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 777,
                isForwarded: true,
              },
              externalAdReply: {
                title: botConfig.bot?.name || "ShooNhee-AI",
                body: `Owner: ${botConfig.owner?.name || "Lucky Archz"}`,
                mediaType: 1,
                thumbnail: imageBuffer,
                mediaUrl: " X ",
                sourceUrl: botConfig.info?.website,
                renderLargerThumbnail: true,
              },
              nativeFlowMessage: {
                messageParamsJson: JSON.stringify({
                  limited_time_offer: {
                    text: "Hai " + m.pushName,
                    url: "https://ShooNhee.site",
                    copy_code: botConfig.owner?.name || "ShooNhee-AI",
                    expiration_time: Date.now(),
                  },
                  bottom_sheet: {
                    in_thread_buttons_limit: 2,
                    divider_indices: [1, 2, 3, 4, 5, 999],
                    list_title: "zanxnpc",
                    button_title: "zanxnpc",
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
                    name: "quick_reply",
                    buttonParamsJson: JSON.stringify({
                      display_text: "Kembali Ke Menu Utama",
                      id: prefix + "menu",
                    }),
                  },
                ],
              },
            },
          },
          { quoted: m }
        );
        break;
      }

      // ── Fallback · Image with context ─────────────────────
      default:
        if (imageBuffer) {
          await sock.sendMessage(
            m.chat,
            {
              image: imageBuffer,
              caption: txt,
              contextInfo: fullContextInfo,
            },
            { quoted: m }
          );
        } else {
          await m.reply(txt);
        }
    }
  } catch (error) {
    console.error("[AllMenu] Dispatch error:", error.message);
    if (imageBuffer) {
      await sock.sendMessage(
        m.chat,
        {
          image: imageBuffer,
          caption: txt,
          contextInfo: buildBaseContextInfo(botConfig, m),
        },
        { quoted: m }
      );
    } else {
      await m.reply(txt);
    }
  }
}

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║                            MODULE EXPORT                                     ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

export { pluginConfig as config, handler };
