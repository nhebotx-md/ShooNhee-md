# Integrasi NHEfinance untuk ShooNhee-md

## Ringkasan arsitektur

Integrasi ini menjadikan **NHEfinance sebagai satu-satunya sumber data keuangan** bagi pengguna bot yang telah tertaut. ShooNhee-md tidak menyimpan saldo, transaksi, target, anggaran, atau kredensial pengguna NHEfinance di berkas JSON bot. State lokal bot hanya menyimpan daftar JID yang meminta pemeriksaan reminder; daftar tersebut tidak memuat nomor telepon biasa, identitas Google/Manus, maupun data keuangan.

| Komponen | Tanggung jawab | Data sensitif yang disimpan |
|---|---|---|
| NHEfinance | Kepemilikan akun, transaksi, saldo, laporan, anggaran, target, hutang/piutang, transaksi berulang, notifikasi, dan bukti delivery | Data keuangan pengguna dan JID yang di-hash di database aplikasi |
| ShooNhee-md | Menerima command, mengirim request HMAC, dan mengirim reminder setelah API mengantrekan notifikasi | Daftar JID yang mendaftar dispatcher; tidak ada token per pengguna atau data keuangan |
| HMAC service secret | Mengautentikasi request server-to-server bot | Hanya environment NHEfinance dan environment runtime bot |

> Nomor WhatsApp bukan akun login. Bot memperoleh akses hanya setelah pengguna yang sudah login ke NHEfinance menyetujui kode tautan satu kali pada halaman pengaturan.

## Konfigurasi deployment bot

Salin `.env.example` ke pengelola environment hosting bot. Isi `NHEFINANCE_BOT_SERVICE_SECRET` dengan **nilai yang sama persis** seperti secret production NHEfinance. Jangan menaruh secret tersebut pada `config.js`, repository GitHub, pesan WhatsApp, atau log.

| Variabel | Wajib | Keterangan |
|---|---:|---|
| `NHEFINANCE_BASE_URL` | Ya | URL produksi NHEfinance tanpa garis miring akhir. |
| `NHEFINANCE_LINK_PAGE_URL` | Ya | Halaman pengguna untuk menyetujui kode tautan. |
| `NHEFINANCE_BOT_SERVICE_SECRET` | Ya | Secret HMAC bersama, minimal 32 karakter. |
| `NHEFINANCE_REMINDER_POLL_MS` | Tidak | Interval pemeriksaan; default 60.000 ms dan minimum efektif 30.000 ms. |

Setelah environment tersedia, restart proses bot. Bot harus tetap berjalan agar pengiriman reminder otomatis berfungsi. Jika runtime bot sedang mati, notifikasi belum diakui; bot akan kembali mencoba saat hidup dan waktu reminder pengguna telah terlewati.

## Alur penggunaan pengguna

Pengguna mengirim `.nhefinance link`. Bot mengembalikan kode yang hanya berlaku sementara. Pengguna lalu membuka `https://finorafinanc-hbyzxtda.manus.space/settings/whatsapp` dalam keadaan login, memasukkan kode, dan menyetujui tautan. Setelah itu, `.nhefinance status` memverifikasi relasi aktif dan mendaftarkan JID untuk dispatcher reminder.

| Kebutuhan | Command | Contoh |
|---|---|---|
| Menautkan akun | `.nhefinance link` | `.nhefinance link` |
| Cek atau cabut tautan | `.nhefinance status` / `.nhefinance unlink` | `.nhefinance unlink` |
| Pemasukan/pengeluaran | `.in` / `.out` | `.out 30000 Makanan | makan siang` |
| Transfer internal | `.transfer` | `.transfer 50000 Cash > Bank | setoran` |
| Ringkasan, riwayat, laporan | `.finance`, `.history`, `.report`, `.insight` | `.report` |
| Akun, kategori, anggaran, target | `.account`, `.categories`, `.budget`, `.target` | `.account add Cash | cash | 0` |
| Hutang/piutang pribadi | `.debt` | `.debt add debt | Rina | 500000 | 2026-09-01 | cicilan laptop` |
| Pembayaran hutang/piutang | `.debt pay` | `.debt pay 12 | 100000 | angsuran pertama` |
| Transaksi berulang | `.recurring` | `.recurring add out | 100000 | Internet | monthly | 2026-09-01 | paket bulanan` |
| Reminder | `.reminder` | `.reminder set 07:00`, `.reminder off`, `.reminder check` |

## Keamanan dan integritas data

Setiap request bot memakai HMAC SHA-256 atas `timestamp.rawJson`. Server menolak timestamp di luar jendela waktu lima menit dan signature yang tidak valid. Endpoint bot tidak menerima bearer session pengguna dan tidak memetakan nomor telepon ke identitas Google atau Manus.

Pencatatan pemasukan, pengeluaran, transfer, dan pembayaran hutang/piutang menggunakan hash ID pesan WhatsApp sebagai referensi sumber. Pengiriman ulang pesan yang sama tidak membuat transaksi kedua. Reminder baru diakui **setelah** `sendMessage` WhatsApp berhasil; tabel delivery NHEfinance mengunci kombinasi tautan dan notifikasi sehingga restart bot tidak menghasilkan pengiriman duplikat.

Data lokal lama pada `src/finance/Userfinance.json` tidak dihapus otomatis dan tidak lagi ditulis setelah integrasi aktif. Ini menjaga data lama dari penghapusan tidak sengaja, namun juga berarti catatan lama tidak otomatis muncul di NHEfinance. Migrasi historis perlu dilakukan secara eksplisit, setelah pengguna meninjau data sumbernya.

## Verifikasi pengelola

Jalankan `node --test test/**/*.test.js` di repositori bot. Pada proyek NHEfinance, jalankan `pnpm test`, `pnpm exec tsc --noEmit`, dan `pnpm build`. Pengujian endpoint HMAC `server/whatsappBotApi.secret.test.ts` memastikan secret yang dipasang menerima signature yang benar dan menolak signature palsu tanpa menampilkan nilainya. Regresi route-level `server/whatsapp.integration.test.ts` mensimulasikan request HMAC dengan dua JID tertaut, approval dan unlink dari caller pengguna berbeda, transaksi ulang dengan ID pesan sama, serta polling dan acknowledgement reminder berulang tanpa delivery kedua.
