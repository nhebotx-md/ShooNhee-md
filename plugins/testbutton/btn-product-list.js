const { default: config } = await import('../../config.js')
import { sendProductList } from '../../src/handlerbutton.js'

const pluginConfig = {
    name: 'btnproduct',
    alias: ['btnproduct'],
    category: 'testbutton',
    description: 'Test product list message (WhatsApp catalog)',
    usage: '.btnproduct',
    example: '.btnproduct',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: true, // ⚠️ hanya stabil di private chat
    cooldown: 3,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    try {
        await sendProductList(sock, m.chat, {
            text: 'Ini adalah product list',
            footer: 'Test Product',
            title: 'Produk Kami',
            buttonText: 'Lihat Produk',
            productList: [
                {
                    title: 'Kategori Produk',
                    products: [
                        { productId: 'jkt01' },
                        { productId: 'jkt01' }
                    ]
                }
            ],
            businessOwnerJid: '6282142783884@s.whatsapp.net', // ⚠️ wajib valid
            thumbnail: 'https://example.com/image.jpg'
        })

    } catch (error) {
        console.error('BTN Product List Error:', error)
        await m.reply(`❌ *GAGAL*

> ${error.message}`)
    }
}

export { pluginConfig as config, handler }