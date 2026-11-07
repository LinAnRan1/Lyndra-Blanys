# Lyndrā-Blanys — Notices and Attribution

Lyndrā-Blanys is maintained by **Lín Ān Rán** (Copyright (c) 2026 Lín Ān Rán).
It is a derivative work. Every upstream copyright and permission notice is kept
in `LICENSE` (MIT), and the sources below are credited for what they contributed.
Lyndrā-Blanys does not claim any of this third-party work as original.

| Component | Where | Origin / credit |
|---|---|---|
| Core protocol library (`src/Socket`, `src/Utils`, `src/Signal`, `src/WABinary`, `WAProto`) | whole tree | Baileys by Rajeh Taher / WhiskeySockets, MIT, version 7.0.0-rc14 |
| ourin-baileys compatibility API (`Dugong`, rich `send*` helpers, `getButtonType`, auto `<biz>` node) | `src/Socket/dugong.js`, `messages-send.ts`, `src/Utils/rich-messages.js` | ourin-baileys (Zann). Re-implemented here so the same call signatures work |
| MessageBuilder v4.7 (`Button`, `ButtonV2`, `Carousel`, `AIRich`, `Toolkit`) | `src/MessageBuilder/index.js`, `src/Utils/message_builder.js` | "Created by Nixel, contributors ~ Ahmad tumbuh kembang". The original header (do not remove, no standalone redistribution, do not claim as original) is preserved at the top of the file |
| Elaina feature set (newsletter admin/status tools, auth stores, in-memory store, HTML apps, A2UI/Bloks, scheduled messages, split payments, status stickers, username system, voice recognition, pairing improvements, sender-key and account-health tools, extra message content kinds) | `src/MessageBuilder/*`, `src/Store/*`, `src/Utils/*`, `src/Socket/*-extended.js` | `@rexxhayanasi/elaina-baileys` 1.4.8 by rexxhayanasi (MIT), which itself builds on the ItsLia lineage |
| VoIP calling stack | `src/VoIP/` | Derived from ShellTear's `baileys-caller`, ported to ESM by the Elaina project and carried here |
| WhatsApp Web VoIP resources (`whatsapp.wasm`, `loader.js`, `worker-modules.js`) | `src/assets/wasm/` | WhatsApp Web's own engine, vendored unmodified; checksums are in the README next to them |

## What was deliberately not ported

* `@rexxhayanasi/wangcap-id-bridge`: a closed 2 MB WebAssembly bridge. Lyndrā-Blanys keeps
  `whatsapp-rust-bridge` for the same crypto/app-state primitives.
* `@rexxhayanasi/elaina-anchorguard` (MIT): vendored in `src/AnchorGuard/` with its original credit header and LICENSE, opt-in via `AnchorGuard: true`.

## Trademarks

WhatsApp is a trademark of its owner. This project is not affiliated with, endorsed or
authorized by WhatsApp or Meta.

## Build and runtime support

Lyndrā-Blanys ships an ESM build (`lib/*.js`) and a self-contained CommonJS bundle
(`lib/cjs/index.cjs`, produced by esbuild from the ESM build) and supports Node.js 20 and newer.
Dependencies are kept at their newest releases that still run on Node 20: `@cacheable/node-cache`
3.0.x, `music-metadata` 11 and `p-queue` 9 are held at those lines because later majors need Node 22+.
