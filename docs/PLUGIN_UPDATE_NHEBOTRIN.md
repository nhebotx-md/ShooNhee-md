# Pembaruan sistem plugin ShooNhee-md dari Nhebotrin

Pembaruan ini mengadaptasi pola perbaikan yang relevan dari [repository Nhebotrin](https://github.com/nhebotx-md/Nhebotrin) ke [ShooNhee-md](https://github.com/nhebotx-md/ShooNhee-md). Kode plugin tidak disalin secara massal karena kedua repository memiliki alias Baileys, helper, provider API, dan fitur khusus yang berbeda.

## Perubahan utama

- **Unduhan TikTok:** scraper kini mencoba provider YuuLabs terlebih dahulu dan memakai MusicalDown sebagai fallback. Tautan masukan dibatasi ke domain TikTok, respons API divalidasi, dan request memiliki timeout serta batas ukuran respons. `.ttmp3` menggunakan hasil audio jika tersedia atau mengekstrak audio dari video dengan file sementara yang selalu dibersihkan. Jalur error tidak lagi menggantung tanpa `resolve`/`reject`, dan URL media yang tidak valid tidak diteruskan.
- **Unduhan Instagram:** `.igdl` memakai scraper `src/scraper/ig.js`, memeriksa post/reel/story, menerima daftar media, membatasi kiriman menjadi 10 item, dan mengirim item satu per satu. Ini menggantikan format `albumMessage` lama yang tidak sesuai dengan kontrak hasil endpoint.
- **Pinterest/GIF:** `.pindl` memeriksa domain input, membatasi unduhan GIF, menggunakan file sementara unik, dan menjalankan FFmpeg dengan argumen terpisah.
- **Stiker:** pembuat sticker membatasi masukan hingga 16 MiB, membatasi durasi video sampai 10 detik, memvalidasi dimensi resize 32–512, gagal dengan jelas jika pemeriksaan durasi/proses FFmpeg gagal, dan membersihkan file sementara. Sistem mapping sticker-command tidak lagi memakai `mediaKey` sebagai identitas; penulisan JSON bersifat atomik. Pengaturan/penghapusan mapping hanya dapat dilakukan admin grup.
- **Auto-sticker dan stickerpack:** metadata ukuran/durasi diperiksa sebelum download bila tersedia; respons stickerpack dibatasi hingga 5 MiB per gambar.
- **FFmpeg untuk tools/convert:** antrean tidak lagi menjalankan command shell yang dirangkai dari string. Pemanggil `pindl`, `toaudio`, `tovn`, dan audio FX memberikan daftar argumen terpisah. Konkurensi dibatasi maksimal empat proses dan antrean dibatasi 100 pekerjaan.
- **Tools uploader:** `.tourl` hanya mengirim file ke satu host per pemanggilan. Gunakan `.tourl catbox`, `.tourl litterbox`, `.tourl tmpfiles`, `.tourl gofile`, `.tourl quax`, `.tourl ypnk`, atau `.tourl puticu`; default-nya Catbox. File dibatasi 20 MiB dan bot menyebutkan host pihak ketiga sebelum upload. Termai hanya muncul jika key dikonfigurasi.
- **Pastebin dan NGL:** key Pastebin tidak lagi tertanam di source; `sendngl` memvalidasi host dan panjang pesan, sementara `spamngl` menjadi command terpisah, hanya untuk owner, dan dibatasi maksimal tiga pengiriman.
- **Konflik command:** alias `ttmp4` dihapus dari plugin TikTok pertama sehingga nama tersebut hanya dimiliki satu plugin.

## Konfigurasi opsional

Salin `.env.example` ke `.env` pribadi pada deployment dan isi key yang memang dimiliki/diotorisasi:

```dotenv
SHON_TERMAI_KEY=
SHON_PASTEBIN_API_KEY=
```

Key kosong menonaktifkan provider terkait. Jangan commit `.env` atau menempelkan key ke chat. Key yang sebelumnya pernah disimpan dalam source publik sebaiknya dicabut/dirotasi pada dashboard providernya.

## Validasi

Test `test/plugin-safety.test.js` mencakup parsing URL, penolakan host lokal, batas buffer, sanitasi nama file, dan argumen FFmpeg. Semua file JS yang diubah harus lolos `node --check`. Test suite penuh membutuhkan dependensi proyek; keberhasilan syntax check saja tidak membuktikan provider eksternal aktif. Endpoint scraper pihak ketiga tetap dapat berubah, membatasi permintaan, atau berhenti beroperasi.
