import axios from 'axios'

const pluginConfig = {
    name: 'repo',
    alias: ['sc', 'script'],
    category: 'info',
    description: 'Tampilkan repository GitHub bot beserta statistiknya',
    usage: '.repo',
    example: '.repo',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock, config }) {
    const botName = config.bot?.name || 'Flash-MD'
    const botVersion = config.bot?.version || '3.0.0'

    const repoApiUrl = 'https://github.com/nhebotx-md/mybot'
    const repoUrl = 'https://github.com/nhebotx-md/mybot'

    try {
        const { data } = await axios.get(repoApiUrl)

        const stars = data.stargazers_count?.toLocaleString() || '0'
        const forks = data.forks_count?.toLocaleString() || '0'
        const watchers = data.watchers_count?.toLocaleString() || '0'
        const createdAt = new Date(data.created_at).toLocaleDateString('id-ID')
        const updatedAt = new Date(data.pushed_at).toLocaleDateString('id-ID')

        const txt = `🤖 *${botName.toUpperCase()} v${botVersion}*

Bot WhatsApp open-source dengan performa cepat, stabil, dan mudah dikembangkan.

📂 *Repository:*
${repoUrl}

📊 *Statistik GitHub*
⭐ Stars    : ${stars}
🍴 Forks    : ${forks}
👀 Watchers : ${watchers}
📅 Dibuat   : ${createdAt}
♻️ Update   : ${updatedAt}

⚡ Powered by ${botName} v${botVersion}

> Jangan lupa ⭐ repo ini kalau kamu suka!
> Fork 🍴 & Watch 👀 untuk update terbaru.`

        await sock.sendMessage(m.chat, {
            text: txt,
            contextInfo: {
                forwardingScore: 1,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363401521421919@newsletter',
                    newsletterName: botName,
                    serverMessageId: -1
                }
            }
        }, { quoted: m })

    } catch (err) {
        console.error('Repo Plugin Error:', err.message)

        await sock.sendMessage(m.chat, {
            text: `❌ Gagal mengambil data repository.\nCoba lagi nanti.\n\n⚡ ${botName}`,
            contextInfo: {
                forwardingScore: 1,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363401521421919@newsletter',
                    newsletterName: botName,
                    serverMessageId: -1
                }
            }
        }, { quoted: m })
    }
}

export { pluginConfig as config, handler }