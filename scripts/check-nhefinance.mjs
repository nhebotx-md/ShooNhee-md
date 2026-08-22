const baseUrl = (process.env.NHEFINANCE_BASE_URL || 'https://finorafinanc-hbyzxtda.manus.space').replace(/\/$/, '');
const serviceSecret = process.env.NHEFINANCE_BOT_SERVICE_SECRET || '';

if (!/^https:\/\/[^\s]+$/i.test(baseUrl)) {
  throw new Error('NHEFINANCE_BASE_URL harus memakai URL HTTPS yang valid.');
}

if (serviceSecret.trim().length < 32) {
  throw new Error('NHEFINANCE_BOT_SERVICE_SECRET belum diatur atau terlalu pendek.');
}

console.log('Konfigurasi NHEfinance siap.');
