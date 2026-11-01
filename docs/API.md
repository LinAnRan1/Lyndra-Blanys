# Referensi API Lyndrā-Blanys

> Daftar semua API Lyndrā-Blanys (interactive message, album, AI rich response, newsletter, VoIP, dst.).
> Panduan fitur ada di [GUIDE.md](GUIDE.md). Ringkasan proyek ada di [README.md](../README.md).

## ✨ Features

| Feature | Description |
| --- | --- |
| **Latest base** | Baileys `7.0.0-rc14` (upstream `latest` tag) with its newer retry system, tctoken handling and LID support |
| **Interactive messages** | Native-flow buttons, list/select menus, carousels, payment/order buttons, via `Dugong` |
| **Auto `<biz>` node** | Button / list / native-flow messages automatically get the business node WhatsApp needs to render them (no duplicates if you pass your own) |
| **Album messages** | Multi-image/video albums with correct count metadata |
| **AI rich responses** | `sendTable`, `sendList`, `sendCodeBlock`, `sendLink`, `sendLatex*`, `sendRichMessage`, `sendUnifiedResponse` and V2 variants |
| **Link previews** | `sendPreview` for fully custom preview cards (title, description, thumbnail) |
| **Payment / Event / Poll result / Product** | Request-payment, event, poll-result snapshot and product messages |
| **Status & story helpers** | `sendStatusMention` (mention users/groups in a status) and `swgc` (group story) |
| **Message builders v4.7** | `AIRich`, `ORich`, `Button`, `ButtonV2`, `Carousel`, `Toolkit` fluent builders |
| **VoIP voice calls** | Built-in WASM/WebRTC call engine (`VoipClient`) sharing your existing socket |
| **Newsletter extras** | URL resolve, bulk follow, create/update, admin tools, reactions, message fetch |
| **Communities & groups** | Community CRUD, linked groups, join approval, add mode, member labels |
| **Business tools** | Catalog, product CRUD, cover photo, quick replies, business profile |
| **Pairing code** | Custom 8-character pairing codes, phone-number cleanup, safe to call right after socket creation |
| **LID support** | LID ↔ PN mapping and session migration from upstream rc14 |
| **TypeScript** | Full `.d.ts` typings, source in `src/`, compiled output committed in `lib/` |

---

## ✅ Requirements

- **Node.js** `>= 20.0.0`
- **ESM project**: your `package.json` must contain `"type": "module"`
- `git` available on the machine if you install from the GitHub URL
- Optional, install only what your features need: `sharp`, `jimp`, `audio-decode`, `link-preview-js`, `@roamhq/wrtc`, `fluent-ffmpeg`

> [!IMPORTANT]
> This library is **ESM-only**. CommonJS projects must migrate or use dynamic `import()`.

---

## 📦 Installation

### From GitHub (recommended for bots)

Add it to your bot's `package.json`:

```json
{
  "type": "module",
  "dependencies": {
    "lyndra-blanys": "github:LinAnRan1/lin-baileys"
  }
}
```

Then:

```bash
npm install
```

The first install downloads the repository and runs its `prepare` script, which builds the package. This takes a couple of minutes and needs `git`; later installs reuse the cache. If you want an existing import name to keep working (for example `baileys`), use it as an alias key:

```json
"baileys": "github:LinAnRan1/lin-baileys"
```

### From a local folder

Unpack the repository somewhere in your project and point to it:

```json
"lyndra-blanys": "file:./lyndra-blanys"
```

If a dependency is missing when you start the bot, install inside that folder once:

```bash
cd lyndra-blanys
npm install --ignore-scripts --omit=dev
```

(`lib/` is already compiled, so no build is needed.)

### Using pm2

pm2 only runs your process. Install first, then start:

```bash
npm install
pm2 start index.js --name my-bot
```

---

## 🛠️ Quick Start

```js
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  Browsers,
} from "lyndra-blanys";
import pino from "pino";
import qrcode from "qrcode-terminal";

const logger = pino({ level: "silent" });

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./session");

  const sock = makeWASocket({
    auth: state,
    logger,
    browser: Browsers.macOS("Chrome"),
    syncFullHistory: false,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", ({ connection, lastDisconnect, qr }) => {
    if (qr) qrcode.generate(qr, { small: true });

    if (connection === "close") {
      const code = lastDisconnect?.error?.output?.statusCode;
      if (code !== DisconnectReason.loggedOut) startBot();
    }
    if (connection === "open") console.log("Connected!");
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg?.message || msg.key.fromMe) return;

    const text =
      msg.message.conversation || msg.message.extendedTextMessage?.text || "";

    if (text === ".ping") {
      await sock.sendMessage(msg.key.remoteJid, { text: "Pong!" });
    }
  });
}

startBot();
```

---

## 🔑 Pairing Code

Log in with a pairing code instead of a QR code:

```js
const sock = makeWASocket({ auth: state, logger, browser: Browsers.macOS("Chrome") });

if (!sock.authState.creds.registered) {
  const code = await sock.requestPairingCode("6281234567890");
  console.log("Pairing code:", code);
}
```

`requestPairingCode(phoneNumber, customCode?)`

| Behaviour | Details |
| --- | --- |
| **Call timing** | Can be called right after `makeWASocket()`; it waits for the websocket to open by itself |
| **Phone number** | `+`, spaces and dashes are stripped. You must still pass the country code (`62812…`, not `0812…`). 8 to 15 digits |
| **Custom code** | Optional. Exactly **8 letters/digits** (A-Z, 0-9). Lower case is converted to upper case. Omit it, or pass `null`, for a random code |
| **Already logged in** | Throws a clear error if the session is already registered, so keep the `registered` check |

```js
const code = await sock.requestPairingCode("6281234567890", "DENIA696"); // -> "DENIA696"
```

> [!NOTE]
> A custom code must be 8 characters. `DENIA6969` (9 characters) is rejected, `DENIA696` is accepted.

---

## 💬 Message Sending

```js
// Text, with mention
await sock.sendMessage(jid, { text: "Hello @628xxx!", mentions: ["628xxx@s.whatsapp.net"] });

// Image / Video / Audio / Sticker / Document
await sock.sendMessage(jid, { image: { url: "./photo.jpg" }, caption: "A photo" });
await sock.sendMessage(jid, { video: { url: "./clip.mp4" }, caption: "A video" });
await sock.sendMessage(jid, { audio: { url: "./voice.ogg" }, mimetype: "audio/ogg; codecs=opus", ptt: true });
await sock.sendMessage(jid, { sticker: { url: "./sticker.webp" } });
await sock.sendMessage(jid, { document: { url: "./file.pdf" }, fileName: "file.pdf", mimetype: "application/pdf" });

// Reaction, location, contact, poll
await sock.sendMessage(jid, { react: { key: msg.key, text: "👍" } });
await sock.sendMessage(jid, { location: { degreesLatitude: -6.2, degreesLongitude: 106.8, name: "Jakarta" } });
await sock.sendMessage(jid, { poll: { name: "Vote!", values: ["A", "B", "C"], selectableCount: 1 } });

// Forward, edit, delete
await sock.sendMessage(jid, { forward: msg });
await sock.sendMessage(jid, { text: "Edited", edit: msg.key });
await sock.sendMessage(jid, { delete: msg.key });

// View once: works with image, video and audio
await sock.sendMessage(jid, { image: { url: "./photo.jpg" }, viewOnce: true });
```

Sticker packs:

```js
import { makeStickerPack } from "lyndra-blanys";

await sock.sendMessage(jid, makeStickerPack({
  name: "My Pack",
  publisher: "Lín Ān Rán",
  description: "Starter pack",
  stickers: [
    { url: "./1.webp", emojis: ["🔥"] },
    { url: "./2.webp", emojis: ["😎"] },
  ],
  cover: { url: "./cover.webp" },
}));
```

---

## 🧩 Interactive Messages

**Native-flow buttons**

```js
await sock.sendMessage(jid, {
  interactiveMessage: {
    title: "Welcome!",
    footer: "Powered by Lyndrā-Blanys",
    header: "Choose an option",
    image: { url: "https://example.com/banner.jpg" },
    buttons: [
      { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "Menu", id: ".menu" }) },
      { name: "cta_url",     buttonParamsJson: JSON.stringify({ display_text: "Website", url: "https://example.com" }) },
      { name: "cta_copy",    buttonParamsJson: JSON.stringify({ display_text: "Copy Code", copy_code: "CODE123" }) },
    ],
  },
});
```

**List menu (`single_select`)**

```js
await sock.sendMessage(jid, {
  interactiveMessage: {
    title: "Select Category",
    footer: "Bot menu",
    buttons: [{
      name: "single_select",
      buttonParamsJson: JSON.stringify({
        title: "Menu",
        sections: [
          { title: "Games", rows: [{ title: "Quiz", id: ".quiz" }] },
          { title: "Tools", rows: [{ title: "Sticker", id: ".sticker" }] },
        ],
      }),
    }],
  },
});
```

> [!WARNING]
> Use **at most one** `single_select` per message. More than one can make the card fail to render on the recipient's device. `quick_reply` can be used as many times as you like.

**`interactiveButtons` (media header + buttons)**

```js
await sock.sendMessage(jid, {
  text: "Body text",
  footer: "Footer",
  image: { url: "https://example.com/pic.jpg" },
  interactiveButtons: [
    { name: "quick_reply", buttonParamsJson: { display_text: "OK", id: "ok" } },
  ],
});
```

`buttonParamsJson` may be an object or an already-stringified JSON.

**Carousel**

```js
await sock.sendMessage(jid, {
  interactiveMessage: {
    body: { text: "Pick a card" },
    footer: { text: "Lyndrā-Blanys" },
    carouselMessage: {
      cards: [
        {
          body: { text: "Card 1" },
          header: { title: "First" },
          nativeFlowMessage: { buttons: [{ name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "Choose", id: "c1" }) }] },
        },
      ],
    },
  },
});
```

For more comfortable construction use the [`Button`, `ButtonV2` and `Carousel` builders](#-message-builders-v47).

### Automatic business node

Messages that carry buttons, lists or native-flow payloads (`interactiveMessage`, `buttonsMessage`, `listMessage`, payment/order buttons) get the matching `<biz>` node attached when relayed, so they render for the recipient. A custom `<biz>` node passed in `additionalNodes` is respected and no duplicate is added (a duplicate makes WhatsApp drop the message silently).

```js
import { getButtonType } from "lyndra-blanys";

getButtonType(message); // "interactive" | "buttons" | "list" | "order_details" | ... | null
```

---

## 🖼️ Album Messages

```js
await sock.sendMessage(jid, {
  albumMessage: [
    { image: { url: "./photo1.jpg" }, caption: "First" },
    { image: { url: "./photo2.jpg" }, caption: "Second" },
    { video: { url: "./clip.mp4" }, caption: "Video" },
  ],
});
```

`expectedImageCount` and `expectedVideoCount` are filled in automatically. If media generation or upload fails after the parent message was relayed, the call rejects and messages already sent stay delivered.

---

## 🤖 AI Rich Responses

Meta-AI-style messages (`botForwardedMessage` → `richResponseMessage`). Every helper resolves to `{ message, messageId }`. `quoted` is the message you reply to (or `null`).

```js
// Table (V1)
await sock.sendTable(jid, "Java vs JavaScript", ["Feature", "Java", "JavaScript"], [
  ["Type", "Compiled", "Interpreted"],
  ["Typing", "Static", "Dynamic"],
], quoted, { headerText: "Comparison:", footer: "Hope this helps!" });

// Table (V2, unified response). Rows split by ';;', columns by '|' or ','
await sock.sendTableV2(jid, [
  "Java vs JavaScript",
  "Feature | Java | JavaScript",
  "Type | Compiled | Interpreted;;Typing | Static | Dynamic",
], quoted, { headerText: "Comparison:", text: "Here is a table:", footer: "Done" });

// Key/value list
await sock.sendList(jid, "Bot Info", [["Name", "Bot"], ["Version", "1.0"]], quoted, { footer: "© Bot" });

// Code blocks. V1: js/ts/python. V2: js/ts, python, go, lua, bash (+ aliases)
await sock.sendCodeBlock(jid, 'console.log("hi")', quoted, { language: "javascript", title: "Example" });
await sock.sendCodeBlockV2(jid, 'fmt.Println("hi")', quoted, { language: "go", text: "Go snippet:", footer: "Done" });
```

**LaTeX**

```js
await sock.sendLatex(jid, quoted, { text: "Result", expressions: [/* LatexExpression[] */] });

// Render with your own renderer + uploader
await sock.sendLatexImage(jid, quoted, { expressions: [{ latexExpression: "E=mc^2" }] }, renderLatexToPng, uploadFn);
await sock.sendLatexInlineImage(jid, quoted, { expressions: [{ latexExpression: "x^2" }] }, renderLatexToPng, uploadFn);
```

**Custom sub-messages and unified responses**

```js
await sock.sendRichMessage(jid, [
  { messageType: 2, messageText: "Here is some info:" },
  { messageType: 4, tableMetadata: { title: "Stats", rows: [
      { items: ["Metric", "Value"], isHeading: true },
      { items: ["Users", "1000"] },
  ] } },
  { messageType: 5, codeMetadata: { codeLanguage: "javascript", codeBlocks: [{ highlightType: 0, codeContent: 'console.log("OK")' }] } },
], quoted);

// Capture a received unified response and send it again
const captured = sock.captureUnifiedResponse(receivedMessage.message);
if (captured) await sock.sendUnifiedResponse(jid, quoted, captured);
```

| messageType | Name | Payload field |
| --- | --- | --- |
| 1 | GRID_IMAGE | `gridImageMetadata` |
| 2 | TEXT | `messageText` |
| 3 | INLINE_IMAGE | `imageMetadata` |
| 4 | TABLE | `tableMetadata` |
| 5 | CODE | `codeMetadata` |
| 6 | DYNAMIC | `dynamicMetadata` |
| 7 | MAP | `mapMetadata` |
| 8 | LATEX | `latexMetadata` |
| 9 | CONTENT_ITEMS | `contentItemsMetadata` |

Syntax highlight token types (V2): `DEFAULT`, `KEYWORD`, `METHOD`, `STR`, `NUMBER`, `COMMENT`.

---

## 🔗 Link Messages

Rich text with inline clickable links. Use `{{IE_N}}text{{/IE_N}}` placeholders; `N` is the index in the `links` array.

```js
await sock.sendLink(
  jid,
  "Results:\n🔗 {{IE_0}}link one{{/IE_0}}\n🔗 {{IE_1}}link two{{/IE_1}}",
  ["https://example.com/one", "https://example.com/two"],
  quoted,
  {
    headerText: "📁 Uploader",
    footer: "✨ Done!",
    citations: [{ sourceTitle: "Example", citationNumber: 1 }, { sourceTitle: "Example 2", citationNumber: 2 }],
  },
);

// Search-result style
await sock.sendLinkV2(
  jid,
  "- {{IE_0}}Docs{{/IE_0}}",
  [{ url: "https://example.com", displayName: "Docs", sourceDisplayName: "example", sourceSubtitle: "documentation" }],
  quoted,
  { headerText: "Results", footer: "Reference links", searchEngine: "MAME" },
);
```

| Option (`sendLink`) | Description |
| --- | --- |
| `headerText` / `footer` | Text before and after the content |
| `botJid` | Bot JID used for `forwardedAiBotMessageInfo` |
| `forwardingScore` | Forward score (default `3`) |
| `citations` | `{ sourceQuery, faviconCdnUrl, citationNumber, sourceTitle }[]` |
| `proofs` | `{ version, useCase, signature, certificateChain }[]` |

---

## 📮 Other Message Types

**Payment request**

```js
await sock.sendMessage(jid, {
  requestPaymentMessage: { amount: 50000, currency: "IDR", note: "Order #123", from: "628xxx@s.whatsapp.net" },
});
```

**Event**

```js
await sock.sendMessage(jid, {
  eventMessage: {
    name: "Community Meetup",
    description: "Monthly meetup",
    startTime: Date.now() + 86_400_000,
    endTime: Date.now() + 90_000_000,
    location: { name: "Jakarta", degreesLatitude: -6.2, degreesLongitude: 106.8 },
  },
});
```

**Poll result snapshot**

```js
await sock.sendMessage(jid, {
  pollResultMessage: {
    name: "Favorite color?",
    pollVotes: [{ optionName: "Red", optionVoteCount: 42 }, { optionName: "Blue", optionVoteCount: 38 }],
  },
});
```

**Product**

```js
await sock.sendMessage(jid, {
  productMessage: {
    title: "Headphones",
    description: "Bluetooth headphones",
    productId: "WH-001",
    retailerId: "my-shop",
    url: "https://example.com/product",
    priceAmount1000: 299000,
    currencyCode: "IDR",
    thumbnail: { url: "https://example.com/product.jpg" },
    body: "Check it out!",
    footer: "My Shop",
    buttons: [{ name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "Buy", id: "buy" }) }],
  },
});
```

---

## 📢 Status, Stories & Previews

```js
// Mention users/groups in a status
await sock.sendStatusMention({ text: "Big update coming!" }, ["628xxx@s.whatsapp.net", "groupid@g.us"]);

// Group story (status inside a group). The JID must be a group
await sock.swgc(groupJid, { image: { url: "./story.jpg" }, caption: "Group story" });
// the same through sendMessage:
await sock.sendMessage(groupJid, { groupStatusMessage: { text: "Hello group" } });

// Fully custom link preview card
await sock.sendPreview(jid, {
  text: "Check this out https://example.com",
  url: "https://example.com",
  title: "Example",
  description: "A custom preview card",
  image: "https://example.com/thumb.jpg", // Buffer or http(s) URL
}, { quoted });
```

`sendPreview` resolves to the sent message ID.

---

## 🧱 Message Builders v4.7

Fluent builders that build messages for the rc14 socket and can relay through it directly.

```js
import { AIRich, ORich, Button, ButtonV2, Carousel, Toolkit } from "lyndra-blanys";

const rich = new AIRich(sock)
  .setTitle("Answer")
  .addText("Here is the result.")
  .addCode("javascript", "const answer = 42")
  .addSuggest(["Tell me more", "Next"]);
await rich.send(jid);

const flow = new Button(sock)
  .setBody("Choose an action")
  .addButton("quick_reply", { display_text: "Continue", id: "continue" });
await flow.send(jid);

// ORich is a compatible alias of AIRich
await new ORich(sock).addText("Hello from ORich").addSuggest(["Next"]).send(jid);
```

| Builder | Main methods |
| --- | --- |
| **AIRich / ORich** | `addText`, `addCode`, `addTable`, `addImage`, `addVideo`, `addPost`, `addReels`, `addProduct`, `addSource`, `addSuggest`, `addTip`, `addWidget`, `addSection`, `createAlert`, `build`, `send`, `sendEdit` |
| **Button** | `setBody`, `setImage`, `setDocument`, `setMedia`, `addButton`, `addUrl`, `addCopy`, `addReply`, `addCall`, `addLocation`, `addSelection`, `addReminder`, `addAddress`, `build`, `send` |
| **ButtonV2** | `setMedia`, `setThumbnail`, `addButton`, `addRawButton`, `build`, `send` |
| **Carousel** | `addCard`, `build`, `send` |

Media resizing and video preview helpers need the optional `sharp` and `fluent-ffmpeg` packages.

---

## 📞 VoIP (Voice Calls)

The VoIP engine is built in and shares your existing socket, so there is no second pairing.

```js
import { VoipClient, CallState } from "lyndra-blanys";

// Run this after connection === "open"
if (!global.voipClient) {
  global.voipClient = new VoipClient();
  await global.voipClient.connectWithSocket(sock);
}

const call = await global.voipClient.call("6281234567890", {
  durationMs: 60_000,    // auto hang-up
  audioSource: "silence", // or "mic" / "file" (needs audio-feeder & ffmpeg)
});

call.on("ringing",   () => console.log("Ringing..."));
call.on("connected", () => console.log("Connected!"));
call.on("ended",     (reason) => console.log("Ended:", reason));

await call.waitForEnd();
```

`call.end()` hangs up, `call.mute(true|false)` mutes, `call.state` is one of `CallState`. Only one call can be active at a time.

---

## 📰 Newsletter / Channel Methods

```js
const info = await sock.cekIDSaluran("https://whatsapp.com/channel/xxxxx");   // resolve URL -> metadata
await sock.newsletterMultipleFollow("id1@newsletter id2@newsletter");          // bulk follow
const channels = await sock.newsletterFetchAllSubscribe();
await sock.newsletterAction("id@newsletter", "follow");                        // follow / unfollow / mute / unmute

await sock.newsletterCreate("My Channel", "Description");
await sock.newsletterUpdate("id@newsletter", { name: "New Name" });
await sock.newsletterUpdateName("id@newsletter", "New Name");
await sock.newsletterUpdateDescription("id@newsletter", "New description");
await sock.newsletterUpdatePicture("id@newsletter", mediaUpload);
await sock.newsletterRemovePicture("id@newsletter");

await sock.newsletterFollow("id@newsletter");   await sock.newsletterUnfollow("id@newsletter");
await sock.newsletterMute("id@newsletter");     await sock.newsletterUnmute("id@newsletter");
const { subscribers } = await sock.newsletterSubscribers("id@newsletter");
const meta = await sock.newsletterMetadata("jid", "id@newsletter");

await sock.newsletterReactMessage("id@newsletter", serverId, "👍");
const msgs = await sock.newsletterFetchMessages("id@newsletter", 50, 0, 0);
await sock.subscribeNewsletterUpdates("id@newsletter");                        // live updates

// Admin
await sock.newsletterAdminCount("id@newsletter");
await sock.newsletterChangeOwner("id@newsletter", newOwnerJid);
await sock.newsletterDemote("id@newsletter", userJid);
await sock.newsletterDelete("id@newsletter");
```

---

## 👥 Group Methods

```js
const meta  = await sock.groupMetadata("id@g.us");
const group = await sock.groupCreate("My Group", ["628xxx@s.whatsapp.net"]);
await sock.groupLeave("id@g.us");

await sock.groupUpdateSubject("id@g.us", "New Subject");
await sock.groupUpdateDescription("id@g.us", "New Description");
await sock.groupParticipantsUpdate("id@g.us", ["628xxx@s.whatsapp.net"], "add"); // remove | promote | demote

// Join requests
const requests = await sock.groupRequestParticipantsList("id@g.us");
await sock.groupRequestParticipantsUpdate("id@g.us", ["628xxx@s.whatsapp.net"], "approve");

// Invites
const code = await sock.groupInviteCode("id@g.us");
await sock.groupRevokeInvite("id@g.us");
await sock.groupAcceptInvite("ABCDE12345");
const info = await sock.groupGetInviteInfo("ABCDE12345");

// Settings
await sock.groupSettingUpdate("id@g.us", "announcement"); // not_announcement | locked | unlocked
await sock.groupMemberAddMode("id@g.us", "admin_add");
await sock.groupJoinApprovalMode("id@g.us", "on");
await sock.groupToggleEphemeral("id@g.us", 86400);

const all = await sock.groupFetchAllParticipating();
await sock.updateMemberLabel("id@g.us", "VIP");
```

---

## 🏘️ Community Methods

```js
const meta = await sock.communityMetadata("communityid@g.us");
await sock.communityCreate("Our Community", "Description");
await sock.communityCreateGroup("Announcements", ["628xxx@s.whatsapp.net"], "communityid@g.us");

await sock.communityLinkGroup("groupid@g.us", "communityid@g.us");
await sock.communityUnlinkGroup("groupid@g.us", "communityid@g.us");
const linked = await sock.communityFetchLinkedGroups("communityid@g.us");

const code = await sock.communityInviteCode("communityid@g.us");
await sock.communityRevokeInvite("communityid@g.us");
await sock.communityAcceptInvite(code);
await sock.communityGetInviteInfo(code);

await sock.communityRequestParticipantsList("communityid@g.us");
await sock.communityRequestParticipantsUpdate("communityid@g.us", ["628xxx@s.whatsapp.net"], "approve");
await sock.communityParticipantsUpdate("communityid@g.us", ["628xxx@s.whatsapp.net"], "add");

await sock.communityUpdateSubject("communityid@g.us", "New Subject");
await sock.communityUpdateDescription("communityid@g.us", "New Description");
await sock.communityToggleEphemeral("communityid@g.us", 86400);
await sock.communitySettingUpdate("communityid@g.us", "announcement");
await sock.communityMemberAddMode("communityid@g.us", "admin_add");
await sock.communityJoinApprovalMode("communityid@g.us", "on");

await sock.communityLeave("communityid@g.us");
const communities = await sock.communityFetchAllParticipating();
```

---

## 🏪 Business Methods

```js
const { products } = await sock.getCatalog({ jid: "628xxx@s.whatsapp.net", limit: 10 });
const { collections } = await sock.getCollections("628xxx@s.whatsapp.net", 10);
const order = await sock.getOrderDetails(orderId, tokenBase64);

const product = await sock.productCreate({ name: "Premium", description: "Plan", price: 150000, currency: "IDR", originCountryCode: "ID", images: [mediaUpload] });
await sock.productUpdate(product.id, { name: "Premium Plus", price: 175000, currency: "IDR", images: [mediaUpload] });
await sock.productDelete([product.id]);

await sock.updateBusinessProfile({ address: "Jakarta", description: "Official store", websites: ["https://example.com"], email: "hello@example.com" });
// `updateBussinesProfile` (old spelling) still works

await sock.updateCoverPhoto(mediaUpload);
await sock.removeCoverPhoto(coverId);
await sock.addOrEditQuickReply({ shortcut: "hello", message: "Hello!" });
await sock.removeQuickReply(timestamp);
```

---

## 👤 Chat & Profile Methods

```js
const url = await sock.profilePictureUrl(jid, "image");
await sock.updateProfilePicture(jid, mediaUpload);
await sock.removeProfilePicture(jid);
await sock.updateProfileName("My Name");
await sock.updateProfileStatus("Available");

await sock.sendPresenceUpdate("available", jid);
await sock.presenceSubscribe(jid);
await sock.readMessages([msg.key]);

await sock.updateBlockStatus(jid, "block"); // or "unblock"
const blocklist = await sock.fetchBlocklist();

await sock.chatModify({ archive: true, lastMessageOrig: msg, lastMessage: msg }, jid);
await sock.star(jid, [{ id: msgId, fromMe: true }], true);

await sock.addOrEditContact(jid, { displayName: "Name" });
await sock.removeContact(jid);

await sock.addChatLabel(jid, labelId);
await sock.removeChatLabel(jid, labelId);
await sock.addMessageLabel(jid, messageId, labelId);

await sock.resyncAppState(["regular", "critical_block"], true);
const biz = await sock.getBusinessProfile(jid);

await sock.getPrivacyTokens([jid]); // alias of issuePrivacyTokens
```

---

## 🔒 Privacy Settings

```js
await sock.updateLastSeenPrivacy("all");        // all | contacts | contact_blacklist | nobody
await sock.updateOnlinePrivacy("all");          // all | match_last_seen
await sock.updateProfilePicturePrivacy("contacts");
await sock.updateStatusPrivacy("contacts");
await sock.updateReadReceiptsPrivacy("all");    // all | none
await sock.updateGroupsAddPrivacy("all");       // all | contacts
await sock.updateMessagesPrivacy("all");
await sock.updateCallPrivacy("everyone");
await sock.updateDefaultDisappearingMode(86400);
await sock.updateDisableLinkPreviewsPrivacy(true);
```

---

## 📡 Events

```js
sock.ev.on("connection.update", ({ connection, lastDisconnect, qr, isNewLogin }) => {});
sock.ev.on("creds.update", (update) => {});
sock.ev.on("messaging-history.set", ({ chats, contacts, messages, isLatest }) => {});
sock.ev.on("chats.upsert", (chats) => {});     sock.ev.on("chats.update", (updates) => {});
sock.ev.on("contacts.upsert", (contacts) => {}); sock.ev.on("contacts.update", (updates) => {});
sock.ev.on("messages.upsert", ({ messages, type }) => {});
sock.ev.on("messages.update", (updates) => {}); sock.ev.on("messages.delete", (keys) => {});
sock.ev.on("messages.reaction", (reactions) => {});
sock.ev.on("message-receipt.update", (updates) => {});
sock.ev.on("groups.update", (updates) => {});
sock.ev.on("group-participants.update", (update) => {});
sock.ev.on("group.join-request", (update) => {});
sock.ev.on("call", (calls) => {});
sock.ev.on("labels.edit", (label) => {});
sock.ev.on("labels.association", ({ association, type }) => {});
sock.ev.on("newsletter.reaction", (data) => {});
sock.ev.on("newsletter.view", (data) => {});
sock.ev.on("newsletter-participants.update", (data) => {});
sock.ev.on("newsletter-settings.update", (data) => {});
sock.ev.on("settings.update", (settings) => {});
```

---

## 🔧 Utility Exports

```js
import makeWASocket, {
  // Auth
  useMultiFileAuthState, makeCacheableSignalKeyStore, initAuthCreds, BufferJSON, fetchLatestBaileysVersion,
  // Connection
  DisconnectReason, Browsers,
  // Advanced message types
  Dugong, getButtonType,
  // Builders
  AIRich, ORich, Button, ButtonV2, Carousel, Toolkit,
  // VoIP
  VoipClient, CallState,
  // Rich message generators
  generateTableContent, generateTableContentV2, generateListContent,
  generateCodeBlockContent, generateCodeBlockContentV2,
  generateLinkContent, generateLinkContentV2,
  generateLatexContent, generateLatexImageContent, generateLatexInlineImageContent,
  generateRichMessageContent, generateUnifiedResponseContent, captureUnifiedResponse,
  buildRichContextInfo, buildBotForwardedMessage,
  tokenizeCode, tokenizeCodeV2, CodeHighlightType, RichSubMessageType,
  // Stickers
  makeStickerPack,
  // JID helpers
  jidEncode, jidDecode, jidNormalizedUser, areJidsSameUser,
  isJidGroup, isJidNewsletter, isLidUser, isPnUser, isJidBot, isJidMetaAI, isJidBroadcast, isJidStatusBroadcast,
  // Media
  prepareWAMessageMedia, generateWAMessageFromContent, downloadMediaMessage,
} from "lyndra-blanys";
```

> [!NOTE]
> Session storage: `useMultiFileAuthState()` (default), plus the database stores and `makeInMemoryStore()` described in [GUIDE.md](GUIDE.md) and the README.

---

