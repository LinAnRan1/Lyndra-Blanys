// Lyndrā-Blanys test harness: a real socket wired to a local WebSocket server and a fake Signal layer,
// so the stanzas the library really produces can be captured and inspected without WhatsApp.
import { WebSocketServer } from 'ws'
import pino from 'pino'
import makeWASocket, { initAuthCreds, decodeBinaryNode, binaryNodeToString } from '../../../lib/index.js'
import { makeLibSignalRepository } from '../../../lib/Signal/libsignal.js'

export const ME_PN = '6285000000001:1@s.whatsapp.net'
export const ME_LID = '999000000001:1@lid'

export const memoryKeys = () => {
  const store = new Map()
  return {
    get: async (type, ids) => Object.fromEntries(ids.map(id => [id, store.get(`${type}:${id}`)]).filter(([, v]) => v !== undefined)),
    set: async data => { for (const [type, ids] of Object.entries(data)) for (const [id, v] of Object.entries(ids)) v == null ? store.delete(`${type}:${id}`) : store.set(`${type}:${id}`, v) }
  }
}

const parseFrames = async buf => {
  let b = Buffer.from(buf)
  if (b.length > 4 && b[0] === 0x57 && b[1] === 0x41) b = b.subarray(4)
  const nodes = []
  while (b.length >= 3) {
    const len = b.readUIntBE(0, 3)
    const frame = b.subarray(3, 3 + len)
    b = b.subarray(3 + len)
    try { nodes.push(await decodeBinaryNode(frame)) } catch { /* handshake bytes */ }
  }
  return nodes
}

/**
 * @param {object} opts
 * @param {object} [opts.devices] user -> [{ user, device, server }] seeded into the device cache
 * @param {object} [opts.groups] jid -> group metadata for cachedGroupMetadata
 * @param {Function} [opts.respond] (node, sock) => BinaryNode | undefined, answers iq queries
 */
export const makeHarness = async (opts = {}) => {
  const wss = new WebSocketServer({ host: '127.0.0.1', port: 0 })
  await new Promise(r => wss.on('listening', r))
  const sent = []
  const cacheMap = new Map(Object.entries(opts.devices || {}))
  const userDevicesCache = { get: async k => cacheMap.get(k), set: async (k, v) => { cacheMap.set(k, v) }, del: async k => { cacheMap.delete(k) }, flushAll: async () => cacheMap.clear() }

  const encrypted = []
  const sock = makeWASocket({
    auth: { creds: { ...initAuthCreds(), me: { id: ME_PN, lid: ME_LID, name: 'tester' }, registered: true }, keys: memoryKeys() },
    logger: pino({ level: 'silent' }),
    version: [2, 3000, 1035194821],
    waWebSocketUrl: `ws://127.0.0.1:${wss.address().port}`,
    connectTimeoutMs: 8000,
    defaultQueryTimeoutMs: 5000,
    userDevicesCache,
    cachedGroupMetadata: async jid => (opts.groups || {})[jid],
    makeSignalRepository: (auth, logger, pnFromLID) => {
      const real = makeLibSignalRepository(auth, logger, pnFromLID)
      return Object.assign(real, {
        encryptMessage: async ({ jid, data }) => { encrypted.push({ kind: 'msg', jid, bytes: data.length }); return { type: 'msg', ciphertext: Buffer.from(`enc:${jid}`) } },
        encryptGroupMessage: async ({ group, meId, data }) => { encrypted.push({ kind: 'group', group, meId }); return { ciphertext: Buffer.from('skmsg'), senderKeyDistributionMessage: Buffer.alloc(8) } },
        validateSession: async () => ({ exists: true }),
        hasSenderKey: async () => true,
        getSenderKeyDistributionMessage: async () => Buffer.alloc(8, 1)
      })
    },
    ...(opts.config || {})
  })

  wss.on('connection', ws => {
    ws.on('message', async raw => {
      for (const node of await parseFrames(raw)) {
        sent.push(node)
        if (node.attrs?.id && ['iq', 'message', 'call', 'receipt', 'presence'].includes(node.tag)) {
          const reply = (await opts.respond?.(node, sock)) || (node.tag === 'iq'
            ? { tag: 'iq', attrs: { id: node.attrs.id, type: 'result', from: 's.whatsapp.net' }, content: [] }
            : { tag: 'ack', attrs: { id: node.attrs.id, class: node.tag, from: node.attrs.to || 's.whatsapp.net' } })
          reply.attrs = { id: node.attrs.id, ...reply.attrs }
          setImmediate(() => sock.ws.emit(`TAG:${node.attrs.id}`, reply))
        }
      }
    })
  })

  const settle = (ms = 40) => new Promise(r => setTimeout(r, ms))
  return {
    sock, sent, encrypted, userDevicesCache,
    messages: () => sent.filter(n => n.tag === 'message'),
    iqs: () => sent.filter(n => n.tag === 'iq'),
    settle,
    text: node => binaryNodeToString(node),
    close: async () => { try { sock.end(undefined) } catch {} ; for (const c of wss.clients) c.terminate(); await new Promise(r => wss.close(r)) }
  }
}
