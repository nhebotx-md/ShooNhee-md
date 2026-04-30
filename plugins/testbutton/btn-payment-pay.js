const { default: config } = await import('../../config.js')
import {
    sendInteractive,
    interactiveBuilder
} from '../../src/handlerbutton.js'

const pluginConfig = {
    name: 'btnpay',
    alias: ['btnpay'],
    category: 'testbutton',
    description: 'Test payment full flow (review and pay)',
    usage: '.btnpay',
    example: '.btnpay',
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

        await sendInteractive(sock, m.chat, {
            text: '', // ⚠️ wajib walau kosong
            interactiveButtons: [
                interactiveBuilder.paymentPay({
                    currency: 'IDR',
                    payment_configuration: '',
                    payment_type: '',
                    total_amount: {
                        value: '100000',
                        offset: '100'
                    },
                    reference_id: 'TEST-ORDER-001',
                    type: 'physical-goods',
                    payment_method: 'confirm',
                    payment_status: 'captured',
                    payment_timestamp: Math.floor(Date.now() / 1000),
                    order: {
                        status: 'completed',
                        description: 'Test pembayaran produk',
                        subtotal: {
                            value: '100000',
                            offset: '100'
                        },
                        order_type: 'PAYMENT_REQUEST',
                        items: [
                            {
                                retailer_id: 'test-item-1',
                                name: 'Produk Test',
                                amount: {
                                    value: '100000',
                                    offset: '100'
                                },
                                quantity: '1'
                            }
                        ]
                    },
                    additional_note: 'Ini hanya simulasi pembayaran',
                    native_payment_methods: [],
                    share_payment_status: false
                })
            ]
        })

    } catch (error) {
        console.error('BTN Payment Pay Error:', error)
        await m.reply(`❌ *GAGAL*

> ${error.message}`)
    }
}

export { pluginConfig as config, handler }