import config from '../../config.js'
import te from '../../src/lib/ourin-error.js'
const pluginConfig = {
    name: 'cekch',
    alias: ['cekidchannel'],
    category: 'tools',
    description: 'Cek ID Channel WhatsApp dari link atau forward message',
    usage: '.cekch <link / forward message>',
    example: '.cekch https://whatsapp.com/channel/120363025325555791',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 1,
    isEnabled: true
}

import { sendInteractive, interactiveBuilder } from '../../src/handlerbutton.js'

// ========================
// HANDLER
// ========================
async function handler(m, { sock }) {
    try {
        const text = m.text || ''
        const args = text.trim().split(/\s+/)
        const q = args.slice(1).join(' ')

        let idChannel = null
        let mode = null

        // ========================
        // MODE 1: LINK PARSE (EXISTING LOGIC - UNCHANGED BEHAVIOR)
        // ========================
        if (q) {
            let regex = /whatsapp\.com\/channel\/(\d+)/
            let match = q.match(regex)

            if (match && match[1]) {
                idChannel = match[1]
                mode = 'link'
            }
        }

        // ========================
        // MODE 2: FORWARDED MESSAGE (SAFE EXTENSION ONLY)
        // ========================
        if (!idChannel) {
            const ctx =
                m.message?.extendedTextMessage?.contextInfo ||
                m.message?.messageContextInfo ||
                m?.quoted?.message?.extendedTextMessage?.contextInfo

            const jid =
                ctx?.participant ||
                ctx?.remoteJid ||
                null

            if (jid) {
                const match = jid.match(/(\d+)@/)
                if (match) {
                    idChannel = match[1]
                    mode = 'forward'
                }
            }
        }

        // ========================
        // VALIDATION
        // ========================
        if (!idChannel) {
            return m.reply(
`⚠️ Kirim link channel atau forward pesan dari channel

Contoh:
.cekch https://whatsapp.com/channel/xxxx`
            )
        }

        const jidChannel = `${idChannel}@broadcast`
        const newsletterJid = `${idChannel}@newsletter`

        // ========================
        // RESPONSE (UNCHANGED STYLE)
        // ========================
        const pesan = `
📢 *Channel Info WhatsApp*

📡 Mode: ${mode}

🔹 *ID Channel:* ${idChannel}
🔹 *JID Channel:* ${jidChannel}
🔹 *Newsletter JID:* ${newsletterJid}

✅ Data berhasil diekstrak dari ${mode === 'forward' ? 'forward message' : 'link'}
`

        return sendInteractive(sock, m.chat, {
            text: pesan,
            footer: 'WhatsApp Channel Tools',
            interactiveButtons: [
                interactiveBuilder.copy(
                    '📋 Copy ID Channel',
                    idChannel
                ),
                interactiveBuilder.copy(
                    '📡 Copy Broadcast JID',
                    jidChannel
                ),
                interactiveBuilder.copy(
                    '📰 Copy Newsletter JID',
                    newsletterJid
                )
            ]
        })

    } catch (err) {
        console.error('cekch error:', err)
        return m.reply('⚠️ Terjadi kesalahan saat memproses channel.')
    }
}

export { pluginConfig as config, handler }