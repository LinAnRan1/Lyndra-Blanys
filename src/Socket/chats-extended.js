/* Lyndrā-Blanys. Attribution and license terms: see LICENSE and NOTICE.md. */
import { Boom } from '@hapi/boom'
import { SPAM_FLOWS } from '../Types/Chat.js'
import { QueryIds, XWAPaths } from '../Types/Mex.js'
import { isUsernamePin, stripUsernamePrefix, validateUsername } from '../Utils/username.js'
import {
    getBinaryNodeChild,
    getBinaryNodeChildren,
    isHostedLidUser,
    isHostedPnUser,
    isJidGroup,
    isLidUser,
    isPnUser,
    jidDecode,
    jidNormalizedUser,
    S_WHATSAPP_NET
} from '../WABinary/index.js'

export const buildSpamListNode = (jid, options = {}) => {
    if (typeof jid !== 'string' || !jid.includes('@')) {
        throw new Boom(`${JSON.stringify(jid)} is not a jid to report`, { statusCode: 400, data: { jid } });
    }
    const flow = options.flow ?? SPAM_FLOWS.OverflowMenuReport;
    if (typeof flow !== 'string' || !flow.length) {
        throw new Boom('spam flow must be a non-empty string, see SPAM_FLOWS', { statusCode: 400, data: { flow } });
    }
    const attrs = {
        jid: isJidGroup(jid) ? jid : jidNormalizedUser(jid),
        spam_flow: flow
    };
    if (options.source) {
        attrs.source = jidNormalizedUser(options.source);
    }
    if (options.subject) {
        attrs.subject = options.subject;
    }
    if (typeof options.isKnownChat === 'boolean') {
        attrs.is_known_chat = options.isKnownChat ? 'true' : 'false';
    }
    return { tag: 'spam_list', attrs };
};
export const readSpamReportResult = (sent, result) => {
    const error = getBinaryNodeChild(result, 'error');
    if (error) {
        throw new Boom('reportSpam was rejected by the server', {
            statusCode: Number(error.attrs?.code) || 400,
            data: { jid: sent.attrs.jid, flow: sent.attrs.spam_flow, text: error.attrs?.text }
        });
    }
    return {
        jid: sent.attrs.jid,
        flow: sent.attrs.spam_flow,
        reported: true,
        node: result
    };
};
export const makeChatsExtensions = ({ query, generateMessageTag, executeWMexQuery, signalRepository, sock, getBusinessProfile, fetchStatus, profilePictureUrl }) => {
    const findUserId = async (pnLid) => {
        const normalizedJid = jidNormalizedUser(pnLid);
        const userId = {
            lid: undefined,
            phoneNumber: undefined
        };
        if (isPnUser(normalizedJid) || isHostedPnUser(normalizedJid)) {
            userId.phoneNumber = normalizedJid;
            userId.lid = jidNormalizedUser((await signalRepository.lidMapping.getLIDsForPNs([normalizedJid]))?.[0]?.lid);
        }
        else if (isLidUser(normalizedJid) || isHostedLidUser(normalizedJid)) {
            userId.lid = normalizedJid;
            userId.phoneNumber = jidNormalizedUser((await signalRepository.lidMapping.getPNsForLIDs([normalizedJid]))?.[0]?.pn);
        }
        else {
            throw new Boom('Invalid id input to find user ids', { statusCode: 400 });
        }
        return userId;
    };

    const getUsername = async () => {
        const response = await executeWMexQuery({}, QueryIds.USERNAME_GET, XWAPaths.xwa2_username_get);
        const info = response?.username_info;
        return {
            username: info?.username ?? null,
            state: info?.state ?? null,
            pin: info?.pin ?? null
        };
    };
    const assertUsername = (username) => {
        const value = stripUsernamePrefix(username);
        const { isValid, errorType } = validateUsername(value);
        if (!isValid) {
            throw new Boom(`username is not accepted by WhatsApp: ${errorType}`, { statusCode: 400, data: { username: value, errorType } });
        }
        return value;
    };
    const setUsername = async (username, options = {}) => {
        const variables = username
            ? {
                input: assertUsername(username),
                reserved: options.reserved ?? false,
                session_id: options.sessionId ?? generateMessageTag(),
                source: options.source ?? 'USER_INPUT'
            }
            : {};
        const response = await executeWMexQuery(variables, QueryIds.USERNAME_SET, XWAPaths.xwa2_username_set);
        return response?.result === 'SUCCESS';
    };
    const removeUsername = async () => {
        return setUsername(undefined);
    };
    const checkUsernameAvailability = async (username, options = {}) => {
        const response = await executeWMexQuery({
            input: assertUsername(username),
            session_id: options.sessionId ?? generateMessageTag(),
            source: options.source ?? 'USER_INPUT'
        }, QueryIds.USERNAME_CHECK, XWAPaths.xwa2_username_check);
        return {
            available: response?.result === 'SUCCESS',
            suggestions: response?.suggestions ?? [],
            response
        };
    };
    const setUsernamePin = async (pin) => {
        const value = String(pin ?? '');
        if (!isUsernamePin(value)) {
            throw new Boom('username pin must be exactly 4 digits', { statusCode: 400, data: { pin: value } });
        }
        const response = await executeWMexQuery({ pin: value }, QueryIds.USERNAME_PIN_SET, XWAPaths.xwa2_username_pin_set);
        return response?.result === 'SUCCESS';
    };
    const removeUsernamePin = async () => {
        const response = await executeWMexQuery({ pin: null }, QueryIds.USERNAME_PIN_SET, XWAPaths.xwa2_username_pin_set);
        return response?.result === 'SUCCESS';
    };
    const updateTextStatus = async (text, options = {}) => {
        const input = {
            text: text === '' ? null : text ?? null,
            ephemeral_duration_sec: options.ephemeralDurationSec ?? 0
        };
        if (options.emoji) {
            input.emoji = { content: options.emoji };
        }
        return executeWMexQuery({ input }, QueryIds.UPDATE_TEXT_STATUS, XWAPaths.xwa2_update_text_status);
    };
    const fetchTextStatus = async (jids) => {
        const list = (Array.isArray(jids) ? jids : [jids]).map(jid => ({ jid: jidNormalizedUser(jid) }));
        return executeWMexQuery({ input: list }, QueryIds.TEXT_STATUS_LIST, XWAPaths.xwa2_text_status_list);
    };
    const fetchAbout = async (jid) => {
        const { user } = jidDecode(jidNormalizedUser(jid)) || {};
        if (!user) {
            throw new Boom('Invalid user jid', { statusCode: 400 });
        }
        const response = await executeWMexQuery({ user: { user_id: user } }, QueryIds.ABOUT_STATUS, XWAPaths.xwa2_users_updates_since);
        const updates = Array.isArray(response) ? response[0]?.updates : undefined;
        return {
            jid: jidNormalizedUser(jid),
            status: updates?.[0]?.text ?? null,
            response
        };
    };
    const fetchUserNotices = async (since = 0) => {
        const result = await query({
            tag: 'iq',
            attrs: {
                to: S_WHATSAPP_NET,
                type: 'get',
                xmlns: 'tos',
                id: generateMessageTag()
            },
            content: [{ tag: 'get_user_disclosures', attrs: { t: String(since) } }]
        });
        const notices = [];
        for (const node of getBinaryNodeChildren(result, 'notice')) {
            notices.push({
                id: node.attrs.id,
                stage: node.attrs.stage,
                t: node.attrs.t,
                version: node.attrs.version,
                type: node.attrs.type
            });
        }
        return notices;
    };
    const updateUserNoticeStage = async (noticeId, stage) => {
        await query({
            tag: 'iq',
            attrs: {
                to: S_WHATSAPP_NET,
                type: 'set',
                xmlns: 'tos',
                id: generateMessageTag()
            },
            content: [{ tag: 'notice', attrs: { id: String(noticeId), stage: String(stage) } }]
        });
    };
    const fetchOptOutList = async (options = {}) => {
        const attrs = {
            to: S_WHATSAPP_NET,
            type: 'get',
            xmlns: 'optoutlist',
            id: generateMessageTag()
        };
        if (options.category) {
            attrs.category = options.category;
        }
        const content = options.dhash ? [{ tag: 'item', attrs: { dhash: options.dhash } }] : undefined;
        const result = await query({ tag: 'iq', attrs, content });
        return getBinaryNodeChildren(result, 'item').map(node => node.attrs);
    };
    const updateOptOut = async ({ jid, category, action, dhash, reason, entryPoint, signupId, duration }) => {
        const attrs = {
            jid: jidNormalizedUser(jid),
            category,
            action
        };
        if (dhash)
            attrs.dhash = dhash;
        if (reason)
            attrs.reason = reason;
        if (entryPoint)
            attrs.entry_point = entryPoint;
        if (signupId)
            attrs.signup_id = signupId;
        if (duration !== undefined && duration !== null)
            attrs.duration = String(duration);
        await query({
            tag: 'iq',
            attrs: {
                to: S_WHATSAPP_NET,
                type: 'set',
                xmlns: 'optoutlist',
                id: generateMessageTag()
            },
            content: [{ tag: 'item', attrs }]
        });
    };
    const fetchPushSettings = async () => {
        const result = await query({
            tag: 'iq',
            attrs: {
                to: S_WHATSAPP_NET,
                type: 'get',
                xmlns: 'urn:xmpp:whatsapp:push',
                id: generateMessageTag()
            },
            content: [{ tag: 'settings', attrs: {} }]
        });
        return getBinaryNodeChild(result, 'settings')?.attrs ?? {};
    };
    const fetchServerLinkPreview = async (url) => {
        return executeWMexQuery({ input: { url } }, QueryIds.PLAINTEXT_LINK_PREVIEW, XWAPaths.xwa2_newsletter_link_preview);
    };
    const reportSpam = async (jid, options = {}) => {
        const node = buildSpamListNode(jid, options);
        const result = await query({
            tag: 'iq',
            attrs: {
                xmlns: 'spam',
                to: S_WHATSAPP_NET,
                type: 'set'
            },
            content: [node]
        });
        return readSpamReportResult(node, result);
    };
    const checkAccountHealth = async (jid) => {
        const number = String(jid).split('@')[0].split(':')[0];
        const info = {
            jid,
            exists: false,
            isBusiness: false,
            verifiedName: null,
            about: null,
            hasProfilePhoto: false,
            self: null,
            notes: []
        };
        const [onWa] = await sock.onWhatsApp(number).catch(() => []);
        info.exists = !!onWa?.exists;
        if (onWa?.jid) {
            info.jid = onWa.jid;
        }
        if (!info.exists) {
            info.notes.push('Nomor tidak terdaftar di WhatsApp');
            return info;
        }
        const biz = await getBusinessProfile(info.jid).catch(() => null);
        if (biz && Object.keys(biz).length) {
            info.isBusiness = true;
            info.verifiedName = biz.verifiedName || biz.business_name || biz.description || null;
        }
        const status = await fetchStatus(info.jid).catch(() => null);
        const entry = Array.isArray(status) ? status[0] : status;
        info.about = entry?.status?.status ?? entry?.status ?? null;
        const pic = await profilePictureUrl(info.jid, 'image').catch(() => null);
        info.hasProfilePhoto = !!pic;
        const cap = await sock.fetchNewChatMessageCap().catch(() => null);
        if (cap) {
            info.self = { capped: cap.capped, warned: cap.warned, unlimited: cap.unlimited, remaining: cap.remaining };
            if (cap.capped) {
                info.notes.push('Akunmu sedang di-cap untuk chat baru, rem dulu');
            }
            else if (cap.warned) {
                info.notes.push('Akunmu sudah diperingatkan soal chat baru');
            }
            else {
                info.notes.push('Akunmu sehat untuk chat baru');
            }
        }
        return info;
    };
    return {
        findUserId, getUsername, setUsername, removeUsername, checkUsernameAvailability, setUsernamePin, removeUsernamePin,
        updateTextStatus, fetchTextStatus, fetchAbout, fetchUserNotices, updateUserNoticeStage, fetchOptOutList, updateOptOut,
        fetchPushSettings, fetchServerLinkPreview, reportSpam, checkAccountHealth
    }
}
