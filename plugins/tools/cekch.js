import config from '../../config.js'
import te from '../../src/lib/Shon-error.js'

const pluginConfig = {
    name: 'cekch',
    alias: ['cekidchannel'],
    category: 'tools',
    description: 'Cek ID dan info channel WhatsApp dari link atau forward message',
    usage: '.cekch <link / forward message>',
    example: '.cekch https://whatsapp.com/channel/xxxxx',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 1,
    isEnabled: true
}

import {
    sendInteractive,
    interactiveBuilder
} from '../../src/handlerbutton.js'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FORMAT DATE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function formatDate(timestamp) {

    if (!timestamp) return '—'

    const d = new Date(
        typeof timestamp === 'number' &&
        timestamp < 1e12
            ? timestamp * 1000
            : timestamp
    )

    const pad = (n) =>
        String(n).padStart(2, '0')

    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FORMAT SUBSCRIBERS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function formatSubs(count) {

    if (!count || count === 0) return '0'

    if (count >= 1_000_000) {
        return (
            count / 1_000_000
        ).toFixed(1).replace(/\.0$/, '') + 'M'
    }

    if (count >= 1_000) {
        return (
            count / 1_000
        ).toFixed(1).replace(/\.0$/, '') + 'K'
    }

    return String(count)
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EXTRACT CHANNEL ID
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function extractInviteCode(url) {

    const regex =
        /https:\/\/whatsapp\.com\/channel\/([A-Za-z0-9]+)/

    const match = url.match(regex)

    return match?.[1] || null
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN HANDLER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function handler(m, { sock }) {

    try {

        const text =
            m.text?.trim()

        let inviteCode = null
        let mode = null

        // ───────────────────────
        // MODE 1: LINK
        // ───────────────────────

        if (
            text &&
            text.includes(
                'https://whatsapp.com/channel/'
            )
        ) {

            inviteCode =
                extractInviteCode(text)

            if (inviteCode) {
                mode = 'link'
            }
        }

        // ───────────────────────
        // MODE 2: FORWARDED MSG
        // ───────────────────────

        if (!inviteCode) {

            const ctx =
                m.message?.extendedTextMessage?.contextInfo ||
                m.message?.messageContextInfo ||
                m?.quoted?.message?.extendedTextMessage?.contextInfo

            const jid =
                ctx?.participant ||
                ctx?.remoteJid ||
                null

            if (jid) {

                const match =
                    jid.match(/(\d+)@/)

                if (match?.[1]) {

                    inviteCode =
                        match[1]

                    mode = 'forward'
                }
            }
        }

        // ───────────────────────
        // VALIDATION
        // ───────────────────────

        if (!inviteCode) {

            return m.reply(
`⚠️ Kirim link channel atau forward pesan channel

Contoh:
.cekch https://whatsapp.com/channel/xxxxx`
            )
        }

        m.react('🕕')

        // ───────────────────────
        // FETCH CHANNEL METADATA
        // ───────────────────────

        const metadata =
            await sock.newsletterMetadata(
                'invite',
                inviteCode
            )

        // ───────────────────────
        // VALIDATION
        // ───────────────────────

        if (!metadata?.id) {

            m.react('✘')

            return m.reply(
                `── .✦ ──\n\n` +
                `> Channel tidak ditemukan .☘︎ ݁˖`
            )
        }

        // ───────────────────────
        // METADATA
        // ───────────────────────

        const chName =
            metadata.name || 'Unknown'

        const chId =
            metadata.id || 'Unknown'

        const chSubs =
            metadata.subscribers ||
            metadata.subscribers_count ||
            0

        const chDesc =
            metadata.description || '—'

        const chVerified =
            metadata.verification === 'VERIFIED'
                ? '✓ Verified'
                : 'Unverified'

        const chCreated =
            formatDate(
                metadata.creation_time
            )

        const descPreview =
            chDesc.length > 120
                ? chDesc.slice(0, 120) + '...'
                : chDesc

        const newsletterJid =
            `${inviteCode}@newsletter`

        const broadcastJid =
            `${inviteCode}@broadcast`

        // ───────────────────────
        // MESSAGE
        // ───────────────────────

        const infoText =
`── .✦ 𝗖𝗛𝗔𝗡𝗡𝗘𝗟 𝗜𝗡𝗙𝗢 ✦. ──

╭─〔 *${chName}* 〕───⬣
│ ✦ ɴᴀᴍᴀ       : *${chName}*
│ ✦ ɪᴅ            : \`${chId}\`
│ ✦ sᴜʙsᴄʀɪʙᴇʀ : *${formatSubs(chSubs)}*
│ ✦ sᴛᴀᴛᴜs     : *${chVerified}*
│ ✦ ᴅɪʙᴜᴀᴛ      : *${chCreated}*
│ ✦ ᴅᴇsᴋʀɪᴘsɪ  : ${descPreview}
│ ✦ ᴍᴏᴅᴇ       : ${mode}
╰──────────────⬣`

        // ───────────────────────
        // SEND INTERACTIVE
        // ───────────────────────

        await sendInteractive(
            sock,
            m.chat,
            {
                text: infoText,

                footer:
                    config.bot?.name ||
                    'ShooNhee-AI',

                interactiveButtons: [

                    interactiveBuilder.copy(
                        '📋 Copy Channel ID',
                        chId
                    ),

                    interactiveBuilder.copy(
                        '📰 Copy Newsletter JID',
                        newsletterJid
                    ),

                    interactiveBuilder.copy(
                        '📡 Copy Broadcast JID',
                        broadcastJid
                    )
                ]
            }
        )

        m.react('✅')

    } catch (err) {

        console.error(
            '[cekch error]:',
            err
        )

        m.react('☢')

        return m.reply(
            te(
                m.prefix,
                m.command,
                m.pushName
            )
        )
    }
}

export {
    pluginConfig as config,
    handler
}