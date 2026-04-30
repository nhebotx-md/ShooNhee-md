import { getDatabase } from './src/lib/ourin-database.js';
import * as ownerPremiumDb from './src/lib/ourin-premium-db.js';

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION OBJECT
// ═══════════════════════════════════════════════════════════════════════════
//  utamakan baca object config sampai bawah

const config = {
  info: {
    website: 't.me/Yamaguchihost',
    grupwa: 'https://chat.whatsapp.com/EXSRw7UtYCi0yyhErYjFsX?mode=gi_t'
  },

  owner: {
    name: 'ɱг 𝖙ŋɢχ',                    // Nama owner
    number: ['62881027174423']         // Format: 628xxx (tanpa + atau 0)
  },

  session: {
    pairingNumber: '6282142783884',   // Nomor WA yang akan di-pair
    usePairingCode: true              // true = Pairing Code, false = QR Code
  },

  bot: {
    name: 'ᴹᴿ᭄𝖙ŋɢχོ ×፝֟͜×',           // Nama bot
    version: '2.4.0',                 // Versi bot
    developer: 'Akbarz Store'          // Nama developer
  },

  mode: 'public',

  command: {
    prefix: '.'
  },

  vercel: {
    // ambil token vercel: https://vercel.com/account/tokens
    token: ''                        // Vercel Token untuk fitur deploy ( Kalau .deploy mau work, ini wajib di isi )
  },

  store: {
    payment: [
      { name: 'Dana', number: '083126313052', holder: 'Unarmah' },
      { name: 'OVO', number: '62xxxxxxxxx', holder: 'Nama Pemilik' },
      { name: 'GoPay', number: '62xxxxxxxxx', holder: 'Nama Pemilik' },
      { name: 'ShopeePay', number: '62xxxxxxxxx', holder: 'Nama Pemilik' }
    ],
    qris: 'https'
  },

  donasi: {
    payment: [
      { name: 'Dana', number: '083126313052', holder: 'Unarmah' },
      { name: 'GoPay', number: '08xxxxxxxxxx', holder: 'Nama Owner' },
      { name: 'OVO', number: '08xxxxxxxxxx', holder: 'Nama Owner' }
    ],
    links: [
      { name: 'Saweria', url: 'saweria.co/username' },
      { name: 'Trakteer', url: 'trakteer.id/username' }
    ],
    benefits: [
      'Mendukung development',
      'Server lebih stabil',
      'Fitur baru lebih cepat',
      'Priority support'
    ],
    qris: 'https'
  },

  energi: {
    enabled: false,                   // Jika true, maka sistem energi/limit akan bekerja
    default: 99999,
    premium: 99999999,
    owner: -1
  },

  sticker: {
    packname: 'ᴹᴿ᭄𝖙ŋɢχོ ×፝֟͜×',             // Nama pack sticker
    author: 'ɱг 𝖙ŋɢχ'  // Author sticker
  },

  saluran: {
    id: '120363424976130148@newsletter',    // ID saluran (contoh: 120363xxx@newsletter)
    name: 'WHATSAPP BOT MULTI DEVICE',       // Nama saluran
    link: 'https://whatsapp.com/channel/0029VbCCHiO1iUxbVJ0OCs28'  // Link saluran
  },

  groupProtection: {
        antilink: '⚠ *Antilink* — @%user% mengirim link.\nPesan dihapus.',
        antilinkKick: '⚠ *Antilink* — @%user% di-kick karena mengirim link.',
        antilinkGc: '⚠ *Antilink WA* — @%user% mengirim link WA.\nPesan dihapus.',
        antilinkGcKick: '⚠ *Antilink WA* — @%user% di-kick karena mengirim link WA.',
        antilinkAll: '⚠ *Antilink* — @%user% mengirim link.\nPesan dihapus.',
        antilinkAllKick: '⚠ *Antilink* — @%user% di-kick karena mengirim link.',
        antitagsw: '⚠ *AntiTagSW* — Tag status dari @%user% dihapus.',
        antiviewonce: '👁️ *ViewOnce* — Dari @%user%',
        antiremove: '🗑️ *AntiDelete* — @%user% menghapus pesan:',
        antihidetag: '⚠ *AntiHidetag* — Hidetag dari @%user% dihapus.',
        antitoxicWarn: '⚠ @%user% berkata kasar.\nPeringatan ke %warn% dari %max%, pelanggaran berikutnya bisa di-%method%.',
        antitoxicAction: '🚫 @%user% di-%method% karena toxic. (%warn%/%max%)',
        antidocument: '⚠ *AntiDocument* — Dokumen dari @%user% dihapus.',
        antisticker: '⚠ *AntiSticker* — Sticker dari @%user% dihapus.',
        antimedia: '⚠ *AntiMedia* — Media dari @%user% dihapus.',
        antibot: '🤖 *AntiBot* — @%user% terdeteksi sebagai bot dan di-kick.',
        notAdmin: '⚠ Bot bukan admin, tidak bisa menghapus pesan.'
    },

  errorTemplate: `☢ Kayaknya command \`{prefix}{command}\` lagi ada kendala
Silahkan coba lagi nanti, {pushName}

_Jika masalah berlanjut, silahkan hubungi owner bot_`,

  features: {
    antiSpam: true,
    antiSpamInterval: 3000,
    antiCall: true,                   // Jika true, bot akan menolak panggilan masuk
    blockIfCall: true,                // Jika true, bot akan memblokir nomor yang menelpon bot
    autoTyping: true,
    autoRead: false,
    logMessage: true,
    dailyLimitReset: true,
    smartTriggers: false
  },

  registration: {
    enabled: false,                   // Jika true, user harus mendaftar sebelum menggunakan bot
    rewards: {
      koin: 30000,
      energi: 300,
      exp: 300000
    }
  },

  welcome: { defaultEnabled: false },
  goodbye: { defaultEnabled: false },

  ui: {
    menuVariant: 3
  },

  messages: {
    wait: '🕕 *Proses...* Mohon tunggu sebentar ya.',
    success: '✅ *Berhasil!* Permintaan kamu sudah selesai.',
    error: '❌ *Error!* Ada masalah pada sistem, coba lagi nanti.',

    ownerOnly: '*Akses Ditolak!* Fitur ini khusus untuk Owner bot.',
    premiumOnly: '💎 *Premium Only!* Fitur ini khusus member Premium. Ketik *.benefitpremium* untuk info upgrade.',

    groupOnly: '👥 *Group Only!* Fitur ini hanya bisa digunakan di dalam grup.',
    privateOnly: '🔒 *Private Only!* Fitur ini hanya bisa digunakan di chat pribadi bot.',

    adminOnly: '🛡️ *Admin Only!* Kamu harus jadi Admin grup untuk pakai fitur ini.',
    botAdminOnly: '🤖 *Bot Bukan Admin!* Jadikan bot sebagai Admin grup dulu biar bisa kerja.',

    cooldown: '🕕 *Tunggu Dulu!* Kamu masih dalam cooldown. Tunggu %time% detik lagi ya.',
    energiExceeded: '⚡ *Energi Habis!* Energi kamu sudah habis. Tunggu reset besok atau beli Premium.',

    banned: '🚫 *Kamu Dibanned!* Kamu tidak bisa menggunakan bot ini karena telah melanggar aturan.',

    rejectCall: '🚫 JANGAN TELPON NOMOR INI WEH',
  },

  database: { path: './database/main' },
  backup: { enabled: false, intervalHours: 24, retainDays: 7 },
  scheduler: { resetHour: 0, resetMinute: 0 },

  // Dev mode settings (auto-enabled jika NODE_ENV=development)
  dev: {
    enabled: process.env.NODE_ENV === 'development',
    watchPlugins: true,               // Hot reload plugins (SAFE)
    watchSrc: false,                  // DISABLED - src reload causes connection conflict 440
    debugLog: false                   // Show stack traces
  },

  // bisa dikosongin
  pterodactyl: {
    server1: { domain: '', apikey: '', capikey: '', egg: '15', nestid: '5', location: '1' },
    server2: { domain: '', apikey: '', capikey: '', egg: '15', nestid: '5', location: '1' },
    server3: { domain: '', apikey: '', capikey: '', egg: '15', nestid: '5', location: '1' },
    server4: { domain: '', apikey: '', capikey: '', egg: '15', nestid: '5', location: '1' },
    server5: { domain: '', apikey: '', capikey: '', egg: '15', nestid: '5', location: '1' }
  },

  digitalocean: {
    token: '',
    region: 'sgp1',
    sellers: [],
    ownerPanels: []
  },

  // NOTE: ini di versi free gak ada yak, adanya cuma di sc pt doang
  //  daftar di: https://pakasir.com/
  pakasir: {
    enabled: true,
    slug: '',
    apiKey: '',
    defaultMethod: 'qris',
    sandbox: false,
    pollingInterval: 5000
  },

  // NOTE: ini di versi free gak ada yak, adanya cuma di sc pt doang
  // Ambil apikey di: https://ditznesia.id -> Daftar -> Masuk ke Profile -> AMbile Apikey
  jasaotp: {
    apiKey: '',
    markup: 2000,
    timeout: 300
  },

  // NOTE: kalau mau command "autoai" nya berfungsi, ini gak wajib di isi yak
  // ambil apikey di: https://aistudio.google.com/apikey
  geminiApiKey: '',

  //  APIkey
  APIkey: {
    // kalian bisa daftar di https://api.lolhuman.xyz, lalu ambil apikeynya
    lolhuman: 'APIKey-Milik-Bot-OurinMD(Zann,HyuuSATANN,Keisya,Danzz)',
    // kalian bisa daftar di https://api.neoxr.eu, lalu ambil apikeynya
    neoxr: 'Milik-Bot-OurinMD',
    fgsi: 'fgsiapi-20c1605c-6d',
    google: '',
    groq: '', // API Key Groq untuk fitur transkrip (gratis di console.groq.com)
    betabotz: 'Btz-67YfP',
    // kalian bisa daftar di https://covenant.sbs, dan ambil apikeynya
    covenant: 'cov_live_bb660c9e5f735e46d808b7ae362914cfe35c2936739ee2b2'
  }
};


// ═══════════════════════════════════════════════════════════════════════════
// NUMBER UTILITY HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Membersihkan nomor dari karakter non-digit dan memisahkan bagian sebelum `:`
 * @param {string} number - Nomor mentah
 * @returns {string} Nomor yang sudah dibersihkan
 */
function cleanNumber(number) {
  if (!number) return '';
  return String(number).split(':')[0].split('@')[0].replace(/[^0-9]/g, '');
}

/**
 * Memeriksa apakah dua nomor cocok (exact, suffix, atau prefix match)
 * @param {string} a - Nomor pertama (sudah dibersihkan)
 * @param {string} b - Nomor kedua (sudah dibersihkan)
 * @returns {boolean}
 */
function isNumberMatch(a, b) {
  if (!a || !b) return false;
  return a === b || a.endsWith(b) || b.endsWith(a);
}

// ═══════════════════════════════════════════════════════════════════════════
// ROLE CHECKERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Cek apakah nomor adalah owner
 * @param {string} number - Nomor WA
 * @returns {boolean}
 */
function isOwner(number) {
  if (!number) return false;
  const cleanNum = number.split(':')[0].replace(/[^0-9]/g, '');
  if (!cleanNum) return false;

  // Cek bot number
  if (config.bot?.number) {
    const botNum = config.bot.number.replace(/[^0-9]/g, '');
    if (botNum && (cleanNum.includes(botNum) || botNum.includes(cleanNum))) return true;
  }

  try {
    const db = getDatabase();

    // Cek dari config.owner.number
    if (config.owner?.number) {
      const match = config.owner.number.some((own) => {
        const c = own.replace(/[^0-9]/g, '');
        return c && isNumberMatch(cleanNum, c);
      });
      if (match) return true;
    }

    // Cek dari database.data.owner
    if (db?.data && Array.isArray(db.data.owner)) {
      const match = db.data.owner.some((own) => {
        const c = String(own).replace(/[^0-9]/g, '');
        return c && isNumberMatch(cleanNum, c);
      });
      if (match) return true;
    }

    // Cek dari db.setting('ownerNumbers')
    if (db) {
      const definedOwner = db.setting('ownerNumbers');
      if (Array.isArray(definedOwner)) {
        const match = definedOwner.some((own) => {
          const c = String(own).replace(/[^0-9]/g, '');
          return c && isNumberMatch(cleanNum, c);
        });
        if (match) return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Cek apakah nomor adalah premium
 * @param {string} number - Nomor WA
 * @returns {boolean}
 */
function isPremium(number) {
  if (!number) return false;
  if (isOwner(number)) return true;

  const cleanNum = cleanNumber(number);
  const premiumList = config.premiumUsers || [];

  // Cek dari config.premiumUsers
  const inConfig = premiumList.some((premium) => {
    if (!premium) return false;
    const cleanPremium = cleanNumber(premium);
    return isNumberMatch(cleanNum, cleanPremium);
  });
  if (inConfig) return true;

  // Cek dari ownerPremiumDb
  try {
    if (ownerPremiumDb && ownerPremiumDb.isPremium(cleanNum)) return true;
  } catch {}

  // Cek dari database
  try {
    const db = getDatabase();
    if (db && db.data && Array.isArray(db.data.premium)) {
      const now = Date.now();
      const foundIndex = db.data.premium.findIndex((p) => {
        if (typeof p === 'string') return p === cleanNum;
        if (p.id) return p.id === cleanNum;
        return false;
      });

      if (foundIndex !== -1) {
        const found = db.data.premium[foundIndex];
        if (typeof found === 'string') return true;

        const expireTime = found.expired || (found.expiredAt ? new Date(found.expiredAt).getTime() : 0);
        if (expireTime && expireTime < now) {
          db.data.premium.splice(foundIndex, 1);
          const jid = cleanNum + '@s.whatsapp.net';
          const user = db.getUser(jid);
          if (user) { user.isPremium = false; db.setUser(jid, user); }
          db.save();
          return false;
        }
        return true;
      }
    }

    if (db) {
      const savedPremium = db.setting('premiumUsers') || [];
      const inDb = savedPremium.some((premium) => {
        if (!premium) return false;
        const cleanPremium = cleanNumber(premium);
        return isNumberMatch(cleanNum, cleanPremium);
      });
      if (inDb) return true;
    }
  } catch {}

  return false;
}

/**
 * Cek apakah nomor adalah partner
 * @param {string} number - Nomor WA
 * @returns {boolean}
 */
function isPartner(number) {
  if (!number) return false;
  if (isOwner(number)) return true;

  const cleanNum = cleanNumber(number);
  const partnerList = config.partnerUsers || [];

  // Cek dari config.partnerUsers
  const inConfig = partnerList.some((partner) => {
    if (!partner) return false;
    const cleanPartner = cleanNumber(partner);
    return isNumberMatch(cleanNum, cleanPartner);
  });
  if (inConfig) return true;

  // Cek dari ownerPremiumDb
  try {
    if (ownerPremiumDb && ownerPremiumDb.isPartner(cleanNum)) return true;
  } catch {}

  // Cek dari database
  try {
    const db = getDatabase();
    if (db && db.data && Array.isArray(db.data.partner)) {
      const now = Date.now();
      const foundIndex = db.data.partner.findIndex((p) => {
        if (typeof p === 'string') return p === cleanNum;
        if (p.id) return p.id === cleanNum;
        return false;
      });

      if (foundIndex !== -1) {
        const found = db.data.partner[foundIndex];
        if (typeof found === 'string') return true;

        const expireTime = found.expired || (found.expiredAt ? new Date(found.expiredAt).getTime() : 0);
        if (expireTime && expireTime < now) {
          db.data.partner.splice(foundIndex, 1);
          db.save();
          return false;
        }
        return true;
      }
    }
  } catch {}

  return false;
}

/**
 * Cek apakah nomor dibanned
 * @param {string} number - Nomor WA
 * @returns {boolean}
 */
function isBanned(number) {
  if (!number) return false;
  if (isOwner(number)) return false;

  const cleanNum = cleanNumber(number);

  let bannedList = [];
  try {
    const db = getDatabase();
    if (db) {
      bannedList = db.setting('bannedUsers') || [];
      config.bannedUsers = bannedList;
    }
  } catch {}

  return bannedList.some((banned) => {
    const cleanBanned = cleanNumber(banned);
    return isNumberMatch(cleanNum, cleanBanned);
  });
}

/**
 * Set nomor bot
 * @param {string} number - Nomor bot
 */
function setBotNumber(number) {
  if (number) config.bot.number = number.replace(/[^0-9]/g, '');
}

/**
 * Cek apakah nomor adalah bot itu sendiri
 * @param {string} number - Nomor WA
 * @returns {boolean}
 */
function isSelf(number) {
  if (!number || !config.bot.number) return false;
  const cleanNum = number.replace(/[^0-9]/g, '');
  const botNum = config.bot.number.replace(/[^0-9]/g, '');
  return cleanNum.includes(botNum) || botNum.includes(cleanNum);
}

/**
 * Get config object
 * @returns {Object}
 */
function getConfig() {
  return config;
}


// ═══════════════════════════════════════════════════════════════════════════
// ATTACH HELPERS TO CONFIG & EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

config.isOwner = isOwner;
config.isPremium = isPremium;
config.isPartner = isPartner;
config.isBanned = isBanned;
config.setBotNumber = setBotNumber;
config.isSelf = isSelf;

export default config;
export { config, getConfig, isOwner, isPartner, isPremium, isBanned, setBotNumber, isSelf };
