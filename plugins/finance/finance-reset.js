const { default: config } = await import('../../config.js')
import { resetUserFinance } from '../../src/finance/financehandler.js'

const pluginConfig = {
    name: 'finance-reset',
    alias: ['resetfinance', 'freset', 'financereset'],
    category: 'finance',
    description: 'Reset data keuangan (self / user lain)',
    usage: '.resetfinance confirm / .resetfinance @user confirm',
    example: '.resetfinance confirm',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

// ========================
// TARGET RESOLVER
// ========================
function resolveTarget(m, args) {
    // mention
    if (m.mentionedJid && m.mentionedJid.length) {
        return m.mentionedJid[0]
    }

    // nomor manual
    const number = args.find(a => /^\d+$/.test(a))
    if (number) {
        return number + '@s.whatsapp.net'
    }

    // default: diri sendiri
    return m.sender
}

async function handler(m, { sock }) {
    try {
        const args = m.text.trim().split(' ')

        // ========================
        // CONFIRM CHECK
        // ========================
        const confirm = args.includes('confirm')

        if (!confirm) {
            return m.reply(`⚠️ *PERINGATAN*

Perintah ini akan menghapus seluruh data keuangan.

Mode penggunaan:
• Diri sendiri → .resetfinance confirm
• User lain → .resetfinance @user confirm

> ❌ Data tidak dapat dikembalikan setelah dihapus`)
        }

        // ========================
        // TARGET
        // ========================
        const target = resolveTarget(m, args)

        // ========================
        // EXECUTE
        // ========================
        const existed = resetUserFinance(target)

        const isSelf = target === m.sender

        // ========================
        // RESPONSE
        // ========================
        if (isSelf) {
            return m.reply(
                existed
                    ? `✅ Data keuangan kamu berhasil direset

💳 Saldo: 0
📊 Semua transaksi dihapus
🎯 Target dihapus

> Sistem kembali ke kondisi awal`
                    : `⚠️ Data keuangan belum ada

Sekarang sudah dibuat baru dengan kondisi default`
            )
        } else {
            return m.reply(
                existed
                    ? `✅ Data keuangan user berhasil direset

👤 ${target}

> Semua data kembali ke 0`
                    : `⚠️ User belum memiliki data

👤 ${target}

> Data baru telah dibuat`
            )
        }

    } catch (error) {
        console.error('Finance Reset Error:', error)
        await m.reply(`❌ *GAGAL*

> ${error.message}`)
    }
}

export { pluginConfig as config, handler }