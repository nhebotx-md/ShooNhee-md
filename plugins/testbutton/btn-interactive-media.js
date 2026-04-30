const { default: config } = await import('../../config.js')
import {
    sendInteractive,
    interactiveBuilder
} from '../../src/handlerbutton.js'

const pluginConfig = {
    name: 'btnimedia',
    alias: ['btnimedia'],
    category: 'testbutton',
    description: 'Test interactive dengan media (image, video, document, location)',
    usage: '.btnimedia',
    example: '.btnimedia',
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

        // ===== IMAGE INTERACTIVE =====
        await sendInteractive(sock, m.chat, {
            media: {
                image: { url: 'https://example.com/image.jpg' }
            },
            caption: 'Ini image interactive',
            title: 'Image',
            subtitle: 'Interactive Image',
            footer: 'Test Media',
            interactiveButtons: [
                interactiveBuilder.quickReply(
                    'Klik Image',
                    'testbutton:media:image'
                )
            ]
        })

        // ===== VIDEO INTERACTIVE =====
        await sendInteractive(sock, m.chat, {
            media: {
                video: { url: 'https://example.com/video.mp4' }
            },
            caption: 'Ini video interactive',
            title: 'Video',
            subtitle: 'Interactive Video',
            footer: 'Test Media',
            interactiveButtons: [
                interactiveBuilder.quickReply(
                    'Klik Video',
                    'testbutton:media:video'
                )
            ]
        })

        // ===== DOCUMENT INTERACTIVE =====
        await sendInteractive(sock, m.chat, {
            media: {
                document: { url: 'https://example.com/file.jpg' },
                mimetype: 'image/jpeg'
            },
            caption: 'Ini document interactive',
            title: 'Document',
            subtitle: 'Interactive Document',
            footer: 'Test Media',
            interactiveButtons: [
                interactiveBuilder.quickReply(
                    'Klik Document',
                    'testbutton:media:document'
                )
            ]
        })

        // ===== LOCATION INTERACTIVE =====
        await sendInteractive(sock, m.chat, {
            media: {
                location: {
                    degreesLatitude: -6.2,
                    degreesLongitude: 106.8,
                    name: 'Test Location'
                }
            },
            caption: 'Ini location interactive',
            title: 'Location',
            subtitle: 'Interactive Location',
            footer: 'Test Media',
            interactiveButtons: [
                interactiveBuilder.quickReply(
                    'Klik Location',
                    'testbutton:media:location'
                )
            ]
        })

    } catch (error) {
        console.error('BTN Interactive Media Error:', error)
        await m.reply(`❌ *GAGAL*

> ${error.message}`)
    }
}

export { pluginConfig as config, handler }