const { default: config } = await import('../../config.js')
import { 
    sendInteractive, 
    interactiveBuilder 
} from '../../src/handlerbutton.js'
import { addIncome } from '../../src/finance/financehandler.js'

const pluginConfig = {
    name: 'finance-in',
    alias: ['in'],
    category: 'finance',
    description: 'Catat pemasukan',
    usage: '.in 50000 gaji',
    example: '.in 100000 bonus',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 2,
    energi: 1,
    isEnabled: true
}

function formatRp(num) {
    return 'Rp ' + num.toLocaleString('id-ID')
}

async function handler(m, { sock }) {
    try {
        const args = m.text.trim().split(' ')
        const amount = Number(args[0])
        const note = args.slice(1).join(' ') || '-'

        // ========================
        // VALIDASI
        // ========================
        if (!amount || isNaN(amount)) {
            return m.reply(`❌ Format salah

Contoh:
.in 50000 gaji`)
        }

        // ========================
        // EXECUTE
        // ========================
        addIncome(m.sender, amount, note)

        // ========================
        // RESPONSE + FLOW
        // ========================
        const text = `✅ *INCOME BERHASIL*

💰 ${formatRp(amount)}
📝 ${note}

Data tersimpan.`

        const buttons = [
            interactiveBuilder.quickReply('➕ Tambah Lagi', '.in'),
            interactiveBuilder.quickReply('💳 Cek Wallet', '.wallet'),
            interactiveBuilder.quickReply('📤 Catat Expense', '.out'),
            interactiveBuilder.quickReply('🎯 Target', '.target')
        ]

        await sendInteractive(sock, m.chat, {
            text,
            footer: 'Finance System • Income',
            interactiveButtons: buttons
        })

    } catch (error) {
        console.error('Income Error:', error)
        await m.reply(`❌ *GAGAL*\n\n> ${error.message}`)
    }
}

export { pluginConfig as config, handler }