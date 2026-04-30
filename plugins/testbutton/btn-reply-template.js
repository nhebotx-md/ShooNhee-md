const { default: config } = await import('../../config.js')
import { replyButton } from '../../src/handlerbutton.js'

const pluginConfig = {
    name: 'btntemplate',
    alias: ['btntemplate'],
    category: 'testbutton',
    description: 'Test reply button type template',
    usage: '.btntemplate',
    example: '.btntemplate',
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
        await replyButton.template(sock, m.chat, {
            displayText: 'Klik Template',
            id: 'testbutton:template:click',
            index: 1
        })

    } catch (error) {
        console.error('BTN Reply Template Error:', error)
        await m.reply(`❌ *GAGAL*

> ${error.message}`)
    }
}

export { pluginConfig as config, handler }