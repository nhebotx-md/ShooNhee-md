const { default: config } = await import('../../config.js')
import { compareMonths, getMonthlySummary } from '../../src/finance/financehandler.js'

const pluginConfig = {
    name: 'finance-report',
    alias: ['report', 'laporan'],
    category: 'finance',
    description: 'Laporan keuangan bulanan',
    usage: '.report',
    example: '.report',
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
        const args = m.text.trim().split(' ')
        const sub = args[0]

        // ========================
        // DEFAULT REPORT
        // ========================
        if (!sub) {
            const now = new Date()
            const data = getMonthlySummary(
                m.sender,
                now.getFullYear(),
                now.getMonth()
            )

            return m.reply(`📊 *LAPORAN BULAN INI*

📥 Income: ${data.income}
📤 Expense: ${data.expense}
💰 Balance: ${data.balance}`)
        }

        // ========================
        // COMPARE
        // ========================
        if (sub === 'compare') {
            const { current, previous } = compareMonths(m.sender)

            return m.reply(`📊 *PERBANDINGAN BULAN*

📅 Bulan Ini
📥 ${current.income}
📤 ${current.expense}
💰 ${current.balance}

📅 Bulan Lalu
📥 ${previous.income}
📤 ${previous.expense}
💰 ${previous.balance}`)
        }

        return m.reply('❌ Subcommand tidak dikenal')

    } catch (error) {
        console.error('Report Error:', error)
        await m.reply(`❌ *GAGAL*

> ${error.message}`)
    }
}

export { pluginConfig as config, handler }