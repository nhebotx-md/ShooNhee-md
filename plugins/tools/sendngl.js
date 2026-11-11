import axios from 'axios'
import { parseHttpUrl } from '../../src/lib/Shon-media-safety.js'
const pluginConfig = {
    name: 'sendngl',
    alias: [],
    category: 'tools',
    description: 'Send NGL',
    usage: '.sendngl <url> | <text>',
    example: '.sendngl https://ngl.link/xxxx | hai',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const [linkInput, ...messageParts] = (m.text || '').split('|')
    const link = linkInput?.trim()
    const kata = messageParts.join('|').trim()
    if(!link) return m.reply(`*LINK NGL NYA MANA ??*\nContoh: \`${m?.prefix}sendngl https://ngl.link/xxxx | hai`)
    if(!kata) return m.reply(`*KATA KATA NYA MANA ??*\n\nContoh: \`${m?.prefix}sendngl https://ngl.link/xxxx | hai`)
    let safeLink
    try {
        safeLink = parseHttpUrl(link, { allowedHosts: ['ngl.link'] }).toString()
    } catch {
        return m.reply('❌ Gunakan URL publik dari domain ngl.link.')
    }
    if (kata.length > 300) return m.reply('❌ Pesan terlalu panjang. Batas maksimal 300 karakter.')
    m.react('🎴')
    
    try {
        const { data } = await axios.get('https://api.cuki.biz.id/api/tools/sendngl', {
            params: { apikey: 'cuki-x', link: safeLink, text: kata },
            timeout: 30000,
            maxContentLength: 1024 * 1024
        })
        if (data?.status === false || data?.success === false) throw new Error('Penyedia NGL menolak permintaan.')
        await m.react('✅')
        await m.reply('✅ Pesan NGL berhasil dikirim.')
        
    } catch (error) {
        m.react('☢')
        await m.reply('❌ Pesan NGL gagal dikirim. Coba lagi nanti.')
    }
}

export { pluginConfig as config, handler }
