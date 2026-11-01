export class WasmEngine {
    static "__#11@#globalCallbackListeners": Map<any, any>;
    static "__#11@#globalCallbacksRegistered": boolean;
    static registerGlobalCallbackListener: (callbackName: any, handler: any) => void;
    static notifyGlobalCallbackListeners: (callbackName: any, data: any) => void;
    constructor(config?: {});
    initialize: () => Promise<void>;
    isInitialized: () => boolean;
    destroy: () => void;
    initVoipStack: (selfJid: any, meUserJid: any, selfLid: any) => void;
    waitForVoipStackReady: () => Promise<void>;
    isVoipStackReady: () => boolean;
    startCall: (options: any) => any;
    startGroupCall: (options: any) => any;
    joinOngoingCall: (options: any) => any;
    acceptCall: (isMicEnabled?: boolean, isCameraEnabled?: boolean) => any;
    endCall: (reason?: number, sendTerminate?: boolean) => void;
    setMute: (muted: any) => any;
    updateNetworkMedium: (networkMedium: any, networkMtu?: number) => void;
    handleSignalingOffer: (msg: any) => void;
    handleSignalingMessage: (msg: any) => void;
    handleSignalingAck: (msg: any) => void;
    handleSignalingReceipt: (msg: any) => void;
    handleOnTransportMessage: (data: any, ip: any, port: any) => void;
    updateIceRtt: (rttMs: any, relayIp: any, relayPort: any) => void;
    startScreenShare: () => any;
    stopScreenShare: () => any;
    sendVideoFrame: (frame: any, width: any, height: any, fps: any, format?: number, orientation?: number, useDesktopCapture?: boolean) => boolean;
    releaseVideoFrameBuffer: () => void;
    sendAudioData: (data: any, ptr: any) => void;
    malloc: (size: any) => any;
    free: (ptr: any) => void;
    #private;
}
export default WasmEngine;
//# sourceMappingURL=wasm-engine.d.ts.map