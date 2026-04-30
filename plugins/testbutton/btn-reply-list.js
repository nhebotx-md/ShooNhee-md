const { default: config } = await import('../../config.js')
import { replyButton } from '../../src/handlerbutton.js'

const pluginConfig = {
    name: 'btnlist',
    alias: ['btnlist'],
    category: 'testbutton',
    description: 'Test reply button type list',
    usage: '.btnlist',
    example: '.btnlist',
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
        await replyButton.list(sock, m.chat, {
            name: 'Menu Test',
            description: 'Klik untuk memilih',
            rowId: 'testbutton:list:option1'
        })

    } catch (error) {
        console.error('BTN Reply List Error:', error)
        await m.reply(`❌ *GAGAL*

> ${error.message}`)
    }
}

export { pluginConfig as config, handler }