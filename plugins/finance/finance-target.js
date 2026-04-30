const { default: config } = await import('../../config.js')
import {
    sendInteractive,
    sendList,
    interactiveBuilder
} from '../../src/handlerbutton.js'

import {
    addTarget,
    getTargets,
    addTargetProgress,
    deleteTarget,
    getSummary
} from '../../src/finance/financehandler.js'

const pluginConfig = {
    name: 'finance-target',
    alias: ['target'],
    category: 'finance',
    description: 'Manajemen target tabungan',
    usage: '.target',
    example: '.target add 5000000 laptop',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 1,
    isEnabled: true
}

// ========================
// FORMAT HELPERS
// ========================
const formatRp = (n = 0) =>
    'Rp ' + Number(n || 0).toLocaleString('id-ID')

const percent = (c = 0, a = 0) =>
    a ? Math.min(100, Math.floor((c / a) * 100)) : 0

const parse = (text = '') => {
    const parts = text.trim().split(/\s+/)
    return {
        cmd: (parts[0] || '').toLowerCase(),
        args: parts.slice(1)
    }
}

// ========================
// GUIDE TEXT (ONBOARDING)
// ========================
const guide = `
📘 *CARA PAKAI TARGET TABUNGAN*

Fitur ini membantu kamu menabung lebih terarah.

🧠 *Cara kerja sederhana:*
1. Buat target (contoh: beli HP)
2. Isi target sedikit demi sedikit
3. Pantau progres sampai 100%

━━━━━━━━━━━━━━━

📌 *COMMAND UTAMA:*

➕ Buat target:
.target add 5000000 laptop

📋 Lihat semua target:
.target list

💰 Isi tabungan:
.target isi ID 100000

🔍 Lihat detail:
.target detail ID

🗑️ Hapus target:
.target delete ID

━━━━━━━━━━━━━━━

💡 Tips:
- ID target ada di LIST
- Gunakan ID untuk isi saldo
`

// ========================
// HANDLER
// ========================
async function handler(m, { sock }) {
    try {
        const { cmd, args } = parse(m.text || '')
        const user = m.sender
        const targets = getTargets(user)

        // ========================
        // DASHBOARD
        // ========================
        if (!cmd) {
            if (!targets.length) {
                return sendInteractive(sock, m.chat, {
                    text: `🎯 *WELCOME TARGET SYSTEM*

Kamu belum punya target tabungan.

Gunakan fitur ini untuk bantu kamu lebih disiplin menabung.`,
                    footer: 'Finance • Target System',
                    interactiveButtons: [
                        interactiveBuilder.quickReply('📘 Cara Pakai', '.target help'),
                        interactiveBuilder.quickReply('➕ Buat Target', '.target add')
                    ]
                })
            }

            const preview = targets.slice(0, 3).map((t, i) =>
                `🎯 ${i + 1}. ${t.name}
💰 ${formatRp(t.collected)} / ${formatRp(t.amount)}
📊 ${percent(t.collected, t.amount)}%`
            ).join('\n\n')

            return sendInteractive(sock, m.chat, {
                text: `🎯 *DASHBOARD TARGET KAMU*

${preview}

━━━━━━━━━━━━━━━
Total target aktif: ${targets.length}

💡 Ketik .target help untuk panduan lengkap`,
                footer: 'Finance • Smart Saving',
                interactiveButtons: [
                    interactiveBuilder.quickReply('📋 Semua Target', '.target list'),
                    interactiveBuilder.quickReply('➕ Buat Baru', '.target add'),
                    interactiveBuilder.quickReply('📘 Cara Pakai', '.target help')
                ]
            })
        }

        // ========================
        // HELP
        // ========================
        if (cmd === 'help') {
            return sendInteractive(sock, m.chat, {
                text: guide,
                footer: 'Finance • Guide System',
                interactiveButtons: [
                    interactiveBuilder.quickReply('➕ Buat Target', '.target add'),
                    interactiveBuilder.quickReply('📋 Lihat Target', '.target list')
                ]
            })
        }

        // ========================
        // ADD TARGET
        // ========================
        if (cmd === 'add') {
            const amount = Number(args[0])
            const name = args.slice(1).join(' ')

            if (!amount || isNaN(amount) || !name) {
                return m.reply(
`⚠️ *Cara bikin target:*

Format:
.target add 5000000 nama target

Contoh:
.target add 5000000 laptop gaming`
                )
            }

            addTarget(user, name, amount)

            return sendInteractive(sock, m.chat, {
                text: `🎯 *TARGET BERHASIL DIBUAT*

📌 Nama: ${name}
💰 Target: ${formatRp(amount)}

Sekarang kamu bisa mulai isi sedikit demi sedikit.`,
                footer: 'Finance • Target Created',
                interactiveButtons: [
                    interactiveBuilder.quickReply('💰 Isi Sekarang', `.target list`),
                    interactiveBuilder.quickReply('📋 Lihat Semua', '.target list')
                ]
            })
        }

        // ========================
        // LIST TARGET (FIX: ID EXPOSED)
        // ========================
        if (cmd === 'list') {
            if (!targets.length) {
                return m.reply(
`📭 Kamu belum punya target.

Buat dulu dengan:
.target add 5000000 laptop`
                )
            }

            const sections = [{
                title: '🎯 Target Tabungan Kamu',
                rows: targets.map(t => ({
                    title: `${t.name} (${percent(t.collected, t.amount)}%)`,
                    description: `🆔 ID: ${t.id}
💰 ${formatRp(t.collected)} / ${formatRp(t.amount)}`,
                    rowId: `.target detail ${t.id}`
                }))
            }]

            return sendList(sock, m.chat, {
                text: `📋 *PILIH TARGET*

🧠 ID target ada di bawah nama (gunakan untuk isi tabungan)

Klik salah satu untuk lihat detail & isi tabungan`,
                buttonText: 'Buka Target',
                sections
            })
        }

        // ========================
        // DETAIL
        // ========================
        if (cmd === 'detail') {
            const id = args[0]
            const t = targets.find(x => String(x.id) === String(id))

            if (!t) return m.reply('❌ Target tidak ditemukan')

            const prog = percent(t.collected, t.amount)
            const sisa = Math.max(0, t.amount - t.collected)

            return sendInteractive(sock, m.chat, {
                text: `🎯 *DETAIL TARGET*

🆔 ID: ${t.id}
📌 ${t.name}

💰 Terkumpul: ${formatRp(t.collected)}
🎯 Target: ${formatRp(t.amount)}
📊 Progress: ${prog}%
📉 Sisa: ${formatRp(sisa)}

${prog >= 100 ? '🎉 TARGET SUDAH TERCAPAI!' : '🔥 Lanjutkan menabung sedikit demi sedikit'}`,
                footer: 'Finance • Detail Target',
                interactiveButtons: [
    interactiveBuilder.copy(
        '📋 Copy Command & isi jumlah',
        `.target isi ${t.id} jumlah`
    ),
    interactiveBuilder.quickReply(
        '💰 otomatis isi 5K',
        `.target isi ${t.id} 5000`
    ),
    interactiveBuilder.quickReply(
        '💰 otomatis isi 10K',
        `.target isi ${t.id} 10000`
    ),

                    interactiveBuilder.quickReply('💰 Isi Tabungan', `.target isi ${id}`),
                    interactiveBuilder.quickReply('🗑️ Hapus', `.target delete ${id}`),
                    interactiveBuilder.quickReply('📋 Kembali', '.target list')
                ]
            })
        }

        // ========================
        // ISI TARGET
        // ========================
        if (cmd === 'isi') {
            const id = args[0]
            const amount = Number(args[1])

            if (!id || !amount || isNaN(amount)) {
                return m.reply(
`⚠️ *Cara isi target:*

Format:
.target isi ID jumlah

Contoh:
.target isi 12345 100000`
                )
            }

            const result = addTargetProgress(user, id, amount)

            if (!result.ok) {
                return m.reply(
                    result.reason === 'insufficient_balance'
                        ? '❌ Saldo kamu tidak cukup untuk isi target ini'
                        : '❌ Target tidak ditemukan'
                )
            }

            const t = getTargets(user).find(x => String(x.id) === String(id))
            const saldo = getSummary(user).balance

            return sendInteractive(sock, m.chat, {
                text: `💰 *ISI TARGET BERHASIL*

➕ Masuk: ${formatRp(result.used)}
📊 Progress: ${percent(t?.collected, t?.amount)}%

💳 Sisa saldo kamu: ${formatRp(saldo)}

${result.completed ? '🎉 TARGET SELESAI!' : '🔥 Lanjutkan isi sedikit demi sedikit'}`,
                footer: 'Finance • Progress Update',
                interactiveButtons: [
                    interactiveBuilder.quickReply('➕ Isi Lagi', `.target isi ${id}`),
                    interactiveBuilder.quickReply('📋 List Target', '.target list')
                ]
            })
        }

        // ========================
        // DELETE
        // ========================
        if (cmd === 'delete') {
            const id = args[0]

            if (!id) {
                return m.reply(
`⚠️ Format:
.target delete ID`
                )
            }

            const ok = deleteTarget(user, id)

            if (!ok) return m.reply('❌ Target tidak ditemukan')

            return sendInteractive(sock, m.chat, {
                text: `🗑️ Target berhasil dihapus`,
                footer: 'Finance • Deleted',
                interactiveButtons: [
                    interactiveBuilder.quickReply('📋 Lihat Target', '.target list'),
                    interactiveBuilder.quickReply('➕ Buat Baru', '.target add')
                ]
            })
        }

        return m.reply(
`❌ Perintah tidak dikenal

Ketik:
.target help`
        )

    } catch (e) {
        console.error(e)
        return m.reply(`❌ System error\n\n${e.message}`)
    }
}

export { pluginConfig as config, handler }