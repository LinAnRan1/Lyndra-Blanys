// Lyndrā-Blanys: AnchorGuard detection and response flows against a fake socket.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import pino from 'pino'
import makeWASocket, { createAntiBugGuard, detectBug, ANTIBUG_DEFAULTS, initAuthCreds } from '../../lib/index.js'

const silent = { info() {}, debug() {}, warn() {}, error() {}, trace() {}, child() { return this } }
const GROUP = '120363000000000000@g.us'
const ME = '628000000001:5@s.whatsapp.net'
const BAD = '628999999999@s.whatsapp.net'

const fakeSock = ({ admin = true } = {}) => {
  const calls = []
  const ev = new EventEmitter()
  const sock = {
    ev,
    user: { id: ME },
    logger: silent,
    calls,
    sendMessage: async (jid, content) => { calls.push(['sendMessage', jid, content]); return { ok: true } },
    chatModify: async (mod, jid) => { calls.push(['chatModify', jid, mod]) },
    groupParticipantsUpdate: async (jid, list, action) => { calls.push(['groupParticipantsUpdate', jid, list, action]) },
    updateBlockStatus: async (jid, action) => { calls.push(['updateBlockStatus', jid, action]) },
    groupLeave: async jid => { calls.push(['groupLeave', jid]) },
    groupMetadata: async () => ({ participants: [{ id: '628000000001@s.whatsapp.net', admin: admin ? 'admin' : null }] })
  }
  return sock
}
const bugMessage = { extendedTextMessage: { text: 'x'.repeat(ANTIBUG_DEFAULTS.maxText + 1) } }
const upsert = (sock, key, message = bugMessage) => sock.ev.emit('messages.upsert', { type: 'notify', messages: [{ key, message }] })
const settle = () => new Promise(resolve => setTimeout(resolve, 30))

test('detectBug flags the known crash shapes and passes normal messages', () => {
  assert.equal(detectBug({ conversation: 'halo' }).flagged, false)
  assert.equal(detectBug({ extendedTextMessage: { text: 'baris\nkedua\tok' } }).flagged, false, 'ordinary whitespace is fine')
  assert.match(detectBug(bugMessage).reasons.join(), /string length/)
  assert.match(detectBug({ conversation: '​'.repeat(600) }).reasons.join(), /invisible-char run/)
  assert.match(detectBug({ conversation: 'a\u0000b' }).reasons.join(), /control/)
  assert.match(detectBug({ conversation: 'a' + '́'.repeat(150) }).reasons.join(), /combining/)
  const mentions = { extendedTextMessage: { text: 'hi', contextInfo: { mentionedJid: Array.from({ length: 1501 }, (_, i) => `${i}@s.whatsapp.net`) } } }
  assert.match(detectBug(mentions).reasons.join(), /mentionedJid/)
  const badFlow = { interactiveMessage: { nativeFlowMessage: { buttons: [{ name: 'quick_reply', buttonParamsJson: '{nope' }] } } }
  assert.match(detectBug(badFlow).reasons.join(), /buttonParamsJson invalid/)
  let deep = { conversation: 'x' }
  for (let i = 0; i < 20; i++) deep = { a: deep }
  assert.match(detectBug({ extendedTextMessage: deep }).reasons.join(), /depth/)
  assert.match(detectBug({ ephemeralMessage: { message: { ephemeralMessage: { message: { ephemeralMessage: { message: { ephemeralMessage: { message: { ephemeralMessage: { message: { ephemeralMessage: { message: { conversation: 'x' } } } } } } } } } } } } }).reasons.join(), /wrapper nesting/)
  assert.deepEqual(detectBug(null), { flagged: false, reasons: [] })
  assert.equal(detectBug({ conversation: 'a'.repeat(100) }, { maxText: 10 }).flagged, true, 'thresholds are overridable')
})

test('outgoing guard blocks a bug payload and lets normal sends through; stop() restores', async () => {
  const sock = fakeSock()
  const original = sock.sendMessage
  const seen = []
  const guard = createAntiBugGuard(sock, { logger: silent, onDetect: e => seen.push(e.direction) })
  await assert.rejects(() => sock.sendMessage(GROUP, bugMessage), /anti-bug blocked outgoing message/)
  assert.deepEqual(seen, ['outgoing'])
  assert.deepEqual(await sock.sendMessage(GROUP, { text: 'aman' }), { ok: true })
  guard.stop()
  assert.notEqual(sock.sendMessage, undefined)
  assert.equal(typeof sock.sendMessage, 'function')
  await sock.sendMessage(GROUP, bugMessage) // no longer guarded
  assert.ok(original)
})

test('incoming bug in a group where the bot is admin: revoke, kick, block', async () => {
  const sock = fakeSock({ admin: true })
  const events = []
  createAntiBugGuard(sock, { logger: silent, onDetect: e => events.push(e.direction), guardOutgoing: false })
  upsert(sock, { remoteJid: GROUP, id: 'B1', participant: BAD, fromMe: false })
  await settle()
  const names = sock.calls.map(c => c[0])
  assert.ok(names.includes('sendMessage'), 'revoked for everyone')
  assert.deepEqual(sock.calls.find(c => c[0] === 'sendMessage')[2], { delete: { remoteJid: GROUP, id: 'B1', participant: BAD, fromMe: false } })
  assert.deepEqual(sock.calls.find(c => c[0] === 'groupParticipantsUpdate').slice(1), [GROUP, [BAD], 'remove'])
  assert.deepEqual(sock.calls.find(c => c[0] === 'updateBlockStatus').slice(1), [BAD, 'block'])
  assert.deepEqual(events, ['incoming'])
})

test('incoming bug in a group where the bot is not admin: delete for me only; private chat as well', async () => {
  const sock = fakeSock({ admin: false })
  createAntiBugGuard(sock, { logger: silent, guardOutgoing: false, blockOnBug: false })
  upsert(sock, { remoteJid: GROUP, id: 'B2', participant: BAD, fromMe: false })
  await settle()
  assert.ok(sock.calls.some(c => c[0] === 'chatModify'))
  assert.ok(!sock.calls.some(c => c[0] === 'groupParticipantsUpdate'))
  assert.ok(!sock.calls.some(c => c[0] === 'updateBlockStatus'), 'blockOnBug:false is respected')
})

test('conservative config: nothing destructive happens to people', async () => {
  const sock = fakeSock({ admin: true })
  createAntiBugGuard(sock, { logger: silent, guardOutgoing: false, blockOnBug: false, kickOnBug: false, guardGroupAdds: false })
  upsert(sock, { remoteJid: GROUP, id: 'B3', participant: BAD, fromMe: false })
  await settle()
  assert.ok(!sock.calls.some(c => ['groupParticipantsUpdate', 'updateBlockStatus', 'groupLeave'].includes(c[0])))
})

test('burst escalation blocks and removes the sender once', async () => {
  const sock = fakeSock({ admin: true })
  const events = []
  createAntiBugGuard(sock, { logger: silent, guardOutgoing: false, burstThreshold: 2, cooldownMs: 0, onDetect: e => events.push(e.direction) })
  upsert(sock, { remoteJid: GROUP, id: 'C1', participant: BAD, fromMe: false })
  upsert(sock, { remoteJid: GROUP, id: 'C2', participant: BAD, fromMe: false })
  upsert(sock, { remoteJid: GROUP, id: 'C3', participant: BAD, fromMe: false })
  await settle()
  assert.equal(events.filter(e => e === 'escalation').length, 1, 'escalates exactly once per sender')
})

test('bad group add (Meta AI number) is removed, and watchlist numbers too', async () => {
  const sock = fakeSock({ admin: true })
  createAntiBugGuard(sock, { logger: silent, guardOutgoing: false, addWatchlist: ['6281111111111@s.whatsapp.net'] })
  sock.ev.emit('group-participants.update', { id: GROUP, author: BAD, participants: ['13135550001@s.whatsapp.net', '6281111111111@s.whatsapp.net', '628222@s.whatsapp.net'], action: 'add' })
  await settle()
  const kick = sock.calls.find(c => c[0] === 'groupParticipantsUpdate')
  assert.deepEqual(kick.slice(1), [GROUP, ['13135550001@s.whatsapp.net', '6281111111111@s.whatsapp.net'], 'remove'])
})

test('selfOnly ignores messages from other chats', async () => {
  const sock = fakeSock()
  createAntiBugGuard(sock, { logger: silent, guardOutgoing: false, selfOnly: true })
  upsert(sock, { remoteJid: GROUP, id: 'D1', participant: BAD, fromMe: false })
  await settle()
  assert.equal(sock.calls.length, 0)
})

test('socket integration: off by default, on with AnchorGuard: true', async () => {
  const make = extra => makeWASocket({ auth: { creds: initAuthCreds(), keys: { get: async () => ({}), set: async () => {} } }, logger: pino({ level: 'silent' }), version: [2, 3000, 1035194821], ...extra })
  const off = make({})
  assert.equal(off.anchorGuard, undefined)
  const on = make({ AnchorGuard: true, AnchorGuardConfig: { guardOutgoing: true } })
  assert.equal(typeof on.anchorGuard.detect, 'function')
  assert.equal(on.anchorGuard.detect(bugMessage).flagged, true)
  await assert.rejects(() => on.sendMessage(GROUP, bugMessage), /anti-bug blocked outgoing message/)
  for (const s of [off, on]) { try { s.end(undefined) } catch {} }
})

test('logs option: on by default, off silences warnings, setLogs toggles at runtime', async () => {
  const lines = []
  const logger = { ...silent, warn(_o, msg) { lines.push(msg) } }
  const on = fakeSock(); const guardOn = createAntiBugGuard(on, { logger, guardOutgoing: false, blockOnBug: false, kickOnBug: false })
  upsert(on, { remoteJid: GROUP, id: 'L1', participant: BAD, fromMe: false })
  await settle()
  assert.ok(lines.some(l => /flagged incoming/.test(l)), 'logged by default')
  assert.equal(guardOn.logsEnabled, true)

  lines.length = 0
  const off = fakeSock(); const guardOff = createAntiBugGuard(off, { logger, guardOutgoing: false, logs: false, blockOnBug: false, kickOnBug: false })
  upsert(off, { remoteJid: GROUP, id: 'L2', participant: BAD, fromMe: false })
  await settle()
  assert.equal(lines.length, 0, 'logs:false prints nothing')
  assert.ok(off.calls.some(c => c[0] === 'sendMessage'), 'but the guard still acts')
  assert.equal(guardOff.logsEnabled, false)

  assert.equal(guardOff.setLogs(true), true)
  upsert(off, { remoteJid: '120363111111111111@g.us', id: 'L3', participant: BAD, fromMe: false })
  await settle()
  assert.ok(lines.some(l => /flagged incoming/.test(l)), 'logging resumes after setLogs(true)')
})
