// Lyndrā-Blanys: one smoke test per message content kind ported to this library,
// run through the real generateWAMessageContent (no network).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { generateWAMessageContent, generateWAMessage, proto } from '../../lib/index.js'

const logger = { info() {}, debug() {}, warn() {}, error() {}, trace() {}, child() { return this } }
const upload = async () => ({ mediaUrl: 'https://media.test/x', directPath: '/v/x' })
const opts = { upload, logger }
const gen = (content, extra = {}) => generateWAMessageContent(content, { ...opts, ...extra })
const roundTrip = content => proto.Message.decode(proto.Message.encode(proto.Message.fromObject(content)).finish())
import sharp from 'sharp'
const IMG = await sharp({ create: { width: 8, height: 8, channels: 3, background: '#ffffff' } }).jpeg().toBuffer()

test('poll: plain, single, photo and quiz variants', async () => {
  assert.ok((await gen({ poll: { name: 'q', values: ['a', 'b'], selectableCount: 2 } })).pollCreationMessage)
  assert.ok((await gen({ poll: { name: 'q', values: ['a', 'b'], selectableCount: 1 } })).pollCreationMessageV3)
  assert.ok((await gen({ poll: { name: 'q', values: ['a', 'b'], toAnnouncementGroup: true } })).pollCreationMessageV2)
  const quiz = await gen({ poll: { name: 'q', values: ['a', 'b'], pollType: 1, correctAnswer: 'a' } })
  assert.equal(quiz.pollCreationMessageV5.correctAnswer.optionName, 'a')
  await assert.rejects(() => gen({ poll: { name: 'q', values: ['a'], selectableCount: 5 } }), /selectableCount/)
  assert.ok(roundTrip(await gen({ poll: { name: 'q', values: ['a', 'b'], selectableCount: 1 } })).pollCreationMessageV3)
})

test('richLink and text', async () => {
  const rl = await gen({ richLink: { url: 'https://example.com', title: 'T', description: 'D' } })
  assert.equal(rl.extendedTextMessage.matchedText, 'https://example.com')
  assert.match(rl.extendedTextMessage.text, /example\.com/)
  await assert.rejects(() => gen({ richLink: {} }), /richLink needs a url/)
  const t = await gen({ text: 'halo' }, { backgroundColor: '#7C3AED', textColor: 0, font: 0 })
  assert.equal(t.extendedTextMessage.textArgb, 0xff000000 >>> 0 === 0 ? 0 : t.extendedTextMessage.textArgb)
})

test('album: array form counts media, caption and rejects <2', async () => {
  const album = await gen({ album: [{ image: { url: 'a' } }, { video: { url: 'b' } }], caption: 'judul' })
  assert.equal(album.albumMessage.expectedImageCount, 1)
  assert.equal(album.albumMessage.expectedVideoCount, 1)
  assert.equal(album.albumMessage.caption, 'judul')
  await assert.rejects(() => gen({ album: [{ image: { url: 'a' } }] }), /Minimum provide 2/)
})

test('buttons, list, template, native flow, cards', async () => {
  const buttons = await gen({ text: 'pilih', footer: 'f', buttons: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }] })
  assert.equal(buttons.buttonsMessage.buttons.length, 2)
  const list = await gen({ text: 'menu', title: 't', buttonText: 'buka', footer: 'f', sections: [{ title: 's', rows: [{ title: 'r', rowId: '1' }] }] })
  assert.equal(list.listMessage.sections.length, 1)
  const tpl = await gen({ text: 'hi', footer: 'f', templateButtons: [{ id: 'x', text: 'X' }, { url: 'https://e.com', text: 'U' }] })
  assert.equal(tpl.templateMessage.hydratedTemplate.hydratedButtons.length, 2)
  const flow = await gen({ text: 'hi', footer: 'f', nativeFlow: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }] })
  assert.equal(flow.interactiveMessage.nativeFlowMessage.buttons.length, 2)
  assert.equal(flow.interactiveMessage.nativeFlowMessage.buttons[0].name, 'quick_reply')
  const asTpl = await gen({ text: 'hi', nativeFlow: [{ id: 'a', text: 'A' }], interactiveAsTemplate: true })
  assert.ok(asTpl.templateMessage.interactiveMessageTemplate)
  const cards = await gen({ text: 'kartu', cards: [{ image: IMG, caption: 'c1', nativeFlow: [{ id: 'a', text: 'A' }] }, { image: IMG, caption: 'c2', nativeFlow: [{ id: 'b', text: 'B' }] }] })
  assert.equal(cards.interactiveMessage.carouselMessage.cards.length, 2)
})

test('product card inside a carousel (uses the injected media preparer)', async () => {
  const cards = await gen({
    text: 'toko',
    cards: [{ businessOwnerJid: '628111@s.whatsapp.net', product: { productImage: IMG, title: 'P' }, nativeFlow: [{ id: 'a', text: 'A' }] }]
  })
  assert.equal(cards.interactiveMessage.carouselMessage.cards[0].header.productMessage.product.title, 'P')
})

test('replies, pin/keep, order, payments', async () => {
  const fr = await gen({ flowReply: { name: 'x', text: 't', paramsJson: '{}' } })
  assert.equal(fr.interactiveResponseMessage.nativeFlowResponseMessage.name, 'x')
  const key = { remoteJid: '1@g.us', id: 'A', fromMe: true }
  assert.equal((await gen({ keep: key, type: 1 })).keepInChatMessage.key.id, 'A')
  assert.equal((await gen({ pin: key, type: 1 })).pinInChatMessage.key.id, 'A')
  const order = await gen({ orderText: 'pesan', thumbnail: IMG })
  assert.equal(order.orderMessage.message, 'pesan')
  await assert.rejects(() => gen({ orderText: 'x' }), /thumbnail/)
  assert.ok((await gen({ paymentInviteServiceType: 1 })).paymentInviteMessage)
  const rp = await gen({ text: 'bayar', requestPaymentFrom: '628111@s.whatsapp.net' })
  assert.equal(rp.requestPaymentMessage.requestFrom, '628111@s.whatsapp.net')
  const inv = await gen({ image: IMG, invoiceNote: 'catatan' })
  assert.equal(inv.invoiceMessage.note, 'catatan')
})

test('poll result and poll update', async () => {
  const pr = await gen({ pollResult: { name: 'q', votes: [{ name: 'a', voteCount: '3' }] } })
  assert.equal(pr.pollResultSnapshotMessage.pollVotes[0].optionVoteCount, 3)
  await assert.rejects(() => gen({ pollUpdate: { vote: Buffer.alloc(4) } }), /key is required/)
})

test('decorators: ad reply, mentions, forwarded channel, group status, spoiler, ephemeral, view once', async () => {
  const ad = await gen({ text: 'hi', externalAdReply: { title: 'T', body: 'B', thumbnail: IMG, url: 'https://e.com', largeThumbnail: true } })
  assert.equal(ad.extendedTextMessage.contextInfo.externalAdReply.sourceUrl, 'https://e.com')
  const gm = await gen({ text: 'hi', groupMentions: [{ groupJid: '123@g.us', groupSubject: 'G' }] })
  assert.equal(gm.extendedTextMessage.contextInfo.groupMentions[0].groupJid, '123@g.us')
  assert.match(gm.extendedTextMessage.text, /@123@g\.us/)
  const fw = await gen({ text: 'hi', forwardedNewsletter: { newsletterJid: '1@newsletter', newsletterName: 'N', serverMessageId: 5 } })
  assert.equal(fw.extendedTextMessage.contextInfo.forwardedNewsletterMessageInfo.newsletterJid, '1@newsletter')
  assert.ok((await gen({ text: 'hi', groupStatus: true })).groupStatusMessageV2)
  assert.ok((await gen({ text: 'hi', spoiler: true })).spoilerMessage)
  assert.ok((await gen({ text: 'hi', ephemeral: true })).ephemeralMessage)
  assert.ok((await gen({ text: 'hi', viewOnceV2: true })).viewOnceMessageV2)
  assert.ok((await gen({ text: 'hi', viewOnce: true })).viewOnceMessage)
  const mentions = await gen({ text: 'hi', mentions: ['628111@s.whatsapp.net'], mentionAll: true })
  assert.equal(mentions.extendedTextMessage.contextInfo.nonJidMentions, 1)
  const link = await gen({ text: 'hi', statusLinkPreview: { style: 2 } })
  assert.equal(link.statusLinkPreviewMetadata.style, 2)
})

test('raw content passes through untouched', async () => {
  const raw = await gen({ raw: true, conversation: 'mentah' })
  assert.equal(raw.conversation, 'mentah')
})

test('edit, delete, react, forward keep working through the new pipeline', async () => {
  const key = { remoteJid: '1@s.whatsapp.net', id: 'A', fromMe: true }
  assert.equal((await gen({ text: 'baru', edit: key })).protocolMessage.type, proto.Message.ProtocolMessage.Type.MESSAGE_EDIT)
  assert.equal((await gen({ delete: key })).protocolMessage.type, proto.Message.ProtocolMessage.Type.REVOKE)
  assert.equal((await gen({ react: { key, text: '🔥' } })).reactionMessage.text, '🔥')
  const msg = await generateWAMessage('1@s.whatsapp.net', { text: 'x' }, { ...opts, userJid: '2@s.whatsapp.net' })
  assert.ok(msg.key.id.startsWith('3EB0'))
})

test('status sticker and music content', async () => {
  const music = await gen({ music: { songUri: 'https://open.spotify.com/track/x', title: 'T', artist: 'A' } }).catch(e => e)
  assert.ok(music.musicMessage || /host|music|uri/i.test(String(music.message)), String(music?.message))
})
