import config from "../../config.js";
import {
  getCommandsByCategory,
  getCategories,
} from "../../src/lib/Shon-plugins.js";
import { getDatabase } from "../../src/lib/Shon-database.js";

import fs from "fs";
import path from "path";

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║                        PLUGIN CONFIGURATION                                  ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

const pluginConfig = {
  name: "menucat",
  alias: ["mc", "category", "cat"],
  category: "main",
  description: "Menampilkan commands dalam kategori tertentu",
  usage: ".menucat <kategori>",
  example: ".menucat tools",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 3,
  energi: 0,
  isEnabled: true,
};

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║                    AESTHETIC SYMBOL MANAGER v2.0                             ║
// ║  ── Single-render consistency · Cross-platform unicode · WhatsApp-safe ──   ║
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
  jpm: "📢",
  pushkontak: "📱",
  ephoto: "🎨",
  store: "🛒",
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
  "jpm",
  "pushkontak",
  "panel",
  "ephoto",
  "store",
];

const DEFAULT_MODE_EXCLUDES = {
  md: ["panel", "pushkontak", "store"],
  store: ["panel", "pushkontak", "jpm", "ephoto", "cpanel"],
  pushkontak: ["panel", "store", "jpm", "ephoto", "cpanel"],
  cpanel: ["pushkontak", "store", "jpm", "ephoto"],
};

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║                        TEXT TRANSFORM UTILITIES                              ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

function toMonoUpperBold(text) {
  return text.toUpperCase();
}

function toSmallCaps(text) {
  return text.toUpperCase();
}

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║                         THUMBNAIL ASSET CACHE                                ║
// ║  ── Eager-load on module init · Silent-fail fallback · Single-read ──       ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

let cachedThumb = null;

(function warmThumbnailCache() {
  try {
    const thumbPath = path.join(
      process.cwd(),
      "assets",
      "images",
      "ShooNhee2.jpg"
    );
    if (fs.existsSync(thumbPath)) {
      cachedThumb = fs.readFileSync(thumbPath);
    }
  } catch (_e) {
    /* deliberate no-op: thumbnail is cosmetic */
  }
})();

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║                        CONTEXT INFO BUILDERS                                 ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

function buildBaseContextInfo() {
  const saluranId = config.saluran?.id || "120363399938739678@newsletter";
  const saluranName = config.saluran?.name || config.bot?.name || "ShooNhee-AI";
  const botName = config.bot?.name || "ShooNhee-AI";

  return {
    forwardingScore: 9999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
      newsletterJid: saluranId,
      newsletterName: saluranName,
      serverMessageId: 127,
    },
    externalAdReply: {
      title: "Kategori Menu",
      body: botName,
      sourceUrl: config.saluran?.link || "",
      mediaType: 1,
      renderLargerThumbnail: false,
      thumbnail: cachedThumb,
    },
  };
}

function buildFullContextInfo(m, thumbBuffer, title, body) {
  const saluranId = config.saluran?.id || "120363399938739678@newsletter";
  const saluranName = config.saluran?.name || config.bot?.name || "ShooNhee-AI";
  const saluranLink = config.saluran?.link || "";
  const botName = config.bot?.name || "ShooNhee-AI";

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
      title: title || "Kategori Menu",
      body: body || botName,
      sourceUrl: saluranLink,
      mediaType: 1,
      renderLargerThumbnail: false,
      thumbnail: thumbBuffer || cachedThumb,
    },
  };
}

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║                        MODE EXCLUDE RESOLVER                                 ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

async function resolveModeExcludeMap() {
  let modeExcludeMap = { ...DEFAULT_MODE_EXCLUDES };

  try {
    const { default: botmodePlugin } = await import("../group/botmode.js");
    if (botmodePlugin?.MODES) {
      modeExcludeMap = {};
      for (const [key, val] of Object.entries(botmodePlugin.MODES)) {
        if (val.excludeCategories) {
          modeExcludeMap[key] = val.excludeCategories;
        }
      }
    }
  } catch (_e) {
    /* fallback silently to default mode exclusions */
  }

  return modeExcludeMap;
}

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║                     PREMIUM MENU RENDER ENGINE                               ║
// ║  ── Per-render symbol binding · Declarative section blocks ──               ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

function renderCategoryList(s, prefix, visibleCats, commandsByCategory, casesByCategory) {
  const header =
    `${s.tl}${s.h}${s.h}${s.marker} *${toMonoUpperBold("DAFTAR KATEGORI")}* ${s.marker}${s.h}${s.h}${s.tr}\n` +
    `${s.v} ${s.arrow} Ketik \`${prefix}menucat <kategori>\`${s.v.padStart(2)}\n`;

  const divider = `${s.teeL}${s.sepH}${s.sepH}〔 *${toMonoUpperBold("KATEGORI")}* 〕${s.sepH}${s.sepH}${s.marker}\n`;

  const bodyLines = visibleCats.map((cat) => {
    const pluginCmds = commandsByCategory[cat] || [];
    const caseCmds = casesByCategory[cat] || [];
    const totalCmds = pluginCmds.length + caseCmds.length;
    const emoji = CATEGORY_EMOJIS[cat] || "📁";
    return ` ${s.v} ${emoji} ${cat.toUpperCase()} \`${totalCmds}\` cmds`;
  });

  const footer =
    `${s.bl}${s.dash}${s.dash}${s.teeB}${s.dash}${s.dash}${s.br}\n\n` +
    `${s.star} _Contoh: \`${prefix}menucat tools\`_`;

  return header + "\n" + divider + bodyLines.join("\n") + "\n" + footer;
}

function renderCommandList(s, prefix, emoji, matchedCat, allCommands, pluginCommands, caseCommands) {
  const header = `${s.tl}${s.h}${s.h}〔 ${emoji} *${matchedCat.toUpperCase()}* 〕${s.h}${s.h}${s.tr}\n`;

  const bodyLines = allCommands.map((cmd) => ` ${s.v} \`${prefix}${cmd}\``);

  let footer =
    `\n${s.bl}${s.dash}${s.dash}${s.teeB}${s.dash}${s.dash}${s.br}\n` +
    `${s.star} Total: \`${allCommands.length}\` commands`;

  if (caseCommands.length > 0) {
    footer += `\n${s.diamond} (\`${pluginCommands.length}\` plugin + \`${caseCommands.length}\` case)`;
  }

  return header + bodyLines.join("\n") + footer;
}

function renderNotFoundError(s, prefix, categoryArg) {
  return (
    `${s.tl}${s.h}${s.h}${s.marker} *${toMonoUpperBold("KATEGORI TIDAK DITEMUKAN")}* ${s.marker}${s.h}${s.h}${s.tr}\n` +
    `${s.v} ${s.dot} Kategori \`${categoryArg}\` tidak tersedia.${s.v.padStart(2)}\n` +
    `${s.v} ${s.dot} Ketik \`${prefix}menucat\` untuk melihat daftar.${s.v.padStart(2)}\n` +
    `${s.bl}${s.dash}${s.dash}${s.teeB}${s.dash}${s.dash}${s.br}`
  );
}

function renderAccessDenied(s) {
  return (
    `${s.tl}${s.h}${s.h}${s.marker} *${toMonoUpperBold("AKSES DITOLAK")}* ${s.marker}${s.h}${s.h}${s.tr}\n` +
    `${s.v} ${s.dot} Kategori ini hanya untuk owner.${s.v.padStart(2)}\n` +
    `${s.bl}${s.dash}${s.dash}${s.teeB}${s.dash}${s.dash}${s.br}`
  );
}

function renderEmptyCategory(s, matchedCat) {
  return (
    `${s.tl}${s.h}${s.h}${s.marker} *${toMonoUpperBold("KATEGORI KOSONG")}* ${s.marker}${s.h}${s.h}${s.tr}\n` +
    `${s.v} ${s.dot} Kategori \`${matchedCat}\` tidak memiliki command.${s.v.padStart(2)}\n` +
    `${s.bl}${s.dash}${s.dash}${s.teeB}${s.dash}${s.dash}${s.br}`
  );
}

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║                    INTERACTIVE MESSAGE FACTORIES                             ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

async function relayCategoryInteractive(
  m,
  sock,
  txt,
  visibleCats,
  prefix,
  botName,
  commandsByCategory,
  casesByCategory,
  buildCtx
) {
  const { generateWAMessageFromContent, proto } = await import("ShooNhee");

  const catRows = visibleCats.map((cat) => {
    const totalCmds =
      (commandsByCategory[cat] || []).length +
      (casesByCategory[cat] || []).length;
    const emoji = CATEGORY_EMOJIS[cat] || "📁";
    return {
      title: `${emoji} ${cat.toUpperCase()}`,
      description: `${totalCmds} commands`,
      id: `${prefix}menucat ${cat}`,
    };
  });

  const buttons = [
    {
      name: "single_select",
      buttonParamsJson: JSON.stringify({
        title: "◈ PILIH KATEGORI",
        sections: [{ title: "❰ DAFTAR KATEGORI ❱", rows: catRows }],
      }),
    },
    {
      name: "quick_reply",
      buttonParamsJson: JSON.stringify({
        display_text: "◂ KEMBALI KE MENU",
        id: `${prefix}menu`,
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
          interactiveMessage: proto.Message.InteractiveMessage.fromObject({
            body: proto.Message.InteractiveMessage.Body.fromObject({
              text: txt,
            }),
            footer: proto.Message.InteractiveMessage.Footer.fromObject({
              text: `© ${botName}`,
            }),
            header: proto.Message.InteractiveMessage.Header.fromObject({
              title: "◈ Daftar Kategori",
              subtitle: `${visibleCats.length} kategori`,
              hasMediaAttachment: false,
            }),
            nativeFlowMessage:
              proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                buttons,
              }),
            contextInfo: buildCtx(
              "Daftar Kategori",
              `${visibleCats.length} kategori tersedia`
            ),
          }),
        },
      },
    },
    { userJid: m.sender, quoted: m }
  );

  return await sock.relayMessage(m.chat, msg.message, {
    messageId: msg.key.id,
  });
}

async function relayCommandsInteractive(
  m,
  sock,
  txt,
  allCommands,
  matchedCat,
  emoji,
  prefix,
  botName,
  buildCtx
) {
  const { generateWAMessageFromContent, proto } = await import("ShooNhee");

  const cmdRows = allCommands.map((cmd) => ({
    title: `${prefix}${toSmallCaps(cmd)}`,
    description: `Command ${matchedCat}`,
    id: `${prefix}${cmd}`,
  }));

  const chunkSize = 10;
  const sections = [];
  for (let i = 0; i < cmdRows.length; i += chunkSize) {
    const chunk = cmdRows.slice(i, i + chunkSize);
    const partNum = Math.floor(i / chunkSize) + 1;
    sections.push({
      title: `${emoji} ${matchedCat.toUpperCase()} \u2014 Bagian ${partNum}`,
      rows: chunk,
    });
  }

  const buttons = [
    ...sections.map((sec) => ({
      name: "single_select",
      buttonParamsJson: JSON.stringify({
        title: `${emoji} PILIH COMMAND`,
        sections: [sec],
      }),
    })),
    {
      name: "quick_reply",
      buttonParamsJson: JSON.stringify({
        display_text: "◂ KEMBALI KE KATEGORI",
        id: `${prefix}menucat`,
      }),
    },
    {
      name: "quick_reply",
      buttonParamsJson: JSON.stringify({
        display_text: "◂ KEMBALI KE MENU",
        id: `${prefix}menu`,
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
          interactiveMessage: proto.Message.InteractiveMessage.fromObject({
            body: proto.Message.InteractiveMessage.Body.fromObject({
              text: txt,
            }),
            footer: proto.Message.InteractiveMessage.Footer.fromObject({
              text: `© ${botName}`,
            }),
            header: proto.Message.InteractiveMessage.Header.fromObject({
              title: `${emoji} ${matchedCat.toUpperCase()}`,
              subtitle: `${allCommands.length} commands`,
              hasMediaAttachment: false,
            }),
            nativeFlowMessage:
              proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                buttons,
              }),
            contextInfo: buildCtx(
              `${emoji} ${matchedCat}`,
              `${allCommands.length} commands`
            ),
          }),
        },
      },
    },
    { userJid: m.sender, quoted: m }
  );

  return await sock.relayMessage(m.chat, msg.message, {
    messageId: msg.key.id,
  });
}

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║                        MAIN HANDLER ENTRYPOINT                               ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

async function handler(m, { sock, db }) {
  // ── Resolve configuration ─────────────────────────────────────────
  const prefix = config.command?.prefix || ".";
  const args = m.args || [];
  const categoryArg = args[0]?.toLowerCase();

  // ── Resolve catalogs ──────────────────────────────────────────────
  const categories = getCategories();
  const commandsByCategory = getCommandsByCategory();

  const { getCasesByCategory } = await import("../../case/ShooNhee.js");
  const casesByCategory = getCasesByCategory();

  // ── Resolve UI variant ────────────────────────────────────────────
  const savedVariant = db.setting("menucatVariant");
  const menucatVariant = savedVariant || config.ui?.menucatVariant || 2;

  // ── Resolve channel metadata ──────────────────────────────────────
  const saluranId = config.saluran?.id || "120363399938739678@newsletter";
  const saluranName = config.saluran?.name || config.bot?.name || "ShooNhee-AI";
  const saluranLink = config.saluran?.link || "";
  const botName = config.bot?.name || "ShooNhee-AI";

  // ── Load image assets ─────────────────────────────────────────────
  const imagePath = path.join(
    process.cwd(),
    "assets",
    "images",
    "ShooNhee.jpg"
  );
  const thumbPath = path.join(
    process.cwd(),
    "assets",
    "images",
    "ShooNhee2.jpg"
  );
  const imageBuffer = fs.existsSync(imagePath) ? fs.readFileSync(imagePath) : null;
  const thumbBuffer = fs.existsSync(thumbPath) ? fs.readFileSync(thumbPath) : null;

  // ── Bind aesthetic system for this render ─────────────────────────
  const S = pickSymbolSet();
  const buildCtx = (title, body) => buildFullContextInfo(m, thumbBuffer, title, body);

  // ╔══════════════════════════════════════════════════════════════════╗
  // ║              BRANCH A · CATEGORY LIST VIEW                       ║
  // ╚══════════════════════════════════════════════════════════════════╝

  if (!categoryArg) {
    // ── Resolve bot mode exclusions ───────────────────────────────
    const groupData = m.isGroup ? db.getGroup(m.chat) || {} : {};
    const botMode = groupData.botMode || "md";
    const modeExcludeMap = await resolveModeExcludeMap();
    const excludeCategories = modeExcludeMap[botMode] || modeExcludeMap.md;

    // ── Build unified category catalog ────────────────────────────
    const allCats = [...new Set([...categories, ...Object.keys(casesByCategory)])];
    const sortedCats = allCats.sort((a, b) => {
      const indexA = CATEGORY_ORDER.indexOf(a);
      const indexB = CATEGORY_ORDER.indexOf(b);
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });

    const visibleCats = sortedCats.filter((cat) => {
      if (cat === "owner" && !m.isOwner) return false;
      if (excludeCategories.includes(cat.toLowerCase())) return false;
      const totalCmds =
        (commandsByCategory[cat] || []).length +
        (casesByCategory[cat] || []).length;
      return totalCmds > 0;
    });

    // ── Render menu ───────────────────────────────────────────────
    const txt = renderCategoryList(
      S, prefix, visibleCats, commandsByCategory, casesByCategory
    );

    // ── Dispatch by variant ───────────────────────────────────────
    try {
      switch (menucatVariant) {
        // ── Variant 1 · Plain text reply ──────────────────────
        case 1:
          return await m.reply(txt);

        // ── Variant 2 · Rich context text ─────────────────────
        case 2:
          return await sock.sendMessage(
            m.chat,
            {
              text: txt,
              contextInfo: buildCtx(
                "Daftar Kategori",
                `${visibleCats.length} kategori tersedia`
              ),
            },
            { quoted: m }
          );

        // ── Variant 3 · Image with caption ────────────────────
        case 3:
          if (imageBuffer) {
            return await sock.sendMessage(
              m.chat,
              {
                image: imageBuffer,
                caption: txt,
                contextInfo: buildCtx(
                  "Daftar Kategori",
                  `${visibleCats.length} kategori tersedia`
                ),
              },
              { quoted: m }
            );
          }
          return await sock.sendMessage(
            m.chat,
            {
              text: txt,
              contextInfo: buildCtx(
                "Daftar Kategori",
                `${visibleCats.length} kategori tersedia`
              ),
            },
            { quoted: m }
          );

        // ── Variant 4 · Interactive native flow ───────────────
        case 4:
          return await relayCategoryInteractive(
            m, sock, txt, visibleCats, prefix, botName,
            commandsByCategory, casesByCategory, buildCtx
          );

        // ── Fallback · Rich context text ──────────────────────
        default:
          return await sock.sendMessage(
            m.chat,
            {
              text: txt,
              contextInfo: buildCtx(
                "Daftar Kategori",
                `${visibleCats.length} kategori tersedia`
              ),
            },
            { quoted: m }
          );
      }
    } catch (err) {
      console.error("[MenuCat] List dispatch error:", err.message);
      return await sock.sendMessage(
        m.chat,
        { text: txt, contextInfo: buildBaseContextInfo() },
        { quoted: m }
      );
    }
  }

  // ╔══════════════════════════════════════════════════════════════════╗
  // ║              BRANCH B · COMMAND DETAIL VIEW                      ║
  // ╚══════════════════════════════════════════════════════════════════╝

  // ── Resolve target category ─────────────────────────────────────
  const allCategories = [...new Set([...categories, ...Object.keys(casesByCategory)])];
  const matchedCat = allCategories.find((c) => c.toLowerCase() === categoryArg);

  if (!matchedCat) {
    return m.reply(renderNotFoundError(S, prefix, categoryArg));
  }

  if (matchedCat === "owner" && !m.isOwner) {
    return m.reply(renderAccessDenied(S));
  }

  // ── Build command catalog ───────────────────────────────────────
  const pluginCommands = commandsByCategory[matchedCat] || [];
  const caseCommands = casesByCategory[matchedCat] || [];
  const allCommands = [...pluginCommands, ...caseCommands];

  if (allCommands.length === 0) {
    return m.reply(renderEmptyCategory(S, matchedCat));
  }

  const emoji = CATEGORY_EMOJIS[matchedCat] || "📁";

  // ── Render menu ─────────────────────────────────────────────────
  const txt = renderCommandList(
    S, prefix, emoji, matchedCat,
    allCommands, pluginCommands, caseCommands
  );

  // ── Dispatch by variant ───────────────────────────────────────
  try {
    switch (menucatVariant) {
      // ── Variant 1 · Plain text reply ──────────────────────
      case 1:
        await m.reply(txt);
        break;

      // ── Variant 2 · Rich context text ─────────────────────
      case 2:
        await sock.sendMessage(
          m.chat,
          {
            text: txt,
            contextInfo: buildCtx(
              `${emoji} ${matchedCat}`,
              `${allCommands.length} commands`
            ),
          },
          { quoted: m }
        );
        break;

      // ── Variant 3 · Image with caption ────────────────────
      case 3:
        if (imageBuffer) {
          await sock.sendMessage(
            m.chat,
            {
              image: imageBuffer,
              caption: txt,
              contextInfo: buildCtx(
                `${emoji} ${matchedCat}`,
                `${allCommands.length} commands`
              ),
            },
            { quoted: m }
          );
        } else {
          await sock.sendMessage(
            m.chat,
            {
              text: txt,
              contextInfo: buildCtx(
                `${emoji} ${matchedCat}`,
                `${allCommands.length} commands`
              ),
            },
            { quoted: m }
          );
        }
        break;

      // ── Variant 4 · Interactive native flow ───────────────
      case 4:
        await relayCommandsInteractive(
          m, sock, txt, allCommands,
          matchedCat, emoji, prefix, botName, buildCtx
        );
        break;

      // ── Fallback · Rich context text ──────────────────────
      default:
        await sock.sendMessage(
          m.chat,
          {
            text: txt,
            contextInfo: buildCtx(
              `${emoji} ${matchedCat}`,
              `${allCommands.length} commands`
            ),
          },
          { quoted: m }
        );
    }
  } catch (err) {
    console.error("[MenuCat] Detail dispatch error:", err.message);
    await sock.sendMessage(
      m.chat,
      { text: txt, contextInfo: buildBaseContextInfo() },
      { quoted: m }
    );
  }
}

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║                            MODULE EXPORT                                     ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

export { pluginConfig as config, handler };
