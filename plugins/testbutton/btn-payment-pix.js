const { default: config } = await import('../../config.js')
import {
    sendInteractive,
    interactiveBuilder
} from '../../src/handlerbutton.js'

const pluginConfig = {
    name: 'btnpix',
    alias: ['btnpix'],
    category: 'testbutton',
    description: 'Test payment PIX interactive button',
    usage: '.btnpix',
    example: '.btnpix',
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
            text: '', // ⚠️ wajib ada walau kosong
            interactiveButtons: [
                interactiveBuilder.paymentPIX({
                    payment_settings: [
                        {
                            type: "pix_static_code",
                            pix_static_code: {
                                merchant_name: 'Test Merchant',
                                key: 'example@email.com',
                                key_type: 'EMAIL' // PHONE | EMAIL | CPF | EVP
                            }
                        }
                    ]
                })
            ]
        })

    } catch (error) {
        console.error('BTN Payment PIX Error:', error)
        await m.reply(`❌ *GAGAL*

> ${error.message}`)
    }
}

export { pluginConfig as config, handler }