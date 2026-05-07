import config from '../../config.js'
import fs from 'fs'
import path from 'path'
import fetch from 'node-fetch'

const pluginConfig = {
    name: 'payment',
    alias: ['bayar', 'pay', 'rekening', 'rek'],
    category: 'store',
    description: 'Tampilkan metode pembayaran dengan QRIS',
    usage: '.payment',
    example: '.payment',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

function createCopyButton(label, value) {
    return {
        name: 'cta_copy',
        buttonParamsJson: JSON.stringify({
            display_text: label,
            copy_code: value
        })
    }
}

async function handler(m, { sock, config: cfg }) {
    const payments = cfg.store?.payment || []
    const qrisUrl = cfg.store?.qris || ''

    if (!payments.length) {
        return m.reply(`💳 *ᴍᴇᴛᴏᴅᴇ ᴘᴇᴍʙᴀʏᴀʀᴀɴ*\n\nBelum dikonfigurasi.`)
    }

    let txt = `💳 *ᴍᴇᴛᴏᴅᴇ ᴘᴇᴍʙᴀʏᴀʀᴀɴ*\n\n`
    txt += `╭─「 💰 *ᴘɪʟɪʜᴀɴ* 」\n`

    for (const pay of payments) {
        txt += `┃\n`
        txt += `┃ 🏦 *${pay.name}*\n`
        txt += `┃ ├ 📱 ${pay.number}\n`
        txt += `┃ └ 👤 ${pay.holder}\n`
    }

    txt += `┃\n╰───────────────\n\n`
    txt += `> Setelah transfer, kirim bukti pembayaran`

    const buttons = payments.map(p =>
        createCopyButton(`📋 Copy ${p.name}`, p.number)
    )

    m.react('💳')

    if (qrisUrl) {
        try {
            const res = await fetch(qrisUrl)
            if (!res.ok) throw new Error()

            const buffer = Buffer.from(await res.arrayBuffer())

            return sock.sendMessage(m.chat, {
                image: buffer,
                caption: txt,
                footer: cfg.bot?.name || 'Store',
                interactiveButtons: buttons
            }, { quoted: m, ai: true })

        } catch {
            txt += `\n\n> ⚠️ QRIS gagal dimuat`
        }
    }

    return sock.sendMessage(m.chat, {
        text: txt,
        footer: cfg.bot?.name || 'Store',
        interactiveButtons: buttons
    }, { quoted: m, ai: true })
}

export { pluginConfig as config, handler }