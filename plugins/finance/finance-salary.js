const pluginConfig = { name: 'finance-salary', alias: ['gaji'], category: 'finance', description: 'Panduan pencatatan penghasilan NHEfinance', usage: '.in 5000000 Gaji | periode Agustus', example: '.in 5000000 Gaji | gaji bulanan', isOwner: false, isPremium: false, isGroup: false, isPrivate: true, cooldown: 2, energi: 1, isEnabled: true }

async function handler(m) {
  return m.reply('Pencatatan gaji lokal sudah dihentikan agar data tidak terpisah dari NHEfinance. Catat penghasilan aktual dengan:\n\n*.in 5000000 Gaji | gaji bulanan*\n\nLaporan dan tren penghasilan dapat dilihat dengan *.report* atau *.insight*.')
}

export { pluginConfig as config, handler }
