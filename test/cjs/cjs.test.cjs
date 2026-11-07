// Lyndrā-Blanys: the CommonJS entry. Run with `npm run test:cjs` (uses --no-experimental-require-module,
// so it proves require() works without Node's built-in require(esm)).
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const libDir = path.join(__dirname, '..', '..', 'lib')
const lyndra = require('../../lib/cjs/index.cjs')

test('require() returns the socket factory with named exports attached', () => {
  assert.equal(typeof lyndra, 'function')
  assert.equal(lyndra.__esModule, true)
  assert.equal(typeof lyndra.default, 'function')
  for (const k of ['useMultiFileAuthState', 'DisconnectReason', 'proto', 'jidDecode', 'generateWAMessageContent', 'makeInMemoryStore', 'createAntiBugGuard', 'createBugLogs', 'VoipClient', 'AIRich', 'downloadContentFromMessage']) {
    assert.ok(lyndra[k] !== undefined, `${k} is exported`)
  }
})

test('every export the ESM build has is present in the CJS build', async () => {
  const esm = await import('../../lib/index.js')
  const missing = Object.keys(esm).filter(k => !(k in lyndra))
  assert.deepEqual(missing, [])
})

test('protobuf, JID helpers and auth state work through require()', async () => {
  const msg = lyndra.proto.Message.encode(lyndra.proto.Message.create({ conversation: 'halo' })).finish()
  assert.equal(lyndra.proto.Message.decode(msg).conversation, 'halo')
  assert.equal(lyndra.jidNormalizedUser('226663140991110:3@lid'), '226663140991110@lid')
  assert.equal(lyndra.isPnUser('6281234567890@s.whatsapp.net'), true)
  const dir = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'lb-cjs-'))
  const { state, saveCreds } = await lyndra.useMultiFileAuthState(dir)
  await saveCreds()
  assert.ok(state.creds.noiseKey)
})

test('ESM-only dependencies bundled in (p-queue, node-cache, rust bridge) actually work', async () => {
  const { state } = await lyndra.useMultiFileAuthState(fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'lb-cjs-')))
  // addTransactionCapability uses p-queue and node-cache; the bridge provides hkdf/md5
  assert.equal(lyndra.hkdf(Buffer.alloc(32, 1), 32, { info: 'x' }).length, 32)
  assert.equal(Buffer.from(lyndra.md5(Buffer.from('a'))).toString('hex'), '0cc175b9c0f1b6a831c399e269772661')
  const keys = lyndra.makeCacheableSignalKeyStore(state.keys, { info() {}, debug() {}, warn() {}, error() {}, trace() {}, child() { return this } })
  await keys.set({ 'pre-key': { 1: { public: Buffer.alloc(32), private: Buffer.alloc(32) } } })
  assert.ok((await keys.get('pre-key', ['1']))['1'])
})

test('a socket can be built through require(), with the opt-in features', () => {
  const pino = require('pino')
  const sock = lyndra({ auth: { creds: lyndra.initAuthCreds(), keys: { get: async () => ({}), set: async () => {} } }, logger: pino({ level: 'silent' }), version: [2, 3000, 1035194821], AnchorGuard: true, bugLogs: { sink: () => {} } })
  assert.equal(typeof sock.sendMessage, 'function')
  assert.equal(sock.anchorGuard.detect({ conversation: 'x'.repeat(100000) }).flagged, true)
  assert.equal(sock.bugLogs.enabled, true)
  sock.end(undefined)
})

test('VoIP files resolve their assets next to the ESM build, not inside lib/cjs', () => {
  const bundle = fs.readFileSync(path.join(libDir, 'cjs', 'index.cjs'), 'utf8')
  assert.match(bundle, /join\(__dirname, "\.\.", "VoIP", "wasm-engine\.js"\)/)
  assert.ok(fs.existsSync(path.join(libDir, 'VoIP', 'worker-bootstrap.js')))
  assert.ok(!bundle.includes('import.meta'), 'no import.meta left in the CommonJS bundle')
})
