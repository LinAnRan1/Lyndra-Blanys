// Lyndrā-Blanys: BugLogs prints errors only while switched on and never changes behaviour.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import pino from 'pino'
import makeWASocket, { createBugLogs, initAuthCreds } from '../../lib/index.js'

const fake = () => {
  const sock = {
    ev: new EventEmitter(),
    boom: async () => { throw Object.assign(new Error('kaboom'), { output: { statusCode: 500 } }) },
    boomSync: () => { throw new Error('sync boom') },
    fine: async (x) => x * 2,
    waitForThing: async () => { throw new Error('should not be wrapped') },
    end: () => { throw new Error('should not be wrapped') }
  }
  return sock
}

test('errors are printed with method, args and code, then rethrown unchanged', async () => {
  const lines = []
  const sock = fake()
  createBugLogs(sock, { sink: (entry, line) => lines.push({ entry, line }) })
  await assert.rejects(() => sock.boom('120363@g.us', { text: 'x' }), /kaboom/)
  assert.throws(() => sock.boomSync(), /sync boom/)
  assert.equal(await sock.fine(21), 42, 'successful calls are untouched')
  assert.equal(lines.length, 2)
  assert.match(lines[0].line, /^\[Lyndrā-Blanys:bug\] boom\(120363@g\.us, \{text\}\): kaboom \(code 500\)$/)
  assert.match(lines[1].line, /boomSync\(\): sync boom/)
})

test('waitFor* and end are never wrapped', async () => {
  const sock = fake()
  const w = sock.waitForThing, e = sock.end
  createBugLogs(sock, { sink: () => { throw new Error('must not print') } })
  assert.equal(sock.waitForThing, w); assert.equal(sock.end, e)
})

test('disable stops printing but keeps recording; enable resumes; stop restores', async () => {
  const lines = []
  const sock = fake(); const original = sock.boom
  const logs = createBugLogs(sock, { sink: (_e, line) => lines.push(line) })
  logs.disable()
  await assert.rejects(() => sock.boom())
  assert.equal(lines.length, 0); assert.equal(logs.recent().length, 1); assert.equal(logs.enabled, false)
  logs.enable()
  await assert.rejects(() => sock.boom())
  assert.equal(lines.length, 1)
  logs.stop()
  assert.equal(sock.boom, original)
})

test('decrypt failures and connection closes are reported', () => {
  const lines = []
  const sock = fake()
  createBugLogs(sock, { sink: (_e, line) => lines.push(line) })
  sock.ev.emit('messages.upsert', { type: 'notify', messages: [{ key: { id: 'M1', remoteJid: '1@g.us', participant: '226663140991110@lid' }, messageStubType: 2, messageStubParameters: ['No session'] }] })
  sock.ev.emit('connection.update', { connection: 'close', lastDisconnect: { error: Object.assign(new Error('Connection Closed'), { output: { statusCode: 428 } }) } })
  assert.match(lines[0], /decrypt: could not decrypt message M1 from 226663140991110@lid/)
  assert.match(lines[1], /connection: Connection Closed \(code 428\)/)
})

test('real socket: off by default; bugLogs option wraps and captures send errors', async () => {
  const make = extra => makeWASocket({ auth: { creds: initAuthCreds(), keys: { get: async () => ({}), set: async () => {} } }, logger: pino({ level: 'silent' }), version: [2, 3000, 1035194821], ...extra })
  const off = make({})
  assert.equal(off.bugLogs, undefined)
  const lines = []
  const on = make({ bugLogs: { sink: (_e, line) => lines.push(line) } })
  assert.equal(on.bugLogs.enabled, true)
  await assert.rejects(() => on.sendMessage('nope', { text: 'x' }))
  assert.ok(lines.some(l => /sendMessage\(nope, \{text\}\)/.test(l)), lines.join('\n'))
  on.bugLogs.disable()
  for (const s of [off, on]) { try { s.end(undefined) } catch {} }
})
