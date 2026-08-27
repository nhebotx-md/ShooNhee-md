const pluginConfig = { name: 'finance-reset', alias: ['resetfinance', 'freset', 'financereset'], category: 'finance', description: 'Panduan penghapusan data NHEfinance', usage: 'Kelola data melalui NHEfinance', example: '.nhefinance unlink', isOwner: false, isPremium: false, isGroup: false, isPrivate: true, cooldown: 5, energi: 1, isEnabled: true }

async function handler(m) {
  return m.reply('Untuk melindungi data keuangan, bot tidak dapat mereset data NHEfinance atau data pengguna lain. Gunakan kontrol penghapusan data pada akun NHEfinance yang sedang login. Bila Anda hanya ingin menghentikan akses bot, gunakan *.nhefinance unlink*.')
}

export { pluginConfig as config, handler }
