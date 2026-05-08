import config from '../../config.js';
import path from 'path';
import fs from 'fs';

// ═══════════════════════════════════════════════════════════
//  MODULE  : Contribution Credits Display System
//  BOT     : ShooNhee-AI
//  TYPE    : Plugin Command Handler
//  FLOW    : Preserved — Refactored for Visual Excellence
// ═══════════════════════════════════════════════════════════

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  SECTION 1: PLUGIN METADATA
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const pluginConfig = {
  name: 'tqto',
  alias: ['thanksto', 'credits', 'kredit'],
  category: 'main',
  description: 'Menampilkan daftar kontributor bot',
  usage: '.tqto',
  example: '.tqto',
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  energi: 0,
  isEnabled: true,
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  SECTION 2: VISUAL STYLING CONSTANTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const STYLE = Object.freeze({
  unicode: {
    diamond: '◈',
    diamondOutline: '◇',
    star: '✦',
    starDust: '✧',
    bullet: '▸',
    arrow: '▹',
    line: '┊',
    lineBold: '┃',
    cornerTop: '╭',
    cornerBottom: '╰',
    dash: '─',
    dashBold: '━',
    spark: 'ᯤ',
    ornament: '๑',
    dot: '·',
    accent: '⊹',
  },

  separator: {
    thin: '─────────────────────────',
    medium: '━━━━━━━━━━━━━━━━━━━━━━━━━',
    ornate: '─── ❀ ─── ❀ ─── ❀ ───',
    section: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
  },

  emoji: {
    bot: '🤖',
    heart: '◜♡◞',
    crown: '👑',
    code: '⚙',
    globe: '⟁',
    sparkle: '✨',
  },
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  SECTION 3: ROLE TIER CONFIGURATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const ROLE_TIERS = Object.freeze({
  'Lead Staff':   { weight: 1, symbol: '◈' },
  'Creator':      { weight: 2, symbol: '✦' },
  'Asisstant':    { weight: 3, symbol: '✧' },
  'Developer':    { weight: 3, symbol: '✧' },
  'Staff':        { weight: 4, symbol: '▸' },
  'Tangan Kanan': { weight: 5, symbol: '▹' },
  'Owner':        { weight: 6, symbol: '◆' },
  'Moderator':    { weight: 7, symbol: '◇' },
  'Partner':      { weight: 8, symbol: '·' },
  'Youtuber':     { weight: 9, symbol: '⊙' },
  'Best':         { weight: 10, symbol: '♡' },
  'Libraries':    { weight: 11, symbol: '∞' },
});

/**
 * Resolve tier metadata from role string.
 * @param {string} role
 * @returns {{weight:number,symbol:string}}
 */
const resolveTier = (role) => {
  const key = Object.keys(ROLE_TIERS).find((k) =>
    role.toLowerCase().includes(k.toLowerCase())
  );

  return key
    ? ROLE_TIERS[key]
    : { weight: 99, symbol: '·' };
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  SECTION 4: CREDITS DATA REPOSITORY
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const creditsRepository = [
  { name: 'hyuuOkkotsuX', role: 'Lead Staff' },
  { name: 'TNGX', role: 'Creator ShooNhee MD dan System Refactor Readdibility' },
  { name: 'Zann', role: 'Creator ShooNhee MD dan APK Stardem ShooNhee' },
  { name: 'SenzOkkotsu', role: 'Asisstant Developer' },
  { name: 'Ell', role: 'Asisstant Developer' },
  { name: 'Aqell', role: 'Developer SC BUG ShooNhee Glitch' },
  { name: 'Mobbc', role: 'Staff' },
  { name: 'Sanxz', role: 'Tangan Kanan' },
  { name: 'Dinz', role: 'Tangan Kanan' },
  { name: 'Forone Store', role: 'Tangan Kanan' },
  { name: 'Rakaa', role: 'Tangan Kanan' },
  { name: 'Sabila', role: 'Tangan Kanan' },
  { name: 'Syura Store', role: 'Tangan Kanan' },
  { name: 'Xero', role: 'Tangan Kanan' },
  { name: 'Lyoraaa', role: 'Owner' },
  { name: 'Danzzz', role: 'Owner' },
  { name: 'Muzan', role: 'Owner' },
  { name: 'Gray', role: 'Owner' },
  { name: 'Baim', role: 'Moderator' },
  { name: 'Vadel', role: 'Moderator' },
  { name: 'Fahmi', role: 'Moderator' },
  { name: 'Caca', role: 'Moderator' },
  { name: 'panceo', role: 'Partner' },
  { name: 'KingSatzID', role: 'Partner' },
  { name: 'Dashxz', role: 'Partner' },
  { name: 'This JanzZ', role: 'Partner' },
  { name: 'Ahmad', role: 'Partner' },
  { name: 'nopal', role: 'Partner' },
  { name: 'tuadit', role: 'Partner' },
  { name: 'andry', role: 'Partner' },
  { name: 'kingdanz', role: 'Partner' },
  { name: 'patih', role: 'Partner' },
  { name: 'Ryuu', role: 'Partner' },
  { name: 'Pororo', role: 'Partner' },
  { name: 'Janzz', role: 'Partner' },
  { name: 'Morvic', role: 'Partner' },
  { name: 'zylnzee', role: 'Partner' },
  { name: 'Farhan', role: 'Partner' },
  { name: 'Alizz', role: 'Partner' },
  { name: 'Kiram', role: 'Partner' },
  { name: 'Minerva', role: 'Partner' },
  { name: 'Riam', role: 'Partner' },
  { name: 'Febri', role: 'Partner' },
  { name: 'Kuze', role: 'Partner' },
  { name: 'Oscar Dani', role: 'Partner' },
  { name: 'Udun', role: 'Partner' },
  { name: 'Zanspiw', role: 'Youtuber' },
  { name: 'Danzz Nano', role: 'Youtuber' },
  { name: 'Youtuber Lain yang udah review', role: 'Youtuber' },
  { name: 'Kalian Semua', role: 'Best' },
  { name: 'Open Source Community', role: 'Libraries & Tools' },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  SECTION 5: MESSAGE COMPOSITION ENGINE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const buildHeader = (botName, version) => {
  const { unicode: u, separator: s, emoji: e } = STYLE;

  return [
    `${u.cornerTop}${s.medium}${u.star}`,
    ``,
    `  ${e.sparkle} *${botName}* ${e.sparkle}`,
    `  ${e.code} Version : ${version}`,
    ``,
    `  ${u.diamond} Contribution Credits`,
    `  ${u.diamondOutline} Special Thanks To`,
    ``,
    `${u.cornerBottom}${s.medium}${u.starDust}`,
  ].join('\n');
};

const buildDescription = () => {
  const { unicode: u } = STYLE;

  return [
    ``,
    `${u.lineBold} Berikut adalah daftar individu`,
    `${u.lineBold} yang telah berkontribusi dalam`,
    `${u.lineBold} pengembangan sistem bot ini.`,
    ``,
  ].join('\n');
};

const buildFooter = () => {
  const { unicode: u, separator: s, emoji: e } = STYLE;

  return [
    ``,
    `${u.starDust} ${s.thin} ${u.star}`,
    ``,
    `  ${e.heart} Terima kasih atas support kalian`,
    `  terhadap perkembangan project ini.`,
    ``,
    `  ${e.sparkle} SHONE TEAM`,
    ``,
    `${u.star} ${s.thin} ${u.starDust}`,
  ].join('\n');
};

const buildRenderOptions = (botName, version) => ({
  headerText: buildHeader(botName, version) + buildDescription(),
  footer: buildFooter(),
});

/**
 * Transform credits into formatted blocks.
 * @param {Array} entries
 * @returns {string}
 */
const buildCreditsBlock = (entries) => {
  return entries
    .map((entry, index) => {
      const tier = resolveTier(entry.role);

      return [
        `╭─❖ ${index + 1}`,
        `│ Name : ${entry.name}`,
        `│ Role : ${tier.symbol} ${entry.role}`,
        `╰───────────────`,
      ].join('\n');
    })
    .join('\n\n');
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  SECTION 6: MAIN COMMAND HANDLER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function handler(m, { sock }) {
  try {
    // ── Resolve bot metadata ──
    const botName = config.bot?.name || 'ShooNhee-AI';
    const version = config.bot?.version || '1.0.0';

    // ── Build render sections ──
    const renderOptions = buildRenderOptions(
      botName,
      version
    );

    const creditsBlock = buildCreditsBlock(
      creditsRepository
    );

    // ── Final message assembly ──
    const message = [
      renderOptions.headerText,
      creditsBlock,
      renderOptions.footer,
    ].join('\n');

    // ── Send safely using native Baileys API ──
    await sock.sendMessage(
      m.chat,
      {
        text: message,
      },
      {
        quoted: m,
      }
    );

  } catch (error) {
    console.error('[TQTO ERROR]', error);

    await sock.sendMessage(
      m.chat,
      {
        text: 'Terjadi kesalahan saat menampilkan credits.',
      },
      {
        quoted: m,
      }
    );
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  SECTION 7: MODULE EXPORT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export {
  pluginConfig as config,
  handler,
};