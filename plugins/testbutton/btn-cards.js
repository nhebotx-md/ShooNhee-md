const { default: config } = await import('../../config.js')
import { sendCards } from '../../src/handlerbutton.js'

const pluginConfig = {
    name: 'btncards',
    alias: ['btncards'],
    category: 'testbutton',
    description: 'Test cards message (carousel)',
    usage: '.btncards',
    example: '.btncards',
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
        await sendCards(sock, m.chat, {
            text: 'Ini adalah cards message',
            title: 'Cards Title',
            subtitle: 'Cards Subtitle',
            footer: 'Test Cards',
            cards: [
                {
                    image: { url: 'https://example.com/image.jpg' },
                    title: 'Card 1',
                    body: 'Deskripsi Card 1',
                    footer: 'Footer Card 1',
                    buttons: [
                        {
                            name: 'quick_reply',
                            buttonParamsJson: JSON.stringify({
                                display_text: 'Klik Card 1',
                                id: 'testbutton:cards:1'
                            })
                        },
                        {
                            name: 'cta_url',
                            buttonParamsJson: JSON.stringify({
                                display_text: 'Website',
                                url: 'https://example.com'
                            })
                        }
                    ]
                },
                {
                    video: { url: 'https://example.com/video.mp4' },
                    title: 'Card 2',
                    body: 'Deskripsi Card 2',
                    footer: 'Footer Card 2',
                    buttons: [
                        {
                            name: 'quick_reply',
                            buttonParamsJson: JSON.stringify({
                                display_text: 'Klik Card 2',
                                id: 'testbutton:cards:2'
                            })
                        }
                    ]
                }
            ]
        })

    } catch (error) {
        console.error('BTN Cards Error:', error)
        await m.reply(`❌ *GAGAL*

> ${error.message}`)
    }
}

export { pluginConfig as config, handler }