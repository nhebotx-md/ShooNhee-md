const { default: config } = await import('../../config.js')
import { getSummary } from '../../src/finance/financehandler.js'

const pluginConfig = {
    name: 'finance-summary',
    alias: ['summary', 'saldo'],
    category: 'finance',
    description: 'Lihat ringkasan keuangan',
    usage: '.summary',
    example: '.summary',
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
        const data = getSummary(m.sender)

        await m.reply(`📊 *RINGKASAN KEUANGAN*

💰 Saldo: ${data.balance}
📥 Pemasukan: ${data.income}
📤 Pengeluaran: ${data.expense}
🎯 Target: ${data.targets}`)

    } catch (error) {
        console.error('Finance Summary Error:', error)
        await m.reply(`❌ *GAGAL*

> ${error.message}`)
    }
}

export { pluginConfig as config, handler }