// Lyndrā-Blanys: the stanzas the real socket produces for PN, LID, group, channel and status sends.
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import https from 'node:https'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { makeHarness } from './helpers/net.js'
import { IMG } from './helpers/matrix.js'

const PN = '6281234567890@s.whatsapp.net'
const LID = '226663140991110@lid'
const OTHER_PN = '6287770000002@s.whatsapp.net'
const G_LID = '120363000000000001@g.us'
const G_PN = '120363000000000009@g.us'
const NL = '120363000000000002@newsletter'
const dev = (user, server, ...ids) => ids.map(device => ({ user, server, device }))

let h, tls, uploads = []
before(async () => {
  const dir = mkdtempSync(join(tmpdir(), 'lb-st-'))
  execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', join(dir, 'k.pem'), '-out', join(dir, 'c.pem'), '-days', '1', '-subj', '/CN=localhost'], { stdio: 'ignore' })
  tls = https.createServer({ key: readFileSync(join(dir, 'k.pem')), cert: readFileSync(join(dir, 'c.pem')) }, (req, res) => {
    uploads.push(req.url); req.resume()
    req.on('end', () => { res.setHeader('content-type', 'application/json'); res.end(JSON.stringify({ url: 'https://mmg.whatsapp.net/v/x', direct_path: '/v/x' })) })
  })
  await new Promise(r => tls.listen(0, '127.0.0.1', r))
  const host = `127.0.0.1:${tls.address().port}`
  h = await makeHarness({
    devices: {
      '6281234567890': dev('6281234567890', 's.whatsapp.net', 0),
      '226663140991110': dev('226663140991110', 'lid', 0, 2),
      '6285000000001': dev('6285000000001', 's.whatsapp.net', 0, 1, 5),
      '999000000001': dev('999000000001', 'lid', 0, 1, 5),
      '6287770000002': dev('6287770000002', 's.whatsapp.net', 0)
    },
    groups: {
      [G_LID]: { id: G_LID, subject: 'g', addressingMode: 'lid', owner: LID, participants: [{ id: LID, phoneNumber: PN, admin: 'admin' }, { id: '999000000001@lid', phoneNumber: '6285000000001@s.whatsapp.net' }] },
      [G_PN]: { id: G_PN, subject: 'gp', addressingMode: 'pn', owner: PN, participants: [{ id: PN, admin: 'admin' }, { id: '6285000000001@s.whatsapp.net' }] }
    },
    config: { customUploadHosts: [{ hostname: host }], fetchAgent: new https.Agent({ rejectUnauthorized: false }) },
    respond: n => n.attrs.xmlns === 'w:m' ? { tag: 'iq', attrs: { type: 'result' }, content: [{ tag: 'media_conn', attrs: { auth: 'AUTH', ttl: '300', max_buckets: '1' }, content: [{ tag: 'host', attrs: { hostname: host } }] }] } : undefined
  })
  await h.settle(150)
})
after(async () => { tls.closeAllConnections(); tls.close(); await h.close() })

const capture = async fn => { h.sent.length = 0; h.encrypted.length = 0; uploads.length = 0; await fn(); await h.settle(60); return h.messages() }
const one = async fn => { const m = await capture(fn); assert.equal(m.length, 1, `exactly one message stanza, got ${m.length}`); return m[0] }
const kids = (node, tag) => (Array.isArray(node.content) ? node.content : []).filter(c => c.tag === tag)
const recipients = node => kids(kids(node, 'participants')[0] || { content: [] }, 'to').map(t => t.attrs.jid).sort()

test('1:1 to a phone number: goes to that PN, fans out to its devices and our other devices, not our own', async () => {
  const m = await one(() => h.sock.sendMessage(PN, { text: 'halo' }))
  assert.equal(m.attrs.to, PN); assert.equal(m.attrs.type, 'text')
  assert.deepEqual(recipients(m), ['6281234567890@s.whatsapp.net', '6285000000001:5@s.whatsapp.net', '6285000000001@s.whatsapp.net'].sort())
  assert.ok(!recipients(m).some(j => j.includes(':1@')), 'the sending device is never a recipient')
})

test('1:1 to a LID: stays in the LID space and covers all LID devices', async () => {
  const m = await one(() => h.sock.sendMessage(LID, { text: 'halo' }))
  assert.equal(m.attrs.to, LID)
  assert.deepEqual(recipients(m), ['226663140991110:2@lid', '226663140991110@lid', '999000000001:5@lid', '999000000001@lid'].sort())
  assert.ok(recipients(m).every(j => j.endsWith('@lid')))
})

test('LID group: addressing_mode=lid, one sender-key enc, participants are LIDs only', async () => {
  const m = await one(() => h.sock.sendMessage(G_LID, { text: 'halo' }))
  assert.equal(m.attrs.addressing_mode, 'lid')
  assert.equal(kids(m, 'enc')[0].attrs.type, 'skmsg')
  assert.ok(h.encrypted.some(e => e.kind === 'group' && e.meId.startsWith('999000000001') && e.meId.endsWith('@lid')), 'sender key is owned by our LID: ' + JSON.stringify(h.encrypted.filter(e => e.kind === 'group')))
  assert.ok(recipients(m).length > 0 && recipients(m).every(j => j.endsWith('@lid')))
})

test('PN group: addressing_mode=pn and participants are PNs only', async () => {
  const m = await one(() => h.sock.sendMessage(G_PN, { text: 'halo' }))
  assert.equal(m.attrs.addressing_mode, 'pn')
  assert.ok(recipients(m).length > 0 && recipients(m).every(j => j.endsWith('@s.whatsapp.net')))
})

test('mentions in LID and PN form are carried inside the message, the stanza is unchanged', async () => {
  const m = await one(() => h.sock.sendMessage(G_LID, { text: '@a @b', mentions: [LID, PN] }))
  assert.equal(m.attrs.type, 'text'); assert.equal(m.attrs.addressing_mode, 'lid')
})

test('revoke, edit, pin, reaction, poll and member label carry the right attributes and meta nodes', async () => {
  assert.equal((await one(() => h.sock.sendMessage(PN, { delete: { remoteJid: PN, id: 'X1', fromMe: true } }))).attrs.edit, '7')
  assert.equal((await one(() => h.sock.sendMessage(G_LID, { delete: { remoteJid: G_LID, id: 'X1', fromMe: false, participant: LID } }))).attrs.edit, '8', 'admin revoke of someone else')
  assert.equal((await one(() => h.sock.sendMessage(PN, { text: 'baru', edit: { remoteJid: PN, id: 'X1', fromMe: true } }))).attrs.edit, '1')
  assert.equal((await one(() => h.sock.sendMessage(G_LID, { pin: { remoteJid: G_LID, id: 'M1', fromMe: false, participant: LID }, type: 1, time: 86400 }))).attrs.edit, '2')
  assert.equal((await one(() => h.sock.sendMessage(G_LID, { react: { text: '👍', key: { remoteJid: G_LID, id: 'M1', fromMe: false, participant: LID } } }))).attrs.type, 'reaction')
  const poll = await one(() => h.sock.sendMessage(G_LID, { poll: { name: 'q', values: ['a', 'b'], selectableCount: 1 } }))
  assert.equal(poll.attrs.type, 'poll'); assert.equal(kids(poll, 'meta')[0].attrs.polltype, 'creation')
  const label = await one(() => h.sock.updateMemberLabel(G_LID, 'Admin Kece'))
  assert.deepEqual(kids(label, 'meta')[0].attrs, { tag_reason: 'user_update', appdata: 'member_tag' })
})

test('channel text goes out as plaintext, no per-device encryption', async () => {
  const m = await one(() => h.sock.sendMessage(NL, { text: 'hi' }))
  assert.equal(m.attrs.to, NL); assert.equal(kids(m, 'plaintext').length, 1); assert.equal(kids(m, 'participants').length, 0)
  assert.deepEqual(h.encrypted, [])
})

test('channel image: uploads to /newsletter with server thumbnail and tags the plaintext mediatype', async () => {
  const m = await one(() => h.sock.sendMessage(NL, { image: IMG, caption: 'c' }))
  assert.match(uploads[0], /^\/newsletter\/newsletter-image\/.*server_thumb_gen=1$/)
  assert.equal(kids(m, 'plaintext')[0].attrs.mediatype, 'image')
})

test('group status: every kind carries <meta is_group_status>, media keeps its mediatype (swgc and sendMessage)', async () => {
  const text = await one(() => h.sock.swgc(G_LID, { text: 'status' }))
  assert.equal(kids(text, 'meta')[0].attrs.is_group_status, 'true')
  const viaSend = await one(() => h.sock.sendMessage(G_LID, { groupStatusMessage: { text: 'status' } }, { statusJidList: ['6285000000001@s.whatsapp.net'] }))
  assert.equal(kids(viaSend, 'meta')[0].attrs.is_group_status, 'true')
  const img = await one(() => h.sock.swgc(G_LID, { image: IMG, caption: 'c' }))
  assert.equal(kids(img, 'meta')[0].attrs.is_group_status, 'true')
  assert.equal(kids(img, 'enc')[0].attrs.mediatype, 'image')
  assert.match(uploads[0], /^\/mms\/image\//)
  const wrapped = await one(() => h.sock.sendMessage(G_LID, { image: IMG, caption: 'c', groupStatus: true }))
  assert.equal(kids(wrapped, 'meta')[0].attrs.is_group_status, 'true'); assert.equal(kids(wrapped, 'enc')[0].attrs.mediatype, 'image')
  const plain = await one(() => h.sock.sendMessage(G_LID, { text: 'bukan status' }))
  assert.equal(kids(plain, 'meta').length, 0, 'ordinary messages get no group-status meta')
})

test('a swgc to a non-group JID is rejected before anything is sent', async () => {
  await assert.rejects(() => h.sock.swgc(PN, { text: 'x' }), /JID must be a group/)
})

test('status broadcast: sent to status@broadcast with the given PN recipients', async () => {
  const m = await one(() => h.sock.sendMessage('status@broadcast', { text: 'sw' }, { statusJidList: [OTHER_PN] }))
  assert.equal(m.attrs.to, 'status@broadcast')
  assert.ok(recipients(m).includes(OTHER_PN))
})

test('pin with time 0 keeps the pin without an expiry; default stays 24h', async () => {
  const { generateWAMessageContent } = await import('../../lib/index.js')
  const key = { remoteJid: '1@s.whatsapp.net', id: 'A', fromMe: true }
  const a = await generateWAMessageContent({ pin: key, type: 1, time: 0 }, {})
  const b = await generateWAMessageContent({ pin: key, type: 1 }, {})
  assert.equal(Number(a.messageContextInfo.messageAddOnDurationInSecs), 0)
  assert.equal(Number(b.messageContextInfo.messageAddOnDurationInSecs), 86400)
})
