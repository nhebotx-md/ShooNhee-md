const { default: config } = await import('../../config.js')
import { getHistory } from '../../src/finance/financehandler.js'

const pluginConfig = {
    name: 'finance-history',
    alias: ['history', 'riwayat'],
    category: 'finance',
    description: 'Lihat riwayat transaksi',
    usage: '.history 10',
    example: '.history 5',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    try {
        const limit = Number(m.text.trim()) || 10

        const data = getHistory(m.sender, limit)

        if (!data.length) {
            return m.reply('📭 Belum ada transaksi')
        }

        let text = `📜 *RIWAYAT (${limit})*\n\n`

        data.forEach((t, i) => {
            const type = t.type === 'income' ? '📥' : '📤'
            const date = new Date(t.date).toLocaleDateString()

            text += `${i + 1}. ${type} ${t.amount}\n`
            text += `📝 ${t.note}\n`
            text += `📅 ${date}\n\n`
        })

        return m.reply(text)

    } catch (error) {
        console.error('History Error:', error)
        await m.reply(`❌ *GAGAL*\n\n> ${error.message}`)
    }
}

export { pluginConfig as config, handler }