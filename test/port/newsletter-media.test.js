// Lyndrā-Blanys: channel media upload (path map, server thumbnails, ptt) against a local HTTPS server.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import https from 'node:https'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { getWAUploadToServer, generateWAMessageContent, NEWSLETTER_MEDIA_PATH_MAP } from '../../lib/index.js'

const silent = { info() {}, debug() {}, warn() {}, error() {}, trace() {}, child() { return this } }

const startServer = async () => {
  const dir = mkdtempSync(join(tmpdir(), 'lb-tls-'))
  execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', join(dir, 'k.pem'), '-out', join(dir, 'c.pem'), '-days', '1', '-subj', '/CN=localhost'], { stdio: 'ignore' })
  const seen = []
  const server = https.createServer({ key: readFileSync(join(dir, 'k.pem')), cert: readFileSync(join(dir, 'c.pem')) }, (req, res) => {
    seen.push(req.url)
    req.resume()
    req.on('end', () => { res.setHeader('content-type', 'application/json'); res.end(JSON.stringify({ url: 'https://mmg.whatsapp.net/x', direct_path: '/x' })) })
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  return { server, seen, host: `127.0.0.1:${server.address().port}`, dir }
}

test('NEWSLETTER_MEDIA_PATH_MAP covers gif, ptt, ptv and sticker packs', () => {
  for (const k of ['image', 'video', 'audio', 'document', 'gif', 'ptt', 'ptv', 'sticker', 'sticker-pack', 'thumbnail-link']) assert.ok(NEWSLETTER_MEDIA_PATH_MAP[k], k)
})

test('upload URLs: normal chats use /mms, channels use /newsletter and server thumbnail flags', async () => {
  const { server, seen, host, dir } = await startServer()
  try {
    const file = join(dir, 'f.bin'); writeFileSync(file, Buffer.alloc(64, 7))
    const up = getWAUploadToServer(
      { customUploadHosts: [{ hostname: host }], fetchAgent: new https.Agent({ rejectUnauthorized: false }), logger: silent, options: {} },
      async () => ({ auth: 'AUTH', hosts: [], ttl: 60, fetchDate: new Date() })
    )
    await up(file, { mediaType: 'image', fileEncSha256B64: 'AAA' })
    await up(file, { mediaType: 'image', fileEncSha256B64: 'AAA', newsletter: true })
    await up(file, { mediaType: 'video', fileEncSha256B64: 'AAA', newsletter: true })
    await up(file, { mediaType: 'ptt', fileEncSha256B64: 'AAA', newsletter: true })
    await up(file, { mediaType: 'gif', fileEncSha256B64: 'AAA', newsletter: true })
    assert.match(seen[0], /^\/mms\/image\/AAA\?auth=AUTH&token=AAA$/, 'plain chats are unchanged')
    assert.match(seen[1], /^\/newsletter\/newsletter-image\/AAA\?.*&server_thumb_gen=1$/)
    assert.doesNotMatch(seen[1], /server_transcode/)
    assert.match(seen[2], /^\/newsletter\/newsletter-video\/.*server_thumb_gen=1&server_transcode=1$/)
    assert.match(seen[3], /^\/newsletter\/newsletter-ptt\/AAA\?auth=AUTH&token=AAA$/, 'voice notes: no thumbnail flags')
    assert.match(seen[4], /^\/newsletter\/newsletter-gif\/.*server_transcode=1$/)
  } finally { server.close() }
})

test('channel image/voice-note content passes newsletter:true and maps ptt', async () => {
  const calls = []
  const upload = async (_p, opts) => { calls.push(opts); return { mediaUrl: 'https://mmg.whatsapp.net/x', directPath: '/x' } }
  const ch = '120363000000000000@newsletter'
  const audio = Buffer.alloc(3000, 1)
  await generateWAMessageContent({ audio, mimetype: 'audio/ogg; codecs=opus', ptt: true }, { upload, jid: ch })
  await generateWAMessageContent({ audio, mimetype: 'audio/mpeg' }, { upload, jid: ch })
  assert.equal(calls[0].mediaType, 'ptt'); assert.equal(calls[0].newsletter, true)
  assert.equal(calls[1].mediaType, 'audio'); assert.equal(calls[1].newsletter, true)
})
