import fs from 'fs'
import path from 'path'

const DB_PATH = path.resolve('./src/finance/Userfinance.json')
console.log('Finance handler loaded')

// =========================
// VALIDATOR
// =========================
function isValidAmount(amount) {
    return typeof amount === 'number' && !isNaN(amount) && amount > 0
}

// =========================
// LOAD / SAVE
// =========================
function loadDB() {
    try {
        const data = JSON.parse(fs.readFileSync(DB_PATH))
        if (!data.users) data.users = {}
        return data
    } catch {
        return { users: {} }
    }
}

function saveDB(db) {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2))
}

// =========================
// INIT USER
// =========================
function initUser(db, user) {
    if (!db.users) db.users = {}

    if (!db.users[user]) {
        db.users[user] = {
            wallet: { balance: 0 },
            income: [],
            expense: [],
            targets: [],
            salary: { base: 0, workDays: 0 },
            meta: { createdAt: Date.now() }
        }
    }
}

// =========================
// RESET
// =========================
export function resetUserFinance(user) {
    const db = loadDB()

    if (!db.users) db.users = {}

    const existed = !!db.users[user]

    db.users[user] = {
        wallet: { balance: 0 },
        income: [],
        expense: [],
        targets: [],
        salary: { base: 0, workDays: 0 },
        meta: { createdAt: Date.now(), resetAt: Date.now() }
    }

    saveDB(db)

    return existed
}

// =========================
// INSIGHT
// =========================
export function getInsight(user) {
    const now = new Date()

    const thisMonth = now.getMonth()
    const thisYear = now.getFullYear()

    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1
    const lastYear = thisMonth === 0 ? thisYear - 1 : thisYear

    const current = getMonthlySummary(user, thisYear, thisMonth)
    const previous = getMonthlySummary(user, lastYear, lastMonth)

    let text = '📊 *INSIGHT KEUANGAN*\n\n'

    if (current.balance < 0) {
        text += `⚠️ Defisit: ${current.balance}\n`
    } else {
        text += `✅ Surplus: ${current.balance}\n`
    }

    const diff = current.balance - previous.balance

    if (diff > 0) {
        text += `📈 Naik dari bulan lalu (+${diff})\n`
    } else if (diff < 0) {
        text += `📉 Turun dari bulan lalu (${diff})\n`
    } else {
        text += `➖ Stabil dari bulan lalu\n`
    }

    if (current.income > 0) {
        const ratio = (current.expense / current.income) * 100

        text += `\n💸 Rasio pengeluaran: ${ratio.toFixed(1)}%\n`

        if (ratio > 80) text += '⚠️ Pengeluaran sangat tinggi\n'
        else if (ratio > 60) text += '⚠️ Mulai boros\n'
        else text += '✅ Pengeluaran terkendali\n'
    }

    text += '\n💡 Rekomendasi:\n'

    if (current.balance < 0) text += '- Kurangi pengeluaran harian\n'
    if (current.expense > current.income) text += '- Evaluasi pengeluaran terbesar\n'
    if (previous.balance > current.balance) text += '- Performa menurun\n'
    if (current.balance > 0 && current.expense < current.income) text += '- Pertahankan pola\n'

    return text
}

// =========================
// TRANSACTION
// =========================
export function addIncome(user, amount, note = '') {
    const db = loadDB()
    initUser(db, user)

    if (!isValidAmount(amount)) return false

    db.users[user].income.push({ amount, note, date: Date.now() })
    db.users[user].wallet.balance += amount

    saveDB(db)
    return true
}

export function addExpense(user, amount, note = '') {
    const db = loadDB()
    initUser(db, user)

    if (!isValidAmount(amount)) return false
    if (db.users[user].wallet.balance < amount) return false

    db.users[user].expense.push({ amount, note, date: Date.now() })
    db.users[user].wallet.balance -= amount

    saveDB(db)
    return true
}

// =========================
// TARGET
// =========================
export function addTarget(user, name, amount) {
    const db = loadDB()
    initUser(db, user)

    const u = db.users[user]

    if (!u.targets) u.targets = []

    const target = {
        id: Date.now().toString(),
        name,
        amount: Number(amount),
        collected: 0,
        createdAt: Date.now(),
        completed: false,
        completedAt: null
    }

    u.targets.push(target)
    saveDB(db)

    return target
}
export function getTargets(user) {
    const db = loadDB()
    initUser(db, user)

    return db.users[user].targets || []
}
export function deleteTarget(user, targetId) {
    const db = loadDB()
    initUser(db, user)

    const u = db.users[user]
    const before = u.targets.length

    u.targets = u.targets.filter(t => String(t.id) !== String(targetId))

    saveDB(db)

    return u.targets.length !== before
}
export function addTargetProgress(user, targetId, amount) {
    const db = loadDB()
    initUser(db, user)

    const u = db.users[user]
    const target = u.targets.find(t => t.id == targetId)

    if (!target) return { ok: false, reason: 'not_found' }

    // ========================
    // VALIDASI SALDO
    // ========================
    if (u.wallet.balance < amount) {
        return { ok: false, reason: 'insufficient_balance' }
    }

    // ========================
    // LIMIT TARGET (JANGAN OVER)
    // ========================
    const remaining = target.amount - target.collected
    const realAmount = amount > remaining ? remaining : amount

    // ========================
    // UPDATE TARGET
    // ========================
    target.collected += realAmount

    // ========================
    // AUTO POTONG SALDO
    // ========================
    u.wallet.balance -= realAmount

    // ========================
    // STATUS
    // ========================
    if (target.collected >= target.amount) {
        target.completed = true
        target.completedAt = Date.now()
    }

    saveDB(db)

    return {
        ok: true,
        used: realAmount,
        completed: !!target.completed,
        remaining: target.amount - target.collected
    }
}

// =========================
// SALARY
// =========================
export function setSalary(user, base, workDays) {
    const db = loadDB()
    initUser(db, user)

    if (!isValidAmount(base) || !isValidAmount(workDays)) return false

    db.users[user].salary = { base, workDays }

    saveDB(db)
    return true
}

function getWorkingDaysThisMonth() {
    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth()

    let count = 0

    for (let d = 1; d <= today.getDate(); d++) {
        const date = new Date(year, month, d)
        const day = date.getDay()
        if (day !== 0 && day !== 6) count++
    }

    return count
}

export function getSalaryEstimation(user) {
    const db = loadDB()
    initUser(db, user)

    const { base, workDays } = db.users[user].salary
    if (!base || !workDays || workDays <= 0) return null

    const workedDays = getWorkingDaysThisMonth()
    const daily = base / workDays

    return {
        daily,
        workedDays,
        current: Math.floor(daily * workedDays),
        full: base
    }
}

// =========================
// SUMMARY
// =========================
export function getSummary(user) {
    const db = loadDB()
    initUser(db, user)

    const u = db.users[user]

    return {
        balance: u.wallet.balance,
        income: u.income.length,
        expense: u.expense.length,
        targets: u.targets.length
    }
}

// =========================
// ANALYTICS
// =========================
function filterByMonth(data, year, month) {
    return data.filter(item => {
        const d = new Date(item.date)
        return d.getFullYear() === year && d.getMonth() === month
    })
}

export function getMonthlySummary(user, year, month) {
    const db = loadDB()
    initUser(db, user)

    const u = db.users[user]

    const income = filterByMonth(u.income || [], year, month)
    const expense = filterByMonth(u.expense || [], year, month)

    const totalIncome = income.reduce((a, b) => a + b.amount, 0)
    const totalExpense = expense.reduce((a, b) => a + b.amount, 0)

    return {
        income: totalIncome,
        expense: totalExpense,
        balance: totalIncome - totalExpense
    }
}

export function compareMonths(user) {
    const now = new Date()

    const thisMonth = now.getMonth()
    const thisYear = now.getFullYear()

    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1
    const lastYear = thisMonth === 0 ? thisYear - 1 : thisYear

    const current = getMonthlySummary(user, thisYear, thisMonth)
    const previous = getMonthlySummary(user, lastYear, lastMonth)

    return { current, previous }
}

// =========================
// HISTORY
// =========================
export function getHistory(user, limit = 10) {
    const db = loadDB()
    initUser(db, user)

    const u = db.users[user]

    const combined = [
        ...(u.income || []).map(i => ({ ...i, type: 'income' })),
        ...(u.expense || []).map(e => ({ ...e, type: 'expense' }))
    ]

    return combined
        .sort((a, b) => (b.date || 0) - (a.date || 0))
        .slice(0, limit)
}