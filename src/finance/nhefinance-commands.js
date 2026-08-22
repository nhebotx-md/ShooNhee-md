import { callNHEfinance, financeIntegrationHelp, formatRupiah, NHEfinanceApiError } from './nhefinance-api.js'

// Plugin finance memakai modul ini sebagai satu pintu untuk helper dan command.
// Re-export menjaga import `formatRupiah` pada plugin tetap kompatibel.
export { formatRupiah }

const CATEGORY_KEYWORDS = {
  income: [['gaji', 'Gaji'], ['freelance', 'Freelance'], ['bonus', 'Bonus'], ['hadiah', 'Hadiah']],
  expense: [['makan', 'Makanan'], ['kuliner', 'Makanan'], ['transport', 'Transportasi'], ['bensin', 'Transportasi'], ['ojek', 'Transportasi'], ['tagihan', 'Tagihan'], ['listrik', 'Tagihan'], ['internet', 'Tagihan'], ['belanja', 'Belanja'], ['hiburan', 'Hiburan'], ['sekolah', 'Pendidikan'], ['kursus', 'Pendidikan'], ['obat', 'Kesehatan'], ['dokter', 'Kesehatan'], ['sewa', 'Tempat Tinggal'], ['kos', 'Tempat Tinggal'], ['pulsa', 'Komunikasi'], ['langganan', 'Langganan'], ['donasi', 'Donasi'], ['hobi', 'Hobi'], ['utang', 'Pembayaran Utang']]
}

function normalized(value) { return String(value || '').trim().toLocaleLowerCase('id-ID') }

export function financeErrorText(error) {
  if (error instanceof NHEfinanceApiError && error.code === 'NOT_CONFIGURED') return '⚠️ Integrasi bot belum dikonfigurasi oleh pengelola. Secret layanan NHEfinance belum tersedia.'
  if (error instanceof NHEfinanceApiError && error.status === 401) return `🔐 WhatsApp ini belum ditautkan ke NHEfinance.\n\n${financeIntegrationHelp()}`
  return `❌ ${error?.message || 'Permintaan finance tidak dapat diproses.'}`
}

export async function linkedFinance(jid, action, payload = {}) {
  return callNHEfinance(jid, action, payload)
}

export async function accountForTransaction(jid) {
  const { accounts } = await linkedFinance(jid, 'accounts.list')
  const active = accounts.filter((account) => !account.isArchived)
  if (active.length === 0) throw new NHEfinanceApiError('Belum ada dompet/akun. Buat terlebih dahulu dengan *.account add Cash* atau buat akun melalui web NHEfinance.', { status: 400, code: 'ACCOUNT_REQUIRED' })
  return active[0]
}

export async function categoryForTransaction(jid, type, categoryInput, note) {
  const { categories } = await linkedFinance(jid, 'categories.list', { kind: type })
  const explicit = normalized(categoryInput)
  if (explicit) {
    const exact = categories.find((category) => normalized(category.name) === explicit)
    const partial = categories.find((category) => normalized(category.name).includes(explicit) || explicit.includes(normalized(category.name)))
    if (exact || partial) return exact || partial
    throw new NHEfinanceApiError(`Kategori “${categoryInput}” tidak ditemukan. Gunakan .categories ${type === 'income' ? 'in' : 'out'} untuk melihat kategori.`, { status: 400, code: 'CATEGORY_NOT_FOUND' })
  }
  const input = normalized(note)
  const mapped = CATEGORY_KEYWORDS[type].find(([keyword]) => input.includes(keyword))
  const preferredName = mapped?.[1] || (type === 'income' ? 'Pemasukan Lain' : 'Lainnya')
  return categories.find((category) => category.name === preferredName) || categories[0]
}

/** Format: .in 50000 Gaji | transfer gaji or .out 30000 Makanan | makan siang */
export function parseTransactionText(text) {
  const match = String(text || '').trim().match(/^(\d+)\s*(.*)$/)
  if (!match) return null
  const amount = Number(match[1])
  if (!Number.isSafeInteger(amount) || amount <= 0) return null
  const [categoryInput = '', note = ''] = match[2].split('|', 2).map((part) => part.trim())
  return { amount, categoryInput, note: note || categoryInput || '-' }
}

export async function recordFinanceTransaction(m, type) {
  const parsed = parseTransactionText(m.text)
  if (!parsed) throw new NHEfinanceApiError(`Format: *${type === 'income' ? '.in' : '.out'} 50000 ${type === 'income' ? 'Gaji' : 'Makanan'} | catatan*`, { status: 400, code: 'INVALID_FORMAT' })
  const [account, category] = await Promise.all([
    accountForTransaction(m.sender),
    categoryForTransaction(m.sender, type, parsed.categoryInput, parsed.note)
  ])
  const { transaction } = await linkedFinance(m.sender, 'transactions.create', {
    messageId: m.id,
    type,
    amount: parsed.amount,
    accountId: account.id,
    categoryId: category.id,
    paymentMethod: 'cash',
    note: parsed.note,
    occurredAt: new Date().toISOString()
  })
  return { ...transaction, account, category, amount: parsed.amount, note: parsed.note }
}

export function dashboardMessage(dashboard) {
  const totalBalance = dashboard?.totalBalance ?? 0
  const income = dashboard?.income ?? 0
  const expense = dashboard?.expense ?? 0
  const remaining = dashboard?.cashFlow ?? income - expense
  return `💳 *NHEfinance — Ringkasan*

Saldo total: *${formatRupiah(totalBalance)}*
Pemasukan bulan ini: *${formatRupiah(income)}*
Pengeluaran bulan ini: *${formatRupiah(expense)}*
Sisa arus kas: *${formatRupiah(remaining)}*

Data ditarik langsung dari akun NHEfinance Anda.`
}

export function listAccountsMessage(accounts) {
  if (!accounts?.length) return 'Belum ada akun. Buat dengan *.account add Cash* atau melalui web NHEfinance.'
  return `💼 *Akun NHEfinance*\n\n${accounts.map((account) => `• ${account.name}: *${formatRupiah(account.balance)}*`).join('\n')}\n\nTambah akun: *.account add Nama Akun | cash | 0*`
}
