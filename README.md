# ShooNhee Bot

<p align="center">
  <b>WhatsApp Multi-Device Bot dengan Sistem Plugin Modular</b><br>
  <a href="#architecture">Arsitektur</a> ·
  <a href="#fitur">Fitur</a> ·
  <a href="#instalasi">Instalasi</a> ·
  <a href="#panduan-plugin">Panduan Plugin</a> ·
  <a href="#troubleshooting">Troubleshooting</a>
</p>

---

## Ringkasan Arsitektur

ShooNhee adalah WhatsApp bot berbasis [Baileys](https://github.com/WhiskeySockets/Baileys) yang dibangun dengan arsitektur modular berbasis plugin. Bot ini mendukung dual command system (Plugin + Case), multi-mode operasi, sistem energi/limit, role-based access control, dan fitur bisnis seperti store system, sewa bot, dan jadibot (sub-bot).

**Teknologi Utama:**
- **Runtime:** Node.js >=22 (ES Modules)
- **WhatsApp Library:** Baileys (@itsukichan/baileys v7.3.2, dipublish sebagai `ShooNhee`)
- **Database:** Lowdb (JSON-based, multi-file)
- **Media Processing:** Sharp, FFmpeg, fluent-ffmpeg
- **AI Integration:** Google Generative AI, Groq (transkripsi suara)
- **Web Scraping:** Cheerio, Axios, btch-downloader, @vreden/youtube_scraper
- **Canvas:** @napi-rs/canvas, skia-canvas, jimp
- **Deployment:** PM2 ready, Termux/PRoot compatible

---

## Fitur

### Core System

| Fitur | Deskripsi |
|-------|-----------|
| **Plugin System** | Auto-loader plugin dengan hot reload, 30+ kategori, 700+ command |
| **Case System** | Legacy switch-based command handler untuk command critical |
| **Dual Handler** | Priority: Plugin → Case → Store Command → Smart Trigger |
| **Hot Reload** | File watcher untuk plugin dan src (dev mode) |
| **Anti Crash** | Global error handler (uncaughtException, unhandledRejection) |
| **Reconnect** | Watchdog, exponential backoff, status code mapping |
| **Rate Limiting** | rate-limiter-flexible untuk anti-spam |
| **Voice Command** | Transkripsi audio ke command via Groq Whisper |
| **Smart Trigger** | Auto-reply, custom reply, keyword detection |
| **Message Logger** | Terminal UI dengan role tag, device detection |

### Bot Modes

| Mode | Deskripsi |
|------|-----------|
| `public` | Semua user dapat menggunakan (default) |
| `self` | Hanya owner + jadibot |
| `onlyGc` | Hanya grup |
| `onlyPc` | Hanya private chat |
| `onlyAdmin` | Hanya admin grup |
| `selfAdmin` | Owner + admin grup |
| `publicAdmin` | Public + admin grup (admin only untuk grup) |
| `AFK` | Bot tidak merespon dengan pesan AFK |

### Group Modes (per grup)

| Mode | Kategori Aktif |
|------|---------------|
| `all` | Semua kategori |
| `md` | Semua kecuali pushkontak, store, panel, otp |
| `cpanel` | main, group, sticker, owner, tools, panel |
| `pushkontak` | main, group, sticker, owner, pushkontak |
| `store` | main, group, sticker, owner, store |
| `otp` | main, group, sticker, owner, otp |

### Role System

| Role | Hierarki | Cara Mendapatkan |
|------|---------|-----------------|
| **Owner** | Tertinggi | Config + database owner table |
| **Partner** | Premium+ | Database partner table |
| **Premium** | Premium | Config array / database premium table (dengan expiry) |
| **Admin** | Grup | Admin grup WhatsApp |
| **User** | Default | Semua pengguna |

### Group Protection

| Fitur | Aksi |
|-------|------|
| Antilink | Hapus pesan / kick pengirim link |
| Antilink WA | Hapus pesan / kick pengirim link grup WA |
| Antilink All | Block semua format link |
| Anti Tag SW | Hapus tag status story |
| Anti Hidetag | Hapus pesan hidetag |
| Anti Delete | Forward pesan yang dihapus |
| Anti ViewOnce | Forward media view-once |
| Anti Toxic | Deteksi kata kasar dengan warn system |
| Anti Document | Hapus pesan dokumen |
| Anti Sticker | Hapus pesan sticker |
| Anti Media | Hapus pesan media |
| Anti Bot | Deteksi dan kick bot lain |
| Anti Spam | Rate limiting per user |
| Slowmode | Batasi kecepatan chat |

### AI & Media

| Fitur | Integrasi |
|-------|----------|
| **AI Chat** | Google Gemini (autoai, tanya, dan lainnya) |
| **Transkripsi Suara** | Groq Whisper API |
| **YouTube** | ytmp3, ytmp4, ytdl (via @vreden/youtube_scraper, btch-downloader) |
| **TikTok** | TikTok downloader (scraping) |
| **Instagram** | Reels, story, post downloader |
| **Spotify** | Spotify track/album downloader |
| **Canvas** | 30+ template canvas (sertifikat, meme, wanted, dll) |
| **Sticker** | Image/video ke sticker dengan exif support |
| **Konversi** | TTS, image manipulation, audio effects |

### Business Features

| Fitur | Deskripsi |
|-------|-----------|
| **Store System** | Katalog produk dengan command trigger otomatis |
| **Payment** | Multi payment gateway (Dana, OVO, GoPay, ShopeePay) |
| **Sewa Bot** | Sistem langganan grup dengan expiry otomatis |
| **Jadibot** | Sub-bot system (bot lain menjalankan instance sendiri) |
| **Push Kontak** | Broadcast ke kontak |
| **JPM** | Jadwal post message otomatis |
| **Panel** | CPanel integration (Pterodactyl, DigitalOcean) |

### Games

- Tebak Gambar, Tebak Lagu, Tebak Kata, dll (30+ game data JSON)
- Suit (Batukertas)
- TicTacToe
- Ular Tangga
- RPG System (level, energi, ekonomi)
- Family 100
- Quiz Battle

---

## Struktur Direktori

```
mybot/
├── index.js                          # Entry point, bootstrap & lifecycle
├── config.js                         # Konfigurasi sentral, role checkers, helpers
├── package.json                      # Dependencies & scripts
├── install.sh                        # Install script (dependencies sistem)
│
├── src/
│   ├── connection.js                 # Baileys socket manager, auth, reconnect
│   ├── handler.js                    # Message handler utama (pipeline lengkap)
│   ├── handlerbutton.js              # Button/interactive message handler
│   │
│   ├── lib/                          # Core libraries (~50 modules)
│   │   ├── Shon-plugins.js           # Plugin loader, register, hot reload
│   │   ├── Shon-database.js          # Lowdb wrapper, multi-file JSON DB
│   │   ├── Shon-serialize.js         # Message serializer (raw WA → rich object)
│   │   ├── Shon-socket.js            # Socket extensions (sendMedia, sticker, dll)
│   │   ├── Shon-middleware.js        # Permission checker, mode validator
│   │   ├── Shon-logger.js            # Terminal UI (banner, box, message log)
│   │   ├── Shon-context.js           # Game context, fast answer, praise system
│   │   ├── Shon-formatter.js         # Message templates, wait/error messages
│   │   ├── Shon-performance.js       # Debounce, caching, throttle
│   │   ├── Shon-group-protection.js  # Antilink, anti delete, anti tag SW
│   │   ├── Shon-level.js             # RPG level & EXP system
│   │   ├── Shon-games.js             # Game engine & session manager
│   │   ├── Shon-auto-ai.js           # Gemini AI handler
│   │   ├── Shon-auto-download.js     # Auto-detect & download URL
│   │   ├── Shon-scheduler.js         # Cron-based task scheduler
│   │   ├── Shon-backup.js            # Auto backup database
│   │   ├── Shon-temp-cleaner.js      # Cleanup tmp folder
│   │   ├── Shon-memory-monitor.js    # Memory usage monitor
│   │   ├── Shon-data-pruner.js       # Daily data pruning
│   │   ├── Shon-jadibot-manager.js   # Sub-bot lifecycle manager
│   │   ├── Shon-jadibot-database.js  # Sub-bot role database
│   │   ├── Shon-pakasir.js           # Payment gateway integration
│   │   ├── Shon-otp-service.js       # OTP service handler
│   │   ├── Shon-order-poller.js      # Order status polling
│   │   └── ... (25+ modules lain)
│   │
│   ├── scraper/                      # Custom scrapers (30+ modules)
│   │   ├── youtube.js, ytdl.js, tiktok.js
│   │   ├── spotify.js, pindl.js, reelsvideo.js
│   │   ├── gemini.js, gpt52.js, hd.js
│   │   └── ...
│   │
│   ├── data/                         # Static game data (JSON)
│   ├── finance/                      # Finance handler & user data
│   └── tiktok/                       # TikTok data profiles
│
├── plugins/                          # Plugin modules (30+ kategori, 700+ file)
│   ├── main/                         # Menu, ping, stats, system
│   ├── owner/                        # Broadcast, eval, exec, settings
│   ├── group/                        # Admin tools, welcome, protection
│   ├── download/                     # YouTube, TikTok, IG, Spotify
│   ├── ai/                           # Gemini, chatbot, AI tools
│   ├── game/                         # Tebak-tebakan, RPG, session games
│   ├── fun/                          # Confess, quotes, fun commands
│   ├── media/                        # Sticker, convert, audio
│   ├── store/                        # Product catalog, order, payment
│   ├── panel/                        # CPanel, VPS, DigitalOcean
│   ├── info/                         # News, jadwal, info lookup
│   ├── tools/                        # Utility tools
│   ├── utility/                      # Helpers, converters
│   ├── convert/                      # Format conversion
│   ├── canvas/                       # Image generation templates
│   ├── search/                       # Web search, image search
│   ├── sticker/                      # Sticker tools
│   ├── user/                         # Profile, level, register
│   ├── rpg/                          # RPG economy, items, dungeon
│   ├── nsfw/                         # NSFW content
│   ├── anime/                        # Anime search, quotes
│   ├── islamic/                      # Islamic tools, jadwal sholat
│   ├── religi/                       # Auto sahur, religious content
│   ├── primbon/                      # Primbon Jawa
│   ├── stalker/                      # Social media stalker
│   ├── ephoto/                       # E-photo frame generator
│   ├── pushkontak/                   # Contact broadcast
│   ├── jpm/                          # Scheduled messaging
│   ├── asupan/                       # Random video content
│   ├── clan/                         # Clan/group management
│   ├── cek/                          # Check/verification tools
│   ├── random/                       # Random content generator
│   ├── finance/                      # Financial tools
│   ├── tts/                          # Text-to-speech
│   ├── testbutton/                   # Button template tests
│   └── vps/                          # VPS management
│
├── case/
│   └── ShooNhee.js                   # Legacy case handler (switch-based)
│
├── database/                         # JSON databases
│   ├── main/
│   │   ├── users.json                # User data (energi, level, exp)
│   │   ├── groups.json               # Group settings & configs
│   │   ├── settings.json             # Bot settings (mode, triggers)
│   │   ├── stats.json                # Usage statistics
│   │   ├── sewa.json                 # Sewa/subscription data
│   │   ├── premium.json              # Premium users (with expiry)
│   │   ├── owner.json                # Owner numbers
│   │   └── partner.json              # Partner numbers
│   ├── cpanel/                       # CPanel role data (CEO, Owner, Reseller)
│   ├── prefix.json                   # Custom prefix config
│   └── ...
│
├── storage/                          # Session & temporary data
│   ├── session/                      # Baileys auth session
│   └── tmp/                          # Temporary files
│
├── assets/
│   └── images/                       # Thumbnails, menu images
│
└── tmp/                              # Runtime temp directory
```

---

## Arsitektur Runtime

### Startup Flow

```
index.js
  ├── printBanner()                    # Figlet ASCII banner
  ├── printStartup()                   # Info bot name, version, mode
  ├── setupAntiCrash()                 # Global error handlers
  ├── initDatabase(dbPath)             # Load Lowdb multi-file
  ├── loadPlugins(pluginsDir)          # Scan & register 700+ plugins
  ├── startDevWatcher()                # Hot reload (dev mode)
  ├── initScheduler()                  # Cron jobs
  └── startConnection()                # Baileys socket
        ├── useMultiFileAuthState()    # Load/create session
        ├── fetchLatestBaileysVersion()# Get latest WA version
        ├── makeWASocket()             # Create socket instance
        ├── extendSocket()             # Add custom methods
        └── Event binding:
              ├── creds.update         # Save credentials
              ├── connection.update    # Handle connect/disconnect/reconnect
              ├── messages.upsert      # Route ke handler.js
              ├── groups.update        # Group metadata updates
              ├── group-participants.update # Welcome/goodbye/sewa check
              └── chats.upsert         # Chat metadata cache
```

### Message Lifecycle

```
messages.upsert (Baileys)
  │
  ├── Filter: ignored types (protocol, reaction, poll, call, dll)
  ├── Deduplicate: processedMessages cache (30s TTL)
  ├── Timestamp check: abaikan pesan >5 menit
  └── Message age validation
  │
  ▼
serialize(sock, msg)                    # Rich message object
  ├── decode JID, extract body text
  ├── Parse command (prefix + name + args)
  ├── Resolve roles (owner, premium, partner, admin)
  ├── Detect media type (image, video, audio, sticker, doc)
  ├── Quoted message resolver
  └── Helper methods (reply, react, download, delete)
  │
  ▼
handler.js → messageHandler()
  ├── Anti-tag SW handler
  ├── Sticker pack handler
  ├── Database ready check
  ├── Jadibot identity override
  ├── Message logging (terminal UI)
  ├── AFK check
  ├── Group protection (antilink, antibot, mute, spam, slowmode, toxic)
  ├── Mode check (self/public/onlyGc/onlyPc/AFK)
  ├── Banned user/group check
  ├── Debounce check
  ├── Auto-read
  ├── Push name fix
  ├── User last-seen update
  ├── Top chat counter
  ├── Voice command (transkripsi → command)
  ├── Level system (add EXP)
  ├── Auto AI handler
  ├── Auto download handler
  ├── Auto join detector
  ├── Owner exec handler (>> javascript eval)
  ├── Active game session check
  ├── Sticker command handler
  ├── Smart trigger handler
  ├── Reply session handlers (YTDL, confess, sulap)
  ├── Auto sticker & auto media
  ├── Anti sticker & anti media
  ├── Spam delay cooldown
  ├── Rate limit check
  ├── Store mode handler
  ├── Case handler (legacy)
  ├── Plugin handler
  │     ├── Plugin lookup (name → alias → store command)
  │     ├── Permission check (owner, premium, group, admin, botAdmin)
  │     ├── Registration check
  │     ├── Energi/limit check
  │     ├── Cooldown check
  │     └── Execute plugin.handler(m, { sock, store, config, plugins, db })
  └── Similarity suggestion ("Did you mean?")
```

### Plugin Architecture

```
Plugin File Structure (setiap plugin):

export const config = {
  name: 'ping',                    # Nama command utama
  alias: ['p', 'speed'],           # Alias alternatif
  category: 'main',                # Kategori untuk grouping
  description: 'Cek latency bot',
  usage: '.ping',
  example: '.ping',
  isOwner: false,                  # Restrict ke owner
  isPremium: false,                # Restrict ke premium
  isGroup: false,                  # Hanya di grup
  isPrivate: false,                # Hanya di private chat
  isAdmin: false,                  # Hanya admin grup
  isBotAdmin: false,               # Bot harus admin
  cooldown: 3,                     # Cooldown dalam detik
  limit: 1,                        # Energi yang digunakan
  isEnabled: true,                 # Plugin aktif/nonaktif
}

export async function handler(m, { sock, store, config, plugins, db }) {
  # m: serialized message object
  # sock: extended Baileys socket
  # store: in-memory message store
  # config: bot configuration object
  # plugins: plugin store access
  # db: database instance

  await m.reply('Pong!')
}
```

### Plugin Store

```
pluginStore
├── commands: Map<name, Plugin>     # Lookup by command name
├── aliases: Map<alias, name>       # Redirect alias ke primary name
└── categories: Map<category, Plugin[]> # Grouping per kategori
```

### Database Architecture

Multi-file JSON database menggunakan Lowdb:

```
Database (class)
├── stores:
│   ├── users      → users.json      # { jid: { name, energi, exp, level, ... } }
│   ├── groups     → groups.json     # { gid: { name, settings, botMode, ... } }
│   ├── settings   → settings.json   # { botMode, premiumUsers, smartTriggers, ... }
│   ├── stats      → stats.json      # { commandUsage, ... }
│   ├── sewa       → sewa.json       # { enabled, groups: { gid: { expiredAt } } }
│   ├── premium    → premium.json    # [{ id, expired, ... }]
│   ├── owner      → owner.json      # [number1, number2, ...]
│   └── partner    → partner.json    # [{ id, expired, ... }]
├── Dirty tracking + debounced flush (5s interval)
├── Async atomic writes (write to .tmp → rename)
└── Auto-migration dari path lama
```

### Connection Manager (Baileys)

| Komponen | Implementasi |
|----------|-------------|
| Auth | `useMultiFileAuthState` (folder `storage/session/`) |
| Pairing | Pairing code (default) atau QR code |
| Reconnect | Exponential backoff, max 5 attempts, status code mapping |
| Watchdog | 30 menit idle → auto restart |
| Group Cache | NodeCache 5 menit TTL |
| Message Store | In-memory Map per JID, max 150 pesan per chat |
| Retry Cache | NodeCache 60 detik untuk message retry |

---

## Instalasi

### Prerequisites

- **Node.js** >= 22.0.0
- **Git**
- **FFmpeg** (untuk media processing)
- **ImageMagick** (opsional, untuk beberapa fitur canvas)

### Termux (Android)

```bash
# Update & install dependencies
pkg update && pkg upgrade -y
pkg install git nodejs ffmpeg imagemagick build-essential python -y

# Clone repository
git clone https://github.com/nhebotx-md/mybot.git
cd mybot

# Install npm dependencies
npm install

# Jika ada error native module (sharp, canvas):
npm install --build-from-source

# Edit konfigurasi
nano config.js

# Jalankan
npm start
```

### Ubuntu/Debian PRoot

```bash
# Update & install dependencies
apt update && apt upgrade -y
apt install -y git curl ffmpeg imagemagick build-essential python3

# Install Node.js 22+ (menggunakan NodeSource)
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs

# Clone & setup
git clone https://github.com/nhebotx-md/mybot.git
cd mybot
npm install

# Edit konfigurasi
nano config.js

# Jalankan
npm start
```

### Linux / VPS (Production)

```bash
# Install Node.js 22+, git, ffmpeg
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo bash -
sudo apt install -y nodejs git ffmpeg imagemagick build-essential

# Clone repository
git clone https://github.com/nhebotx-md/mybot.git
cd mybot

# Install dependencies
npm install

# Setup PM2 untuk production
sudo npm install -g pm2

# Konfigurasi bot
cp config.js config.js.backup
nano config.js

# Jalankan dengan PM2
pm2 start index.js --name shoonhee-bot
pm2 save
pm2 startup

# Monitor
pm2 logs shoonhee-bot
pm2 monit
```

### Post-Install (Wajib)

1. **Edit `config.js`**:
   - `owner.number`: Nomor owner (format: 628xxx)
   - `session.pairingNumber`: Nomor WA bot (format: 628xxx)
   - `session.usePairingCode`: `true` untuk pairing code, `false` untuk QR
   - `geminiApiKey`: API key Gemini (opsional, untuk fitur AI)
   - `APIkey.lolhuman` / `APIkey.neoxr`: API keys untuk downloader (opsional)

2. **First Run**:
   - Bot akan menampilkan pairing code
   - Buka WhatsApp → Settings → Linked Devices → Link a Device
   - Masukkan pairing code
   - Session tersimpan otomatis di `storage/session/`

---

## Menjalankan Bot

### Development Mode

```bash
# Auto hot-reload plugin
npm run dev

# Atau
NODE_ENV=development node index.js
```

### Production Mode

```bash
# Langsung
npm start

# Dengan PM2
pm2 start index.js --name shoonhee-bot

# Auto restart on crash
pm2 start index.js --name shoonhee-bot --restart-delay 5000
```

### Mode Pairing vs QR

**Pairing Code (default):**
```javascript
// config.js
session: {
  pairingNumber: '6282142783884',
  usePairingCode: true
}
```

**QR Code:**
```javascript
session: {
  usePairingCode: false
}
```

### PM2 Commands

```bash
pm2 status                    # Status bot
pm2 logs shoonhee-bot         # Lihat log
pm2 logs shoonhee-bot --lines 50
pm2 restart shoonhee-bot      # Restart bot
pm2 stop shoonhee-bot         # Stop bot
pm2 delete shoonhee-bot       # Hapus dari PM2
pm2 save                      # Simpan konfigurasi
pm2 startup                   # Auto-start on boot
```

---

## Konfigurasi Sistem

### config.js - Struktur Utama

```javascript
const config = {
  info: { website, grupwa },
  owner: { name, number[] },
  session: { pairingNumber, usePairingCode },
  bot: { name, version, developer },
  mode: 'public',                    # 'public' | 'self'
  command: { prefix: '.' },
  store: { payment[], qris },
  energi: { enabled, default, premium, owner },
  sticker: { packname, author },
  saluran: { id, name, link },       # Newsletter config
  groupProtection: {                 # Template pesan proteksi
    antilink, antilinkKick, antitoxicWarn, ...
  },
  features: {
    antiSpam, antiCall, blockIfCall,
    autoTyping, autoRead, logMessage
  },
  registration: { enabled, rewards },
  database: { path: './database/main' },
  backup: { enabled, intervalHours, retainDays },
  dev: { enabled, watchPlugins, watchSrc, debugLog },
  geminiApiKey: '',                  # Google AI API key
  APIkey: { lolhuman, neoxr, groq, covenant, ... }
}
```

### Environment Variables

| Variable | Efek |
|----------|------|
| `NODE_ENV=development` | Aktifkan dev mode (hot reload, debug log) |
| `DEBUG_PLUGINS=true` | Log detail plugin loading |

---

## Panduan Plugin Development

### Struktur Plugin Minimal

```javascript
// plugins/kategori/nama-command.js

export const config = {
  name: 'hello',
  alias: ['hi', 'halo'],
  category: 'main',
  description: 'Say hello',
  usage: '.hello [nama]',
  example: '.hello John',
  cooldown: 3,
}

export async function handler(m, { sock, store, config, db }) {
  const name = m.text || 'Friend'
  await m.reply(`Hello, ${name}! 👋`)
}
```

### Serialized Message Object (m)

| Property | Tipe | Deskripsi |
|----------|------|-----------|
| `m.id` | string | Message ID |
| `m.chat` | string | JID chat/group |
| `m.sender` | string | JID pengirim |
| `m.pushName` | string | Nama display |
| `m.fromMe` | boolean | Pesan dari bot |
| `m.isGroup` | boolean | Pesan dari grup |
| `m.isOwner` | boolean | Pengirim = owner |
| `m.isPremium` | boolean | Pengirim = premium |
| `m.isPartner` | boolean | Pengirim = partner |
| `m.isAdmin` | boolean | Pengirim = admin grup |
| `m.isBotAdmin` | boolean | Bot = admin grup |
| `m.isBanned` | boolean | Pengirim dibanned |
| `m.isCommand` | boolean | Pesan adalah command |
| `m.command` | string | Nama command |
| `m.prefix` | string | Prefix yang digunakan |
| `m.args` | string[] | Array argumen |
| `m.text` | string | Text setelah command |
| `m.body` | string | Full text pesan |
| `m.type` | string | Tipe pesan (conversation, imageMessage, dll) |
| `m.isMedia` | boolean | Mengandung media |
| `m.isImage` | boolean | Pesan gambar |
| `m.isVideo` | boolean | Pesan video |
| `m.isAudio` | boolean | Pesan audio |
| `m.isSticker` | boolean | Pesan sticker |
| `m.isDocument` | boolean | Pesan dokumen |
| `m.quoted` | object | Pesan yang di-quote |
| `m.mentionedJid` | string[] | JID yang di-mention |
| `m.messageTimestamp` | number | Timestamp pesan |

### Method pada m

| Method | Contoh | Deskripsi |
|--------|--------|-----------|
| `m.reply(text, opts)` | `m.reply('Halo')` | Reply text |
| `m.react(emoji)` | `m.react('✅')` | React emoji ke pesan |
| `m.replyImage(buffer, caption)` | `m.replyImage(buf, 'Foto')` | Reply gambar |
| `m.replyVideo(buffer, caption)` | `m.replyVideo(buf, 'Video')` | Reply video |
| `m.replyAudio(buffer)` | `m.replyAudio(buf)` | Reply audio |
| `m.replySticker(buffer)` | `m.replySticker(buf)` | Reply sticker |
| `m.replyDocument(buffer, mimetype, filename)` | `m.replyDocument(buf, 'application/pdf', 'doc.pdf')` | Reply dokumen |
| `m.replyWithMentions(text, mentions)` | `m.replyWithMentions('Hi @user', [jid])` | Reply dengan mention |
| `m.replyWithQuote(text)` | `m.replyWithQuote('Fake quoted')` | Reply dengan fake quote |
| `m.download()` | `const buf = await m.download()` | Download media buffer |
| `m.delete()` | `await m.delete()` | Hapus pesan |

### Handler Arguments

```javascript
export async function handler(m, context) {
  const {
    sock,           // Extended Baileys socket
    store,          // In-memory message store
    config,         // Bot configuration object
    plugins,        // Plugin store (getPlugin, getAllPlugins, dll)
    db              // Database instance
  } = context
}
```

### Permission Flags

Tambahkan di `config` plugin:

```javascript
export const config = {
  name: 'adminonly-cmd',
  isOwner: true,        # Hanya owner
  isPremium: true,      # Hanya premium (dan owner)
  isPartner: true,      # Hanya partner (dan owner)
  isGroup: true,        # Hanya di grup
  isPrivate: true,      # Hanya private chat
  isAdmin: true,        # Hanya admin grup (dan owner)
  isBotAdmin: true,     # Bot harus admin
  cooldown: 10,         # Cooldown 10 detik
  limit: 5,             # Gunakan 5 energi
  skipRegistration: true, # Lewati pengecekan registrasi
}
```

### Database API

```javascript
// User operations
const user = db.getUser(m.sender)           # Ambil user data
db.setUser(m.sender, { name, energi, exp }) # Set/update user
db.addUserValue(m.sender, 'koin', 100)      # Tambah field numerik

// Group operations
const group = db.getGroup(m.chat)           # Ambil group settings
db.setGroup(m.chat, { botMode: 'md' })      # Set group config

// Settings (global)
const mode = db.setting('botMode')          # Get setting
db.setting('botMode', 'public')             # Set setting

// Save
await db.save()                             # Force save
```

---

## Arsitektur Lanjutan

### Scalability Design

| Patern | Implementasi |
|--------|-------------|
| **Modular Plugin** | Plugin terisolasi, independent loading/unloading |
| **Lazy Loading** | Dynamic import untuk heavy modules (AI, games, canvas) |
| **Debounced I/O** | Database flush setiap 5s, atomic write (.tmp → rename) |
| **Caching** | Prefix cache (30s TTL), thumbnail cache, group metadata cache |
| **Message Debounce** | Cegah double-process pesan yang sama |
| **Queue Processing** | Group events diproses secara serial dengan rate limit handling |
| **Memory Management** | Auto temp cleaner, memory monitor, data pruner |
| **Game Session Isolation** | Setiap game punya session manager terpisah |

### Event-Driven System

```
Baileys Events:
  ├── connection.update      → Koneksi, reconnect, QR/pairing
  ├── creds.update           → Simpan session
  ├── messages.upsert        → Message pipeline
  ├── messages.update        → Edit, delete, reaction
  ├── groups.update          → Subject, desc, settings change
  ├── group-participants.update → Join, leave, promote, demote
  └── chats.upsert           # Chat metadata
```

### Jadibot (Sub-bot) Architecture

```
Bot Utama (Owner)
  ├── Menjalankan instance Baileys utama
  ├── Mengelola database sentral
  ├── Menerima command .jadibot
  └── Menyediakan session ke sub-bot

Jadibot (Sub-bot)
  ├── Instance Baileys terpisah
  ├── Session tersimpan di database
  ├── Role mapping: owner jadibot, premium jadibot
  ├── Restricted: tidak bisa akses owner, panel, store, pushkontak
  └── Auto-reconnect saat bot utama restart
```

---

## Troubleshooting

### Error Umum

| Error | Penyebab | Solusi |
|-------|----------|--------|
| `MODULE_NOT_FOUND` | Dependency belum terinstall | `npm install` |
| `Cannot find module 'ShooNhee'` | Package alias error | `npm install` ulang |
| `EACCES` / permission denied | Permission npm | `npm install` tanpa sudo, atau fix permission |
| `prebuild-install failed` | Native module (sharp/canvas) | Install build tools: `build-essential`, `python` |
| `FFmpeg not found` | FFmpeg belum terinstall | `pkg install ffmpeg` (Termux) / `apt install ffmpeg` |
| `Segmentation fault` | Native module crash | Reinstall dengan `--build-from-source` |

### Koneksi WhatsApp

| Status Code | Arti | Solusi |
|-------------|------|--------|
| 401 | Session expired | Hapus folder `storage/session/`, scan QR/pairing ulang |
| 403 | Akses ditolak | Cek nomor WhatsApp, coba pairing ulang |
| 440 | Session conflict | Matikan bot lain dengan nomor yang sama |
| 428 | Reconnect required | Bot akan reconnect otomatis |
| 515 | Restart required | Bot akan restart otomatis |
| 500/502/503 | Server WA error | Tunggu, bot akan retry |

### QR Code tidak muncul

```bash
# Cek config
# Pastikan usePairingCode: false

# Hapus session lama
rm -rf storage/session/

# Jalankan ulang
npm start
```

### Session Corrupt

```bash
# Hapus folder session
rm -rf storage/session/

# Atau rename untuk backup
mv storage/session storage/session-backup-$(date +%s)

# Jalankan ulang dan scan QR/pairing baru
npm start
```

### Termux Spesifik

| Masalah | Solusi |
|---------|--------|
| `Process completed (signal 9)` | Android OOM killer. Gunakan `termux-wake-lock`, kurangi plugin, disable fitur berat |
| Background kill | Jalankan dengan `termux-wake-lock && npm start` |
| Storage penuh | `npm cache clean --force`, hapus `tmp/` dan `storage/tmp/` |
| RAM tidak cukup | Disable canvas, AI, atau game modules. Gunakan PM2 dengan `--max-memory-restart` |
| Node.js outdated | `pkg install nodejs-lts` atau install via nvm |

### Android Background Restriction

```bash
# Termux wake lock (mencegah sleep)
termux-wake-lock

# Atau jalankan dengan nohup
nohup npm start > bot.log 2>&1 &

# Untuk persistent, gunakan termux-services
pkg install termux-services
sv-enable shoonhee
```

---

## Rekomendasi Performa

### Optimasi RAM (Low-end Device)

```javascript
// config.js - Disable fitur berat
features: {
  smartTriggers: false,     # Matikan auto-reply
  logMessage: false,        # Matikan message logger
  autoTyping: false,        # Matikan typing indicator
},

// Disable AI (jika tidak perlu)
geminiApiKey: '',

// Disable auto download
// Hapus atau kosongkan Shon-auto-download
```

### Tuning PM2

```bash
# ecosystem.config.cjs
module.exports = {
  apps: [{
    name: 'shoonhee-bot',
    script: './index.js',
    instances: 1,
    exec_mode: 'fork',
    max_memory_restart: '512M',
    restart_delay: 5000,
    max_restarts: 10,
    min_uptime: '10s',
    env: {
      NODE_ENV: 'production'
    },
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    cron_restart: '0 4 * * *'  # Restart otomatis jam 4 pagi
  }]
}
```

### Optimasi Media Processing

| Operasi | Library | Alternatif Ringan |
|---------|---------|-------------------|
| Image resize | Sharp | Jimp (lebih lambat tapi lebih ringan) |
| Sticker create | Sharp + FFmpeg | FFmpeg only |
| Canvas | @napi-rs/canvas | Skia-canvas atau jimp |

---

## Keamanan

### Session
- Session tersimpan di `storage/session/` (local file system)
- Jangan commit folder session ke git
- Backup session secara berkala
- Jika session dicuri, hapus folder session dan re-pair

### API Key
- API key disimpan di `config.js`
- Gunakan environment variable untuk production:
  ```javascript
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  ```
- Jangan share config.js dengan API key yang aktif

### Owner Command
- Command `>>` (eval JavaScript) = **OWNER ONLY**
- Dapat mengeksekusi kode arbitrer dengan akses penuh ke sistem
- Gunakan dengan sangat hati-hati
- Batasi nomor owner hanya ke nomor yang terpercaya

### Plugin Security
- Plugin di-load secara dinamis dengan `import()`
- Review plugin sebelum install dari sumber tidak terpercaya
- Plugin dapat mengakses: socket, database, file system, network

---

## Ecosystem & Credits

### Core Libraries

| Library | Penggunaan |
|---------|-----------|
| `@itsukichan/baileys` | WhatsApp Web API (dipublish sebagai `ShooNhee`) |
| `lowdb` | JSON database |
| `sharp` | Image processing |
| `fluent-ffmpeg` | Video/audio processing |
| `@napi-rs/canvas` | Canvas rendering |
| `@google/generative-ai` | Google Gemini AI |
| `rate-limiter-flexible` | Rate limiting |
| `p-queue` | Promise queue |
| `node-cron` | Task scheduling |
| `axios` | HTTP client |
| `cheerio` | HTML parsing |
| `jimp` | Image manipulation (fallback) |
| `qrcode` | QR code generator |
| `figlet` | ASCII art banner |
| `chalk` | Terminal colors |
| `gradient-string` | Gradient text |

### Data Sources

- Game data: Static JSON (tebak-tebakan, family 100, dll)
- Islamic: External API (jadwal sholat)
- Downloader: Multiple scraper modules
- AI: Google Generative AI API

---

## Lisensi

ISC License

---

<p align="center">
  <sub>ShooNhee Bot v1.0.1 · Built with modular architecture</sub>
</p>
