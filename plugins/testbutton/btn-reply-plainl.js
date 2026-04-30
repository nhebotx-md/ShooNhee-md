const { default: config } = await import('../../config.js')
import { replyButton } from '../../src/handlerbutton.js'

const pluginConfig = {
    name: 'btnplain',
    alias: ['btnplain'],
    category: 'testbutton',
    description: 'Test reply button type plain',
    usage: '.btnplain',
    example: '.btnplain',
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
        await replyButton.plain(sock, m.chat, {
            displayText: 'Klik Saya',
            id: 'testbutton:plain:click'
        })

    } catch (error) {
        console.error('BTN Reply Plain Error:', error)
        await m.reply(`❌ *GAGAL*

> ${error.message}`)
    }
}

export { pluginConfig as config, handler }