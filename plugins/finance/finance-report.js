import { financeErrorText, formatRupiah, linkedFinance } from '../../src/finance/nhefinance-commands.js'

const pluginConfig = { name: 'finance-report', alias: ['report', 'laporan'], category: 'finance', description: 'Laporan arus kas NHEfinance', usage: '.report [YYYY-MM]', example: '.report 2026-08', isOwner: false, isPremium: false, isGroup: false, isPrivate: false, cooldown: 3, energi: 1, isEnabled: true }

async function handler(m) {
  try {
    const periodMonth = (m.text || '').trim() || new Date().toISOString().slice(0, 7)
    const { report } = await linkedFinance(m.sender, 'reports.month', { periodMonth })
    return m.reply(`📊 *Laporan NHEfinance ${periodMonth}*\n\nPemasukan: *${formatRupiah(report.income)}*\nPengeluaran: *${formatRupiah(report.expense)}*\nArus kas: *${formatRupiah(report.cashFlow)}*\nSaving rate: *${report.savingRate ?? 0}%*\n\nLihat halaman Laporan NHEfinance untuk rincian kategori dan grafik.`)
  } catch (error) { return m.reply(financeErrorText(error)) }
}

export { pluginConfig as config, handler }
