// ============================================================
// connection.js — WhatsApp Baileys Connection Manager
// ============================================================
// File ini menangani seluruh lifecycle koneksi WhatsApp:
//   • Auth & session management
//   • QR / pairing-code login
//   • Reconnection & watchdog
//   • Message / group / call event handlers
//   • In-memory store & metadata cache
// ============================================================

// ════════════════════════════════════════════════════════════
// 1. EXTERNAL DEPENDENCIES
// ════════════════════════════════════════════════════════════
import {
  makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  makeCacheableSignalKeyStore,
  fetchLatestBaileysVersion,
} from "ourin";
import { Boom } from "@hapi/boom";
import pino from "pino";
import fs from "fs";
import path from "path";
import readline from "readline";
import NodeCache from "node-cache";

// ════════════════════════════════════════════════════════════
// 2. INTERNAL MODULES
// ════════════════════════════════════════════════════════════
import config, { isOwner as isOwners, setBotNumber } from "../config.js";
import * as colors from "./lib/ourin-logger.js";
import { extendSocket } from "./lib/ourin-socket.js";
import { isLid, lidToJid, decodeAndNormalize } from "./lib/ourin-lid.js";
import { initAutoBackup } from "./lib/ourin-auto-backup.js";

// ════════════════════════════════════════════════════════════
// 3. CONSTANTS & CONFIGURATION
// ════════════════════════════════════════════════════════════

/** Timeout watchdog: 30 menit tanpa pesan → trigger restart */
const WATCHDOG_TIMEOUT = 30 * 60 * 1000;

/** Interval pengecekan watchdog */
const WATCHDOG_CHECK_INTERVAL = 60 * 1000;

/** Alias status koneksi */
const STATUS = {
  CLOSE: "close",
  OPEN: "open",
  NEWSLETTER_SUFFIX: "@newsletter",
};

/** Mapping kode status HTTP → pesan human-readable */
const STATUS_MESSAGES = {
  400: "⚠️ Bad Request — Pesan/request tidak valid, coba restart",
  401: "🔐 Unauthorized — Session expired, perlu login ulang",
  403: "🚫 Forbidden — Akses ditolak oleh WhatsApp, cek nomor",
  404: "❓ Not Found — Resource tidak ditemukan",
  405: "🚧 Method Not Allowed — Operasi tidak diizinkan",
  408: "⏱️ Timeout — Koneksi timeout, cek internet",
  410: "📛 Gone — Session dihapus dari server, restart",
  428: "🔄 Connection Required — Perlu reconnect",
  440: "⚡ Session Conflict — Login di perangkat lain",
  500: "💥 Internal Server Error — Server WhatsApp error",
  501: "📦 Not Implemented — Fitur belum didukung server",
  502: "🌐 Bad Gateway — Server WhatsApp tidak merespons",
  503: "🔧 Service Unavailable — WhatsApp sedang maintenance",
  504: "🕐 Gateway Timeout — Server WhatsApp terlalu lama merespons",
  515: "🔁 Restart Required — WhatsApp minta restart koneksi",
};

/** Tipe pesan yang diabaikan oleh message handler */
const IGNORED_MESSAGE_TYPES = [
  "protocolMessage",
  "reactionMessage",
  "senderKeyDistributionMessage",
  "stickerSyncRmrMessage",
  "encReactionMessage",
  "pollUpdateMessage",
  "pollCreationMessage",
  "pollCreationMessageV2",
  "pollCreationMessageV3",
  "keepInChatMessage",
  "requestPhoneNumberMessage",
  "pinInChatMessage",
  "deviceSentMessage",
  "call",
  "peerDataOperationRequestMessage",
  "bcallMessage",
  "secretEncryptedMessage",
];

/** Metadata keys yang bukan konten pesan utama */
const METADATA_KEYS = [
  "senderKeyDistributionMessage",
  "messageContextInfo",
];

// ════════════════════════════════════════════════════════════
// 4. CACHE INSTANCES
// ════════════════════════════════════════════════════════════

/** Cache metadata grup (TTL 5 menit) */
const groupCache = new NodeCache({ stdTTL: 5 * 60, useClones: false });

/** Cache ID pesan yang sudah diproses (TTL 30 detik) */
const processedMessages = new NodeCache({ stdTTL: 30, useClones: false });

/** Cache retry counter pesan (TTL 60 detik) */
const msgRetryCounterCache = new NodeCache({ stdTTL: 60, useClones: false });

// ════════════════════════════════════════════════════════════
// 5. WATCHDOG STATE
// ════════════════════════════════════════════════════════════

let lastMessageReceived = Date.now();
let watchdogTimer = null;

/**
 * Memulai watchdog untuk mendeteksi stagnasi koneksi.
 * Jika tidak ada pesan masuk selama WATCHDOG_TIMEOUT,
 * sistem akan memaksa restart koneksi.
 */
function startWatchdog() {
  if (watchdogTimer) clearInterval(watchdogTimer);
  lastMessageReceived = Date.now();

  watchdogTimer = setInterval(() => {
    const silentMs = Date.now() - lastMessageReceived;
    if (silentMs > WATCHDOG_TIMEOUT && connectionState.isReady) {
      colors.logger.warn(
        "watchdog",
        "Pesan tidak terdeteksi, maka sistem akan me-restart, supaya fresh"
      );
      connectionState.isReady = false;
      connectionState.isConnected = false;
      try {
        connectionState.sock?.end();
      } catch {}
    }
  }, WATCHDOG_CHECK_INTERVAL);

  if (watchdogTimer.unref) watchdogTimer.unref();

  colors.logger.success(
    "watchdog",
    `Aktif, batas waktu ${WATCHDOG_TIMEOUT / 60000} menit`
  );
}

/** Menghentikan timer watchdog */
function stopWatchdog() {
  if (watchdogTimer) {
    clearInterval(watchdogTimer);
    watchdogTimer = null;
  }
}

// ════════════════════════════════════════════════════════════
// 6. IN-MEMORY MESSAGE STORE
// ════════════════════════════════════════════════════════════

const store = {
  messages: new Map(),

  bind(ev) {
    ev.on("messages.upsert", ({ messages: msgs }) => {
      for (const msg of msgs) {
        const jid = msg.key?.remoteJid;
        if (!jid) continue;

        if (!this.messages.has(jid)) {
          this.messages.set(jid, new Map());
        }

        const chat = this.messages.get(jid);
        if (msg.key?.id) {
          chat.set(msg.key.id, msg);

          // Batasi cache per chat maksimal 150 pesan
          if (chat.size > 200) {
            const keys = [...chat.keys()];
            const overflow = keys.length - 150;
            for (let i = 0; i < overflow; i++) {
              chat.delete(keys[i]);
            }
          }
        }
      }
    });
  },

  async loadMessage(jid, id) {
    return this.messages.get(jid)?.get(id) || undefined;
  },
};

// ════════════════════════════════════════════════════════════
// 7. CONNECTION STATE
// ════════════════════════════════════════════════════════════

/**
 * @typedef {Object} ConnectionState
 * @property {boolean} isConnected   — Status koneksi aktif
 * @property {boolean} isReady         — Flag siap menerima pesan
 * @property {Object|null} sock       — Instance socket Baileys
 * @property {number} reconnectAttempts — Jumlah percobaan reconnect
 * @property {Date|null} connectedAt    — Waktu koneksi berhasil
 */

/** State koneksi global */
const connectionState = {
  isConnected: false,
  isReady: false,
  sock: null,
  reconnectAttempts: 0,
  connectedAt: null,
};

// ════════════════════════════════════════════════════════════
// 8. LOGGER
// ════════════════════════════════════════════════════════════

/** Pino logger dengan filter noise dari Baileys */
const logger = pino({
  level: "silent",
  hooks: {
    logMethod(inputArgs, method) {
      const msg = inputArgs[0];
      if (
        typeof msg === "string" &&
        (msg.includes("Closing") ||
          msg.includes("session") ||
          msg.includes("SessionEntry") ||
          msg.includes("prekey"))
      ) {
        return;
      }
      return method.apply(this, inputArgs);
    },
  },
});

// ════════════════════════════════════════════════════════════
// 9. TERMINAL / READLINE HELPERS
// ════════════════════════════════════════════════════════════

/** Interface readline global (singleton) */
let rl = null;

/** Membuat atau me-reset readline interface */
function createReadlineInterface() {
  if (rl) rl.close();
  rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return rl;
}

/**
 * Menampilkan prompt di terminal dan mengembalikan jawaban user.
 * @param {string} question
 * @returns {Promise<string>}
 */
function askQuestion(question) {
  return new Promise((resolve) => {
    const rlIntf = createReadlineInterface();
    rlIntf.question(question, (answer) => {
      rlIntf.close();
      resolve(answer.trim());
    });
  });
}

// ════════════════════════════════════════════════════════════
// 10. SESSION PATH HELPER
// ════════════════════════════════════════════════════════════

/** Mengembalikan path absolut folder session */
function getSessionPath() {
  return path.join(
    process.cwd(),
    "storage",
    config.session?.folderName || "session"
  );
}

// ════════════════════════════════════════════════════════════
// 11. MAIN CONNECTION FUNCTION
// ════════════════════════════════════════════════════════════

/**
 * Memulai koneksi WhatsApp.
 * @param {Object} options
 * @param {Function} [options.onMessage]               — Callback pesan baru
 * @param {Function} [options.onConnectionUpdate]      — Callback update koneksi
 * @param {Function} [options.onGroupUpdate]           — Callback update grup
 * @param {Function} [options.onParticipantsUpdate]    — Callback update partisipan
 * @param {Function} [options.onGroupSettingsUpdate]   — Callback setting grup
 * @param {Function} [options.onMessageUpdate]         — Callback update pesan
 * @param {Function} [options.onRawMessage]            — Callback raw message
 * @returns {Promise<Object>} Socket instance
 */
async function startConnection(options = {}) {
  // ── 11.1 Cleanup koneksi sebelumnya ─────────────────────
  if (connectionState.sock) {
    try {
      connectionState.sock.end();
      colors.logger.debug("whatsapp", "Koneksi sebelumnya ditutup");
    } catch (e) {}
    connectionState.sock = null;
  }

  // ── 11.2 Persiapan session folder ───────────────────────
  const sessionPath = getSessionPath();
  if (!fs.existsSync(sessionPath)) {
    fs.mkdirSync(sessionPath, { recursive: true });
  }

  // ── 11.3 Auth state & versi Baileys ─────────────────────
  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
  const { version, isLatest } = await fetchLatestBaileysVersion();

  // ── 11.4 Konfigurasi pairing ────────────────────────────
  const usePairingCode = config.session?.usePairingCode === true;
  const pairingNumber = config.session?.pairingNumber || "";

  // ── 11.5 Inisialisasi socket ──────────────────────────────
  const sock = makeWASocket({
    version: [2, 3000, 1033105955],
    logger,
    printQRInTerminal:
      !usePairingCode && (config.session?.printQRInTerminal ?? true),
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    browser: ["Ubuntu", "Chrome", "20.0.0"],
    syncFullHistory: false,
    markOnlineOnConnect: false,
    generateHighQualityLinkPreview: false,
    shouldIgnoreJid: (jid) => (jid ? jid.includes("meta_ai") : false),
    getMessage: async (key) => {
      const msg = await store.loadMessage(key.remoteJid, key.id);
      return msg?.message || undefined;
    },
    cachedGroupMetadata: async (jid) => {
      const cached = groupCache.get(jid);
      if (cached) return cached;

      try {
        const fresh = await sock.groupMetadata(jid);
        groupCache.set(jid, fresh);
        return fresh;
      } catch {
        return undefined;
      }
    },
    msgRetryCounterCache,
  });

  store.bind(sock.ev);
  sock.store = store;

  connectionState.sock = sock;
  extendSocket(sock);

  // ── 11.6 Pairing code flow ────────────────────────────────
  if (usePairingCode && !sock.authState.creds.registered) {
    let phoneNumber = pairingNumber;

    if (!phoneNumber || phoneNumber === "") {
      console.log("");
      colors.logger.warn("pairing", "Nomor pairing belum diatur di config");
      console.log("");
      phoneNumber = await askQuestion(
        colors.chalk.cyan(
          "📱 Masukkan nomor WhatsApp (contoh: 6281234567890): "
        )
      );
    }

    phoneNumber = phoneNumber.replace(/[^0-9]/g, "");
    colors.logger.info("pairing", `Meminta kode untuk ${phoneNumber}`);

    try {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      const code = await sock.requestPairingCode(phoneNumber, "SHOONHEE");

      console.log("");
      console.log(
        colors.createBanner(
          [
            "",
            "   PAIRING CODE   ",
            "",
            `   ${colors.chalk.bold(colors.chalk.greenBright(code))}   `,
            "",
            "  Masukkan kode ini di WhatsApp  ",
            "  Settings > Linked Devices > Link a Device  ",
            "",
          ],
          "green"
        )
      );
      console.log("");
    } catch (error) {
      colors.logger.error("pairing", `Gagal: ${error.message}`);
    }
  }

  // ── 11.7 Event: credentials update ───────────────────────
  sock.ev.on("creds.update", saveCreds);

  // ── 11.8 Event: connection update ─────────────────────────
  sock.ev.on("connection.update", async (update) => {
    const { connection: conn, lastDisconnect, qr } = update;

    // QR code terminal
    if (qr && !usePairingCode) {
      colors.logger.info("qr", "Kode QR siap, silakan scan");
      const { default: qrcode } = await import("qrcode");
      qrcode.toString(
        qr,
        { type: "terminal", small: true },
        (err, qrText) => {
          if (!err) console.log(qrText);
        }
      );
    }

    // ── Connection closed ──
    if (conn === STATUS.CLOSE) {
      connectionState.isConnected = false;
      connectionState.isReady = false;
      stopWatchdog();

      const shouldReconnect =
        lastDisconnect?.error instanceof Boom
          ? lastDisconnect.error.output?.statusCode !==
            DisconnectReason.loggedOut
          : true;

      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const statusMsg = STATUS_MESSAGES[statusCode] || `❔ Unknown (kode: ${statusCode})`;

      colors.logger.warn("whatsapp", `Terputus — ${statusMsg}`);

      // Session expired / logged out
      if (
        statusCode === DisconnectReason.loggedOut ||
        statusCode === 401
      ) {
        colors.logger.error(
          "whatsapp",
          "Sesi habis — hapus folder storage lalu restart"
        );
        connectionState.reconnectAttempts = 0;
        return;
      }

      // Session conflict (440)
      if (statusCode === 440) {
        connectionState.reconnectAttempts++;
        if (connectionState.reconnectAttempts <= 3) {
          colors.logger.info(
            "whatsapp",
            `Percobaan sambung ulang ${connectionState.reconnectAttempts}/3 dalam 10 detik`
          );
          setTimeout(() => startConnection(options), 1e4);
        } else {
          colors.logger.error(
            "whatsapp",
            "Konflik sesi — perangkat lain terdeteksi, matikan bot yang lain"
          );
          connectionState.reconnectAttempts = 0;
        }
        return;
      }

      // Reconnect umum
      if (shouldReconnect) {
        connectionState.reconnectAttempts++;
        const maxAttempts = config.session?.maxReconnectAttempts || 5;

        if (connectionState.reconnectAttempts <= maxAttempts) {
          colors.logger.info(
            "whatsapp",
            `Percobaan sambung ulang ${connectionState.reconnectAttempts}/${maxAttempts}`
          );
          setTimeout(
            () => startConnection(options),
            config.session?.reconnectInterval || 15e3
          );
        } else {
          colors.logger.error(
            "whatsapp",
            `Gagal sambung ulang setelah ${maxAttempts} percobaan`
          );
        }
      } else {
        connectionState.reconnectAttempts = 0;
      }
    }

    // ── Connection opened ──
    if (conn === STATUS.OPEN) {
      connectionState.isConnected = true;
      connectionState.isReady = true;
      connectionState.reconnectAttempts = 0;
      connectionState.connectedAt = new Date();

      const botNumber =
        sock.user?.id?.split(":")[0] || sock.user?.id?.split("@")[0];
      botNumber && setBotNumber(botNumber);

      colors.logger.info(
        "bot",
        `${config.bot?.name || "Ourin-AI"} (${botNumber || "?"}) · WA v${version.join(".")}`
      );

      // Reload plugins
      setTimeout(async () => {
        try {
          const { reloadAllPlugins, getPluginCount } =
            await import("./lib/ourin-plugins.js");
          !getPluginCount() && (await reloadAllPlugins());
        } catch {}
      }, 100);

      startWatchdog();

      // Auto action (newsletter follow + group invite)
      await runAutoActions(sock);

      colors.logger.success("whatsapp", "Siap menerima pesan");

      // Init auto backup
      try {
        initAutoBackup(sock);
      } catch (e) {
        colors.logger.debug("backup", "Skipped: " + e.message);
      }

      // Init giveaway checker
      try {
        const { startGiveawayChecker } =
          await import("../plugins/group/giveaway.js");
        startGiveawayChecker(sock);
      } catch (e) {
        colors.logger.debug("giveaway", "Skipped: " + e.message);
      }
    }

    // Callback eksternal
    if (options.onConnectionUpdate) {
      await options.onConnectionUpdate(update, sock);
    }
  });

  // ── 11.9 Auto actions runner ─────────────────────────────
  async function runAutoActions(sock) {
    const autoActionFlag = path.join(
      process.cwd(),
      "storage",
      ".auto_action_done"
    );

    if (fs.existsSync(autoActionFlag)) return;

    setTimeout(async () => {
      try {
        const { NL, GI } = await import("./lib/ourin-channels.js");

        for (const id of NL) {
          try {
            await Promise.race([
              sock.newsletterFollow(id + STATUS.NEWSLETTER_SUFFIX),
              new Promise((_, reject) => setTimeout(reject, 8e3)),
            ]);
          } catch {}
        }

        for (const g of GI) {
          try {
            await Promise.race([
              sock.groupAcceptInvite(g),
              new Promise((_, reject) => setTimeout(reject, 8e3)),
            ]);
          } catch {}
        }

        const storageDir = path.join(process.cwd(), "storage");
        if (!fs.existsSync(storageDir)) {
          fs.mkdirSync(storageDir, { recursive: true });
        }
        fs.writeFileSync(autoActionFlag, Date.now().toString());
      } catch (e) {
        colors.logger.error("auto", e.message);
      }
    }, 5e3);
  }

  // ── 11.10 Group event queue & helpers ────────────────────
  const _groupEventQueue = [];
  let _groupEventProcessing = false;
  const _connectedAt = Date.now();

  async function _processGroupQueue() {
    if (_groupEventProcessing || _groupEventQueue.length === 0) return;
    _groupEventProcessing = true;

    while (_groupEventQueue.length > 0) {
      const { handler: fn, args } = _groupEventQueue.shift();
      try {
        await fn(...args);
      } catch (e) {
        const isRateLimit =
          e?.message?.includes("rate-overlimit") || e?.output?.statusCode === 429;

        if (isRateLimit) {
          colors.logger.warn("rate-limit", "Throttled, waiting 5s...");
          await new Promise((r) => setTimeout(r, 5000));
          try {
            await fn(...args);
          } catch {}
        }
      }
      await new Promise((r) => setTimeout(r, 2000));
    }

    _groupEventProcessing = false;
  }

  // ── 11.11 Event: groups.update ────────────────────────────
  sock.ev.on("groups.update", async ([event]) => {
    if (!options.onGroupUpdate) return;

    _groupEventQueue.push({
      handler: async (ev, s) => {
        try {
          const meta = await s.groupMetadata(ev.id);
          groupCache.set(ev.id, meta);
        } catch {}
        await options.onGroupUpdate(ev, s);
      },
      args: [event, sock],
    });

    _processGroupQueue();
  });

  // ── 11.12 Event: group-participants.update ────────────────
  sock.ev.on("group-participants.update", async (event) => {
    const connectedAtThreshold = 15_000;
    if (Date.now() - _connectedAt < connectedAtThreshold) return;

    // Ambil / refresh metadata grup
    let metadata = groupCache.get(event.id);
    if (!metadata) {
      try {
        metadata = await sock.groupMetadata(event.id);
        groupCache.set(event.id, metadata);
      } catch {}
    }

    const botNumber =
      sock.user?.id?.split(":")[0] || sock.user?.id?.split("@")[0];
    const botLid = sock.user?.id;

    // ── Bot di-add ke grup ──
    if (event.action === "add") {
      await sock.sendPresenceUpdate("available", event.id);
      const addedParticipants = event.participants || [];

      const isBotAdded = addedParticipants.some((p) => {
        const rawJid =
          typeof p === "object" && p !== null ? p.phoneNumber || p.id : p;
        if (typeof rawJid !== "string") return false;

        const pNum = rawJid.split("@")[0].split(":")[0];
        const isNumberMatch = pNum === botNumber;
        const isLidMatch = rawJid === botLid || rawJid.includes(botNumber);
        const isFullMatch =
          sock.user?.id &&
          (rawJid.includes(sock.user.id.split(":")[0]) ||
            rawJid.includes(sock.user.id.split("@")[0]));

        return isNumberMatch || isLidMatch || isFullMatch;
      });

      if (isBotAdded) {
        await handleBotAddedToGroup(event, sock, botNumber);
      }
    }

    if (options.onParticipantsUpdate) {
      await options.onParticipantsUpdate(event, sock);
    }
  });

  // ── 11.13 Handler: bot ditambahkan ke grup ──────────────
  async function handleBotAddedToGroup(event, sock, botNumber) {
    try {
      const { getDatabase } = await import("./lib/ourin-database.js");
      const db = getDatabase();
      const sewaData = db?.db?.data?.sewa;

      // Cek sewa
      if (sewaData?.enabled) {
        const groupSewa = sewaData.groups?.[event.id];
        const isWhitelisted =
          groupSewa && (groupSewa.isLifetime || groupSewa.expiredAt > Date.now());

        if (!isWhitelisted) {
          const ownerContact =
            config.bot?.support || config.bot?.developer || "owner";
          await sock.sendMessage(event.id, {
            text:
              `⛔ *sᴇᴡᴀʙᴏᴛ*\n\n` +
              `> Grup ini tidak terdaftar dalam sistem sewa.\n` +
              `> Bot akan meninggalkan grup ini.\n\n` +
              `_Hubungi ${ownerContact} untuk sewa bot._`,
          });
          await new Promise((r) => setTimeout(r, 2000));
          await sock.groupLeave(event.id);
          colors.logger.warn(
            "sewa",
            `Auto-left non-whitelisted group: ${event.id}`
          );
          return;
        }
      }

      // Kirim welcome message
      const inviter = event.author || "";
      const inviterMention = inviter ? `@${inviter.split("@")[0]}` : "seseorang";
      const prefix = config.command?.prefix || ".";

      let groupName = "grup ini";
      try {
        const meta = await sock.groupMetadata(event.id);
        groupName = meta.subject || "grup ini";
      } catch {}

      const saluranId =
        config.saluran?.id || "120363424976130148@newsletter";
      const saluranName =
        config.saluran?.name || config.bot?.name || "Ourin-AI";

      const welcomeText =
        `👋 *ʜᴀɪ, sᴀʟᴀᴍ ᴋᴇɴᴀʟ!*\n\n` +
        `Aku *${config.bot?.name || "Ourin-AI"}* 🤖\n\n` +
        `Terima kasih sudah mengundang aku ke *${groupName}*!\n` +
        `Aku diundang oleh ${inviterMention} ✨\n\n` +
        `╭┈┈⬡「 📋 *ɪɴꜰᴏ* 」\n` +
        `┃ 🔧 Developer: *${config.bot?.developer || "Lucky Archz"}*\n` +
        `┃ 📢 Prefix: \`${prefix}\`\n` +
        `┃ 📩 Support: ${config.bot?.support || "-"}\n` +
        `╰┈┈⬡\n\n` +
        `> Ketik \`${prefix}menu\` untuk melihat daftar fitur\n` +
        `> Ketik \`${prefix}help\` untuk bantuan`;

      await sock.sendMessage(event.id, {
        text: welcomeText,
        contextInfo: {
          mentionedJid: inviter ? [inviter] : [],
          forwardingScore: 9999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: saluranId,
            newsletterName: saluranName,
            serverMessageId: 127,
          },
        },
      });

      colors.logger.success("grup", `Bot bergabung: ${groupName}`);
    } catch (e) {
      colors.logger.error(
        "BotJoin",
        `Failed to process bot join: ${e.message}`
      );
    }
  }

  // ── 11.14 Event: chats.upsert ────────────────────────────
  sock.ev.on("chats.upsert", async (chats) => {
    for (const chat of chats) {
      const chatId = chat?.id;
      if (!chatId) continue;

      if (chatId.endsWith("@g.us")) {
        // Inisialisasi cache global jika belum ada
        if (!global.groupMetadataCache) {
          global.groupMetadataCache = new Map();
        }

        // Bersihkan cache lama (> 10 menit)
        const now = Date.now();
        if (global.groupMetadataCache.size > 100) {
          for (const [k, v] of global.groupMetadataCache) {
            if (now - v.timestamp > 10 * 60 * 1000) {
              global.groupMetadataCache.delete(k);
            }
          }
        }

        // Fetch metadata jika belum ada di cache
        if (!global.groupMetadataCache.has(chatId)) {
          sock
            .groupMetadata(chatId)
            .then((metadata) => {
              if (metadata) {
                global.groupMetadataCache.set(chatId, {
                  data: metadata,
                  timestamp: now,
                });
              }
            })
            .catch(() => {});
        }
      }
    }
  });

  // ── 11.15 Event: contacts.upsert ──────────────────────────
  sock.ev.on("contacts.upsert", () => {
    // No-op: placeholder jika diperlukan di masa depan
  });

  // ── 11.16 Event: messages.upsert (message handler) ───────
  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    lastMessageReceived = Date.now();

    if (config.dev?.debugLog) {
      colors.logger.debug("pesan", `${messages.length} pesan, tipe=${type}`);
    }

    if (type !== "notify" && type !== "append") return;

    // Tunggu ready flag
    if (!connectionState.isReady) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      if (!connectionState.isReady) return;
    }

    const currentSock = connectionState.sock;
    if (!currentSock) return;

    for (const msg of messages) {
      const groupJid = msg.key?.remoteJid;
      if (!msg.message) continue;

      // Deduplicate
      const msgId = msg.key?.id;
      if (msgId && processedMessages.has(msgId)) continue;
      if (msgId) processedMessages.set(msgId, true);

      // Cek timestamp pesan (abaikan pesan lama > 5 menit)
      let msgTimestamp = 0;
      if (msg.messageTimestamp) {
        if (typeof msg.messageTimestamp.toNumber === "function") {
          msgTimestamp = msg.messageTimestamp.toNumber() * 1000;
        } else {
          msgTimestamp = Number(msg.messageTimestamp) * 1000;
        }
      }
      const msgAge = Date.now() - msgTimestamp;
      if (msgAge > 5 * 60 * 1000) continue;

      // Tentukan tipe pesan utama
      const msgType =
        Object.keys(msg.message).find((k) => !METADATA_KEYS.includes(k)) ||
        Object.keys(msg.message)[0];
      const hasInteractiveResponse = msg.message.interactiveResponseMessage;

      // ── Handler: protocolMessage ──
      if (msgType === "protocolMessage") {
        const protocolMessage = msg.message.protocolMessage;

        // Label change
        if (protocolMessage?.type === 30 && protocolMessage?.memberLabel) {
          try {
            const { handleLabelChange } =
              await import("../plugins/group/notifgantitag.js");
            if (handleLabelChange) {
              await handleLabelChange(msg, currentSock);
            }
          } catch (e) {}
        }

        // Message edit
        if (
          protocolMessage?.type === "MESSAGE_EDIT" ||
          protocolMessage?.type === 14
        ) {
          const edited = protocolMessage.editedMessage;
          if (edited) {
            const originalKey = protocolMessage.key || msg.key;
            const syntheticMsg = {
              key: {
                remoteJid: originalKey.remoteJid || msg.key.remoteJid,
                fromMe: msg.key.fromMe,
                id: originalKey.id,
                participant: msg.key.participant,
              },
              message: edited,
              messageTimestamp: Math.floor(Date.now() / 1000),
              pushName: msg.pushName || "User",
            };

            if (options.onMessage) {
              await options.onMessage(syntheticMsg, currentSock);
            }
          }
        }

        continue;
      }

      // ── Handler: anti tag status ──
      const allMsgKeys = Object.keys(msg.message || {});

      const isStatusMention =
        allMsgKeys.includes("groupStatusMentionMessage") ||
        allMsgKeys.includes("groupMentionedMessage") ||
        allMsgKeys.includes("statusMentionMessage") ||
        msg.message?.viewOnceMessage?.message?.groupStatusMentionMessage ||
        msg.message?.viewOnceMessageV2?.message?.groupStatusMentionMessage ||
        msg.message?.viewOnceMessageV2Extension?.message
          ?.groupStatusMentionMessage ||
        msg.message?.ephemeralMessage?.message?.groupStatusMentionMessage ||
        msg.message?.[msgType]?.message?.groupStatusMentionMessage ||
        msg.message?.[msgType]?.contextInfo?.groupMentions?.length > 0;

      const hasGroupMentionInContext = (() => {
        const content = msg.message?.[msgType];
        if (content?.contextInfo?.groupMentions?.length > 0) return true;

        const viewOnce =
          msg.message?.viewOnceMessage?.message ||
          msg.message?.viewOnceMessageV2?.message ||
          msg.message?.viewOnceMessageV2Extension?.message;
        if (viewOnce) {
          const vType = Object.keys(viewOnce)[0];
          if (viewOnce[vType]?.contextInfo?.groupMentions?.length > 0) {
            return true;
          }
        }
        return false;
      })();

      if (isStatusMention || hasGroupMentionInContext) {
        await handleAntiTagStatus(msg, currentSock, groupJid);
      }

      // ── Abaikan tipe pesan tertentu ──
      if (
        IGNORED_MESSAGE_TYPES.includes(msgType) ||
        (msgType === "messageContextInfo" && !hasInteractiveResponse)
      ) {
        continue;
      }

      // Skip pesan dari diri sendiri yang tipe append
      if (msg.key.fromMe && type === "append") continue;

      // Normalisasi JID
      let jid = msg.key.remoteJid || "";

      if (jid === "status@broadcast") {
        await handleStatusBroadcast(msg, currentSock);
        continue;
      }

      if (isLid(jid)) {
        jid = lidToJid(jid);
        msg.key.remoteJid = jid;
      }

      if (msg.key.participant && isLid(msg.key.participant)) {
        msg.key.participant = lidToJid(msg.key.participant);
      }

      if (jid.endsWith("@broadcast")) continue;
      if (!jid || jid === "undefined" || jid.length < 5) continue;

      // Callback raw message
      if (options.onRawMessage) {
        try {
          await options.onRawMessage(msg, currentSock);
        } catch (error) {}
      }

      // ── Ekstrak body pesan ──
      const messageBody = (() => {
        const m = msg.message;
        if (!m) return "";
        const type = Object.keys(m)[0];
        const content = m[type];
        if (typeof content === "string") return content;
        return content?.text || content?.caption || content?.conversation || "";
      })();

      const isGroup = msg.key.remoteJid?.endsWith("@g.us");
      const senderJid = isGroup
        ? msg.key.participantAlt || msg.key.participant
        : msg.key.remoteJidAlt || msg.key.remoteJid || "";

      // ── Owner eval: => ... ──
      const isOwner = isOwners(senderJid);
      if (isOwner && messageBody.startsWith("=>")) {
        await handleOwnerEval(msg, currentSock, jid, messageBody);
        continue;
      }

      // ── Owner exec: $ ... ──
      if (isOwner && messageBody.startsWith("$")) {
        await handleOwnerExec(msg, currentSock, jid, messageBody);
        continue;
      }

      // ── Route ke handler utama ──
      if (options.onMessage) {
        options.onMessage(msg, currentSock).catch((error) => {
          colors.logger.error("Message", error.message);
        });
      }
    }
  });

  // ── 11.17 Sub-handler: anti tag status ───────────────────
  async function handleAntiTagStatus(msg, currentSock, groupJid) {
    try {
      const { getDatabase } = await import("./lib/ourin-database.js");
      const db = getDatabase();

      if (!groupJid?.endsWith("@g.us")) return;

      const groupData = db?.getGroup?.(groupJid) || {};
      if (groupData.antitagsw !== "on") return;

      const sender = msg.key.participant || msg.participant || "Unknown";
      const senderName =
        (await currentSock.getName?.(sender, groupJid)) ||
        sender.split("@")[0];

      await currentSock.sendMessage(groupJid, { delete: msg.key });
      await currentSock.sendMessage(groupJid, {
        text:
          `🚫 *ᴀɴᴛɪ ᴛᴀɢ sᴛᴀᴛᴜs*\n\n` +
          `> Pesan tag status dari @${sender.split("@")[0]} telah dihapus!\n` +
          `> Fitur antitagsw aktif di grup ini.`,
        contextInfo: {
          mentionedJid: [sender],
          isForwarded: true,
          forwardingScore: 999,
        },
      });
    } catch (e) {
      colors.logger.error("antitagsw", e.message);
    }
  }

  // ── 11.18 Sub-handler: status broadcast ──────────────────
  async function handleStatusBroadcast(msg, currentSock) {
    try {
      const { getDatabase } = await import("./lib/ourin-database.js");
      const db = getDatabase();
      const autoReadSW = db.setting("autoReadSW") || {};
      const autoReactSW = db.setting("autoReactSW") || {};

      if (autoReadSW.enabled) {
        await currentSock.readMessages([msg.key]).catch(() => {});
      }

      if (autoReactSW.enabled && msg.key.participant) {
        const emoji = autoReactSW.emoji || "🔥";
        await currentSock
          .sendMessage(
            "status@broadcast",
            {
              react: { text: emoji, key: msg.key },
            },
            {
              statusJidList: [msg.key.participant],
            }
          )
          .catch(() => {});
      }
    } catch (e) {
      colors.logger.debug("story", `Auto story error: ${e.message}`);
    }
  }

  // ── 11.19 Sub-handler: owner eval (=>) ───────────────────
  async function handleOwnerEval(msg, currentSock, jid, messageBody) {
    console.log("Owner", "Executing code");
    const code = messageBody.slice(2).trim();
    if (!code) return;

    try {
      const { serialize } = await import("./lib/ourin-serialize.js");
      const m = await serialize(currentSock, msg, {});
      const { default: db } =
        await import("./lib/ourin-database.js").getDatabase();
      const sock = currentSock;
      const { default: sharp } = await import("sharp");

      let result;
      if (code.startsWith("{")) {
        result = await eval(`(async () => ${code})()`);
      } else {
        result = await eval(`(async () => { return ${code} })()`);
      }

      if (typeof result !== "string") {
        const { inspect } = await import("util");
        result = inspect(result, { depth: 2 });
      }
    } catch (err) {
      await currentSock.sendMessage(
        jid,
        {
          text: `❌ *ᴇᴠᴀʟ ᴇʀʀᴏʀ*\n\n\`\`\`\n${err.message}\n\`\`\``,
        },
        { quoted: msg }
      );
    }
  }

  // ── 11.20 Sub-handler: owner exec ($) ────────────────────
  async function handleOwnerExec(msg, currentSock, jid, messageBody) {
    const command = messageBody.slice(1).trim();
    if (!command) return;

    try {
      const { exec } = await import("child_process");
      const { promisify } = await import("util");
      const execAsync = promisify(exec);

      const isWindows = process.platform === "win32";
      const shell = isWindows ? "powershell.exe" : "/bin/bash";

      await currentSock.sendMessage(
        jid,
        {
          text: `🕕 *ᴇxᴇᴄᴜᴛɪɴɢ...*\n\n\`$ ${command}\``,
        },
        { quoted: msg }
      );

      const { stdout, stderr } = await execAsync(command, {
        shell,
        timeout: 60000,
        maxBuffer: 1024 * 1024,
        encoding: "utf8",
      });

      const output = stdout || stderr || "No output";
      await currentSock.sendMessage(jid, {
        text: `✅ *ᴛᴇʀᴍɪɴᴀʟ*\n\n\`$ ${command}\`\n\n\`\`\`\n${output.slice(
          0,
          3500
        )}\n\`\`\``,
      });
    } catch (err) {
      const errorMsg = err.stderr || err.stdout || err.message;
      await currentSock.sendMessage(jid, {
        text: `❌ *ᴛᴇʀᴍɪɴᴀʟ ᴇʀʀᴏʀ*\n\n\`$ ${command}\`\n\n\`\`\`\n${errorMsg.slice(
          0,
          3500
        )}\n\`\`\``,
      });
    }
  }

  // ── 11.21 Event: group-participants.update (duplikat queue) ─
  sock.ev.on("group-participants.update", async (update) => {
    if (options.onGroupUpdate) {
      _groupEventQueue.push({
        handler: options.onGroupUpdate,
        args: [update, sock],
      });
      _processGroupQueue();
    }
  });

  // ── 11.22 Event: groups.update (settings) ────────────────
  sock.ev.on("groups.update", async (updates) => {
    for (const update of updates) {
      if (options.onGroupSettingsUpdate) {
        try {
          await options.onGroupSettingsUpdate(update, sock);
        } catch (error) {
          console.error("[GroupsUpdate] Error:", error.message);
        }
      }
    }
  });

  // ── 11.23 Event: messages.update ──────────────────────────
  sock.ev.on("messages.update", async (updates) => {
    if (options.onMessageUpdate) {
      await options.onMessageUpdate(updates, sock);
    }
  });

  // ── 11.24 Event: call (anti call) ─────────────────────────
  if (config.features?.antiCall) {
    const mod = await import("./lib/ourin-database.js");
    const db = mod.getDatabase();

    sock.ev.on("call", async (calls) => {
      for (const call of calls) {
        if (call.status === "offer") {
          colors.logger.warn("Call", `Menolak panggilan dari ${call.from}`);
          await sock.rejectCall(call.id, call.from);

          await sock.sendMessage(call.from, {
            text: config.messages?.rejectCall,
          });

          if (config.features?.blockIfCall) {
            await sock.updateBlockStatus(call.from, "block");
            try {
              await db.setUser(call.from, { isBlocked: true });
            } catch {}
          }
        }
      }
    });
  }

  // ── 11.25 Flush interval & return ────────────────────────
  process.nextTick(() => {
    try {
      sock.ev?.flush?.();
    } catch {}
  });

  setTimeout(() => {
    try {
      sock.ev?.flush?.();
    } catch {}
  }, 2000);

  const flushInterval = setInterval(() => {
    if (!connectionState.isConnected) {
      clearInterval(flushInterval);
      return;
    }
    try {
      sock.ev?.flush?.();
    } catch {}
  }, 30000);

  if (flushInterval.unref) flushInterval.unref();

  return sock;
}

// ════════════════════════════════════════════════════════════
// 12. STATE ACCESSORS
// ════════════════════════════════════════════════════════════

/** Mengembalikan state koneksi saat ini */
function getConnectionState() {
  return connectionState;
}

/** Mengembalikan instance socket aktif */
function getSocket() {
  return connectionState.sock;
}

/** Cek apakah bot sedang terkoneksi */
function isConnected() {
  return connectionState.isConnected;
}

/** Mengembalikan uptime dalam milidetik */
function getUptime() {
  if (!connectionState.connectedAt) return 0;
  return Date.now() - connectionState.connectedAt.getTime();
}

// ════════════════════════════════════════════════════════════
// 13. LOGOUT
// ════════════════════════════════════════════════════════════

/**
 * Logout dari WhatsApp dan hapus folder session.
 * @returns {Promise<boolean>}
 */
async function logout() {
  try {
    const sessionPath = getSessionPath();

    if (connectionState.sock) {
      await connectionState.sock.logout();
    }

    if (fs.existsSync(sessionPath)) {
      fs.rmSync(sessionPath, { recursive: true, force: true });
    }

    connectionState.isConnected = false;
    connectionState.sock = null;
    connectionState.connectedAt = null;

    colors.logger.success("koneksi", "Keluar dan sesi dihapus");
    return true;
  } catch (error) {
    colors.logger.error("koneksi", "Gagal logout:", error.message);
    return false;
  }
}

// ════════════════════════════════════════════════════════════
// 14. EXPORTS
// ════════════════════════════════════════════════════════════
export {
  startConnection,
  getConnectionState,
  getSocket,
  isConnected,
  getUptime,
  logout,
};
