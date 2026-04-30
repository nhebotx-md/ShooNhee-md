const { default: config } = await import('../../config.js')
import {
    sendInteractive,
    interactiveBuilder
} from '../../src/handlerbutton.js'

import { getSummary } from '../../src/finance/financehandler.js'

const pluginConfig = {
    name: 'finance-menu',
    alias: ['finance', 'fm'],
    category: 'finance',
    description: 'Dashboard finance + payment style',
    usage: '.finance',
    example: '.finance',
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
        const summary = getSummary(m.sender)

        // ========================
        // STEP 1: QUICK ACTION UI
        // ========================
        await sendInteractive(sock, m.chat, {
            text: `💰 *FINANCE DASHBOARD*

💳 Saldo: ${formatRp(summary.balance)}

Pilih aksi cepat:`,
            footer: 'Finance System',
            interactiveButtons: [
                interactiveBuilder.quickReply('📥 Income', '.in'),
                interactiveBuilder.quickReply('📤 Expense', '.out'),
                interactiveBuilder.quickReply('💳 Wallet', '.wallet'),
                interactiveBuilder.quickReply('🎯 Target', '.target')
            ]
        })

        // delay biar WA render normal
        await new Promise(r => setTimeout(r, 300))

        // ========================
        // STEP 2: PAYMENT STYLE UI
        // ========================
        await sendInteractive(sock, m.chat, {
            text: '',
            interactiveButtons: [
                interactiveBuilder.paymentPay({
                    currency: 'IDR',
                    payment_configuration: '',
                    payment_type: '',
                    total_amount: {
                        value: String(summary.balance || 0),
                        offset: '1'
                    },
                    reference_id: 'FINANCE-DASHBOARD',
                    type: 'digital-goods',
                    payment_method: 'confirm',
                    payment_status: 'captured',
                    payment_timestamp: Math.floor(Date.now() / 1000),
                    order: {
                        status: 'completed',
                        description: `Saldo kamu: ${formatRp(summary.balance)}`,
                        subtotal: {
                            value: String(summary.balance || 0),
                            offset: '1'
                        },
                        order_type: 'PAYMENT_REQUEST',
                        items: [
                            {
                                retailer_id: 'wallet',
                                name: 'Saldo Wallet',
                                amount: {
                                    value: String(summary.balance || 0),
                                    offset: '1'
                                },
                                quantity: '1'
                            }
                        ]
                    },
                    additional_note: 'MONEY DASBOARD',
                    native_payment_methods: [],
                    share_payment_status: false
                })
            ]
        })

    } catch (error) {
        console.error('Finance Menu Error:', error)
        await m.reply(`❌ Gagal\n\n> ${error.message}`)
    }
}

export { pluginConfig as config, handler }