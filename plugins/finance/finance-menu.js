import { dashboardMessage, financeErrorText, linkedFinance } from '../../src/finance/nhefinance-commands.js'

const pluginConfig = { name: 'finance-menu', alias: ['finance', 'fm'], category: 'finance', description: 'Pusat command finance NHEfinance', usage: '.finance', example: '.finance', isOwner: false, isPremium: false, isGroup: false, isPrivate: true, cooldown: 2, energi: 1, isEnabled: true }

async function handler(m) {
  try {
    const { dashboard } = await linkedFinance(m.sender, 'dashboard')
    return m.reply(`${dashboardMessage(dashboard)}\n\n*Command cepat*\n• *.in 50000 Gaji | catatan*\n• *.out 30000 Makanan | catatan*\n• *.transfer 50000 Cash > Bank | catatan*\n• *.history* · *.report* · *.insight*\n• *.account* · *.budget* · *.target*\n• *.debt* · *.recurring* · *.reminder set 07:00*\n\n*Status akses WhatsApp*\n• *.nhefinance link* — buat kode terbaru\n• *.nhefinance status* — cek status kode/tautan\n• *.nhefinance cancel* — batalkan kode tertunda\n• *.nhefinance unlink* — putuskan tautan aktif\n\nBelum tertaut? Gunakan *.nhefinance link*.`)
  } catch (error) { return m.reply(financeErrorText(error)) }
}

export { pluginConfig as config, handler }
