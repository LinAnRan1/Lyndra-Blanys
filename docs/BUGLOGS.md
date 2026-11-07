# BugLogs

Mencetak error ke console supaya bug kelihatan, bisa dinyalakan dan dimatikan kapan saja. Bawaannya mati.

## Menyalakan

```js
const sock = makeWASocket({ auth: state, bugLogs: true })
// atau dengan pengaturan
const sock2 = makeWASocket({ auth: state, bugLogs: { stack: true, capture: 100 } })
```

## Yang dilaporkan

- error dari method socket (`sendMessage`, `groupMetadata`, dan lainnya) yang menolak (reject)
- pesan masuk yang gagal didekripsi
- alasan koneksi tertutup (kode status dan pesan)

Method tetap menolak seperti biasa; BugLogs hanya mencatat dan mencetak, tidak menelan error.

## Mengatur saat berjalan

```js
sock.bugLogs.disable()   // berhenti mencetak
sock.bugLogs.enable()    // mulai lagi
sock.bugLogs.enabled     // true / false
sock.bugLogs.recent()    // daftar error terakhir
sock.bugLogs.clear()
sock.bugLogs.stop()      // lepas semua pembungkus
```

## Pengaturan

| Opsi | Bawaan | Kegunaan |
| --- | --- | --- |
| `enabled` | `true` | status awal |
| `stack` | `false` | ikut cetak stack trace |
| `decryptFailures` | `true` | laporkan pesan gagal dekripsi |
| `connectionErrors` | `true` | laporkan penyebab koneksi tutup |
| `capture` | `50` | jumlah error terakhir yang disimpan untuk `recent()` |
| `sink` | `console.error` | fungsi `(entry, line)` atau logger bergaya pino |
| `prefix` | bawaan | awalan tiap baris |
| `include` / `exclude` | semua | batasi method yang dibungkus |

AnchorGuard punya opsi `logs` sendiri untuk peringatannya (lihat [ANCHORGUARD.md](ANCHORGUARD.md)).
