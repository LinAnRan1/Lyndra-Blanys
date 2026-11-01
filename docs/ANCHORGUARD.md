# AnchorGuard (anti force-close) di Lyndrā-Blanys

AnchorGuard memindai pesan masuk dan keluar terhadap batas ukuran/bentuk yang dikenal membuat klien WhatsApp
crash ("bug" / force close), lalu bereaksi. Kodenya ada di `src/AnchorGuard/`; asal-usul dan lisensinya tercatat di [NOTICE.md](../NOTICE.md). Ini JavaScript murni, tanpa dependensi tambahan.

**Mati secara default.** Aktifkan dengan opsi socket.

```js
import makeWASocket from 'lyndra-blanys'

const sock = makeWASocket({
  auth: state,
  AnchorGuard: true,
  AnchorGuardConfig: { /* lihat tabel */ }
})

sock.anchorGuard.detect(message) // { flagged, reasons }
sock.anchorGuard.stop()          // lepas listener dan kembalikan sendMessage asli
```

Dipakai terpisah (tanpa opsi socket): `createAntiBugGuard(sock, config)`, `detectBug(message, limits)`,
`ANTIBUG_DEFAULTS` (semuanya diekspor dari paket).

## Peringatan: default-nya agresif

Dengan konfigurasi bawaan, pesan masuk yang ditandai akan: dihapus (dicabut untuk semua orang bila bot admin grup),
pengirimnya **diblokir** (`blockOnBug`) dan **dikeluarkan dari grup** (`kickOnBug`). Deteksi berbasis ambang batas,
jadi pesan sah yang sangat panjang bisa ikut terjaring. Untuk bot yang hanya ingin membuang pesan berbahaya:

```js
AnchorGuardConfig: { blockOnBug: false, kickOnBug: false, guardGroupAdds: false }
```

## Opsi utama

| Opsi | Default | Arti |
|---|---|---|
| `autoDelete` | `true` | hapus pesan yang ditandai |
| `guardIncoming` / `guardOutgoing` | `true` / `true` | pindai masuk / blok kirim keluar (melempar `anti-bug blocked outgoing message`) |
| `revokeForEveryoneIfAdmin` | `true` | cabut untuk semua bila bot admin, jika tidak hapus untuk diri sendiri |
| `blockOnBug` | `true` | blokir pengirim |
| `kickOnBug` | `true` | keluarkan pengirim dari grup bila bot admin |
| `selfOnly` | `false` | hanya pantau chat sendiri |
| `burstThreshold`, `burstWindowMs` | `2`, bawaan | eskalasi bila pengirim yang sama berulang |
| `leaveGroupOnBurst` | `false` | keluar grup jika tidak bisa mengeluarkan pengirim |
| `cooldownMs` | `15000` | jeda per chat |
| `guardGroupAdds`, `autoKickBadAdds` | lihat kode | cabut nomor buruk yang ditambahkan ke grup |
| `metaAiNumbers` | lihat kode | anggap nomor berawalan `1313555` sebagai buruk |
| `addWatchlist` | `[]` | daftar JID tambahan yang dicabut saat ditambahkan |
| `onDetect` | none | callback `{ direction, reasons, ... }` |

Batas deteksi (`maxText`, `maxMentions`, `maxButtons`, `maxDepth`, `maxInvisibleRun`, dan lainnya) ada di
`ANTIBUG_DEFAULTS` dan bisa diganti lewat konfigurasi yang sama atau argumen kedua `detectBug`.

## Pengujian

`test/port/anchorguard.test.js` (9 pengujian, jalan dengan `npm run test:port`) memakai socket palsu untuk
memeriksa: bentuk payload yang ditandai dan yang lolos, blok pengiriman keluar, `stop()`, pencabutan + kick + blokir
saat bot admin, hapus-untuk-diri saat bukan admin, konfigurasi konservatif tanpa tindakan terhadap orang,
eskalasi burst, penambahan nomor Meta AI/watchlist, `selfOnly`, serta integrasi `makeWASocket` (mati secara default).
Tidak diuji terhadap server WhatsApp sungguhan.
