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
var _ActiveCall_state, _ActiveCall_endResolver, _ActiveCall_endPromise, _ActiveCall_endTimer, _ActiveCall_ended, _ActiveCall_hasBeenActive, _VoipClient_config, _VoipClient_engine, _VoipClient_relay, _VoipClient_signaling, _VoipClient_sock, _VoipClient_activeCall, _VoipClient_capturePtr, _VoipClient_captureChunkBytes, _VoipClient_captureSampleRate, _VoipClient_captureChannels, _VoipClient_captureFramesPerChunk, _VoipClient_feeder, _VoipClient_initVoipStack, _VoipClient_handleCallEvent, _VoipClient_handleAudioCaptureInit, _VoipClient_handleAudioCaptureStart, _VoipClient_handleAudioCaptureStop;
import { EventEmitter } from "node:events";
import { randomBytes, createHmac } from "node:crypto";
import { WasmEngine } from "./wasm-engine.js";
import { RelayRtcTransport } from "./relay-transport.js";
import { SignalingBridge } from "./signaling.js";
import { AudioFeeder } from "./audio-feeder.js";
import { CallState } from "./types.js";
export { CallState } from "./types.js";
const SHA256_LEN = 32;
const toBareJid = (jid) => {
    if (!jid)
        return jid;
    const at = jid.indexOf("@");
    if (at < 0)
        return jid;
    const user = jid.slice(0, at).split(":")[0];
    return `${user}@${jid.slice(at + 1)}`;
};
const computeHkdf = (key, salt, info, length) => {
    const effectiveSalt = salt && salt.length > 0 ? Buffer.from(salt) : Buffer.alloc(SHA256_LEN, 0);
    const prk = createHmac("sha256", effectiveSalt).update(key).digest();
    const blocks = Math.ceil(length / SHA256_LEN);
    const okm = Buffer.alloc(blocks * SHA256_LEN);
    let prev = Buffer.alloc(0);
    for (let i = 1; i <= blocks; i += 1) {
        prev = createHmac("sha256", prk)
            .update(prev)
            .update(info)
            .update(Buffer.from([i]))
            .digest();
        prev.copy(okm, (i - 1) * SHA256_LEN);
    }
    return new Uint8Array(okm.buffer, okm.byteOffset, length);
};
const computeHmacSha256 = (data, key) => {
    const result = createHmac("sha256", Buffer.from(key)).update(data).digest();
    return new Uint8Array(result.buffer, result.byteOffset, result.byteLength);
};
const isCallReceiptNode = (node) => {
    if (node?.tag !== "receipt")
        return false;
    const child = Array.isArray(node.content) ? node.content[0] : null;
    return !!(child?.attrs?.["call-id"] || child?.attrs?.call_id);
};
export class ActiveCall extends EventEmitter {
    constructor(callId, engine, durationMs) {
        super();
        _ActiveCall_state.set(this, CallState.Idle);
        _ActiveCall_endResolver.set(this, void 0);
        _ActiveCall_endPromise.set(this, void 0);
        _ActiveCall_endTimer.set(this, null);
        _ActiveCall_ended.set(this, false);
        _ActiveCall_hasBeenActive.set(this, false);
        this._audioSource = "silence";
        this.end = () => {
            if (__classPrivateFieldGet(this, _ActiveCall_ended, "f"))
                return;
            __classPrivateFieldSet(this, _ActiveCall_ended, true, "f");
            if (__classPrivateFieldGet(this, _ActiveCall_endTimer, "f")) {
                clearTimeout(__classPrivateFieldGet(this, _ActiveCall_endTimer, "f"));
                __classPrivateFieldSet(this, _ActiveCall_endTimer, null, "f");
            }
            try {
                this.engine.endCall(0, true);
            }
            catch { }
        };
        this.mute = (muted) => {
            try {
                this.engine.setMute(muted);
            }
            catch { }
        };
        this.waitForEnd = () => __classPrivateFieldGet(this, _ActiveCall_endPromise, "f");
        this._updateState = (state) => {
            __classPrivateFieldSet(this, _ActiveCall_state, state, "f");
            if (state === CallState.Calling || state === CallState.PreacceptReceived || state === CallState.Active) {
                __classPrivateFieldSet(this, _ActiveCall_hasBeenActive, true, "f");
            }
            if (state === CallState.PreacceptReceived)
                this.emit("ringing");
            else if (state === CallState.Active)
                this.emit("connected");
            else if (__classPrivateFieldGet(this, _ActiveCall_hasBeenActive, "f") && (state === CallState.Idle || state === CallState.Ending)) {
                this._forceEnd("ended");
            }
        };
        this._emitAudio = (pcm) => { this.emit("audio", pcm); };
        this._forceEnd = (reason) => {
            if (__classPrivateFieldGet(this, _ActiveCall_ended, "f"))
                return;
            __classPrivateFieldSet(this, _ActiveCall_ended, true, "f");
            if (__classPrivateFieldGet(this, _ActiveCall_endTimer, "f")) {
                clearTimeout(__classPrivateFieldGet(this, _ActiveCall_endTimer, "f"));
                __classPrivateFieldSet(this, _ActiveCall_endTimer, null, "f");
            }
            this.emit("ended", reason);
            __classPrivateFieldGet(this, _ActiveCall_endResolver, "f").call(this, reason);
        };
        this.callId = callId;
        this.engine = engine;
        __classPrivateFieldSet(this, _ActiveCall_endPromise, new Promise((res) => { __classPrivateFieldSet(this, _ActiveCall_endResolver, res, "f"); }), "f");
        if (durationMs > 0) {
            __classPrivateFieldSet(this, _ActiveCall_endTimer, setTimeout(() => this.end(), durationMs), "f");
        }
    }
    get state() { return __classPrivateFieldGet(this, _ActiveCall_state, "f"); }
}
_ActiveCall_state = new WeakMap(), _ActiveCall_endResolver = new WeakMap(), _ActiveCall_endPromise = new WeakMap(), _ActiveCall_endTimer = new WeakMap(), _ActiveCall_ended = new WeakMap(), _ActiveCall_hasBeenActive = new WeakMap();
export class VoipClient {
    constructor(config = {}) {
        _VoipClient_config.set(this, void 0);
        _VoipClient_engine.set(this, null);
        _VoipClient_relay.set(this, null);
        _VoipClient_signaling.set(this, null);
        _VoipClient_sock.set(this, null);
        _VoipClient_activeCall.set(this, null);
        _VoipClient_capturePtr.set(this, 0);
        _VoipClient_captureChunkBytes.set(this, 0);
        _VoipClient_captureSampleRate.set(this, 16000);
        _VoipClient_captureChannels.set(this, 1);
        _VoipClient_captureFramesPerChunk.set(this, 320);
        _VoipClient_feeder.set(this, null);
        this.connectWithSocket = async (existingSock) => {
            __classPrivateFieldSet(this, _VoipClient_sock, existingSock, "f");
            await __classPrivateFieldGet(this, _VoipClient_initVoipStack, "f").call(this);
        };
        _VoipClient_initVoipStack.set(this, async () => {
            __classPrivateFieldSet(this, _VoipClient_signaling, new SignalingBridge({ sock: __classPrivateFieldGet(this, _VoipClient_sock, "f") }), "f");
            await __classPrivateFieldGet(this, _VoipClient_signaling, "f").init();
            __classPrivateFieldSet(this, _VoipClient_relay, new RelayRtcTransport({
                onTransportMessage: (data, ip, port) => __classPrivateFieldGet(this, _VoipClient_engine, "f")?.handleOnTransportMessage(data, ip, port),
                onIceRtt: (rttMs, ip, port) => __classPrivateFieldGet(this, _VoipClient_engine, "f")?.updateIceRtt(rttMs, ip, port),
            }), "f");
            __classPrivateFieldSet(this, _VoipClient_engine, new WasmEngine({
                resourcesPath: __classPrivateFieldGet(this, _VoipClient_config, "f").resourcesPath,
                callbacks: {
                    onSignalingXmpp: (peerJid, callId, xmlPayload) => __classPrivateFieldGet(this, _VoipClient_signaling, "f").sendSignaling(peerJid, callId, xmlPayload),
                    onCallEvent: (eventType, eventData) => __classPrivateFieldGet(this, _VoipClient_handleCallEvent, "f").call(this, eventType, eventData),
                    sendDataToRelay: (data, ip, port) => __classPrivateFieldGet(this, _VoipClient_relay, "f").send(data, ip, port),
                    onAudioCaptureInit: (config) => __classPrivateFieldGet(this, _VoipClient_handleAudioCaptureInit, "f").call(this, config),
                    onAudioCaptureStart: () => __classPrivateFieldGet(this, _VoipClient_handleAudioCaptureStart, "f").call(this),
                    onAudioCaptureStop: () => __classPrivateFieldGet(this, _VoipClient_handleAudioCaptureStop, "f").call(this),
                    onAudioPlaybackData: (audioData) => __classPrivateFieldGet(this, _VoipClient_activeCall, "f")?._emitAudio(audioData),
                    cryptoHkdf: computeHkdf,
                    hmacSha256: computeHmacSha256,
                },
            }), "f");
            await __classPrivateFieldGet(this, _VoipClient_engine, "f").initialize();
            __classPrivateFieldGet(this, _VoipClient_signaling, "f").attachEngine(__classPrivateFieldGet(this, _VoipClient_engine, "f"));
            const selfPnJid = __classPrivateFieldGet(this, _VoipClient_sock, "f").authState.creds.me?.id;
            const selfLidJid = __classPrivateFieldGet(this, _VoipClient_sock, "f").authState.creds.me?.lid;
            __classPrivateFieldGet(this, _VoipClient_engine, "f").initVoipStack(selfPnJid, toBareJid(selfPnJid), selfLidJid);
            await __classPrivateFieldGet(this, _VoipClient_engine, "f").waitForVoipStackReady();
            try {
                __classPrivateFieldGet(this, _VoipClient_engine, "f").updateNetworkMedium(2, 0);
            }
            catch { }
            __classPrivateFieldGet(this, _VoipClient_sock, "f").ws.on("CB:call", (node) => {
                __classPrivateFieldGet(this, _VoipClient_signaling, "f").processIncomingCall(node, __classPrivateFieldGet(this, _VoipClient_engine, "f"), __classPrivateFieldGet(this, _VoipClient_activeCall, "f")?.callId ?? "");
            });
            __classPrivateFieldGet(this, _VoipClient_sock, "f").ws.on("CB:receipt", (node) => {
                if (!isCallReceiptNode(node))
                    return;
                __classPrivateFieldGet(this, _VoipClient_signaling, "f").processIncomingReceipt(node, __classPrivateFieldGet(this, _VoipClient_engine, "f"), __classPrivateFieldGet(this, _VoipClient_activeCall, "f")?.callId ?? "");
            });
        });
        this.call = async (phoneNumber, opts = {}) => {
            if (!__classPrivateFieldGet(this, _VoipClient_engine, "f") || !__classPrivateFieldGet(this, _VoipClient_signaling, "f"))
                throw new Error("Not connected. Call connectWithSocket() first.");
            if (__classPrivateFieldGet(this, _VoipClient_activeCall, "f"))
                throw new Error("A call is already active.");
            const targetNumber = phoneNumber.replace(/\D/g, "");
            const targetPnJid = `${targetNumber}@s.whatsapp.net`;
            const durationMs = opts.durationMs ?? 120000;
            const audioSource = opts.audioSource ?? "silence";
            const peerLid = await __classPrivateFieldGet(this, _VoipClient_signaling, "f").resolveLid(targetPnJid);
            if (!peerLid)
                throw new Error(`Could not resolve LID for ${targetPnJid}`);
            for (const jid of [targetPnJid, peerLid]) {
                try {
                    await __classPrivateFieldGet(this, _VoipClient_sock, "f").presenceSubscribe(jid);
                }
                catch { }
            }
            await new Promise((r) => setTimeout(r, 750));
            const peerDeviceJids = await __classPrivateFieldGet(this, _VoipClient_signaling, "f").discoverPeerDevices(peerLid);
            const deviceList = peerDeviceJids.length ? peerDeviceJids : [toBareJid(peerLid)];
            const allSessionTargets = [...new Set([...deviceList, peerLid, toBareJid(peerLid), targetPnJid, toBareJid(targetPnJid)])];
            await __classPrivateFieldGet(this, _VoipClient_signaling, "f").ensureSessionsForPeers(allSessionTargets);
            await new Promise((r) => setTimeout(r, 500));
            await __classPrivateFieldGet(this, _VoipClient_signaling, "f").issueTcToken(peerLid);
            const tcToken = await __classPrivateFieldGet(this, _VoipClient_signaling, "f").ensureTcToken(peerLid, targetPnJid);
            const callId = ("00" + randomBytes(16).toString("hex").slice(2)).toUpperCase();
            const call = new ActiveCall(callId, __classPrivateFieldGet(this, _VoipClient_engine, "f"), durationMs);
            call._audioSource = audioSource;
            __classPrivateFieldSet(this, _VoipClient_activeCall, call, "f");
            __classPrivateFieldGet(this, _VoipClient_engine, "f").startCall({
                peerJid: peerLid,
                peerPn: targetPnJid,
                peerList: deviceList,
                callId,
                isVideo: false,
                isLidCall: true,
                isFromDialer: false,
                extraData: tcToken,
            });
            return call;
        };
        this.disconnect = () => {
            __classPrivateFieldGet(this, _VoipClient_activeCall, "f")?._forceEnd("disconnect");
            __classPrivateFieldSet(this, _VoipClient_activeCall, null, "f");
            __classPrivateFieldGet(this, _VoipClient_relay, "f")?.closeAll();
            __classPrivateFieldGet(this, _VoipClient_engine, "f")?.destroy();
            __classPrivateFieldSet(this, _VoipClient_engine, null, "f");
            __classPrivateFieldSet(this, _VoipClient_relay, null, "f");
            __classPrivateFieldSet(this, _VoipClient_signaling, null, "f");
            __classPrivateFieldSet(this, _VoipClient_sock, null, "f");
        };
        _VoipClient_handleCallEvent.set(this, (eventType, eventData) => {
            if (eventType === 16 && eventData) {
                try {
                    const parsed = JSON.parse(eventData);
                    const info = parsed.call_info ?? parsed.callInfo ?? {};
                    const callState = Number(info.call_state ?? info.callState ?? 0);
                    __classPrivateFieldGet(this, _VoipClient_activeCall, "f")?._updateState(callState);
                }
                catch { }
            }
            else if (eventType === 156 && eventData) {
                try {
                    const update = JSON.parse(eventData);
                    __classPrivateFieldGet(this, _VoipClient_relay, "f")?.updateRelayList(update);
                }
                catch { }
            }
            else if (eventType === 2) {
                __classPrivateFieldGet(this, _VoipClient_activeCall, "f")?._forceEnd("remote_end");
            }
        });
        _VoipClient_handleAudioCaptureInit.set(this, (config) => {
            if (!__classPrivateFieldGet(this, _VoipClient_engine, "f"))
                return;
            __classPrivateFieldSet(this, _VoipClient_captureSampleRate, config.sampleRate || 16000, "f");
            __classPrivateFieldSet(this, _VoipClient_captureChannels, config.channels || 1, "f");
            __classPrivateFieldSet(this, _VoipClient_captureFramesPerChunk, config.framesPerChunk || 320, "f");
            const chunkSamples = __classPrivateFieldGet(this, _VoipClient_captureFramesPerChunk, "f") * __classPrivateFieldGet(this, _VoipClient_captureChannels, "f");
            __classPrivateFieldSet(this, _VoipClient_captureChunkBytes, chunkSamples * Float32Array.BYTES_PER_ELEMENT, "f");
            __classPrivateFieldSet(this, _VoipClient_capturePtr, __classPrivateFieldGet(this, _VoipClient_engine, "f").malloc(__classPrivateFieldGet(this, _VoipClient_captureChunkBytes, "f")), "f");
        });
        _VoipClient_handleAudioCaptureStart.set(this, () => {
            if (!__classPrivateFieldGet(this, _VoipClient_engine, "f") || !__classPrivateFieldGet(this, _VoipClient_capturePtr, "f"))
                return;
            const audioSource = __classPrivateFieldGet(this, _VoipClient_activeCall, "f")?._audioSource ?? "silence";
            __classPrivateFieldSet(this, _VoipClient_feeder, new AudioFeeder(__classPrivateFieldGet(this, _VoipClient_captureSampleRate, "f"), __classPrivateFieldGet(this, _VoipClient_captureChannels, "f"), __classPrivateFieldGet(this, _VoipClient_captureFramesPerChunk, "f"), (chunk) => {
                if (__classPrivateFieldGet(this, _VoipClient_engine, "f") && __classPrivateFieldGet(this, _VoipClient_capturePtr, "f"))
                    __classPrivateFieldGet(this, _VoipClient_engine, "f").sendAudioData(chunk, __classPrivateFieldGet(this, _VoipClient_capturePtr, "f"));
            }, audioSource), "f");
            __classPrivateFieldGet(this, _VoipClient_feeder, "f").start();
        });
        _VoipClient_handleAudioCaptureStop.set(this, () => {
            __classPrivateFieldGet(this, _VoipClient_feeder, "f")?.stop();
            __classPrivateFieldSet(this, _VoipClient_feeder, null, "f");
            if (__classPrivateFieldGet(this, _VoipClient_engine, "f") && __classPrivateFieldGet(this, _VoipClient_capturePtr, "f")) {
                try {
                    __classPrivateFieldGet(this, _VoipClient_engine, "f").free(__classPrivateFieldGet(this, _VoipClient_capturePtr, "f"));
                }
                catch { }
                __classPrivateFieldSet(this, _VoipClient_capturePtr, 0, "f");
            }
        });
        __classPrivateFieldSet(this, _VoipClient_config, config, "f");
    }
}
_VoipClient_config = new WeakMap(), _VoipClient_engine = new WeakMap(), _VoipClient_relay = new WeakMap(), _VoipClient_signaling = new WeakMap(), _VoipClient_sock = new WeakMap(), _VoipClient_activeCall = new WeakMap(), _VoipClient_capturePtr = new WeakMap(), _VoipClient_captureChunkBytes = new WeakMap(), _VoipClient_captureSampleRate = new WeakMap(), _VoipClient_captureChannels = new WeakMap(), _VoipClient_captureFramesPerChunk = new WeakMap(), _VoipClient_feeder = new WeakMap(), _VoipClient_initVoipStack = new WeakMap(), _VoipClient_handleCallEvent = new WeakMap(), _VoipClient_handleAudioCaptureInit = new WeakMap(), _VoipClient_handleAudioCaptureStart = new WeakMap(), _VoipClient_handleAudioCaptureStop = new WeakMap();
//# sourceMappingURL=index.js.map