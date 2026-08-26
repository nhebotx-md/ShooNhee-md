# Eksperimen Ourin Baileys

Branch `experiment/ourin-baileys-9` memigrasikan runtime ShooNhee-md dari dependency Itsukichan ke `ourin-baileys@9.0.21`. Branch ini belum dipromosikan ke `main`; promosi hanya dilakukan setelah pairing diuji pada akun WhatsApp yang dikelola pemilik bot.

## Perubahan kompatibilitas

| Area | Penyesuaian |
|---|---|
| Library runtime | `ourin-baileys@9.0.21` dipin sebagai dependency utama. |
| Import legacy | Alias `ShooNhee` diarahkan ke `npm:ourin-baileys@9.0.21`, sehingga import plugin lama tetap memuat runtime Ourin. |
| Jimp | Dinaikkan ke `^1.6.0`; adapter ular tangga memakai `JimpMime`, `BlendMode`, dan API buffer Jimp 1.x. |
| Sharp | Dinaikkan ke `^0.35.3` agar binary tersedia untuk Node 22 dan helper media Ourin dapat diimpor. |
| Owner exec | Import `getBuffer` dihapus dari sandbox command owner karena Ourin tidak mengekspos helper tersebut. |

## Uji lokal

```bash
git switch experiment/ourin-baileys-9
npm install --no-audit --no-fund
npm test
```

Perintah tersebut tidak menghapus atau membuat ulang folder session.

## Uji pairing yang dikelola pengguna

1. Salin folder project ke lokasi uji tersendiri. Jangan gunakan folder produksi yang memuat session aktif.
2. Atur nomor pairing pada konfigurasi uji yang sama seperti alur bot saat ini.
3. Jalankan `npm start` dan ikuti alur **Linked Devices** di aplikasi WhatsApp untuk nomor yang kamu kelola.
4. Uji satu command dasar, satu menu, dan satu pengiriman media setelah koneksi terbuka.
5. Hentikan pengujian bila muncul loop reconnect, kode 405 berulang, atau session tidak tersimpan.

> Branch ini tidak mengirim broadcast, tidak membuat forwarded message palsu, dan tidak meminta perubahan pada akun atau session produksi.
