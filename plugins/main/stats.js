import os from 'os'
import te from '../../src/lib/Shon-error.js'

const pluginConfig = {
    name: 'stats',
    alias: ['botstats', 'status', 'stat'],
    category: 'main',
    description: 'Menampilkan statistik bot',
    usage: '.stats',
    example: '.stats',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FORMAT BYTES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function formatBytes(bytes) {
    if (bytes === 0) return '0 B'

    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat(
        (bytes / Math.pow(k, i)).toFixed(2)
    ) + ' ' + sizes[i]
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FORMAT UPTIME
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function formatUptime(ms) {
    const seconds = Math.floor(ms / 1000)

    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    const parts = []

    if (days > 0) parts.push(`${days}d`)
    if (hours > 0) parts.push(`${hours}h`)
    if (minutes > 0) parts.push(`${minutes}m`)
    if (secs > 0 || parts.length === 0) {
        parts.push(`${secs}s`)
    }

    return parts.join(' ')
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN HANDLER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function handler(m, {
    sock,
    db,
    uptime,
    config: botConfig
}) {
    try {

        // ── DATABASE ──
        const users = db.db?.data?.users || {}
        const groups = db.db?.data?.groups || {}

        // ── MEMORY ──
        const memUsed = process.memoryUsage()

        // ── SYSTEM ──
        const cpuUsage = os.loadavg()[0].toFixed(2)

        const totalMem = os.totalmem()
        const freeMem = os.freemem()
        const usedMem = totalMem - freeMem

        // ── DATABASE STATS ──
        const totalUsers = Object.keys(users).length
        const totalGroups = Object.keys(groups).length

        const premiumUsers = Object
            .values(users)
            .filter(u => u.premium)
            .length

        // ── BOT INFO ──
        const botName =
            botConfig?.bot?.name ||
            'ShooNhee-AI'

        const botVersion =
            botConfig?.bot?.version ||
            '1.0.0'

        // ── STATS OBJECT ──
        const statsObj = {
            bot: botName,
            version: `v${botVersion}`,

            uptime: formatUptime(uptime),

            database: {
                users: totalUsers,
                premium: premiumUsers,
                groups: totalGroups
            },

            system: {
                platform: `${os.platform()} ${os.arch()}`,
                node: process.version,
                cpuLoad: `${cpuUsage}%`,
                ram: `${formatBytes(usedMem)} / ${formatBytes(totalMem)}`,
                heap: `${formatBytes(memUsed.heapUsed)} / ${formatBytes(memUsed.heapTotal)}`
            },

            updated: new Date().toLocaleString(
                'id-ID',
                {
                    timeZone: 'Asia/Jakarta'
                }
            )
        }

        // ── JSON FORMAT ──
        const statsText = JSON.stringify(
            statsObj,
            null,
            2
        )

        // ── FINAL MESSAGE ──
        const message = `
╭──────────────────────
│ 📊 *BOT STATISTICS*
╰──────────────────────

\`\`\`json
${statsText}
\`\`\`

╭──────────────────────
│ 🤖 ${botName}
│ ⚡ Runtime Stable
╰──────────────────────
`.trim()

        // ── SEND MESSAGE ──
        await sock.sendMessage(
            m.chat,
            {
                text: message
            },
            {
                quoted: m
            }
        )

    } catch (error) {

        console.error(
            '[STATS ERROR]',
            error
        )

        await sock.sendMessage(
            m.chat,
            {
                text: te(
                    m.prefix,
                    m.command,
                    m.pushName
                )
            },
            {
                quoted: m
            }
        )
    }
}

export {
    pluginConfig as config,
    handler
}