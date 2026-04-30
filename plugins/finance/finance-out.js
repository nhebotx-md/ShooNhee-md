const { default: config } = await import('../../config.js')
import { 
    sendInteractive, 
    interactiveBuilder 
} from '../../src/handlerbutton.js'
import { addExpense } from '../../src/finance/financehandler.js'

const pluginConfig = {
    name: 'finance-out',
    alias: ['out'],
    category: 'finance',
    description: 'Catat pengeluaran',
    usage: '.out 20000 makan',
    example: '.out 15000 kopi',
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
.out 20000 makan`)
        }

        // ========================
        // EXECUTE
        // ========================
        addExpense(m.sender, amount, note)

        // ========================
        // RESPONSE + FLOW
        // ========================
        const text = `📤 *EXPENSE TERCATAT*

💸 ${formatRp(amount)}
📝 ${note}

Pengeluaran berhasil disimpan.`

        const buttons = [
            interactiveBuilder.quickReply('➖ Tambah Lagi', '.out'),
            interactiveBuilder.quickReply('💳 Cek Wallet', '.wallet'),
            interactiveBuilder.quickReply('📥 Tambah Income', '.in'),
            interactiveBuilder.quickReply('🎯 Target', '.target')
        ]

        await sendInteractive(sock, m.chat, {
            text,
            footer: 'Finance System • Expense',
            interactiveButtons: buttons
        })

    } catch (error) {
        console.error('Expense Error:', error)
        await m.reply(`❌ *GAGAL*\n\n> ${error.message}`)
    }
}

export { pluginConfig as config, handler }