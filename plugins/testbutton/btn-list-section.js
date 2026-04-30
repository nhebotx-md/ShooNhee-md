const { default: config } = await import('../../config.js')
import { sendList } from '../../src/handlerbutton.js'

const pluginConfig = {
    name: 'btnlistsec',
    alias: ['btnlistsec'],
    category: 'testbutton',
    description: 'Test list message dengan section',
    usage: '.btnlistsec',
    example: '.btnlistsec',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: true, // ⚠️ sesuai source: hanya stabil di private chat
    cooldown: 3,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    try {
        await sendList(sock, m.chat, {
            text: 'Ini adalah list menu',
            footer: 'Test List Section',
            title: 'Menu Utama',
            buttonText: 'Klik untuk lihat',
            sections: [
                {
                    title: 'Section 1',
                    rows: [
                        {
                            title: 'Option 1',
                            rowId: 'testbutton:listsec:opt1'
                        },
                        {
                            title: 'Option 2',
                            rowId: 'testbutton:listsec:opt2',
                            description: 'Deskripsi option 2'
                        }
                    ]
                },
                {
                    title: 'Section 2',
                    rows: [
                        {
                            title: 'Option 3',
                            rowId: 'testbutton:listsec:opt3'
                        },
                        {
                            title: 'Option 4',
                            rowId: 'testbutton:listsec:opt4',
                            description: 'Deskripsi option 4'
                        }
                    ]
                }
            ]
        })

    } catch (error) {
        console.error('BTN List Section Error:', error)
        await m.reply(`❌ *GAGAL*

> ${error.message}`)
    }
}

export { pluginConfig as config, handler }