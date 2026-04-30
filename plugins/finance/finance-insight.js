const { default: config } = await import('../../config.js')
import { getInsight } from '../../src/finance/financehandler.js'

const pluginConfig = {
    name: 'finance-insight',
    alias: ['insight'],
    category: 'finance',
    description: 'Analisa keuangan otomatis',
    usage: '.insight',
    example: '.insight',
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
        const text = getInsight(m.sender)

        await m.reply(text)

    } catch (error) {
        console.error('Insight Error:', error)
        await m.reply(`❌ *GAGAL*

> ${error.message}`)
    }
}

export { pluginConfig as config, handler }