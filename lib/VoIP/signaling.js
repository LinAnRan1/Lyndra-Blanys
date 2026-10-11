var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _SignalingBridge_sock, _SignalingBridge_voip, _SignalingBridge_observedTcTokens, _SignalingBridge_pendingTcTokenWaiters, _SignalingBridge_ensuredSignalSessions, _SignalingBridge_remoteDevicePeerByCallId, _SignalingBridge_remoteObfuscatedPeerByCallId, _SignalingBridge_remoteXmppRoutePeerByCallId, _SignalingBridge_incomingCallPeerById, _SignalingBridge_outgoingSignalingQueue, _SignalingBridge_incomingSignalingQueue, _SignalingBridge_doSendSignaling, _SignalingBridge_sendCallStanza, _SignalingBridge_doProcessIncomingCall, _SignalingBridge_doProcessIncomingReceipt, _SignalingBridge_maybeDecryptEnc, _SignalingBridge_encryptCallKey, _SignalingBridge_ensureSignalSessions, _SignalingBridge_appendDeviceIdentity, _SignalingBridge_toBareJid, _SignalingBridge_toCallDeviceJid, _SignalingBridge_toPrimaryDeviceJid, _SignalingBridge_hasConcreteDevice, _SignalingBridge_preferDeviceRouteJid, _SignalingBridge_preferOrderedRouteJid, _SignalingBridge_pickConcreteRouteHint, _SignalingBridge_resolveOutboundPeerJid, _SignalingBridge_expandSignalSessionTargets, _SignalingBridge_normalizeStartCallPeerList, _SignalingBridge_rememberTcToken, _SignalingBridge_getTcToken;
import { decodeBinaryNode } from '../WABinary/decode.js';
import { encodeBinaryNode } from '../WABinary/encode.js';
import { getBinaryNodeChild, getAllBinaryNodeChildren } from '../WABinary/generic-utils.js';
import { jidDecode, jidEncode, jidNormalizedUser } from '../WABinary/jid-utils.js';
import { encodeWAMessage, unpadRandomMax16 } from '../Utils/generics.js';
import { parseAndInjectE2ESessions } from '../Utils/signal.js';
import { encodeSignedDeviceIdentity } from '../Utils/validate-connection.js';
import { proto } from '../../WAProto/index.js';
const S_WHATSAPP_NET = "@s.whatsapp.net";
const TC_TOKEN_REQUEST_TIMEOUT_MS = 3500;
const SESSION_CACHE_TTL_MS = 5 * 60000;
const ACK_TIMEOUT_MS = 15000;
const getNodeChildren = (node) => Array.isArray(node.content) ? node.content : [];
const setNodeChildren = (node, children) => {
    node.content = children.length ? children : undefined;
};
const replaceNodeChild = (node, tag, nextChild) => {
    const children = getNodeChildren(node);
    const index = children.findIndex((c) => c.tag === tag);
    if (index >= 0)
        children[index] = nextChild;
    else
        children.push(nextChild);
    setNodeChildren(node, children);
};
const removeNodeChildrenByTag = (node, tag) => {
    setNodeChildren(node, getNodeChildren(node).filter((c) => c.tag !== tag));
};
const parseCountAttr = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};
export class SignalingBridge {
    constructor(config) {
        _SignalingBridge_sock.set(this, void 0);
        _SignalingBridge_voip.set(this, null);
        _SignalingBridge_observedTcTokens.set(this, new Map());
        _SignalingBridge_pendingTcTokenWaiters.set(this, new Map());
        _SignalingBridge_ensuredSignalSessions.set(this, new Map());
        _SignalingBridge_remoteDevicePeerByCallId.set(this, new Map());
        _SignalingBridge_remoteObfuscatedPeerByCallId.set(this, new Map());
        _SignalingBridge_remoteXmppRoutePeerByCallId.set(this, new Map());
        _SignalingBridge_incomingCallPeerById.set(this, new Map());
        _SignalingBridge_outgoingSignalingQueue.set(this, Promise.resolve(undefined));
        _SignalingBridge_incomingSignalingQueue.set(this, Promise.resolve(undefined));
        this.attachEngine = (voip) => {
            __classPrivateFieldSet(this, _SignalingBridge_voip, voip, "f");
        };
        this.init = async () => {
            const originalKeysSet = __classPrivateFieldGet(this, _SignalingBridge_sock, "f").authState.keys.set.bind(__classPrivateFieldGet(this, _SignalingBridge_sock, "f").authState.keys);
            __classPrivateFieldGet(this, _SignalingBridge_sock, "f").authState.keys.set = async (data) => {
                const result = await originalKeysSet(data);
                for (const [jid, entry] of Object.entries(data?.tctoken ?? {})) {
                    if (entry?.token instanceof Uint8Array && entry.token.length > 0) {
                        __classPrivateFieldGet(this, _SignalingBridge_rememberTcToken, "f").call(this, jid, entry.token, entry.timestamp);
                    }
                }
                return result;
            };
        };
        this.sendSignaling = (peerJid, callId, xmlPayload) => {
            __classPrivateFieldSet(this, _SignalingBridge_outgoingSignalingQueue, __classPrivateFieldGet(this, _SignalingBridge_outgoingSignalingQueue, "f")
                .then(() => __classPrivateFieldGet(this, _SignalingBridge_doSendSignaling, "f").call(this, peerJid, callId, xmlPayload))
                .catch(() => { }), "f");
        };
        this.processIncomingCall = (node, voip, activeCallId) => {
            __classPrivateFieldSet(this, _SignalingBridge_incomingSignalingQueue, __classPrivateFieldGet(this, _SignalingBridge_incomingSignalingQueue, "f")
                .then(() => __classPrivateFieldGet(this, _SignalingBridge_doProcessIncomingCall, "f").call(this, node, voip, activeCallId))
                .catch(() => { }), "f");
        };
        this.processIncomingReceipt = (node, voip, activeCallId) => {
            __classPrivateFieldSet(this, _SignalingBridge_incomingSignalingQueue, __classPrivateFieldGet(this, _SignalingBridge_incomingSignalingQueue, "f")
                .then(() => __classPrivateFieldGet(this, _SignalingBridge_doProcessIncomingReceipt, "f").call(this, node, voip, activeCallId))
                .catch(() => { }), "f");
        };
        this.requestTcToken = async (jid) => {
            const userJid = __classPrivateFieldGet(this, _SignalingBridge_toBareJid, "f").call(this, jid);
            const cached = await __classPrivateFieldGet(this, _SignalingBridge_getTcToken, "f").call(this, userJid);
            if (cached?.length)
                return cached;
            try {
                const response = await __classPrivateFieldGet(this, _SignalingBridge_sock, "f").getPrivacyTokens([userJid]);
                const tokensNode = getBinaryNodeChild(response, "tokens") ??
                    getBinaryNodeChild(getBinaryNodeChild(response, "iq"), "tokens");
                const tokenNodes = tokensNode
                    ? getAllBinaryNodeChildren(tokensNode).filter((c) => c.tag === "token")
                    : [];
                for (const tokenNode of tokenNodes) {
                    const tokenJid = String(tokenNode.attrs.jid ?? "");
                    if (jidNormalizedUser(tokenJid) !== jidNormalizedUser(userJid))
                        continue;
                    const content = tokenNode.content;
                    if (content instanceof Uint8Array && content.length > 0) {
                        const token = Buffer.from(content);
                        await __classPrivateFieldGet(this, _SignalingBridge_sock, "f").authState.keys.set({
                            tctoken: { [userJid]: { token, timestamp: String(tokenNode.attrs.t ?? "") } },
                        });
                        return token;
                    }
                }
            }
            catch { }
            return __classPrivateFieldGet(this, _SignalingBridge_getTcToken, "f").call(this, userJid);
        };
        this.ensureTcToken = async (...jids) => {
            const uniqueJids = [
                ...new Set(jids.map((j) => __classPrivateFieldGet(this, _SignalingBridge_toBareJid, "f").call(this, String(j ?? "").trim())).filter(Boolean)),
            ];
            for (const jid of uniqueJids) {
                const cached = await __classPrivateFieldGet(this, _SignalingBridge_getTcToken, "f").call(this, jid);
                if (cached?.length)
                    return cached;
            }
            for (const jid of uniqueJids) {
                const fetched = await Promise.race([
                    this.requestTcToken(jid),
                    new Promise((r) => setTimeout(() => r(undefined), TC_TOKEN_REQUEST_TIMEOUT_MS)),
                ]);
                if (fetched?.length)
                    return fetched;
            }
            return undefined;
        };
        this.discoverPeerDevices = async (peerLidJid) => {
            const devices = await __classPrivateFieldGet(this, _SignalingBridge_sock, "f").getUSyncDevices([peerLidJid], true, false);
            return __classPrivateFieldGet(this, _SignalingBridge_normalizeStartCallPeerList, "f").call(this, devices.map((d) => d.jid).filter(Boolean));
        };
        this.ensureSessionsForPeers = async (jids) => {
            const targets = __classPrivateFieldGet(this, _SignalingBridge_expandSignalSessionTargets, "f").call(this, jids);
            if (targets.length)
                await __classPrivateFieldGet(this, _SignalingBridge_ensureSignalSessions, "f").call(this, targets, true);
        };
        this.resolveLid = async (pnJid) => __classPrivateFieldGet(this, _SignalingBridge_sock, "f").signalRepository.lidMapping?.getLIDForPN(pnJid);
        this.issueTcToken = async (jid) => {
            const userJid = __classPrivateFieldGet(this, _SignalingBridge_toBareJid, "f").call(this, jid);
            const issuedAt = Math.floor(Date.now() / 1000);
            try {
                await __classPrivateFieldGet(this, _SignalingBridge_sock, "f").query({
                    tag: "iq",
                    attrs: {
                        to: S_WHATSAPP_NET, type: "set", xmlns: "privacy",
                        id: __classPrivateFieldGet(this, _SignalingBridge_sock, "f").generateMessageTag(),
                    },
                    content: [{
                            tag: "tokens", attrs: {},
                            content: [{
                                    tag: "token",
                                    attrs: { jid: userJid, t: String(issuedAt), type: "trusted_contact" },
                                }],
                        }],
                });
                return true;
            }
            catch {
                return false;
            }
        };
        this.getRemoteDeviceJid = (callId) => __classPrivateFieldGet(this, _SignalingBridge_remoteDevicePeerByCallId, "f").get(callId);
        _SignalingBridge_doSendSignaling.set(this, async (peerJid, callId, xmlPayload) => {
            const rawPayload = Buffer.from(xmlPayload);
            let voipNode;
            try {
                voipNode = await decodeBinaryNode(Buffer.concat([Buffer.from([0]), rawPayload]));
            }
            catch {
                voipNode = await decodeBinaryNode(rawPayload);
            }
            const signalingTag = String(voipNode.tag);
            const effectivePeerJid = __classPrivateFieldGet(this, _SignalingBridge_resolveOutboundPeerJid, "f").call(this, callId, peerJid);
            if (signalingTag === "offer" && !voipNode.attrs["call-creator"]) {
                const selfLid = __classPrivateFieldGet(this, _SignalingBridge_sock, "f").authState.creds.me?.lid;
                if (selfLid)
                    voipNode.attrs["call-creator"] = selfLid;
            }
            const destination = getBinaryNodeChild(voipNode, "destination");
            if (destination) {
                const destinations = getNodeChildren(destination);
                const destinationJids = destinations
                    .map((n) => String(n.attrs.jid ?? "").trim())
                    .filter(Boolean);
                const sessionTargets = __classPrivateFieldGet(this, _SignalingBridge_expandSignalSessionTargets, "f").call(this, destinationJids);
                if (sessionTargets.length)
                    await __classPrivateFieldGet(this, _SignalingBridge_ensureSignalSessions, "f").call(this, sessionTargets, signalingTag === "offer");
                const rootEnc = getBinaryNodeChild(voipNode, "enc");
                const encCount = parseCountAttr(rootEnc?.attrs.count);
                let includeDeviceIdentity = false;
                for (const destNode of destinations) {
                    const targetJid = String(destNode.attrs.jid ?? "").trim();
                    const destEnc = getBinaryNodeChild(destNode, "enc");
                    if (!targetJid || !destEnc || !(destEnc.content instanceof Uint8Array))
                        continue;
                    try {
                        const encrypted = await __classPrivateFieldGet(this, _SignalingBridge_encryptCallKey, "f").call(this, targetJid, destEnc.content, encCount);
                        includeDeviceIdentity = includeDeviceIdentity || encrypted.shouldIncludeDeviceIdentity;
                        setNodeChildren(destNode, [encrypted.encNode]);
                    }
                    catch {
                        for (const d of destinations)
                            removeNodeChildrenByTag(d, "enc");
                        break;
                    }
                }
                if (includeDeviceIdentity)
                    __classPrivateFieldGet(this, _SignalingBridge_appendDeviceIdentity, "f").call(this, voipNode);
                await __classPrivateFieldGet(this, _SignalingBridge_sendCallStanza, "f").call(this, __classPrivateFieldGet(this, _SignalingBridge_toBareJid, "f").call(this, peerJid), voipNode, signalingTag, effectivePeerJid, peerJid);
                return;
            }
            if (signalingTag === "offer" || signalingTag === "enc_rekey") {
                const enc = getBinaryNodeChild(voipNode, "enc");
                if (enc && enc.content instanceof Uint8Array) {
                    const targetJid = __classPrivateFieldGet(this, _SignalingBridge_toCallDeviceJid, "f").call(this, effectivePeerJid);
                    const encrypted = await __classPrivateFieldGet(this, _SignalingBridge_encryptCallKey, "f").call(this, targetJid, enc.content, parseCountAttr(enc.attrs.count));
                    replaceNodeChild(voipNode, "enc", encrypted.encNode);
                    if (encrypted.shouldIncludeDeviceIdentity)
                        __classPrivateFieldGet(this, _SignalingBridge_appendDeviceIdentity, "f").call(this, voipNode);
                    await __classPrivateFieldGet(this, _SignalingBridge_sendCallStanza, "f").call(this, targetJid, voipNode, signalingTag, effectivePeerJid, peerJid);
                    return;
                }
            }
            const routeTo = signalingTag !== "offer" && signalingTag !== "enc_rekey"
                ? __classPrivateFieldGet(this, _SignalingBridge_toBareJid, "f").call(this, effectivePeerJid)
                : __classPrivateFieldGet(this, _SignalingBridge_toCallDeviceJid, "f").call(this, effectivePeerJid);
            await __classPrivateFieldGet(this, _SignalingBridge_sendCallStanza, "f").call(this, routeTo, voipNode, signalingTag, effectivePeerJid, peerJid);
        });
        _SignalingBridge_sendCallStanza.set(this, async (routeTo, voipNode, signalingTag, effectivePeerJid, callbackPeerJid) => {
            const stanzaId = __classPrivateFieldGet(this, _SignalingBridge_sock, "f").generateMessageTag();
            await __classPrivateFieldGet(this, _SignalingBridge_sock, "f").sendNode({
                tag: "call",
                attrs: { to: routeTo, id: stanzaId },
                content: [voipNode],
            });
            void (async () => {
                try {
                    const ackNode = await __classPrivateFieldGet(this, _SignalingBridge_sock, "f").waitForMessage(stanzaId, ACK_TIMEOUT_MS);
                    if (!ackNode || !__classPrivateFieldGet(this, _SignalingBridge_voip, "f"))
                        return;
                    const ackPayload = Buffer.from(encodeBinaryNode(ackNode)).toString("base64");
                    const tcToken = await this.ensureTcToken(effectivePeerJid, callbackPeerJid);
                    try {
                        __classPrivateFieldGet(this, _SignalingBridge_voip, "f").handleSignalingAck({
                            payload: ackPayload,
                            ackError: ackNode.attrs?.error ?? "0",
                            msgType: ackNode.attrs?.type ?? signalingTag,
                            peerJid: effectivePeerJid,
                            extraData: tcToken,
                        });
                    }
                    catch { }
                }
                catch { }
            })();
        });
        _SignalingBridge_doProcessIncomingCall.set(this, async (node, voip, activeCallId) => {
            const voipChild = getAllBinaryNodeChildren(node)[0];
            if (!voipChild)
                return;
            const incomingCallId = String(voipChild.attrs["call-id"] ?? voipChild.attrs.call_id ?? "");
            const normalizedIncomingId = incomingCallId.toUpperCase();
            const normalizedActiveId = String(activeCallId ?? "").toUpperCase();
            const callIdForRouting = normalizedIncomingId || normalizedActiveId;
            if (normalizedActiveId && normalizedIncomingId && normalizedIncomingId !== normalizedActiveId)
                return;
            const senderDeviceJid = String(voipChild.attrs.participant ?? "") ||
                String(node.attrs.participant ?? "") ||
                String(node.attrs.from ?? "") ||
                String(voipChild.attrs["call-creator"] ?? "");
            const callbackPeerJid = String(node.attrs.from ?? "") || senderDeviceJid;
            const platform = voipChild.attrs.platform ?? node.attrs.platform ?? "";
            const appVersion = voipChild.attrs.version ?? node.attrs.version ?? "";
            const epochId = voipChild.attrs.e ?? node.attrs.e ?? "0";
            const timestamp = voipChild.attrs.t ?? node.attrs.t ?? "0";
            const offline = !!(voipChild.attrs.offline ?? node.attrs.offline);
            let usableNode = voipChild;
            if (getBinaryNodeChild(voipChild, "enc")) {
                usableNode = await __classPrivateFieldGet(this, _SignalingBridge_maybeDecryptEnc, "f").call(this, voipChild, senderDeviceJid);
            }
            const b64 = Buffer.from(encodeBinaryNode(usableNode)).toString("base64");
            const storedPeerJid = callIdForRouting ? __classPrivateFieldGet(this, _SignalingBridge_incomingCallPeerById, "f").get(callIdForRouting) : undefined;
            let mappedRemoteDeviceJid = callIdForRouting ? __classPrivateFieldGet(this, _SignalingBridge_remoteDevicePeerByCallId, "f").get(callIdForRouting) : undefined;
            if (callIdForRouting && (callbackPeerJid || senderDeviceJid)) {
                __classPrivateFieldGet(this, _SignalingBridge_remoteXmppRoutePeerByCallId, "f").set(callIdForRouting, callbackPeerJid || senderDeviceJid);
                const hinted = __classPrivateFieldGet(this, _SignalingBridge_pickConcreteRouteHint, "f").call(this, senderDeviceJid, callbackPeerJid);
                if (hinted && hinted !== mappedRemoteDeviceJid) {
                    mappedRemoteDeviceJid = hinted;
                    __classPrivateFieldGet(this, _SignalingBridge_remoteDevicePeerByCallId, "f").set(callIdForRouting, hinted);
                }
            }
            const routedPeerJid = usableNode.tag === "offer"
                ? __classPrivateFieldGet(this, _SignalingBridge_preferDeviceRouteJid, "f").call(this, senderDeviceJid, callbackPeerJid, storedPeerJid)
                : __classPrivateFieldGet(this, _SignalingBridge_preferOrderedRouteJid, "f").call(this, mappedRemoteDeviceJid, storedPeerJid, senderDeviceJid, callbackPeerJid);
            if (callIdForRouting && routedPeerJid) {
                __classPrivateFieldGet(this, _SignalingBridge_incomingCallPeerById, "f").set(callIdForRouting, routedPeerJid);
            }
            const tcToken = await this.ensureTcToken(routedPeerJid, callbackPeerJid);
            switch (usableNode.tag) {
                case "offer":
                    voip.handleSignalingOffer({
                        payload: b64,
                        peerPlatform: Number(platform || 0),
                        peerAppVersion: appVersion,
                        epochId, timestamp,
                        isOffline: offline,
                        isOfferNotContact: false,
                        peerJid: routedPeerJid,
                        tcToken,
                    });
                    break;
                case "ack":
                    voip.handleSignalingAck({
                        payload: b64,
                        ackError: usableNode.attrs.error ?? "0",
                        msgType: usableNode.attrs.type ?? "",
                        peerJid: routedPeerJid,
                        extraData: tcToken,
                    });
                    break;
                default:
                    voip.handleSignalingMessage({
                        payload: b64,
                        peerPlatform: platform,
                        peerAppVersion: appVersion,
                        epochId, timestamp,
                        isOffline: offline,
                        peerJid: routedPeerJid,
                        tcToken,
                    });
                    if (callIdForRouting && (usableNode.tag === "terminate" || usableNode.tag === "reject")) {
                        __classPrivateFieldGet(this, _SignalingBridge_incomingCallPeerById, "f").delete(callIdForRouting);
                        __classPrivateFieldGet(this, _SignalingBridge_remoteDevicePeerByCallId, "f").delete(callIdForRouting);
                        __classPrivateFieldGet(this, _SignalingBridge_remoteObfuscatedPeerByCallId, "f").delete(callIdForRouting);
                        __classPrivateFieldGet(this, _SignalingBridge_remoteXmppRoutePeerByCallId, "f").delete(callIdForRouting);
                    }
                    break;
            }
        });
        _SignalingBridge_doProcessIncomingReceipt.set(this, async (node, voip, activeCallId) => {
            const receiptChild = getAllBinaryNodeChildren(node)[0];
            if (!receiptChild)
                return;
            const incomingCallId = String(receiptChild.attrs["call-id"] ?? receiptChild.attrs.call_id ?? "");
            const normalizedIncomingId = incomingCallId.toUpperCase();
            const normalizedActiveId = String(activeCallId ?? "").toUpperCase();
            const callIdForRouting = normalizedIncomingId || normalizedActiveId;
            if (normalizedActiveId && normalizedIncomingId && normalizedIncomingId !== normalizedActiveId)
                return;
            const callbackPeerJid = String(node.attrs.from ?? receiptChild.attrs["call-creator"] ?? "");
            const storedPeerJid = callIdForRouting ? __classPrivateFieldGet(this, _SignalingBridge_incomingCallPeerById, "f").get(callIdForRouting) : undefined;
            const routedPeerJid = __classPrivateFieldGet(this, _SignalingBridge_preferOrderedRouteJid, "f").call(this, storedPeerJid, callbackPeerJid);
            if (callIdForRouting && routedPeerJid)
                __classPrivateFieldGet(this, _SignalingBridge_incomingCallPeerById, "f").set(callIdForRouting, routedPeerJid);
            const tcToken = await this.ensureTcToken(routedPeerJid, callbackPeerJid);
            voip.handleSignalingReceipt({
                payload: Buffer.from(encodeBinaryNode(node)).toString("base64"),
                peerJid: routedPeerJid,
                tcToken,
            });
        });
        _SignalingBridge_maybeDecryptEnc.set(this, async (voipNode, peerJid) => {
            const enc = getBinaryNodeChild(voipNode, "enc");
            if (!enc || !(enc.content instanceof Uint8Array))
                return voipNode;
            const type = enc.attrs.type;
            if (type !== "pkmsg" && type !== "msg")
                return voipNode;
            const candidates = [...new Set([
                    peerJid,
                    __classPrivateFieldGet(this, _SignalingBridge_toCallDeviceJid, "f").call(this, peerJid),
                ].filter(Boolean))];
            let lastErr;
            for (const jid of candidates) {
                try {
                    const decrypted = await __classPrivateFieldGet(this, _SignalingBridge_sock, "f").signalRepository.decryptMessage({
                        jid, type, ciphertext: enc.content,
                    });
                    const parsed = proto.Message.decode(unpadRandomMax16(decrypted));
                    const callKey = parsed.call?.callKey;
                    if (!callKey || callKey.length === 0) {
                        throw new Error("decrypted signaling has no call.callKey");
                    }
                    enc.content = callKey;
                    return voipNode;
                }
                catch (err) {
                    lastErr = err;
                }
            }
            throw lastErr;
        });
        _SignalingBridge_encryptCallKey.set(this, async (targetJid, rawCallKey, count) => {
            const primaryDeviceJid = __classPrivateFieldGet(this, _SignalingBridge_toPrimaryDeviceJid, "f").call(this, targetJid);
            const sessionTargets = primaryDeviceJid && primaryDeviceJid !== targetJid
                ? [primaryDeviceJid, targetJid]
                : [targetJid];
            await __classPrivateFieldGet(this, _SignalingBridge_ensureSignalSessions, "f").call(this, sessionTargets, false);
            const { type, ciphertext } = await __classPrivateFieldGet(this, _SignalingBridge_sock, "f").signalRepository.encryptMessage({
                jid: targetJid,
                data: encodeWAMessage({ call: { callKey: Buffer.from(rawCallKey) } }),
            });
            return {
                encNode: {
                    tag: "enc",
                    attrs: { v: "2", type, count: String(count) },
                    content: Buffer.from(ciphertext),
                },
                shouldIncludeDeviceIdentity: type === "pkmsg",
            };
        });
        _SignalingBridge_ensureSignalSessions.set(this, async (jids, refresh) => {
            const missing = [];
            for (const jid of [...new Set(jids.filter(Boolean))]) {
                const signalId = __classPrivateFieldGet(this, _SignalingBridge_sock, "f").signalRepository.jidToSignalProtocolAddress(jid);
                const cachedAt = __classPrivateFieldGet(this, _SignalingBridge_ensuredSignalSessions, "f").get(signalId);
                if (!refresh && cachedAt && Date.now() - cachedAt < SESSION_CACHE_TTL_MS)
                    continue;
                if (!refresh) {
                    const validation = await __classPrivateFieldGet(this, _SignalingBridge_sock, "f").signalRepository.validateSession(jid);
                    if (validation.exists) {
                        __classPrivateFieldGet(this, _SignalingBridge_ensuredSignalSessions, "f").set(signalId, Date.now());
                        continue;
                    }
                }
                missing.push(jid);
            }
            if (!missing.length)
                return;
            const sessionNode = await __classPrivateFieldGet(this, _SignalingBridge_sock, "f").query({
                tag: "iq",
                attrs: { xmlns: "encrypt", type: "get", to: S_WHATSAPP_NET },
                content: [{
                        tag: "key", attrs: {},
                        content: missing.map((jid) => ({ tag: "user", attrs: { jid } })),
                    }],
            });
            await parseAndInjectE2ESessions(sessionNode, __classPrivateFieldGet(this, _SignalingBridge_sock, "f").signalRepository);
            for (const jid of missing) {
                __classPrivateFieldGet(this, _SignalingBridge_ensuredSignalSessions, "f").set(__classPrivateFieldGet(this, _SignalingBridge_sock, "f").signalRepository.jidToSignalProtocolAddress(jid), Date.now());
            }
        });
        _SignalingBridge_appendDeviceIdentity.set(this, (voipNode) => {
            if (getBinaryNodeChild(voipNode, "device-identity"))
                return;
            const account = __classPrivateFieldGet(this, _SignalingBridge_sock, "f").authState.creds.account;
            if (!account)
                return;
            const children = getNodeChildren(voipNode);
            children.push({
                tag: "device-identity",
                attrs: {},
                content: encodeSignedDeviceIdentity(account, true),
            });
            setNodeChildren(voipNode, children);
        });
        _SignalingBridge_toBareJid.set(this, (jid) => {
            const decoded = jidDecode(jid);
            if (!decoded?.user)
                return jid;
            const server = jid.endsWith("@lid") ? "lid" : "s.whatsapp.net";
            return jidEncode(decoded.user, server);
        });
        _SignalingBridge_toCallDeviceJid.set(this, (jid) => {
            const decoded = jidDecode(jid);
            if (!decoded?.user)
                return jid;
            const server = jid.endsWith("@lid") ? "lid" : "s.whatsapp.net";
            if (decoded.device == null)
                return jidEncode(decoded.user, server);
            return `${decoded.user}:${decoded.device}@${server}`;
        });
        _SignalingBridge_toPrimaryDeviceJid.set(this, (jid) => {
            const decoded = jidDecode(jid);
            if (!decoded?.user)
                return undefined;
            const device = decoded.device;
            if (device == null || device === 0)
                return undefined;
            const server = jid.endsWith("@lid") ? "lid" : "s.whatsapp.net";
            return jidEncode(decoded.user, server);
        });
        _SignalingBridge_hasConcreteDevice.set(this, (jid) => {
            const decoded = jidDecode(jid);
            return !!decoded?.user && decoded.device != null;
        });
        _SignalingBridge_preferDeviceRouteJid.set(this, (...candidates) => {
            for (const c of candidates) {
                const jid = String(c ?? "").trim();
                if (jid && __classPrivateFieldGet(this, _SignalingBridge_hasConcreteDevice, "f").call(this, jid))
                    return jid;
            }
            for (const c of candidates) {
                const jid = String(c ?? "").trim();
                if (jid)
                    return __classPrivateFieldGet(this, _SignalingBridge_toCallDeviceJid, "f").call(this, jid);
            }
            return "";
        });
        _SignalingBridge_preferOrderedRouteJid.set(this, (...candidates) => {
            for (const c of candidates) {
                const jid = String(c ?? "").trim();
                if (jid)
                    return __classPrivateFieldGet(this, _SignalingBridge_toCallDeviceJid, "f").call(this, jid);
            }
            return "";
        });
        _SignalingBridge_pickConcreteRouteHint.set(this, (...candidates) => {
            for (const c of candidates) {
                const jid = String(c ?? "").trim();
                if (jid && __classPrivateFieldGet(this, _SignalingBridge_hasConcreteDevice, "f").call(this, jid))
                    return jid;
            }
            return "";
        });
        _SignalingBridge_resolveOutboundPeerJid.set(this, (callId, wasmPeerJid) => {
            const peerJid = String(wasmPeerJid ?? "").trim();
            if (!peerJid || !callId)
                return peerJid;
            const normalizedCallId = String(callId).toUpperCase();
            return __classPrivateFieldGet(this, _SignalingBridge_remoteDevicePeerByCallId, "f").get(normalizedCallId) ?? __classPrivateFieldGet(this, _SignalingBridge_remoteDevicePeerByCallId, "f").get(callId) ?? peerJid;
        });
        _SignalingBridge_expandSignalSessionTargets.set(this, (jids) => [...new Set(jids.flatMap((jid) => {
                const primary = __classPrivateFieldGet(this, _SignalingBridge_toPrimaryDeviceJid, "f").call(this, jid);
                return primary && primary !== jid ? [primary, jid] : [jid];
            }))]);
        _SignalingBridge_normalizeStartCallPeerList.set(this, (jids) => {
            const result = new Set();
            for (const jid of jids) {
                const decoded = jidDecode(jid);
                if (!decoded?.user) {
                    result.add(jid);
                    continue;
                }
                const server = jid.endsWith("@lid") ? "lid" : "s.whatsapp.net";
                result.add(jidEncode(decoded.user, server));
                if (decoded.device != null) {
                    result.add(`${decoded.user}:${decoded.device}@${server}`);
                }
            }
            return [...result].slice(0, 5);
        });
        _SignalingBridge_rememberTcToken.set(this, (jid, token, timestamp = "") => {
            const bareJid = __classPrivateFieldGet(this, _SignalingBridge_toBareJid, "f").call(this, jid);
            if (!token.length)
                return;
            __classPrivateFieldGet(this, _SignalingBridge_observedTcTokens, "f").set(bareJid, { token: Buffer.from(token), timestamp });
            const waiters = __classPrivateFieldGet(this, _SignalingBridge_pendingTcTokenWaiters, "f").get(bareJid);
            if (waiters?.length) {
                __classPrivateFieldGet(this, _SignalingBridge_pendingTcTokenWaiters, "f").delete(bareJid);
                for (const w of waiters)
                    w(Buffer.from(token));
            }
        });
        _SignalingBridge_getTcToken.set(this, async (jid) => {
            const userJid = __classPrivateFieldGet(this, _SignalingBridge_toBareJid, "f").call(this, jid);
            const observed = __classPrivateFieldGet(this, _SignalingBridge_observedTcTokens, "f").get(userJid)?.token;
            if (observed?.length)
                return Buffer.from(observed);
            try {
                const data = await __classPrivateFieldGet(this, _SignalingBridge_sock, "f").authState.keys.get("tctoken", [userJid]);
                const token = data[userJid]?.token;
                if (token && token.length > 0) {
                    __classPrivateFieldGet(this, _SignalingBridge_rememberTcToken, "f").call(this, userJid, token, data[userJid]?.timestamp);
                    return token;
                }
            }
            catch { }
            return undefined;
        });
        __classPrivateFieldSet(this, _SignalingBridge_sock, config.sock, "f");
    }
}
_SignalingBridge_sock = new WeakMap(), _SignalingBridge_voip = new WeakMap(), _SignalingBridge_observedTcTokens = new WeakMap(), _SignalingBridge_pendingTcTokenWaiters = new WeakMap(), _SignalingBridge_ensuredSignalSessions = new WeakMap(), _SignalingBridge_remoteDevicePeerByCallId = new WeakMap(), _SignalingBridge_remoteObfuscatedPeerByCallId = new WeakMap(), _SignalingBridge_remoteXmppRoutePeerByCallId = new WeakMap(), _SignalingBridge_incomingCallPeerById = new WeakMap(), _SignalingBridge_outgoingSignalingQueue = new WeakMap(), _SignalingBridge_incomingSignalingQueue = new WeakMap(), _SignalingBridge_doSendSignaling = new WeakMap(), _SignalingBridge_sendCallStanza = new WeakMap(), _SignalingBridge_doProcessIncomingCall = new WeakMap(), _SignalingBridge_doProcessIncomingReceipt = new WeakMap(), _SignalingBridge_maybeDecryptEnc = new WeakMap(), _SignalingBridge_encryptCallKey = new WeakMap(), _SignalingBridge_ensureSignalSessions = new WeakMap(), _SignalingBridge_appendDeviceIdentity = new WeakMap(), _SignalingBridge_toBareJid = new WeakMap(), _SignalingBridge_toCallDeviceJid = new WeakMap(), _SignalingBridge_toPrimaryDeviceJid = new WeakMap(), _SignalingBridge_hasConcreteDevice = new WeakMap(), _SignalingBridge_preferDeviceRouteJid = new WeakMap(), _SignalingBridge_preferOrderedRouteJid = new WeakMap(), _SignalingBridge_pickConcreteRouteHint = new WeakMap(), _SignalingBridge_resolveOutboundPeerJid = new WeakMap(), _SignalingBridge_expandSignalSessionTargets = new WeakMap(), _SignalingBridge_normalizeStartCallPeerList = new WeakMap(), _SignalingBridge_rememberTcToken = new WeakMap(), _SignalingBridge_getTcToken = new WeakMap();
//# sourceMappingURL=signaling.js.map