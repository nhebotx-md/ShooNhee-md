import fs from 'fs'
import path from 'path'
import te from '../../src/lib/Shon-error.js'
const pluginConfig = {
    name: 'ganti-ShooNhee.mp4',
    alias: ['gantiShooNheevideo', 'setShooNheevideo'],
    category: 'owner',
    description: 'Ganti video ShooNhee.mp4',
    usage: '.ganti-ShooNhee.mp4 (reply/kirim video)',
    example: '.ganti-ShooNhee.mp4',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const isVideo = m.type === 'videoMessage' || (m.quoted && m.quoted.type === 'videoMessage')
    
    if (!isVideo) {
        return m.reply(`🎬 *ɢᴀɴᴛɪ ShoNhe.ᴍᴘ4*\n\n> Kirim/reply video untuk mengganti\n> File: assets/video/ShooNhee.mp4`)
    }
    
    try {
        let buffer
        if (m.quoted && m.quoted.isMedia) {
            buffer = await m.quoted.download()
        } else if (m.isMedia) {
            buffer = await m.download()
        }
        
        if (!buffer) {
            return m.reply(`❌ Gagal mendownload video`)
        }
        
        const targetPath = path.join(process.cwd(), 'assets', 'video', 'ShooNhee.mp4')
        
        const dir = path.dirname(targetPath)
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }
        
        fs.writeFileSync(targetPath, buffer)
        
        m.reply(`✅ *ʙᴇʀʜᴀsɪʟ*\n\n> Video ShooNhee.mp4 telah diganti`)
        
    } catch (error) {
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }