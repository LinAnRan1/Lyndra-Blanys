// Lyndrā-Blanys: JID / LID handling across the public helpers and the group-status path.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  jidDecode, jidEncode, isLidUser, isPnUser, isJidGroup, isJidNewsletter, isJidStatusBroadcast,
  isHostedLidUser, isHostedPnUser, jidNormalizedUser, areJidsSameUser, transferDevice, generateWAMessageContent
} from '../../lib/index.js'

const PN = '6281234567890@s.whatsapp.net'
const LID = '226663140991110@lid'

test('decode and encode keep user, device and server for PN and LID', () => {
  assert.deepEqual(jidDecode('6281234567890:12@s.whatsapp.net'), { server: 's.whatsapp.net', user: '6281234567890', domainType: 0, device: 12 })
  const lid = jidDecode('226663140991110:3@lid')
  assert.equal(lid.user, '226663140991110'); assert.equal(lid.device, 3); assert.equal(lid.server, 'lid')
  assert.equal(jidEncode('6281234567890', 's.whatsapp.net', 12), '6281234567890:12@s.whatsapp.net')
  assert.equal(jidEncode('226663140991110', 'lid'), LID)
  assert.equal(jidDecode('nope'), undefined)
})

test('type guards tell PN, LID, group, channel, status and hosted apart', () => {
  assert.ok(isPnUser(PN) && !isLidUser(PN))
  assert.ok(isLidUser(LID) && !isPnUser(LID))
  assert.ok(isJidGroup('120363000000000000@g.us') && !isJidGroup(PN))
  assert.ok(isJidNewsletter('120363000000000000@newsletter'))
  assert.ok(isJidStatusBroadcast('status@broadcast'))
  assert.equal(isHostedPnUser(PN), false); assert.equal(isHostedLidUser(LID), false)
  assert.ok(isHostedPnUser('6281234567890@hosted')); assert.ok(isHostedLidUser('226663140991110@hosted.lid'))
})

test('normalisation drops the device and keeps the addressing space', () => {
  assert.equal(jidNormalizedUser('6281234567890:12@s.whatsapp.net'), PN)
  assert.equal(jidNormalizedUser('226663140991110:3@lid'), LID)
  assert.equal(jidNormalizedUser('6281234567890@c.us'), PN, 'legacy c.us becomes s.whatsapp.net')
  assert.ok(areJidsSameUser('6281234567890:5@s.whatsapp.net', PN))
  assert.ok(!areJidsSameUser(PN, LID), 'a PN and a LID are not the same JID without a mapping')
  assert.equal(transferDevice('6281234567890:7@s.whatsapp.net', PN), '6281234567890:7@s.whatsapp.net')
})

test('group status and member label accept LID senders without touching the JID', async () => {
  const content = await generateWAMessageContent({ text: 'halo', groupStatus: true, mentions: [LID, PN] }, { upload: async () => ({}) })
  const inner = content.groupStatusMessageV2.message.extendedTextMessage
  assert.equal(inner.contextInfo.isGroupStatus, true)
  assert.deepEqual(inner.contextInfo.mentionedJid, [LID, PN], 'LID and PN mentions are kept as given')
})
