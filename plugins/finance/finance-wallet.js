const { default: config } = await import('../../config.js')
import { 
    sendInteractive, 
    interactiveBuilder 
} from '../../src/handlerbutton.js'
import { getSummary } from '../../src/finance/financehandler.js'

const pluginConfig = {
    name: 'finance-wallet',
    alias: ['wallet', 'saldo'],
    category: 'finance',
    description: 'Dashboard saldo & kontrol keuangan',
    usage: '.wallet',
    example: '.wallet',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 2,
    energi: 1,
    isEnabled: true
}

// ========================
// FORMAT
// ========================
function formatRp(num) {
    return 'Rp ' + num.toLocaleString('id-ID')
}

async function handler(m, { sock }) {
    try {
        const user = m.sender
        const data = getSummary(user)

        // ========================
        // STATUS
        // ========================
        const status = data.balance < 0 
            ? '🔴 Defisit' 
            : '🟢 Aman'

        // ========================
        // DASHBOARD TEXT
        // ========================
        const text = `💳 *WALLET DASHBOARD*

💰 Saldo: ${formatRp(data.balance)}
📥 Total Income: ${data.income}
📤 Total Expense: ${data.expense}
🎯 Target Aktif: ${data.targets}

📊 Status: ${status}

⚡ Quick Action:
Kelola keuangan kamu langsung dari sini.`

        // ========================
        // BUTTON FLOW
        // ========================
        const buttons = [

            // ⚡ PRIMARY ACTION
            interactiveBuilder.quickReply('➕ Income', '.in'),
            interactiveBuilder.quickReply('➖ Expense', '.out'),

            // 🎯 CONTROL
            interactiveBuilder.quickReply('🎯 Target', '.target'),
            interactiveBuilder.quickReply('💼 Salary', '.gaji'),

            // 📊 ANALYTICS
            interactiveBuilder.quickReply('📊 Report', '.report'),
            interactiveBuilder.quickReply('🧠 Insight', '.insight'),

            // 🔙 NAV
            interactiveBuilder.quickReply('🏠 Menu', '.finance')
        ]

        await sendInteractive(sock, m.chat, {
            text,
            footer: 'Finance System • Wallet Hub',
            interactiveButtons: buttons
        })

    } catch (error) {
        console.error('Wallet Error:', error)
        await m.reply(`❌ *GAGAL*\n\n> ${error.message}`)
    }
}

export { pluginConfig as config, handler }