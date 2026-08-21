<div align="center">

<img src="./banner.jpg" alt="ShooNhee MD" width="100%" />

# ShooNhee MD

**WhatsApp Multi-Device Bot berbasis Node.js dengan arsitektur plugin modular.**

[Mulai cepat](#mulai-cepat) · [Konfigurasi](#konfigurasi) · [Pairing WhatsApp](#pairing-whatsapp) · [Operasi Termux](#operasi-termux) · [Troubleshooting](#troubleshooting)

<p>
  <img src="https://img.shields.io/badge/Node.js-%3E%3D%2022-339933?style=flat-square&logo=nodedotjs&logoColor=white" alt="Node.js 22 atau lebih baru" />
  <img src="https://img.shields.io/badge/Runtime-ESM-F7DF1E?style=flat-square&logo=javascript&logoColor=black" alt="ES Modules" />
  <img src="https://img.shields.io/badge/WhatsApp-Multi--Device-25D366?style=flat-square&logo=whatsapp&logoColor=white" alt="WhatsApp Multi-Device" />
  <img src="https://img.shields.io/github/license/nhebotx-md/ShooNhee-md?style=flat-square&color=4c6ef5" alt="Lisensi ISC" />
</p>

</div>

---

## Ringkasan

**ShooNhee MD** adalah bot WhatsApp berbasis Multi-Device yang dirancang untuk penggunaan personal, komunitas, dan pengembangan fitur berbasis plugin. Proyek memakai Node.js, ES Modules, dan Baileys, dengan konfigurasi utama yang terpusat di [`config.js`](./config.js).

Strukturnya memisahkan core runtime, plugin, penyimpanan data, dan aset media agar penambahan fitur dapat dilakukan tanpa mengubah seluruh sistem. Instalasi Termux disediakan melalui [`install.sh`](./install.sh), sedangkan runtime dapat dijalankan secara langsung pada Linux atau VPS yang memenuhi dependensi proyek.

| Area | Keterangan |
|---|---|
| Runtime | Node.js **22 atau lebih baru** dengan ES Modules |
| Koneksi | WhatsApp Multi-Device melalui Baileys |
| Ekstensi | Sistem plugin dan case handler |
| Penyimpanan | Lowdb JSON di `database/main/` |
| Platform | Termux + Ubuntu proot, Linux, atau VPS kompatibel |

## Fitur Utama

ShooNhee MD memuat ratusan plugin yang dikelompokkan untuk kebutuhan administrasi grup, media, utilitas, permainan, owner tools, serta integrasi layanan. Ketersediaan command dapat berubah sesuai plugin dan konfigurasi yang aktif.

| Modul | Kemampuan utama |
|---|---|
| **Plugin system** | Pemuatan plugin modular, kategori command, dan hot reload plugin saat mode development aktif |
| **Grup & moderasi** | Fitur admin, proteksi grup, welcome/goodbye, anti-link, anti-spam, serta aturan khusus grup |
| **Media** | Pengolahan gambar, sticker, audio, video, dan utilitas downloader sesuai plugin yang tersedia |
| **Produktivitas** | Scheduler, pengingat, pencarian, translasi, dan command utilitas |
| **Ekonomi & RPG** | Sistem data pengguna, limit/energi opsional, game, dan fitur RPG |
| **Owner tools** | Kontrol owner, premium, partner, konfigurasi, dan administrasi bot |
| **Reliabilitas** | Logging, pemulihan koneksi WhatsApp, pemeriksaan memori, serta pengelolaan data berkala |

## Mulai Cepat

### Pilihan instalasi

Gunakan installer resmi repository untuk Termux karena installer tersebut menyiapkan dependency, Ubuntu proot, Node.js, dan project runtime. Untuk Linux atau VPS, gunakan instalasi Node.js manual dan pastikan dependency sistem untuk media processing tersedia.

| Platform | Jalur yang disarankan |
|---|---|
| **Android / Termux** | Jalankan `install.sh` dari repository |
| **Linux / VPS** | Clone repository, pasang Node.js 22+, jalankan `npm install`, lalu mulai dengan `node index.js` |

### Termux + Ubuntu proot

Gunakan Termux dari [F-Droid](https://f-droid.org/packages/com.termux/) atau rilis resmi [Termux GitHub](https://github.com/termux/termux-app/releases). Jangan gunakan versi Google Play yang lama.

```bash
pkg update -y && pkg upgrade -y
pkg install git -y

git clone https://github.com/nhebotx-md/ShooNhee-md.git
cd ShooNhee-md
bash install.sh
```

Setelah installer selesai, masuk ke Ubuntu proot dan mulai bot:

```bash
proot-distro login ubuntu
cd ~/ShooNhee-md
node index.js
```

> Installer dapat memerlukan waktu cukup lama karena menyiapkan Node.js, dependency native, dan paket plugin. Pastikan penyimpanan perangkat serta koneksi internet mencukupi.

### Linux atau VPS

Pastikan Node.js versi 22 atau lebih baru tersedia sebelum menjalankan perintah berikut.

```bash
git clone https://github.com/nhebotx-md/ShooNhee-md.git
cd ShooNhee-md
npm install
node index.js
```

Untuk proses media tertentu, lingkungan server mungkin memerlukan FFmpeg dan library build yang sesuai dengan arsitektur host.

## Konfigurasi

Seluruh konfigurasi inti berada di [`config.js`](./config.js). Sebelum menjalankan bot untuk pertama kali, ubah setidaknya identitas owner, nomor pairing, nama bot, mode, dan prefix command.

```js
const config = {
  owner: {
    name: 'Nama Anda',
    number: ['628xxxxxxxxxx'] // Format internasional, tanpa + atau awalan 0
  },

  session: {
    pairingNumber: '628xxxxxxxxxx',
    usePairingCode: true
  },

  bot: {
    name: 'ShooNhee MD',
    version: '1.0.1',
    developer: 'Nama Anda'
  },

  mode: 'public',
  command: { prefix: '.' }
}
```

| Opsi | Fungsi | Nilai yang disarankan |
|---|---|---|
| `owner.number` | Nomor yang memiliki akses owner | Nomor internasional, contoh `62812xxxx` |
| `session.pairingNumber` | Nomor WhatsApp yang akan ditautkan | Nomor internasional tanpa `+` atau `0` |
| `session.usePairingCode` | Memilih metode autentikasi | `true` untuk pairing code, `false` untuk QR |
| `bot.name` | Nama bot pada menu dan informasi | Nama brand bot Anda |
| `mode` | Akses command secara umum | `public` atau mode sesuai kebutuhan Anda |
| `command.prefix` | Awalan command | Contoh `.` |

### API key dan data sensitif

Beberapa plugin memakai API key atau token pihak ketiga. Isi hanya layanan yang benar-benar Anda gunakan, dan jangan pernah membagikan file `config.js`, folder session, token, atau API key ke publik.

Sebelum menjadikan repository publik, ganti nilai sensitif di `config.js` dengan placeholder milik Anda sendiri. Kunci yang sudah terlanjur diunggah sebaiknya segera dicabut dan dibuat ulang dari penyedia layanan terkait.

## Pairing WhatsApp

ShooNhee MD mendukung dua metode login. Pilih satu metode pada objek `session` di `config.js`, lalu jalankan bot.

| Metode | Konfigurasi | Tindakan di WhatsApp |
|---|---|---|
| **Pairing code** | `usePairingCode: true` | Masukkan nomor di `pairingNumber`, salin kode dari terminal, lalu gunakan menu *Tautkan perangkat dengan nomor telepon* di WhatsApp |
| **QR code** | `usePairingCode: false` | Jalankan bot lalu pindai QR dari menu *Perangkat tertaut* di WhatsApp |

Jika bot sebelumnya pernah ditautkan, kredensial WhatsApp disimpan di `storage/session/`. Jangan hapus folder tersebut kecuali Anda memang ingin menautkan ulang akun WhatsApp.

## Operasi Termux

Installer membuat helper command untuk mengelola bot dari Termux. Ketersediaan alias bergantung pada instalasi yang telah selesai dengan benar.

| Kebutuhan | Perintah |
|---|---|
| Mulai bot | `bot-start` |
| Periksa status | `bot-status` |
| Lihat log | `bot-log` |
| Masuk ke shell Ubuntu proot | `bot-shell` |
| Buka direktori bot | `bot-dir` |

Untuk menjaga bot tetap hidup di Android, gunakan `tmux` sebagai supervisor dan pasang **Termux:Boot**. Atur Termux dan Termux:Boot ke mode baterai **Tidak dibatasi / Unrestricted**, lalu jangan gunakan opsi Android *Paksa berhenti* pada kedua aplikasi.

```bash
# Pemeriksaan sesi tmux
tmux ls

# Membaca log dari sesi yang berjalan
tmux capture-pane -pt shoonhee -S -120

# Membuka sesi bot tanpa menghentikannya
tmux attach -t shoonhee
```

Untuk keluar dari tampilan `tmux` tanpa menghentikan bot, tekan `Ctrl+b`, lalu tekan `d`.

## Struktur Repository

```text
ShooNhee-md/
├── assets/                 # Font, audio, gambar, dan media pendukung
├── case/                   # Case handler tambahan
├── database/               # Data Lowdb dan penyimpanan runtime
├── plugins/                # Plugin command modular
├── src/                    # Core connection, handler, dan library
├── storage/session/        # Kredensial WhatsApp setelah pairing
├── config.js               # Konfigurasi utama
├── index.js                # Entry point bot
├── install.sh              # Installer Termux + Ubuntu proot
└── package.json            # Dependency dan metadata Node.js
```

## Membuat Plugin

Plugin disimpan di direktori [`plugins/`](./plugins). Ikuti pola plugin yang sudah ada agar metadata command, akses owner, akses grup, dan handler konsisten dengan runtime.

```js
export default {
  command: ['halo'],
  category: 'fun',
  description: 'Membalas sapaan sederhana.',

  async run({ m, conn }) {
    await conn.sendMessage(m.chat, { text: 'Halo dari ShooNhee MD.' })
  }
}
```

Setelah menambah plugin, jalankan ulang bot atau manfaatkan plugin watcher ketika mode development aktif. Hindari mengubah file core ketika kebutuhan hanya dapat dipenuhi oleh plugin baru.

## Troubleshooting

| Gejala | Pemeriksaan dan tindakan |
|---|---|
| Pairing code tidak muncul | Pastikan `usePairingCode: true`, nomor memakai format `628...`, dan koneksi internet stabil. Jalankan ulang setelah memeriksa log. |
| QR tidak muncul | Pastikan `usePairingCode: false`, hapus sesi hanya jika memang ingin login ulang, lalu mulai ulang bot. |
| Bot tidak merespons | Cek log, pastikan status WhatsApp `CONNECTED`, dan periksa apakah mode atau permission command membatasi akses. |
| Bot berhenti di Termux | Periksa `tmux ls`, jalankan ulang supervisor, lalu nonaktifkan pembatasan baterai Android untuk Termux. |
| Error module / native dependency | Pastikan Node.js memenuhi versi minimum, jalankan installer yang sesuai, atau ulangi `npm install` di lingkungan runtime yang benar. |
| Koneksi sering putus | Periksa jaringan, biarkan mekanisme reconnect berjalan, dan hindari menjalankan lebih dari satu instance untuk sesi WhatsApp yang sama. |

Saat meminta bantuan, sertakan 50–100 baris log terakhir, versi Node.js, platform yang dipakai, dan langkah yang dilakukan sebelum error muncul. Jangan sertakan API key, token, atau isi folder session.

## Kontribusi

Kontribusi yang memperbaiki stabilitas, dokumentasi, keamanan, atau kualitas plugin sangat dihargai. Buat branch terpisah, lakukan perubahan kecil yang terfokus, dan jelaskan alasan serta cara mengujinya pada pull request.

1. Fork repository ini.
2. Buat branch fitur atau perbaikan.
3. Uji perubahan pada environment Anda.
4. Buat pull request dengan deskripsi yang ringkas dan jelas.

## Penggunaan yang Bertanggung Jawab

Gunakan bot hanya pada akun, grup, layanan, dan konten yang Anda miliki izin untuk kelola. Anda bertanggung jawab atas konfigurasi, command, API pihak ketiga, serta kepatuhan penggunaan terhadap kebijakan WhatsApp dan hukum yang berlaku.

## Lisensi

Repository ini menggunakan lisensi [ISC](./package.json). Silakan periksa repository dan dependency terkait sebelum menggunakan atau mendistribusikan ulang bagian proyek.

---

<div align="center">

Dikembangkan dan dipelihara oleh **NheBotx**.

[Laporkan masalah](https://github.com/nhebotx-md/ShooNhee-md/issues) · [Lihat pembaruan](https://github.com/nhebotx-md/ShooNhee-md/commits/main)

</div>
