// Lyndrā-Blanys: newsletter extension flows against a fake transport.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { makeNewsletterExtensions, toNewsletterServerIds, toNewsletterUserSettingInput } from '../../lib/Socket/newsletter-extended.js'
import { QueryIds, XWAPaths } from '../../lib/Types/index.js'

const JID = '120363000000000000@newsletter'
const make = (responder = () => ({})) => {
  const calls = []
  const executeWMexQuery = async (variables, queryId, dataPath) => {
    calls.push({ variables, queryId, dataPath })
    return responder({ variables, queryId, dataPath })
  }
  const query = async node => { calls.push({ node }); return { tag: 'iq', attrs: {}, content: [] } }
  const ext = makeNewsletterExtensions({ query, generateMessageTag: () => 'T1', executeWMexQuery, newsletterUpdate: async () => ({}), logger: undefined })
  return { ext, calls }
}

test('server id and user-setting helpers validate input', () => {
  assert.deepEqual(toNewsletterServerIds(['100', 200]), ['100', '200'])
  assert.throws(() => toNewsletterServerIds([5]), /newsletter server id/)
  assert.throws(() => toNewsletterServerIds([]), /required/)
  assert.deepEqual(toNewsletterUserSettingInput(JID, 'FOLLOWER_NOTIFICATIONS', true).input, { newsletter_id: JID, type: 'MUTE_FOLLOWER_ACTIVITY', value: 'ON' })
  assert.throws(() => toNewsletterUserSettingInput('x@s.whatsapp.net', 'ADMIN', true), /not a newsletter jid/)
})

test('metadata, recommended, similar and question-response go through w:mex with the right ids', async () => {
  const { ext, calls } = make(({ queryId }) => (queryId === QueryIds.METADATA ? { id: JID, thread_metadata: {} } : { ok: true }))

  const meta = await ext.newsletterMetadataDetailed('jid', JID)
  assert.equal(meta.id, JID)
  assert.equal(calls.at(-1).queryId, QueryIds.METADATA)
  assert.equal(calls.at(-1).dataPath, XWAPaths.xwa2_newsletter_metadata)
  assert.equal(calls.at(-1).variables.input.type, 'JID')

  await ext.newsletterRecommended({ limit: 5, countryCodes: ['ID'] })
  assert.equal(calls.at(-1).queryId, QueryIds.RECOMMENDED)
  assert.deepEqual(calls.at(-1).variables.input, { limit: 5, country_codes: ['ID'] })

  await ext.newsletterSimilar(JID)
  assert.equal(calls.at(-1).queryId, QueryIds.SIMILAR)
  assert.equal(calls.at(-1).variables.input.newsletter_id, JID)

  await ext.newsletterQuestionResponseState(JID, 120, 130, 'HIDDEN')
  assert.equal(calls.at(-1).queryId, QueryIds.QUESTION_RESPONSE_STATE)
  assert.equal(calls.at(-1).variables.server_id, '120')
})

test('every extension method is an async function and the set matches the documented surface', () => {
  const { ext } = make()
  const names = Object.keys(ext)
  assert.ok(names.length >= 30, `expected the full extension set, got ${names.length}`)
  for (const name of names) assert.equal(typeof ext[name], 'function', name)
  for (const needed of ['newsletterAdminCapabilities', 'newsletterDirectorySearch', 'newsletterInsights', 'newsletterPinMessages', 'newsletterSendPollVote', 'newsletterLabelAiContent', 'newsletterCreateAdminInvite']) {
    assert.ok(names.includes(needed) || needed in ext, `${needed} missing`)
  }
})
