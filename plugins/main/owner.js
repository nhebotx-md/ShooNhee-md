import config from '../../config.js'
import { getDatabase } from '../../src/lib/Shon-database.js'

const pluginConfig = {
    name: 'owner',
    alias: ['creator', 'dev', 'developer'],
    category: 'main',
    description: 'Menampilkan kontak owner bot',
    usage: '.owner',
    example: '.owner',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock, config: botConfig }) {
    const db = getDatabase() // tetap dipertahankan (tidak dihapus)
    const ownerNumbers = botConfig.owner?.number || ['6281234567890']
    const ownerName = botConfig.owner?.name || 'Owner'
    const botName = botConfig.bot?.name || 'ShooNhee-AI'

    // ✅ FAKE QUOTED
    const fakeQuoted = {
        key: {
            fromMe: false,
            participant: '13135550002@s.whatsapp.net',
            remoteJid: '13135550002@s.whatsapp.net'
        },
        message: {
            contactMessage: {
                displayName: 'SHONHE DEVELOPER™',
                vcard: `BEGIN:VCARD
VERSION:3.0
FN:System Notification
ORG:WhatsApp
TITLE:Verified System
END:VCARD`
            }
        }
    }

    // ✅ HEADER MESSAGE (tetap ada biar lebih profesional)
    const ownerText = `👑 *OWNER OFFICIAL CONTACT*

╭━━━〔 INFO 〕━━━⬡
┃ 👤 Nama   : *${ownerName}*
┃ 🤖 Bot    : *${botName}*
┃ 📡 Status : *Online*
╰━━━━━━━━━━━━⬡

📩 Silakan hubungi owner melalui kontak di bawah.
Mohon gunakan dengan bijak (no spam / call).`

    await sock.sendMessage(m.chat, {
        text: ownerText
    }, { quoted: fakeQuoted, ai: true })

    // ✅ VCARD PROFESSIONAL (multi-owner tetap support)
    const contacts = []

    for (const number of ownerNumbers) {
        const cleanNumber = number.replace(/[^0-9]/g, '')

        const vcard = `BEGIN:VCARD
VERSION:3.0
N:${ownerName};;;;
FN:${ownerName}
ORG:${botName}
TITLE:Founder & Lead Developer

item1.TEL;waid=${cleanNumber}:+${cleanNumber}
item1.X-ABLabel:WhatsApp

item2.EMAIL;type=INTERNET:hello@${botName.toLowerCase().replace(/ /g, '')}.com
item2.X-ABLabel:Email

item3.URL:https://wa.me/${cleanNumber}
item3.X-ABLabel:Direct Chat

item4.URL:https://github.com/
item4.X-ABLabel:GitHub

item5.ADR:;;Indonesia;;;;
item5.X-ABLabel:Region

NOTE:Official ${botName} Support | Fast Response | No Spam / Call

END:VCARD`

        contacts.push({ vcard })
    }

    await sock.sendMessage(m.chat, {
        contacts: {
            displayName: `${ownerName} • ${botName}`,
            contacts
        }
    }, { quoted: fakeQuoted, ai: true })
}

export { pluginConfig as config, handler }