# Integrasi NHEfinance untuk ShooNhee-md

## Ringkasan arsitektur

Integrasi ini menjadikan **NHEfinance sebagai satu-satunya sumber data keuangan** bagi setiap pengguna bot. ShooNhee-md tidak menyimpan saldo, transaksi, target, anggaran, atau kredensial pengguna dalam JSON lokal. Bot hanya meneruskan command yang sudah divalidasi ke endpoint NHEfinance dan menyimpan registri JID minimal untuk dispatcher reminder.

| Komponen | Tanggung jawab | Data sensitif yang disimpan |
|---|---|---|
| NHEfinance | Kepemilikan akun, data finance, hash JID, verifikator kode akses, sesi WhatsApp, dan delivery reminder | Data finance dan state otorisasi server-side |
| ShooNhee-md | Menerima command pribadi, menandatangani request, dan mengirim reminder yang telah diantrekan | JID dispatcher minimal; tidak ada data finance atau token pengguna |
| HMAC service secret | Mengautentikasi request antar layanan | Hanya environment NHEfinance dan environment runtime bot |

> Nomor WhatsApp bukan akun login. Kode akses bukan password login web. Keduanya dipakai bersama hanya untuk membuktikan bahwa pengguna yang sama telah menyetujui link dan sedang membuka sesi finance di JID miliknya.

## Konfigurasi deployment bot

Salin `.env.example` menjadi `.env` pribadi pada host bot. Isi `NHEFINANCE_BOT_SERVICE_SECRET` dengan nilai yang identik dengan secret production NHEfinance. Jangan pernah menaruhnya pada `config.js`, GitHub, pesan WhatsApp, atau log.

| Variabel | Wajib | Keterangan |
|---|---:|---|
| `NHEFINANCE_BASE_URL` | Ya | URL produksi NHEfinance tanpa garis miring akhir. |
| `NHEFINANCE_LINK_PAGE_URL` | Ya | Halaman pengguna untuk membuat kode akses dan menyetujui kode link. |
| `NHEFINANCE_BOT_SERVICE_SECRET` | Ya | Secret HMAC bersama, minimal 32 karakter. |
| `NHEFINANCE_REMINDER_POLL_MS` | Tidak | Interval pemeriksaan; default 60.000 ms dan minimum efektif 30.000 ms. |

Di Termux, restart bot hanya setelah pemeriksaan aman berhasil:

```sh
cd ~/ShooNhee-md
npm run check:nhefinance
npm run start:termux
```

Jika pemeriksaan gagal, periksa nama variabel dan kesamaan secret pada kedua layanan tanpa mengirim nilainya kepada siapa pun. Bot tidak boleh dipaksa melewati pemeriksaan HMAC.

## Alur penggunaan pengguna

Semua command finance hanya dapat dipakai melalui **chat pribadi** dengan bot. Pengguna membuat kode akses pada halaman **Bot WhatsApp** NHEfinance, kemudian menjalankan `.nhefinance link` untuk memperoleh kode link sekali pakai. Saat login pada NHEfinance, pengguna memasukkan kode link dan menyetujui koneksi JID.

Setelah link aktif, pengguna membuka sesi dengan `.nhefinance unlock <kode-akses>`. Kode diteruskan melalui koneksi bertanda tangan untuk diverifikasi hanya di NHEfinance, lalu tidak ditampilkan atau disimpan oleh bot. Sesi tidak aktif setelah 15 menit tanpa aktivitas dan berakhir maksimal setelah 60 menit. Pengguna dapat menutupnya kapan saja dengan `.nhefinance lock`.

| Kebutuhan | Command | Contoh |
|---|---|---|
| Membuat kode penautan | `.nhefinance link` | `.nhefinance link` |
| Membuka sesi finance | `.nhefinance unlock <kode-akses>` | `.nhefinance unlock contoh-kode-pribadi` |
| Cek link dan sesi | `.nhefinance status` | `.nhefinance status` |
| Menutup sesi | `.nhefinance lock` | `.nhefinance lock` |
| Batalkan kode link pending | `.nhefinance cancel` | `.nhefinance cancel` |
| Cabut tautan aktif | `.nhefinance unlink` | `.nhefinance unlink` |
| Pemasukan/pengeluaran | `.in` / `.out` | `.out 30000 Makanan | makan siang` |
| Transfer internal | `.transfer` | `.transfer 50000 Cash > Bank | setoran` |
| Ringkasan dan laporan | `.finance`, `.history`, `.report`, `.insight` | `.report` |
| Akun, kategori, anggaran, target | `.account`, `.categories`, `.budget`, `.target` | `.account add Cash | cash | 0` |
| Hutang, piutang, dan rutin | `.debt`, `.recurring` | `.debt add debt | Rina | 500000 | 2026-09-01 | cicilan laptop` |
| Reminder | `.reminder` | `.reminder set 07:00`, `.reminder off` |

## Keamanan dan integritas data

Setiap request membawa HMAC SHA-256 atas `timestamp.rawJson`, timestamp yang valid maksimal lima menit, dan `requestId` satu kali pakai. NHEfinance menolak signature, timestamp, atau replay yang tidak valid sebelum action diproses. Endpoint tidak menerima bearer session pengguna dan tidak menganggap nomor telepon sebagai identitas Google atau Manus.

Write transaksi memakai hash ID pesan WhatsApp sebagai `sourceRef`, sehingga pengiriman ulang pesan sama tidak menciptakan transaksi kedua. Reminder hanya diakui setelah pengiriman WhatsApp berhasil dan tidak dapat memperpanjang sesi finance. Mengubah kode akses atau memutus link akan langsung membuat sesi JID tidak berlaku.

## Verifikasi pengelola

Pada repository bot, jalankan `npm test`. Pada source NHEfinance, jalankan `pnpm test`, `pnpm check`, dan `pnpm build`. Terapkan migrasi database NHEfinance terlebih dahulu, deploy source web baru, lalu uji dengan akun non-produktif: buat kode akses, link JID, pastikan command `.finance` ditolak sebelum unlock, buka sesi, buat satu transaksi, kemudian lock dan pastikan command ditolak kembali.
