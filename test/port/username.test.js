import { test } from 'node:test';
import assert from 'node:assert/strict';
import { USyncQuery } from '../../lib/WAUSync/USyncQuery.js';
import { USyncUser } from '../../lib/WAUSync/USyncUser.js';
import { USyncUsernameProtocol } from '../../lib/WAUSync/Protocols/USyncUsernameProtocol.js';
import { validateUsername, isUsernamePin, displayUsername, stripUsernamePrefix } from '../../lib/Utils/username.js';

test('usync-username-query-nodes', () => {
    const q = new USyncQuery().withUsernameProtocol();
    q.withUser(new USyncUser().withId('628123@s.whatsapp.net'));
    const proto = q.protocols[0];
    assert.ok(proto instanceof USyncUsernameProtocol);
    assert.deepEqual(proto.getQueryElement(), { tag: 'username', attrs: {} });
    assert.equal(proto.getUserElement(q.users[0]), null);
});

test('usync-username-reverse-parse', () => {
    const q = new USyncQuery().withUsernameProtocol();
    q.withUser(new USyncUser().withId('628123@s.whatsapp.net'));
    q.withUser(new USyncUser().withId('628999@s.whatsapp.net'));
    const result = {
        tag: 'iq',
        attrs: { type: 'result' },
        content: [{ tag: 'usync', attrs: {}, content: [{ tag: 'list', attrs: {}, content: [
            { tag: 'user', attrs: { jid: '628123@s.whatsapp.net' }, content: [{ tag: 'username', attrs: {}, content: 'lyndra' }] },
            { tag: 'user', attrs: { jid: '628999@s.whatsapp.net' }, content: [{ tag: 'username', attrs: {}, content: 'lyndra' }] }
        ] }] }]
    };
    const parsed = q.parseUSyncQueryResult(result);
    const mapped = parsed.list
        .filter(a => typeof a.username === 'string' && a.username.length > 0)
        .map(({ username, id }) => ({ jid: id, username }));
    assert.deepEqual(mapped, [
        { jid: '628123@s.whatsapp.net', username: 'lyndra' },
        { jid: '628999@s.whatsapp.net', username: 'lyndra' }
    ]);
});

test('usync-contact-username-nodes', () => {
    const q = new USyncQuery().withContactProtocol();
    q.withUser(new USyncUser().withUsername('lyndra').withUsernameKey('1234'));
    q.withUser(new USyncUser().withUsername('lyndra'));
    const proto = q.protocols[0];
    assert.deepEqual(proto.getUserElement(q.users[0]), { tag: 'contact', attrs: { username: 'lyndra', pin: '1234' } });
    assert.deepEqual(proto.getUserElement(q.users[1]), { tag: 'contact', attrs: { username: 'lyndra' } });
});

test('username-validation', () => {
    assert.equal(validateUsername('lyndra').isValid, true);
    assert.equal(validateUsername('@lyndra').isValid, true);
    assert.equal(validateUsername('ab').isValid, false);
    assert.equal(validateUsername('1234').isValid, false);
    assert.equal(validateUsername('.lyndra').isValid, false);
    assert.equal(validateUsername('www.lyndra').isValid, false);
    assert.equal(validateUsername('lyndra.com').isValid, false);
    assert.equal(validateUsername('whatsapp1').isValid, false);
    assert.equal(isUsernamePin('1234'), true);
    assert.equal(isUsernamePin('12'), false);
    assert.equal(displayUsername('lyndra'), '@lyndra');
    assert.equal(stripUsernamePrefix('@lyndra'), 'lyndra');
});
