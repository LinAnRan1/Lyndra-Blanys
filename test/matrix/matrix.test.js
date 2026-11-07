// Lyndrā-Blanys: calls every public socket method once on a fresh socket and fails on code defects
// (TypeError, ReferenceError, "is not a function"). Rejections caused by the empty fake server reply are expected.
// Slow (one socket per method), so it is not part of `npm run test:port`; run it with `npm run test:matrix`.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { makeHarness } from '../port/helpers/net.js'
import { ARGS, SKIP, G } from '../port/helpers/matrix.js'

const devices = {
  '6281234567890': [{ user: '6281234567890', server: 's.whatsapp.net', device: 0 }],
  '226663140991110': [{ user: '226663140991110', server: 'lid', device: 0 }],
  '6285000000001': [{ user: '6285000000001', server: 's.whatsapp.net', device: 0 }],
  '999000000001': [{ user: '999000000001', server: 'lid', device: 0 }]
}
const groups = { [G]: { id: G, subject: 'g', addressingMode: 'lid', owner: '226663140991110@lid', participants: [{ id: '226663140991110@lid', phoneNumber: '6281234567890@s.whatsapp.net', admin: 'admin' }, { id: '999000000001@lid', phoneNumber: '6285000000001@s.whatsapp.net' }] } }

// these need a real server answer (empty replies make the library read a missing node) or fetch a remote URL
const NEEDS_REAL_SERVER = new Set([
  'communityGetInviteInfo', 'communityMetadata', 'communityUpdateDescription', 'refreshMediaConn', 'updateCoverPhoto',
  'waUploadToServer', 'productCreate', 'productUpdate', 'resyncAppState', 'revokeNewsletterStatus', 'sendNewsletterStatus',
  'sendNewsletterStatusReaction', 'updateMediaMessage'
])

test('every public socket method runs without a code defect', { timeout: 600000 }, async () => {
  const probe = await makeHarness({ devices, groups })
  const names = Object.keys(probe.sock).filter(k => typeof probe.sock[k] === 'function' && !SKIP.has(k)).sort()
  await probe.close()
  assert.deepEqual(names.filter(n => !(n in ARGS)), [], 'every method needs sample arguments in test/port/helpers/matrix.js')

  const defects = []
  for (const name of names) {
    const h = await makeHarness({ devices, groups })
    await h.settle(50)
    try {
      await Promise.race([Promise.resolve(h.sock[name](...ARGS[name])), new Promise((_, rej) => setTimeout(() => rej(new Error('__timeout__')), 4000))])
    } catch (e) {
      const msg = String(e?.message || e)
      const code = e?.name === 'TypeError' || e?.name === 'ReferenceError' || /is not (a function|defined|iterable)|Cannot read properties|Cannot destructure/.test(msg) || msg === '__timeout__'
      if (code && !NEEDS_REAL_SERVER.has(name)) defects.push(`${name}: ${e?.name}: ${msg.slice(0, 140)}`)
    }
    await h.close()
  }
  assert.deepEqual(defects, [])
})
