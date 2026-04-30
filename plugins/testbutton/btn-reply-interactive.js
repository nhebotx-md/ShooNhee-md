const { default: config } = await import('../../config.js')
import { replyButton } from '../../src/handlerbutton.js'

const pluginConfig = {
    name: 'btninteract',
    alias: ['btninteract'],
    category: 'testbutton',
    description: 'Test reply button type interactive',
    usage: '.btninteract',
    example: '.btninteract',
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
        await replyButton.interactive(sock, m.chat, {
            body: 'Klik Interactive',
            id: 'testbutton:interactive:click',
            description: 'Ini interactive button',
            version: 1
        })

    } catch (error) {
        console.error('BTN Reply Interactive Error:', error)
        await m.reply(`❌ *GAGAL*

> ${error.message}`)
    }
}

export { pluginConfig as config, handler }