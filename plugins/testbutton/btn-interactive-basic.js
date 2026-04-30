const { default: config } = await import('../../config.js')
import {
    sendInteractive,
    interactiveBuilder
} from '../../src/handlerbutton.js'

const pluginConfig = {
    name: 'btnibasic',
    alias: ['btnibasic'],
    category: 'testbutton',
    description: 'Test interactive basic (quick reply + url)',
    usage: '.btnibasic',
    example: '.btnibasic',
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
            text: 'Ini interactive basic',
            title: 'Interactive Basic',
            subtitle: 'Quick Reply & URL',
            footer: 'Test Interactive',
            interactiveButtons: [
                interactiveBuilder.quickReply(
                    'Klik Saya',
                    'testbutton:interactive:basic:click'
                ),
                interactiveBuilder.url(
                    'Kunjungi Website',
                    'https://example.com'
                )
            ]
        })

    } catch (error) {
        console.error('BTN Interactive Basic Error:', error)
        await m.reply(`❌ *GAGAL*

> ${error.message}`)
    }
}

export { pluginConfig as config, handler }