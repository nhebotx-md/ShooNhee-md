const { default: config } = await import('../../config.js')
import { setSalary, getSalaryEstimation } from '../../src/finance/financehandler.js'

const pluginConfig = {
    name: 'finance-salary',
    alias: ['gaji'],
    category: 'finance',
    description: 'Manajemen gaji & estimasi',
    usage: '.gaji set 5000000 22',
    example: '.gaji set 4000000 20',
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
        const args = m.text.trim().split(' ')
        const sub = args[0]

        if (!sub) {
            return m.reply(`💼 *SALARY MENU*

.gaji set 5000000 22
.gaji cek`)
        }

        switch (sub) {

            // ========================
            // SET SALARY
            // ========================
            case 'set': {
                const base = Number(args[1])
                const workDays = Number(args[2])

                // VALIDASI INPUT
                if (!base || isNaN(base) || !workDays || isNaN(workDays)) {
                    return m.reply('❌ Format:\n.gaji set 5000000 22')
                }

                const ok = setSalary(m.sender, base, workDays)

                if (!ok) {
                    return m.reply(`❌ Gagal set gaji

Kemungkinan:
- Nominal tidak valid
- Hari kerja tidak valid`)
                }

                return m.reply(`💼 Gaji berhasil diset

💰 Gaji: ${base}
📅 Hari kerja: ${workDays}`)
            }

            // ========================
            // CEK ESTIMASI
            // ========================
            case 'cek': {
                const data = getSalaryEstimation(m.sender)

                if (!data) {
                    return m.reply('❌ Gaji belum diset / data tidak valid')
                }

                return m.reply(`📊 *ESTIMASI GAJI*

💰 Per hari: ${Math.floor(data.daily)}
📅 Hari berjalan: ${data.workedDays}

📈 Gaji saat ini: ${data.current}
🏁 Estimasi full: ${data.full}`)
            }

            // ========================
            // DEFAULT
            // ========================
            default:
                return m.reply('❌ Subcommand tidak dikenal')
        }

    } catch (error) {
        console.error('Salary Error:', error)
        await m.reply(`❌ *GAGAL*

> ${error.message}`)
    }
}

export { pluginConfig as config, handler }