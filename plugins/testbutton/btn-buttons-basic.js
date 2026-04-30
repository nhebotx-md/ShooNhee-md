const { default: config } = await import('../../config.js')
import { sendButtons } from '../../src/handlerbutton.js'

const pluginConfig = {
    name: 'btnbasic',
    alias: ['btnbasic'],
    category: 'testbutton',
    description: 'Test basic buttons message (multi button)',
    usage: '.btnbasic',
    example: '.btnbasic',
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
        await sendButtons(sock, m.chat, {
            text: 'Ini adalah button message!',
            footer: 'Test Button Basic',
            buttons: [
                {
                    buttonId: 'testbutton:basic:btn1',
                    buttonText: { displayText: 'Button 1' }
                },
                {
                    buttonId: 'testbutton:basic:btn2',
                    buttonText: { displayText: 'Button 2' }
                },
                {
                    buttonId: 'testbutton:basic:btn3',
                    buttonText: { displayText: 'Button 3' }
                }
            ]
        })

    } catch (error) {
        console.error('BTN Basic Error:', error)
        await m.reply(`❌ *GAGAL*

> ${error.message}`)
    }
}

export { pluginConfig as config, handler }