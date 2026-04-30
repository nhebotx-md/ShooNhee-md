const { default: config } = await import('../../config.js')
import {
    sendInteractive,
    interactiveBuilder
} from '../../src/handlerbutton.js'

const pluginConfig = {
    name: 'btniadv',
    alias: ['btniadv'],
    category: 'testbutton',
    description: 'Test interactive advanced (copy, call, webview, location, catalog)',
    usage: '.btniadv',
    example: '.btniadv',
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
            text: 'Ini interactive advanced',
            title: 'Interactive Advanced',
            subtitle: 'Multi Action Button',
            footer: 'Test Advanced',
            interactiveButtons: [

                // Quick Reply (trigger bot)
                interactiveBuilder.quickReply(
                    'Klik Saya',
                    'testbutton:interactive:adv:click'
                ),

                // Copy Text
                interactiveBuilder.copy(
                    'Copy Link',
                    'https://example.com'
                ),

                // Call
                interactiveBuilder.call(
                    'Hubungi Kami',
                    '6281234567890'
                ),

                // Open Webview
                interactiveBuilder.webview(
                    'Buka Website',
                    'https://example.com',
                    true
                ),

                // Send Location
                interactiveBuilder.location(
                    'Kirim Lokasi'
                ),

                // Open Catalog (WA Business)
                interactiveBuilder.catalog(
                    '6281234567890'
                )
            ]
        })

    } catch (error) {
        console.error('BTN Interactive Advanced Error:', error)
        await m.reply(`❌ *GAGAL*

> ${error.message}`)
    }
}

export { pluginConfig as config, handler }