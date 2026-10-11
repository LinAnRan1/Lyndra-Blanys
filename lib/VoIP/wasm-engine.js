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
var _NodeWorkerMessagePort_listeners, _NodeWorkerMessagePort_worker, _NodeWorkerMessagePort_handleMessage, _b, _WasmEngine_globalCallbackListeners, _WasmEngine_globalCallbacksRegistered, _WasmEngine_config, _WasmEngine_instance, _WasmEngine_initialized, _WasmEngine_moduleRegistry, _WasmEngine_vmContext, _WasmEngine_unusedWorkers, _WasmEngine_runningWorkers, _WasmEngine_pthreads, _WasmEngine_nextWorkerID, _WasmEngine_wasmModule, _WasmEngine_wasmMemory, _WasmEngine_removeRunDependencyCallback, _WasmEngine_workersLoadedCount, _WasmEngine_audioPlaybackLoopInterval, _WasmEngine_audioPlaybackBuffer, _WasmEngine_isPlaybackActive, _WasmEngine_voipStackInitialized, _WasmEngine_voipStackInitPromise, _WasmEngine_voipReadyResolver, _WasmEngine_voipReadyPromise, _WasmEngine_workerModulesCode, _WasmEngine_loaderCode, _WasmEngine_ensureInitialized, _WasmEngine_makeStringList, _WasmEngine_createUint8List, _WasmEngine_startAudioPlaybackLoop, _WasmEngine_stopAudioPlaybackLoop, _WasmEngine_applyDefaultAbProps, _WasmEngine_allocateUnusedWorker, _WasmEngine_initPThreadPool, _WasmEngine_loadWasmModuleToWorker, _WasmEngine_loadWasmModuleToAllWorkers, _WasmEngine_registerGlobalCallbacks, _WasmEngine_requireModule, _WasmEngine_createVMContext, _WasmEngine_createAtomicsWrapper;
var _a;
/**
 * WhatsApp VoIP WASM engine.
 *
 * Loads the WhatsApp Web VoIP WASM stack inside a Node.js `vm.Context`,
 * spawns a 20-thread `worker_threads` pool to mirror the browser's pthread
 * model, and exposes a callback-based JS bridge. Audio-only (no video).
 *
 * @author ShellTear
 */
import * as vm from "node:vm";
import * as fs from "node:fs";
import * as path from "node:path";
import { randomFillSync } from "node:crypto";
import { Worker } from "node:worker_threads";
import { fileURLToPath } from "node:url";
const voipFilePath = fileURLToPath(import.meta.url);
const voipDirectoryPath = path.dirname(voipFilePath);
const CALL_WASM_AB_PROPS_JSON = process.env.CALL_WASM_AB_PROPS_JSON ?? "";
const PTHREAD_POOL_SIZE = 20;
const VOIP_READY_TIMEOUT_MS = 15000;
const parseJsonObjectEnv = (raw) => {
    if (!raw)
        return {};
    try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed))
            return parsed;
    }
    catch { }
    return {};
};
const toByteArray = (input) => {
    if (!input)
        return new Uint8Array(0);
    if (input instanceof Uint8Array)
        return input;
    if (typeof input === "string")
        return new TextEncoder().encode(input);
    if (ArrayBuffer.isView(input))
        return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
    if (input instanceof ArrayBuffer)
        return new Uint8Array(input);
    if (typeof input === "object" && typeof input.length === "number") {
        const arr = new Uint8Array(input.length);
        for (let i = 0; i < input.length; i += 1)
            arr[i] = input[i] ?? 0;
        return arr;
    }
    return new Uint8Array(0);
};
const filterWorkerStderr = (chunk) => {
    const line = chunk.toString().trim();
    if (line && !line.startsWith("voip:") && !line.startsWith("still waiting")) {
        process.stderr.write(chunk);
    }
};
const resolveWorkerScriptPath = () => {
    const compiled = path.join(voipDirectoryPath, "worker-bootstrap.js");
    return fs.existsSync(compiled) ? compiled : path.join(voipDirectoryPath, "worker-bootstrap.mts");
};
class NodeWorkerMessagePort {
    constructor(worker, name = "WAWebVoipWebWasmWorker") {
        _NodeWorkerMessagePort_listeners.set(this, new Map());
        _NodeWorkerMessagePort_worker.set(this, void 0);
        this.workerID = 0;
        this.pthread_ptr = 0;
        this.postMessage = (msg, transferList) => {
            const out = msg && typeof msg === "object" && msg.cmd && !msg.type ? { ...msg, type: "cmd" } : msg;
            __classPrivateFieldGet(this, _NodeWorkerMessagePort_worker, "f").postMessage(out, transferList);
        };
        this.addMessageListener = (type, handler) => {
            let set = __classPrivateFieldGet(this, _NodeWorkerMessagePort_listeners, "f").get(type);
            if (!set) {
                set = new Set();
                __classPrivateFieldGet(this, _NodeWorkerMessagePort_listeners, "f").set(type, set);
            }
            set.add(handler);
            return handler;
        };
        this.removeMessageListener = (type, handler) => __classPrivateFieldGet(this, _NodeWorkerMessagePort_listeners, "f").get(type)?.delete(handler) ?? false;
        this.removeAllMessageListeners = (type) => {
            if (type)
                __classPrivateFieldGet(this, _NodeWorkerMessagePort_listeners, "f").get(type)?.clear();
            else
                __classPrivateFieldGet(this, _NodeWorkerMessagePort_listeners, "f").clear();
        };
        this.terminate = () => { __classPrivateFieldGet(this, _NodeWorkerMessagePort_worker, "f").terminate(); };
        this.close = () => { };
        this.isWrappingVirtualMessagePort = () => false;
        this.getWorker = () => __classPrivateFieldGet(this, _NodeWorkerMessagePort_worker, "f");
        _NodeWorkerMessagePort_handleMessage.set(this, (data) => {
            if (!data || typeof data !== "object")
                return;
            if (data.type === "callback" || data.type === "waWasmWorkerCompatibleCallback") {
                let callbackName;
                let callbackArgs;
                if (data.__name) {
                    callbackName = data.__name;
                    callbackArgs = {};
                    for (const key in data) {
                        if (key !== "type" && key !== "__name" && key !== "prototype" && key !== "args" && !key.startsWith("__")) {
                            callbackArgs[key] = data[key];
                        }
                    }
                }
                else if (data.name) {
                    callbackName = data.name;
                    callbackArgs = data.args ?? {};
                }
                else if (data.payload?.name) {
                    callbackName = data.payload.name;
                    callbackArgs = data.payload.args ?? {};
                }
                else {
                    return;
                }
                if (callbackName === "onSignalingXmpp" &&
                    (!callbackArgs || Object.keys(callbackArgs).length === 0)) {
                    callbackArgs = {
                        peerJid: data.peerJid, callId: data.callId, xmlPayload: data.xmlPayload,
                    };
                }
                let listenerData = callbackArgs;
                if (!callbackArgs || Object.keys(callbackArgs).length === 0 ||
                    (Object.keys(callbackArgs).length === 1 && callbackArgs.prototype)) {
                    listenerData = {};
                    for (const key in data) {
                        if (key !== "type" && key !== "__name" && key !== "prototype" && key !== "args" && !key.startsWith("__")) {
                            listenerData[key] = data[key];
                        }
                    }
                }
                else if (callbackName === "sendDataToRelay") {
                    listenerData = { ...callbackArgs };
                    if (data.data !== undefined)
                        listenerData.data = data.data;
                    if (data.len !== undefined)
                        listenerData.len = data.len;
                    if (data.ip !== undefined)
                        listenerData.ip = data.ip;
                    if (data.port !== undefined)
                        listenerData.port = data.port;
                }
                else if (callbackName === "onCallEvent") {
                    listenerData = { ...callbackArgs };
                    if (data.eventType !== undefined)
                        listenerData.eventType = data.eventType;
                    if (data.userData !== undefined)
                        listenerData.userData = data.userData;
                    if (data.eventDataJson !== undefined)
                        listenerData.eventDataJson = data.eventDataJson;
                }
                WasmEngine.notifyGlobalCallbackListeners(callbackName, listenerData);
                return;
            }
            const dispatch = (key) => {
                if (!key)
                    return;
                for (const handler of __classPrivateFieldGet(this, _NodeWorkerMessagePort_listeners, "f").get(key) ?? []) {
                    try {
                        handler(data);
                    }
                    catch { }
                }
            };
            dispatch(data.type);
            if (data.cmd !== data.type)
                dispatch(data.cmd);
        });
        __classPrivateFieldSet(this, _NodeWorkerMessagePort_worker, worker, "f");
        this.name = name;
        this.fullyConnected = new Promise((resolve) => {
            const loadedHandler = (msg) => {
                if (msg && msg.cmd === "loaded") {
                    this.workerID = msg.workerID ?? 0;
                    resolve(this);
                }
            };
            this.addMessageListener("cmd", loadedHandler);
        });
        if (typeof worker.on === "function") {
            worker.on("message", (data) => __classPrivateFieldGet(this, _NodeWorkerMessagePort_handleMessage, "f").call(this, data));
            worker.on("error", () => { });
        }
        else if (typeof worker.addEventListener === "function") {
            worker.addEventListener("message", (ev) => __classPrivateFieldGet(this, _NodeWorkerMessagePort_handleMessage, "f").call(this, ev?.data ?? ev));
        }
    }
}
_NodeWorkerMessagePort_listeners = new WeakMap(), _NodeWorkerMessagePort_worker = new WeakMap(), _NodeWorkerMessagePort_handleMessage = new WeakMap();
export class WasmEngine {
    constructor(config = {}) {
        _WasmEngine_config.set(this, void 0);
        _WasmEngine_instance.set(this, null);
        _WasmEngine_initialized.set(this, false);
        _WasmEngine_moduleRegistry.set(this, new Map());
        _WasmEngine_vmContext.set(this, null);
        _WasmEngine_unusedWorkers.set(this, []);
        _WasmEngine_runningWorkers.set(this, []);
        _WasmEngine_pthreads.set(this, {});
        _WasmEngine_nextWorkerID.set(this, 1);
        _WasmEngine_wasmModule.set(this, null);
        _WasmEngine_wasmMemory.set(this, null);
        _WasmEngine_removeRunDependencyCallback.set(this, null);
        _WasmEngine_workersLoadedCount.set(this, 0);
        _WasmEngine_audioPlaybackLoopInterval.set(this, null);
        _WasmEngine_audioPlaybackBuffer.set(this, null);
        _WasmEngine_isPlaybackActive.set(this, false);
        _WasmEngine_voipStackInitialized.set(this, false);
        _WasmEngine_voipStackInitPromise.set(this, null);
        _WasmEngine_voipReadyResolver.set(this, null);
        _WasmEngine_voipReadyPromise.set(this, null);
        _WasmEngine_workerModulesCode.set(this, "");
        _WasmEngine_loaderCode.set(this, "");
        this.initialize = async () => {
            if (__classPrivateFieldGet(this, _WasmEngine_initialized, "f"))
                throw new Error("WasmEngine already initialized");
            const voipStorageDir = "/tmp/voip";
            try {
                if (!fs.existsSync(voipStorageDir))
                    fs.mkdirSync(voipStorageDir, { recursive: true });
            }
            catch { }
            const loaderFile = path.join(__classPrivateFieldGet(this, _WasmEngine_config, "f").resourcesPath, "assets", "wasm", "loader.js");
            const workerFile = path.join(__classPrivateFieldGet(this, _WasmEngine_config, "f").resourcesPath, "assets", "wasm", "worker-modules.js");
            if (!__classPrivateFieldGet(this, _WasmEngine_config, "f").wasmBinary && !fs.existsSync(__classPrivateFieldGet(this, _WasmEngine_config, "f").wasmPath)) {
                throw new Error(`WASM file not found: ${__classPrivateFieldGet(this, _WasmEngine_config, "f").wasmPath}`);
            }
            const wasmBuffer = __classPrivateFieldGet(this, _WasmEngine_config, "f").wasmBinary
                ? Buffer.from(__classPrivateFieldGet(this, _WasmEngine_config, "f").wasmBinary)
                : fs.readFileSync(__classPrivateFieldGet(this, _WasmEngine_config, "f").wasmPath);
            const diskWorkerCode = fs.existsSync(workerFile) ? fs.readFileSync(workerFile, "utf8") : "";
            __classPrivateFieldSet(this, _WasmEngine_workerModulesCode, __classPrivateFieldGet(this, _WasmEngine_config, "f").workerModulesCode ?? diskWorkerCode, "f");
            const workerBundleHasLoader = typeof __classPrivateFieldGet(this, _WasmEngine_workerModulesCode, "f") === "string" && /WAWebVoipWebWasmLoader/.test(__classPrivateFieldGet(this, _WasmEngine_workerModulesCode, "f"));
            // Skip the on-disk loader.js if the worker bundle already has a loader —
            // the standalone loader.js is older and would clobber the freshly fetched
            // bindings inside worker-modules.js.
            __classPrivateFieldSet(this, _WasmEngine_loaderCode, __classPrivateFieldGet(this, _WasmEngine_config, "f").loaderCode ??
                (workerBundleHasLoader ? "" : fs.existsSync(loaderFile) ? fs.readFileSync(loaderFile, "utf8") : ""), "f");
            if (!__classPrivateFieldGet(this, _WasmEngine_loaderCode, "f") && !__classPrivateFieldGet(this, _WasmEngine_workerModulesCode, "f")) {
                throw new Error("No loader/worker code available to initialize VoIP");
            }
            const memory = new WebAssembly.Memory({ initial: 256, maximum: 32768, shared: true });
            __classPrivateFieldSet(this, _WasmEngine_wasmMemory, memory, "f");
            __classPrivateFieldSet(this, _WasmEngine_wasmModule, await WebAssembly.compile(wasmBuffer), "f");
            __classPrivateFieldSet(this, _WasmEngine_vmContext, __classPrivateFieldGet(this, _WasmEngine_createVMContext, "f").call(this, memory), "f");
            const runModuleCode = (code) => {
                if (code)
                    vm.runInContext(code, __classPrivateFieldGet(this, _WasmEngine_vmContext, "f"));
            };
            runModuleCode(__classPrivateFieldGet(this, _WasmEngine_workerModulesCode, "f"));
            runModuleCode(__classPrivateFieldGet(this, _WasmEngine_loaderCode, "f"));
            __classPrivateFieldGet(this, _WasmEngine_vmContext, "f").WAWebVoipWebWasmWorkerResource = __classPrivateFieldGet(this, _WasmEngine_requireModule, "f").call(this, "WAWebVoipWebWasmWorkerResource");
            const loaderModuleNames = [
                __classPrivateFieldGet(this, _WasmEngine_config, "f").loaderModuleName,
                "WAWebVoipWebWasmLoader",
                "WAWebVoipWebWasmLoader.worker",
                "WAWebVoipWebWasmLoader_ProdLab_internal.worker",
                "WAWebVoipWebWasmLoader_ProdLabvideo_internal.worker",
            ].filter((v, i, a) => !!v && a.indexOf(v) === i);
            let wasmLoader = null;
            for (const moduleName of loaderModuleNames) {
                const candidate = __classPrivateFieldGet(this, _WasmEngine_requireModule, "f").call(this, moduleName);
                if (typeof candidate === "function") {
                    wasmLoader = candidate;
                    break;
                }
                if (typeof candidate?.default === "function") {
                    wasmLoader = candidate.default;
                    break;
                }
            }
            if (typeof wasmLoader !== "function") {
                throw new Error(`No compatible WASM loader found. Tried: ${loaderModuleNames.join(", ")}`);
            }
            if (!__classPrivateFieldGet(_a, _b, "f", _WasmEngine_globalCallbacksRegistered))
                __classPrivateFieldGet(this, _WasmEngine_registerGlobalCallbacks, "f").call(this);
            await __classPrivateFieldGet(this, _WasmEngine_initPThreadPool, "f").call(this);
            const workersLoadingPromise = __classPrivateFieldGet(this, _WasmEngine_loadWasmModuleToAllWorkers, "f").call(this);
            const readyPromise = wasmLoader({
                wasmBinary: wasmBuffer,
                wasmMemory: memory,
                locateFile: () => __classPrivateFieldGet(this, _WasmEngine_config, "f").wasmPath,
                onRuntimeInitialized: () => { },
            });
            const [instance] = await Promise.all([readyPromise, workersLoadingPromise]);
            __classPrivateFieldSet(this, _WasmEngine_instance, instance, "f");
            __classPrivateFieldSet(this, _WasmEngine_initialized, true, "f");
        };
        this.isInitialized = () => __classPrivateFieldGet(this, _WasmEngine_initialized, "f");
        this.destroy = () => {
            __classPrivateFieldGet(this, _WasmEngine_stopAudioPlaybackLoop, "f").call(this);
            if (__classPrivateFieldGet(this, _WasmEngine_instance, "f") && typeof __classPrivateFieldGet(this, _WasmEngine_instance, "f").endCall === "function") {
                try {
                    __classPrivateFieldGet(this, _WasmEngine_instance, "f").endCall(0, false);
                }
                catch { }
            }
            for (const worker of [...__classPrivateFieldGet(this, _WasmEngine_runningWorkers, "f"), ...__classPrivateFieldGet(this, _WasmEngine_unusedWorkers, "f")]) {
                try {
                    worker.terminate();
                }
                catch { }
            }
            __classPrivateFieldSet(this, _WasmEngine_runningWorkers, [], "f");
            __classPrivateFieldSet(this, _WasmEngine_unusedWorkers, [], "f");
            __classPrivateFieldSet(this, _WasmEngine_instance, null, "f");
            __classPrivateFieldSet(this, _WasmEngine_vmContext, null, "f");
            __classPrivateFieldGet(this, _WasmEngine_moduleRegistry, "f").clear();
            __classPrivateFieldSet(this, _WasmEngine_wasmModule, null, "f");
            __classPrivateFieldSet(this, _WasmEngine_wasmMemory, null, "f");
            __classPrivateFieldSet(this, _WasmEngine_initialized, false, "f");
        };
        this.initVoipStack = (selfJid, meUserJid, selfLid) => {
            __classPrivateFieldGet(this, _WasmEngine_ensureInitialized, "f").call(this);
            if (__classPrivateFieldGet(this, _WasmEngine_voipStackInitialized, "f") || __classPrivateFieldGet(this, _WasmEngine_voipStackInitPromise, "f"))
                return;
            __classPrivateFieldSet(this, _WasmEngine_voipStackInitPromise, new Promise((resolveInit) => {
                __classPrivateFieldSet(this, _WasmEngine_voipReadyPromise, new Promise((readyResolve) => {
                    __classPrivateFieldSet(this, _WasmEngine_voipReadyResolver, () => {
                        __classPrivateFieldSet(this, _WasmEngine_voipStackInitialized, true, "f");
                        __classPrivateFieldSet(this, _WasmEngine_voipReadyResolver, null, "f");
                        __classPrivateFieldSet(this, _WasmEngine_voipReadyPromise, null, "f");
                        readyResolve();
                    }, "f");
                }), "f");
                try {
                    __classPrivateFieldGet(this, _WasmEngine_applyDefaultAbProps, "f").call(this);
                    try {
                        __classPrivateFieldGet(this, _WasmEngine_instance, "f").initVoipStack(selfJid, meUserJid, selfLid);
                    }
                    catch (modernErr) {
                        if (modernErr?.name === "BindingError" &&
                            (String(modernErr?.message ?? "").includes("expected 8 args") ||
                                String(modernErr?.message ?? "").includes("takes 8"))) {
                            __classPrivateFieldGet(this, _WasmEngine_instance, "f").initVoipStack(selfJid, meUserJid, selfLid, true, 5, 0, 8, 16);
                        }
                        else {
                            throw modernErr;
                        }
                    }
                    Promise.race([
                        __classPrivateFieldGet(this, _WasmEngine_voipReadyPromise, "f"),
                        new Promise((r) => setTimeout(() => {
                            __classPrivateFieldSet(this, _WasmEngine_voipStackInitialized, true, "f");
                            r();
                        }, VOIP_READY_TIMEOUT_MS)),
                    ]).finally(() => {
                        __classPrivateFieldSet(this, _WasmEngine_voipStackInitPromise, null, "f");
                        resolveInit();
                    });
                }
                catch {
                    __classPrivateFieldSet(this, _WasmEngine_voipReadyResolver, null, "f");
                    __classPrivateFieldSet(this, _WasmEngine_voipReadyPromise, null, "f");
                    __classPrivateFieldSet(this, _WasmEngine_voipStackInitPromise, null, "f");
                    resolveInit();
                }
            }), "f");
        };
        this.waitForVoipStackReady = async () => {
            if (__classPrivateFieldGet(this, _WasmEngine_voipStackInitialized, "f"))
                return;
            if (__classPrivateFieldGet(this, _WasmEngine_voipStackInitPromise, "f")) {
                await __classPrivateFieldGet(this, _WasmEngine_voipStackInitPromise, "f");
            }
            else {
                await new Promise((r) => setTimeout(r, 100));
            }
        };
        this.isVoipStackReady = () => __classPrivateFieldGet(this, _WasmEngine_voipStackInitialized, "f");
        this.startCall = (options) => {
            __classPrivateFieldGet(this, _WasmEngine_ensureInitialized, "f").call(this);
            const peers = __classPrivateFieldGet(this, _WasmEngine_makeStringList, "f").call(this, options.peerList ?? [options.peerJid]);
            const tcToken = __classPrivateFieldGet(this, _WasmEngine_createUint8List, "f").call(this, options.extraData);
            const isLidCall = options.isLidCall ?? options.peerJid.includes("@lid");
            const isFromDialer = options.isFromDialer ?? false;
            const peerJid = String(options.peerJid);
            try {
                try {
                    return __classPrivateFieldGet(this, _WasmEngine_instance, "f").startVoipCall(peerJid, peers, options.callId, options.isVideo, options.peerPn, isLidCall, isFromDialer, tcToken);
                }
                catch (error) {
                    if (error?.name !== "BindingError")
                        throw error;
                    return __classPrivateFieldGet(this, _WasmEngine_instance, "f").startVoipCall(peerJid, peers, options.callId, options.isVideo, options.peerPn, isFromDialer, tcToken);
                }
            }
            finally {
                peers?.delete?.();
                tcToken?.delete?.();
            }
        };
        this.endCall = (reason = 0, sendTerminate = true) => {
            __classPrivateFieldGet(this, _WasmEngine_ensureInitialized, "f").call(this);
            __classPrivateFieldGet(this, _WasmEngine_instance, "f").endCall(reason, sendTerminate);
        };
        this.setMute = (muted) => {
            __classPrivateFieldGet(this, _WasmEngine_ensureInitialized, "f").call(this);
            return __classPrivateFieldGet(this, _WasmEngine_instance, "f").setCallMute(muted);
        };
        this.updateNetworkMedium = (networkMedium, networkMtu = 0) => {
            __classPrivateFieldGet(this, _WasmEngine_ensureInitialized, "f").call(this);
            __classPrivateFieldGet(this, _WasmEngine_instance, "f").updateNetworkMedium?.(networkMedium, networkMtu);
        };
        this.handleSignalingOffer = (msg) => {
            __classPrivateFieldGet(this, _WasmEngine_ensureInitialized, "f").call(this);
            const tcTokenList = __classPrivateFieldGet(this, _WasmEngine_createUint8List, "f").call(this, msg.tcToken);
            try {
                __classPrivateFieldGet(this, _WasmEngine_instance, "f").handleIncomingSignalingOffer(msg.payload, String(msg.peerPlatform ?? 0), String(msg.peerAppVersion ?? "0"), String(msg.epochId ?? "0"), String(msg.timestamp ?? "0"), msg.isOffline ?? false, msg.isOfferNotContact ?? false, String(msg.peerJid), tcTokenList);
            }
            finally {
                tcTokenList?.delete?.();
            }
        };
        this.handleSignalingMessage = (msg) => {
            __classPrivateFieldGet(this, _WasmEngine_ensureInitialized, "f").call(this);
            const tcTokenList = __classPrivateFieldGet(this, _WasmEngine_createUint8List, "f").call(this, msg.tcToken);
            try {
                __classPrivateFieldGet(this, _WasmEngine_instance, "f").handleIncomingSignalingMessage(msg.payload, String(msg.peerPlatform ?? "0"), String(msg.peerAppVersion ?? "0"), String(msg.epochId ?? "0"), String(msg.timestamp ?? "0"), msg.isOffline ?? false, String(msg.peerJid), tcTokenList);
            }
            finally {
                tcTokenList?.delete?.();
            }
        };
        this.handleSignalingAck = (msg) => {
            __classPrivateFieldGet(this, _WasmEngine_ensureInitialized, "f").call(this);
            const options = __classPrivateFieldGet(this, _WasmEngine_createUint8List, "f").call(this, msg.extraData);
            try {
                __classPrivateFieldGet(this, _WasmEngine_instance, "f").handleIncomingSignalingAck(msg.payload, String(msg.ackError ?? "0"), String(msg.msgType ?? ""), msg.peerJid ?? "", options);
            }
            finally {
                options?.delete?.();
            }
        };
        this.handleSignalingReceipt = (msg) => {
            __classPrivateFieldGet(this, _WasmEngine_ensureInitialized, "f").call(this);
            const tcTokenList = __classPrivateFieldGet(this, _WasmEngine_createUint8List, "f").call(this, msg.tcToken);
            try {
                __classPrivateFieldGet(this, _WasmEngine_instance, "f").handleIncomingSignalingReceipt?.(msg.payload, msg.peerJid, tcTokenList);
            }
            finally {
                tcTokenList?.delete?.();
            }
        };
        this.handleOnTransportMessage = (data, ip, port) => {
            __classPrivateFieldGet(this, _WasmEngine_ensureInitialized, "f").call(this);
            if (typeof __classPrivateFieldGet(this, _WasmEngine_instance, "f").handleOnMessageFromHeap === "function") {
                const ptr = this.malloc(data.byteLength);
                if (!ptr)
                    return;
                try {
                    const heapU8 = __classPrivateFieldGet(this, _WasmEngine_instance, "f").GROWABLE_HEAP_U8?.() ?? __classPrivateFieldGet(this, _WasmEngine_instance, "f").HEAPU8;
                    if (!heapU8)
                        return;
                    heapU8.set(data, ptr);
                    __classPrivateFieldGet(this, _WasmEngine_instance, "f").handleOnMessageFromHeap(ptr, data.byteLength, ip, port);
                }
                finally {
                    this.free(ptr);
                }
                return;
            }
            if (typeof __classPrivateFieldGet(this, _WasmEngine_instance, "f").handleOnMessage !== "function")
                return;
            const dataList = __classPrivateFieldGet(this, _WasmEngine_createUint8List, "f").call(this, data);
            try {
                __classPrivateFieldGet(this, _WasmEngine_instance, "f").handleOnMessage(dataList, ip, port);
            }
            finally {
                dataList?.delete?.();
            }
        };
        this.updateIceRtt = (rttMs, relayIp, relayPort) => {
            __classPrivateFieldGet(this, _WasmEngine_ensureInitialized, "f").call(this);
            __classPrivateFieldGet(this, _WasmEngine_instance, "f").updateIceRtt?.(rttMs, relayIp, relayPort);
        };
        this.sendAudioData = (data, ptr) => {
            __classPrivateFieldGet(this, _WasmEngine_ensureInitialized, "f").call(this);
            if (!data || data.length === 0 || !ptr)
                return;
            if (typeof __classPrivateFieldGet(this, _WasmEngine_instance, "f").onAudioDataFromJs !== "function")
                return;
            try {
                const heapF32 = __classPrivateFieldGet(this, _WasmEngine_instance, "f").GROWABLE_HEAP_F32?.() ?? __classPrivateFieldGet(this, _WasmEngine_instance, "f").HEAPF32;
                if (!heapF32)
                    return;
                const index = Math.floor(ptr / 4);
                if (index < 0 || index + data.length > heapF32.length)
                    return;
                heapF32.set(data, index);
                __classPrivateFieldGet(this, _WasmEngine_instance, "f").onAudioDataFromJs(ptr, data.length);
            }
            catch { }
        };
        this.malloc = (size) => {
            __classPrivateFieldGet(this, _WasmEngine_ensureInitialized, "f").call(this);
            return __classPrivateFieldGet(this, _WasmEngine_instance, "f")._malloc(size);
        };
        this.free = (ptr) => {
            __classPrivateFieldGet(this, _WasmEngine_ensureInitialized, "f").call(this);
            __classPrivateFieldGet(this, _WasmEngine_instance, "f")._free(ptr);
        };
        // ─── private ──────────────────────────────────────────────────────────────
        _WasmEngine_ensureInitialized.set(this, () => {
            if (!__classPrivateFieldGet(this, _WasmEngine_initialized, "f") || !__classPrivateFieldGet(this, _WasmEngine_instance, "f")) {
                throw new Error("WasmEngine not initialized. Call initialize() first.");
            }
        });
        _WasmEngine_makeStringList.set(this, (arr) => {
            const list = new (__classPrivateFieldGet(this, _WasmEngine_instance, "f").StringList)();
            for (const v of arr)
                list.push_back(v);
            return list;
        });
        _WasmEngine_createUint8List.set(this, (data) => {
            if (!__classPrivateFieldGet(this, _WasmEngine_instance, "f")?.Uint8List)
                return null;
            const list = new (__classPrivateFieldGet(this, _WasmEngine_instance, "f").Uint8List)();
            if (data)
                data.forEach((byte) => list.push_back(byte));
            return list;
        });
        _WasmEngine_startAudioPlaybackLoop.set(this, () => {
            if (__classPrivateFieldGet(this, _WasmEngine_audioPlaybackLoopInterval, "f"))
                return;
            __classPrivateFieldGet(this, _WasmEngine_ensureInitialized, "f").call(this);
            __classPrivateFieldSet(this, _WasmEngine_isPlaybackActive, true, "f");
            if (typeof __classPrivateFieldGet(this, _WasmEngine_instance, "f").requestAudioDataFromWasmVoip !== "function")
                return;
            const framesPerChunk = 320;
            const bufferSize = framesPerChunk * 4;
            try {
                const _malloc = __classPrivateFieldGet(this, _WasmEngine_instance, "f")._malloc ?? __classPrivateFieldGet(this, _WasmEngine_instance, "f").malloc;
                if (!_malloc)
                    return;
                __classPrivateFieldSet(this, _WasmEngine_audioPlaybackBuffer, _malloc(bufferSize), "f");
            }
            catch {
                return;
            }
            if (!__classPrivateFieldGet(this, _WasmEngine_audioPlaybackBuffer, "f") || __classPrivateFieldGet(this, _WasmEngine_audioPlaybackBuffer, "f") <= 0)
                return;
            __classPrivateFieldSet(this, _WasmEngine_audioPlaybackLoopInterval, setInterval(() => {
                if (!__classPrivateFieldGet(this, _WasmEngine_isPlaybackActive, "f") || !__classPrivateFieldGet(this, _WasmEngine_instance, "f") || !__classPrivateFieldGet(this, _WasmEngine_initialized, "f")) {
                    __classPrivateFieldGet(this, _WasmEngine_stopAudioPlaybackLoop, "f").call(this);
                    return;
                }
                try {
                    __classPrivateFieldGet(this, _WasmEngine_instance, "f").requestAudioDataFromWasmVoip(__classPrivateFieldGet(this, _WasmEngine_audioPlaybackBuffer, "f"), bufferSize);
                    const heapF32 = __classPrivateFieldGet(this, _WasmEngine_instance, "f").GROWABLE_HEAP_F32?.();
                    if (!heapF32)
                        return;
                    const index = Math.floor(__classPrivateFieldGet(this, _WasmEngine_audioPlaybackBuffer, "f") / 4);
                    const numFloats = Math.floor(bufferSize / 4);
                    if (index < 0 || index + numFloats > heapF32.length)
                        return;
                    const audioData = new Float32Array(heapF32.buffer, heapF32.byteOffset + index * 4, numFloats);
                    const hasNonZero = audioData.some((s) => Math.abs(s) > 0.0001);
                    if (hasNonZero)
                        __classPrivateFieldGet(this, _WasmEngine_config, "f").callbacks?.onAudioPlaybackData?.(audioData);
                }
                catch { }
            }, 16), "f");
        });
        _WasmEngine_stopAudioPlaybackLoop.set(this, () => {
            __classPrivateFieldSet(this, _WasmEngine_isPlaybackActive, false, "f");
            if (__classPrivateFieldGet(this, _WasmEngine_audioPlaybackLoopInterval, "f")) {
                clearInterval(__classPrivateFieldGet(this, _WasmEngine_audioPlaybackLoopInterval, "f"));
                __classPrivateFieldSet(this, _WasmEngine_audioPlaybackLoopInterval, null, "f");
            }
            if (__classPrivateFieldGet(this, _WasmEngine_audioPlaybackBuffer, "f") && __classPrivateFieldGet(this, _WasmEngine_audioPlaybackBuffer, "f") > 0) {
                try {
                    __classPrivateFieldGet(this, _WasmEngine_instance, "f")?._free?.(__classPrivateFieldGet(this, _WasmEngine_audioPlaybackBuffer, "f"));
                }
                catch { }
                __classPrivateFieldSet(this, _WasmEngine_audioPlaybackBuffer, null, "f");
            }
        });
        _WasmEngine_applyDefaultAbProps.set(this, () => {
            if (!__classPrivateFieldGet(this, _WasmEngine_instance, "f"))
                return;
            const setInt = typeof __classPrivateFieldGet(this, _WasmEngine_instance, "f").setABPropInt === "function"
                ? (k, v) => { __classPrivateFieldGet(this, _WasmEngine_instance, "f").setABPropInt(k, v); }
                : null;
            const setBool = typeof __classPrivateFieldGet(this, _WasmEngine_instance, "f").setABPropBool === "function"
                ? (k, v) => { __classPrivateFieldGet(this, _WasmEngine_instance, "f").setABPropBool(k, v); }
                : null;
            const setString = typeof __classPrivateFieldGet(this, _WasmEngine_instance, "f").setABPropString === "function"
                ? (k, v) => { __classPrivateFieldGet(this, _WasmEngine_instance, "f").setABPropString(k, v); }
                : null;
            if (!setInt && !setBool && !setString)
                return;
            const opts = __classPrivateFieldGet(this, _WasmEngine_config, "f").options ?? {};
            const intProps = {
                heartbeat_interval_s: opts.heartbeatInterval ?? 30,
                lobby_timeout_min: opts.lobbyTimeout ?? 1,
                max_num_participants_for_ss: opts.maxParticipantsScreenShare ?? 32,
                max_group_size_for_long_ringtone: opts.maxGroupSizeLongRingtone ?? 32,
                app_exit_reason_version: 1,
                log_level: opts.logLevel ?? 3,
                calling_rust_migration_bitmap: 0,
                calling_rust_migration_incoming_stanza_bitmap: 0,
                default_endpoint_thread_poll_timeout: 0,
                aigc_version: 0,
                call_admin_version: 0,
                vid_stream_pause_resume_jb_reset_threshold_ms: 0,
                // Opus: max bandwidth WB (16 kHz). FB (48 kHz) needs native audio device
                // hooks not available in this JS-only WASM context.
                opus_max_bandwidth: 1103, // OPUS_BANDWIDTH_WIDEBAND
            };
            const boolProps = {
                enable_av_downgrade: false,
                enable_new_user_action_stanza_for_raise_hand_sender: false,
                enable_webcodec_video_encode: false,
                enable_init_bwe_for_group_call: false,
                enable_ring_for_gc_on_offer_expire: false,
                allow_reporting_call_replayer_id: false,
                enable_offer_v2_upgrade: false,
                enable_silent_offer: false,
                voice_ai_conversation_starter_latency_tracking: false,
                enable_waiting_room_logging: false,
                attach_transport_rtx: false,
                ignore_joinable_terminate_on_expired_offer: false,
                enable_passthrough_video_decoder: false,
            };
            for (const [key, value] of Object.entries(intProps)) {
                if (setInt && Number.isFinite(value))
                    try {
                        setInt(key, value);
                    }
                    catch { }
            }
            for (const [key, value] of Object.entries(boolProps)) {
                if (setBool)
                    try {
                        setBool(key, value);
                    }
                    catch { }
            }
            const overrideProps = parseJsonObjectEnv(CALL_WASM_AB_PROPS_JSON);
            for (const [key, value] of Object.entries(overrideProps)) {
                try {
                    if (typeof value === "boolean" && setBool)
                        setBool(key, value);
                    else if (typeof value === "number" && setInt)
                        setInt(key, value);
                    else if (typeof value === "string" && setString)
                        setString(key, value);
                }
                catch { }
            }
        });
        _WasmEngine_allocateUnusedWorker.set(this, () => {
            const workerScriptPath = resolveWorkerScriptPath();
            if (!fs.existsSync(workerScriptPath))
                return;
            try {
                const worker = new Worker(workerScriptPath, {
                    stdout: true, stderr: true,
                    workerData: {
                        wasmPath: __classPrivateFieldGet(this, _WasmEngine_config, "f").wasmPath,
                        wasmBinary: __classPrivateFieldGet(this, _WasmEngine_config, "f").wasmBinary,
                        workerModulesCode: __classPrivateFieldGet(this, _WasmEngine_workerModulesCode, "f"),
                        loaderCode: __classPrivateFieldGet(this, _WasmEngine_loaderCode, "f"),
                        loaderModuleName: __classPrivateFieldGet(this, _WasmEngine_config, "f").loaderModuleName,
                        resourcesPath: __classPrivateFieldGet(this, _WasmEngine_config, "f").resourcesPath,
                        enableLogs: __classPrivateFieldGet(this, _WasmEngine_config, "f").enableLogs,
                    },
                });
                const port = new NodeWorkerMessagePort(worker, "WAWebVoipWebWasmWorker");
                worker.stdout?.on("data", () => { }); // suppress noisy worker stdout
                worker.stderr?.on("data", filterWorkerStderr);
                __classPrivateFieldGet(this, _WasmEngine_unusedWorkers, "f").push(port);
            }
            catch { }
        });
        _WasmEngine_initPThreadPool.set(this, async () => {
            for (let i = 0; i < PTHREAD_POOL_SIZE; i += 1)
                __classPrivateFieldGet(this, _WasmEngine_allocateUnusedWorker, "f").call(this);
        });
        _WasmEngine_loadWasmModuleToWorker.set(this, (worker) => new Promise((resolve) => {
            var _c, _d;
            const loadedHandler = (msg) => {
                if (msg && msg.cmd === "loaded") {
                    worker.removeMessageListener("cmd", loadedHandler);
                    __classPrivateFieldSet(this, _WasmEngine_workersLoadedCount, __classPrivateFieldGet(this, _WasmEngine_workersLoadedCount, "f") + 1, "f");
                    if (__classPrivateFieldGet(this, _WasmEngine_workersLoadedCount, "f") >= PTHREAD_POOL_SIZE && __classPrivateFieldGet(this, _WasmEngine_removeRunDependencyCallback, "f")) {
                        __classPrivateFieldGet(this, _WasmEngine_removeRunDependencyCallback, "f").call(this, "loading-workers");
                    }
                    resolve();
                }
            };
            worker.addMessageListener("cmd", loadedHandler);
            worker.workerID = (__classPrivateFieldSet(this, _WasmEngine_nextWorkerID, (_d = __classPrivateFieldGet(this, _WasmEngine_nextWorkerID, "f"), _c = _d++, _d), "f"), _c);
            worker.postMessage({
                cmd: "load", type: "cmd",
                wasmMemory: __classPrivateFieldGet(this, _WasmEngine_wasmMemory, "f"),
                wasmModule: __classPrivateFieldGet(this, _WasmEngine_wasmModule, "f"),
                workerID: worker.workerID,
                handlers: [],
            });
        }));
        _WasmEngine_loadWasmModuleToAllWorkers.set(this, async () => {
            __classPrivateFieldSet(this, _WasmEngine_workersLoadedCount, 0, "f");
            await Promise.all(__classPrivateFieldGet(this, _WasmEngine_unusedWorkers, "f").map((w) => __classPrivateFieldGet(this, _WasmEngine_loadWasmModuleToWorker, "f").call(this, w)));
        });
        _WasmEngine_registerGlobalCallbacks.set(this, () => {
            const callbacks = __classPrivateFieldGet(this, _WasmEngine_config, "f").callbacks ?? {};
            _a.registerGlobalCallbackListener("loggingCallback", (data) => {
                if (!__classPrivateFieldGet(this, _WasmEngine_config, "f").enableLogs)
                    return;
                const level = data?.level;
                const msg = data?.message ?? "";
                const mapped = level === 1 ? "error" : level === 2 ? "warn" : level === 3 ? "log" : "debug";
                callbacks.onLog?.(mapped, msg);
            });
            if (callbacks.onAudioCaptureInit) {
                _a.registerGlobalCallbackListener("initCaptureDriverJS", (data) => {
                    callbacks.onAudioCaptureInit({
                        sampleRate: data?.sample_rate ?? data?.sampleRate,
                        channels: data?.channels,
                        bitsPerSample: data?.bits_per_sample ?? data?.bitsPerSample,
                        framesPerChunk: data?.frames_per_chunk ?? data?.framesPerChunk,
                    });
                });
            }
            _a.registerGlobalCallbackListener("startCaptureJS", () => callbacks.onAudioCaptureStart?.());
            _a.registerGlobalCallbackListener("stopCaptureJS", () => callbacks.onAudioCaptureStop?.());
            if (callbacks.onAudioPlaybackInit) {
                _a.registerGlobalCallbackListener("initPlaybackDriverJS", (data) => {
                    callbacks.onAudioPlaybackInit({
                        sampleRate: data?.sample_rate ?? data?.sampleRate,
                        channels: data?.channels,
                        bitsPerSample: data?.bits_per_sample ?? data?.bitsPerSample,
                        framesPerChunk: data?.frames_per_chunk ?? data?.framesPerChunk,
                    });
                });
            }
            _a.registerGlobalCallbackListener("startPlaybackJS", () => {
                callbacks.onAudioPlaybackStart?.();
                __classPrivateFieldGet(this, _WasmEngine_startAudioPlaybackLoop, "f").call(this);
            });
            _a.registerGlobalCallbackListener("stopPlaybackJS", () => {
                __classPrivateFieldGet(this, _WasmEngine_stopAudioPlaybackLoop, "f").call(this);
                callbacks.onAudioPlaybackStop?.();
            });
            if (callbacks.onSignalingXmpp) {
                _a.registerGlobalCallbackListener("onSignalingXmpp", (data) => {
                    const peerJid = data.peerJid ?? data.args?.peerJid;
                    const callId = data.callId ?? data.args?.callId;
                    let xmlPayload = data.xmlPayload ?? data.args?.xmlPayload;
                    if (Array.isArray(xmlPayload))
                        xmlPayload = new Uint8Array(xmlPayload);
                    else if (xmlPayload && typeof xmlPayload === "object" &&
                        !(xmlPayload instanceof Uint8Array) && !Buffer.isBuffer(xmlPayload)) {
                        xmlPayload = new Uint8Array(xmlPayload);
                    }
                    callbacks.onSignalingXmpp(peerJid, callId, xmlPayload);
                });
            }
            if (callbacks.onCallEvent) {
                _a.registerGlobalCallbackListener("onCallEvent", (data) => {
                    callbacks.onCallEvent(data.eventType, data.eventDataJson);
                });
            }
            if (callbacks.sendDataToRelay) {
                _a.registerGlobalCallbackListener("sendDataToRelay", (data) => {
                    let relayData = data.data ?? data.args?.data;
                    const ip = data.ip ?? data.args?.ip;
                    const portNum = data.port ?? data.args?.port;
                    if (relayData instanceof Uint8Array) { /* ok */ }
                    else if (Array.isArray(relayData))
                        relayData = new Uint8Array(relayData);
                    else if (Buffer.isBuffer(relayData))
                        relayData = new Uint8Array(relayData);
                    else if (relayData && typeof relayData === "object" && relayData.buffer) {
                        relayData = new Uint8Array(relayData.buffer, relayData.byteOffset ?? 0, relayData.byteLength ?? relayData.length);
                    }
                    else if (relayData instanceof ArrayBuffer)
                        relayData = new Uint8Array(relayData);
                    else
                        return 0;
                    if (!ip || !portNum)
                        return 0;
                    callbacks.sendDataToRelay(relayData, ip, portNum);
                    return relayData.byteLength;
                });
            }
            __classPrivateFieldSet(_a, _b, true, "f", _WasmEngine_globalCallbacksRegistered);
        });
        _WasmEngine_requireModule.set(this, (name) => {
            const preDefinedModules = {
                Promise,
                WAWebVoipWebWasmWorkerResource: {
                    resourcePath: resolveWorkerScriptPath(),
                    name: "WAWebVoipWebWasmWorker",
                },
                WorkerBundleResource: {
                    createDedicatedWebWorker: (resource) => {
                        const scriptPath = resource?.resourcePath && fs.existsSync(resource.resourcePath)
                            ? resource.resourcePath
                            : resolveWorkerScriptPath();
                        const worker = new Worker(scriptPath, {
                            stdout: true, stderr: true,
                            workerData: {
                                wasmPath: __classPrivateFieldGet(this, _WasmEngine_config, "f").wasmPath,
                                wasmBinary: __classPrivateFieldGet(this, _WasmEngine_config, "f").wasmBinary,
                                workerModulesCode: __classPrivateFieldGet(this, _WasmEngine_workerModulesCode, "f"),
                                loaderCode: __classPrivateFieldGet(this, _WasmEngine_loaderCode, "f"),
                                loaderModuleName: __classPrivateFieldGet(this, _WasmEngine_config, "f").loaderModuleName,
                                resourcesPath: __classPrivateFieldGet(this, _WasmEngine_config, "f").resourcesPath,
                                enableLogs: __classPrivateFieldGet(this, _WasmEngine_config, "f").enableLogs,
                            },
                        });
                        worker.stdout?.on("data", () => { });
                        worker.stderr?.on("data", filterWorkerStderr);
                        return worker;
                    },
                },
                WorkerClient: { init: () => { } },
                WorkerMessagePort: {
                    WorkerMessagePort: NodeWorkerMessagePort,
                    CastWorkerMessagePort: (w) => w,
                    WorkerSyncedMessagePort: NodeWorkerMessagePort,
                },
                bx: Object.assign((id) => String(id), { getURL: () => "" }),
                HasteSupportData: { handle: () => { } },
                ServiceWorkerDynamicModules: { handle: () => { } },
                WhatsAppWebServiceWorker: { default: true },
                WAWebLogger: { initializeWAWebLogger: () => { } },
                WAWebSw: { initHandlers: () => { } },
                WAWebWamRuntimeProvider: { setWamRuntime: () => { } },
                WAWebWamWorkerInterface: { commit: () => { }, set: () => { } },
                ServerJSDefine: { handleDefine: () => { } },
                ix: { add: () => { } },
                MetaConfigMap: { add: () => { } },
                QPLHasteSupportDataStorage: { default: { add: () => { }, get: () => null } },
                getFalcoLogPolicy_DO_NOT_USE: { add: () => { } },
                gkx: { add: () => { } },
                justknobx: { add: () => { } },
                qex: { add: () => { } },
            };
            if (preDefinedModules[name])
                return preDefinedModules[name];
            const mod = __classPrivateFieldGet(this, _WasmEngine_moduleRegistry, "f").get(name);
            if (!mod)
                return {};
            if (mod.exports !== undefined)
                return mod.exports;
            const requireFn = __classPrivateFieldGet(this, _WasmEngine_requireModule, "f");
            const normalizeModuleResult = (value) => {
                if (value && typeof value === "object" && "exports" in value && Object.keys(value).length === 1) {
                    return value.exports;
                }
                return value;
            };
            const importDefaultFn = (dep) => {
                const v = requireFn(dep);
                return v && v.__esModule ? v.default : v;
            };
            const importAllFn = (dep) => {
                const v = requireFn(dep);
                if (v == null)
                    return { default: v };
                if (v.__esModule)
                    return v;
                if (typeof v !== "object" && typeof v !== "function")
                    return { default: v };
                const ns = {};
                for (const key of Object.keys(v))
                    ns[key] = v[key];
                ns.default = v;
                return ns;
            };
            const tryMetro = () => {
                const module = { exports: {} };
                mod.factory(__classPrivateFieldGet(this, _WasmEngine_vmContext, "f") ?? globalThis, requireFn, importDefaultFn, importAllFn, null, module, module.exports);
                return normalizeModuleResult(module.exports);
            };
            const tryLegacy = () => {
                const exports = {};
                const module = { exports };
                const resolvedDeps = mod.deps.map((dep) => requireFn(dep));
                mod.factory(__classPrivateFieldGet(this, _WasmEngine_vmContext, "f") ?? globalThis, requireFn, requireFn, requireFn, module, exports, ...resolvedDeps);
                return normalizeModuleResult(module.exports);
            };
            let result = {};
            let metroError = null;
            try {
                result = tryMetro();
            }
            catch (e) {
                metroError = e;
            }
            if (metroError != null || (result && typeof result === "object" && Object.keys(result).length === 0)) {
                try {
                    const legacyResult = tryLegacy();
                    if (typeof legacyResult === "function" || (legacyResult && Object.keys(legacyResult).length > 0)) {
                        result = legacyResult;
                    }
                }
                catch { }
            }
            mod.exports = result;
            return result;
        });
        _WasmEngine_createVMContext.set(this, (memory) => {
            const callbacks = __classPrivateFieldGet(this, _WasmEngine_config, "f").callbacks ?? {};
            const wasmCallbacks = {
                onVoipReady: () => {
                    __classPrivateFieldGet(this, _WasmEngine_voipReadyResolver, "f")?.call(this);
                    callbacks.onVoipReady?.();
                },
                onSignalingXmpp: (data) => callbacks.onSignalingXmpp?.(data?.peerJid, data?.callId, data?.xmlPayload),
                onCallEvent: (data) => callbacks.onCallEvent?.(data?.eventType, data?.eventDataJson),
                sendDataToRelay: (data) => callbacks.sendDataToRelay?.(data?.data, data?.ip, data?.port),
                loggingCallback: (data) => {
                    if (!__classPrivateFieldGet(this, _WasmEngine_config, "f").enableLogs)
                        return;
                    const level = data?.level;
                    const msg = data?.message ?? "";
                    const mapped = level === 1 ? "error" : level === 2 ? "warn" : level === 3 ? "log" : "debug";
                    callbacks.onLog?.(mapped, msg);
                },
                initCaptureDriverJS: (data) => {
                    callbacks.onAudioCaptureInit?.({
                        sampleRate: data?.sample_rate, channels: data?.channels,
                        bitsPerSample: data?.bits_per_sample, framesPerChunk: data?.frames_per_chunk,
                    });
                    return 0;
                },
                startCaptureJS: () => { callbacks.onAudioCaptureStart?.(); return 0; },
                stopCaptureJS: () => { callbacks.onAudioCaptureStop?.(); return 0; },
                initPlaybackDriverJS: (data) => {
                    callbacks.onAudioPlaybackInit?.({
                        sampleRate: data?.sample_rate, channels: data?.channels,
                        bitsPerSample: data?.bits_per_sample, framesPerChunk: data?.frames_per_chunk,
                    });
                    return 0;
                },
                startPlaybackJS: () => {
                    callbacks.onAudioPlaybackStart?.();
                    __classPrivateFieldGet(this, _WasmEngine_startAudioPlaybackLoop, "f").call(this);
                    return 0;
                },
                stopPlaybackJS: () => {
                    __classPrivateFieldGet(this, _WasmEngine_stopAudioPlaybackLoop, "f").call(this);
                    callbacks.onAudioPlaybackStop?.();
                    return 0;
                },
                startVideoCaptureJS: () => 0,
                stopVideoCaptureJS: () => 0,
                startDesktopCaptureJS: () => 0,
                stopDesktopCaptureJS: () => 0,
                dataChannelStateCallback: () => 0,
                getBrowserAudioProcessingStatus: () => 7,
                getBweModelPath: () => null,
                videoFrameConsumed: () => 0,
                cryptoHkdfExtractWithSaltAndExpand: (data) => {
                    const key = toByteArray(data?.key_);
                    const salt = data?.salt_ ? toByteArray(data.salt_) : new Uint8Array(0);
                    const info = toByteArray(data?.info_);
                    const length = data?.length ?? 32;
                    return callbacks.cryptoHkdf?.(key, salt, info, length) ?? new Uint8Array(length);
                },
                hmacSha256KeyGenerator: (data) => {
                    const hmacData = new Uint8Array(data?.data_ ?? []);
                    const hmacKey = new Uint8Array(data?.key_ ?? []);
                    return callbacks.hmacSha256?.(hmacData, hmacKey) ?? new Uint8Array(32);
                },
                isParticipantKnownContact: () => true,
                getPersistentDirectoryPath: () => {
                    const dir = "/tmp/voip";
                    try {
                        if (!fs.existsSync(dir))
                            fs.mkdirSync(dir, { recursive: true });
                    }
                    catch { }
                    return dir;
                },
            };
            const __d = (name, deps, factory) => {
                __classPrivateFieldGet(this, _WasmEngine_moduleRegistry, "f").set(name, { deps, factory, exports: undefined });
            };
            const babelHelpers = {
                extends: Object.assign,
                inheritsLoose: (sub, sup) => {
                    sub.prototype = Object.create(sup.prototype);
                    sub.prototype.constructor = sub;
                    sub.__proto__ = sup;
                },
                objectWithoutPropertiesLoose: (source, excluded) => {
                    if (source == null)
                        return {};
                    const target = {};
                    for (const key of Object.keys(source)) {
                        if (excluded.indexOf(key) >= 0)
                            continue;
                        target[key] = source[key];
                    }
                    return target;
                },
                taggedTemplateLiteralLoose: (strings, raw) => {
                    if (!raw)
                        raw = strings.slice(0);
                    strings.raw = raw;
                    return strings;
                },
                wrapNativeSuper: (Class) => Class,
            };
            const addRunDependency = (dep) => {
                if (dep === "loading-workers" && __classPrivateFieldGet(this, _WasmEngine_workersLoadedCount, "f") >= PTHREAD_POOL_SIZE) {
                    setImmediate(() => __classPrivateFieldGet(this, _WasmEngine_removeRunDependencyCallback, "f")?.call(this, dep));
                }
            };
            const removeRunDependency = (_dep) => { };
            __classPrivateFieldSet(this, _WasmEngine_removeRunDependencyCallback, removeRunDependency, "f");
            const webCrypto = {
                getRandomValues: (arr) => {
                    if (!arr || !ArrayBuffer.isView(arr)) {
                        throw new TypeError("crypto.getRandomValues expects a TypedArray");
                    }
                    const bytes = Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength);
                    randomFillSync(bytes);
                    return arr;
                },
            };
            const selfObj = {
                __swData: { dynamic_data: { hsdp: {}, dynamic_modules: [] } },
                WhatsAppVoipWasmCallbacks: wasmCallbacks,
                WhatsAppVoipWasmWorkerCompatibleCallbacks: wasmCallbacks,
                crypto: webCrypto,
            };
            selfObj.self = selfObj;
            selfObj.window = selfObj;
            selfObj.globalThis = selfObj;
            if (typeof global !== "undefined") {
                global.WhatsAppVoipWasmCallbacks = wasmCallbacks;
                global.WhatsAppVoipWasmWorkerCompatibleCallbacks = wasmCallbacks;
            }
            const context = vm.createContext({
                self: selfObj, globalThis: selfObj, global: selfObj, window: selfObj,
                console, setTimeout, setInterval, clearTimeout, clearInterval,
                queueMicrotask, performance, babelHelpers, __d,
                require: __classPrivateFieldGet(this, _WasmEngine_requireModule, "f"),
                addRunDependency, removeRunDependency,
                WebAssembly, SharedArrayBuffer,
                Atomics: __classPrivateFieldGet(this, _WasmEngine_createAtomicsWrapper, "f").call(this, memory),
                Int8Array, Uint8Array, Int16Array, Uint16Array, Int32Array, Uint32Array,
                Float32Array, Float64Array, BigInt64Array, BigUint64Array,
                ArrayBuffer, DataView, Error, TypeError, RangeError, Promise,
                Map, Set, WeakMap, WeakSet, Symbol, Object, Array, String, Number,
                Boolean, Math, Date, JSON, RegExp, Function, Proxy, Reflect,
                crypto: webCrypto,
                WhatsAppVoipWasmCallbacks: wasmCallbacks,
                WhatsAppVoipWasmWorkerCompatibleCallbacks: wasmCallbacks,
                navigator: {
                    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                    hardwareConcurrency: 4,
                },
                process: undefined,
                document: { currentScript: null },
                location: { href: "file:///wasm" },
                Worker: class {
                    constructor() { }
                    postMessage() { }
                    terminate() { }
                    addEventListener() { }
                },
                fetch: async () => { throw new Error("fetch not supported"); },
                XMLHttpRequest: class {
                    open() { }
                    send() { }
                    setRequestHeader() { }
                },
                Blob: class {
                    constructor() { }
                },
                URL: { createObjectURL: () => "blob:fake", revokeObjectURL: () => { } },
                Image: class {
                    constructor() {
                        this.src = "";
                        this.onload = null;
                        this.onerror = null;
                    }
                },
                Audio: class {
                    constructor() {
                        this.src = "";
                    }
                    addEventListener() { }
                },
                __NODE_PTHREAD: {
                    getUnusedWorker: () => {
                        if (__classPrivateFieldGet(this, _WasmEngine_unusedWorkers, "f").length === 0)
                            return null;
                        const worker = __classPrivateFieldGet(this, _WasmEngine_unusedWorkers, "f").pop();
                        __classPrivateFieldGet(this, _WasmEngine_runningWorkers, "f").push(worker);
                        return worker;
                    },
                    returnWorkerToPool: (worker) => {
                        const idx = __classPrivateFieldGet(this, _WasmEngine_runningWorkers, "f").indexOf(worker);
                        if (idx >= 0) {
                            __classPrivateFieldGet(this, _WasmEngine_runningWorkers, "f").splice(idx, 1);
                            __classPrivateFieldGet(this, _WasmEngine_unusedWorkers, "f").push(worker);
                        }
                    },
                    spawnThread: (params) => {
                        const worker = __classPrivateFieldGet(this, _WasmEngine_unusedWorkers, "f").pop();
                        if (!worker)
                            return 6;
                        __classPrivateFieldGet(this, _WasmEngine_runningWorkers, "f").push(worker);
                        __classPrivateFieldGet(this, _WasmEngine_pthreads, "f")[params.pthread_ptr] = worker;
                        worker.pthread_ptr = params.pthread_ptr;
                        const pthreadTable = __classPrivateFieldGet(this, _WasmEngine_instance, "f")?.PThread?.pthreads;
                        if (pthreadTable)
                            pthreadTable[params.pthread_ptr] = worker;
                        worker.postMessage({
                            cmd: "run",
                            start_routine: params.startRoutine,
                            arg: params.arg,
                            pthread_ptr: params.pthread_ptr,
                        });
                        return 0;
                    },
                    unusedWorkersCount: () => __classPrivateFieldGet(this, _WasmEngine_unusedWorkers, "f").length,
                    runningWorkersCount: () => __classPrivateFieldGet(this, _WasmEngine_runningWorkers, "f").length,
                },
                __IS_NODE_PTHREAD_ENV: true,
            });
            context.self = context;
            context.globalThis = context;
            context.global = context;
            context.window = context;
            return context;
        });
        _WasmEngine_createAtomicsWrapper.set(this, (_memory) => {
            const atomicsWrapper = {
                add: Atomics.add.bind(Atomics),
                and: Atomics.and.bind(Atomics),
                compareExchange: Atomics.compareExchange.bind(Atomics),
                exchange: Atomics.exchange.bind(Atomics),
                isLockFree: Atomics.isLockFree.bind(Atomics),
                load: Atomics.load.bind(Atomics),
                or: Atomics.or.bind(Atomics),
                store: Atomics.store.bind(Atomics),
                sub: Atomics.sub.bind(Atomics),
                xor: Atomics.xor.bind(Atomics),
                notify: (typedArray, index, count) => {
                    try {
                        return Atomics.notify(typedArray, index, count);
                    }
                    catch (e) {
                        if (e?.message?.includes("futex_wake") || e?.message?.includes("main_browser_thread"))
                            return 0;
                        throw e;
                    }
                },
                waitAsync: Atomics.waitAsync
                    ? Atomics.waitAsync.bind(Atomics)
                    : () => ({ async: true, value: Promise.resolve("ok") }),
                wait: (typedArray, index, value, timeout) => {
                    const currentValue = Atomics.load(typedArray, index);
                    if (currentValue !== value)
                        return "not-equal";
                    if (timeout !== undefined && timeout <= 0)
                        return "timed-out";
                    return "timed-out";
                },
                [Symbol.toStringTag]: "Atomics",
            };
            return atomicsWrapper;
        });
        const basePath = config.resourcesPath
            ? (path.isAbsolute(config.resourcesPath) ? config.resourcesPath : path.resolve(process.cwd(), config.resourcesPath))
            : path.resolve(voipDirectoryPath, "..");
        const wasmPath = config.wasmPath
            ? (path.isAbsolute(config.wasmPath) ? config.wasmPath : path.resolve(process.cwd(), config.wasmPath))
            : path.join(basePath, "assets", "wasm", "whatsapp.wasm");
        __classPrivateFieldSet(this, _WasmEngine_config, {
            ...config,
            wasmPath,
            resourcesPath: basePath,
            enableLogs: config.enableLogs ?? true,
            options: {
                heartbeatInterval: 30,
                lobbyTimeout: 1,
                maxParticipantsScreenShare: 32,
                maxGroupSizeLongRingtone: 32,
                ...config.options,
            },
        }, "f");
    }
}
_b = WasmEngine, _WasmEngine_config = new WeakMap(), _WasmEngine_instance = new WeakMap(), _WasmEngine_initialized = new WeakMap(), _WasmEngine_moduleRegistry = new WeakMap(), _WasmEngine_vmContext = new WeakMap(), _WasmEngine_unusedWorkers = new WeakMap(), _WasmEngine_runningWorkers = new WeakMap(), _WasmEngine_pthreads = new WeakMap(), _WasmEngine_nextWorkerID = new WeakMap(), _WasmEngine_wasmModule = new WeakMap(), _WasmEngine_wasmMemory = new WeakMap(), _WasmEngine_removeRunDependencyCallback = new WeakMap(), _WasmEngine_workersLoadedCount = new WeakMap(), _WasmEngine_audioPlaybackLoopInterval = new WeakMap(), _WasmEngine_audioPlaybackBuffer = new WeakMap(), _WasmEngine_isPlaybackActive = new WeakMap(), _WasmEngine_voipStackInitialized = new WeakMap(), _WasmEngine_voipStackInitPromise = new WeakMap(), _WasmEngine_voipReadyResolver = new WeakMap(), _WasmEngine_voipReadyPromise = new WeakMap(), _WasmEngine_workerModulesCode = new WeakMap(), _WasmEngine_loaderCode = new WeakMap(), _WasmEngine_ensureInitialized = new WeakMap(), _WasmEngine_makeStringList = new WeakMap(), _WasmEngine_createUint8List = new WeakMap(), _WasmEngine_startAudioPlaybackLoop = new WeakMap(), _WasmEngine_stopAudioPlaybackLoop = new WeakMap(), _WasmEngine_applyDefaultAbProps = new WeakMap(), _WasmEngine_allocateUnusedWorker = new WeakMap(), _WasmEngine_initPThreadPool = new WeakMap(), _WasmEngine_loadWasmModuleToWorker = new WeakMap(), _WasmEngine_loadWasmModuleToAllWorkers = new WeakMap(), _WasmEngine_registerGlobalCallbacks = new WeakMap(), _WasmEngine_requireModule = new WeakMap(), _WasmEngine_createVMContext = new WeakMap(), _WasmEngine_createAtomicsWrapper = new WeakMap();
_WasmEngine_globalCallbackListeners = { value: new Map() };
_WasmEngine_globalCallbacksRegistered = { value: false };
WasmEngine.registerGlobalCallbackListener = (callbackName, handler) => {
    const key = `callback:${callbackName}`;
    let set = __classPrivateFieldGet(_a, _b, "f", _WasmEngine_globalCallbackListeners).get(key);
    if (!set) {
        set = new Set();
        __classPrivateFieldGet(_a, _b, "f", _WasmEngine_globalCallbackListeners).set(key, set);
    }
    set.add(handler);
};
WasmEngine.notifyGlobalCallbackListeners = (callbackName, data) => {
    const set = __classPrivateFieldGet(_a, _b, "f", _WasmEngine_globalCallbackListeners).get(`callback:${callbackName}`);
    if (!set)
        return;
    for (const handler of set) {
        try {
            handler(data);
        }
        catch { }
    }
};
_a = WasmEngine;
export default WasmEngine;
//# sourceMappingURL=wasm-engine.js.map