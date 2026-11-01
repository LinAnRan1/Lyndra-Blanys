export class RelayRtcTransport {
    constructor(config: any);
    config: any;
    _relayInfoById: Map<any, any>;
    _connections: Map<any, any>;
    _totals: {
        sentPackets: number;
        receivedPackets: number;
        sentBytes: number;
        receivedBytes: number;
        droppedPackets: number;
        openConnections: number;
    };
    _wrtcPromise: any;
    updateRelayList: (update: any) => void;
    send: (packet: any, ip: any, port: any) => any;
    getStats: () => {
        openConnections: number;
        sentPackets: number;
        receivedPackets: number;
        sentBytes: number;
        receivedBytes: number;
        droppedPackets: number;
    };
    closeAll: () => Promise<void>;
    _getOrCreateConnection: (info: any) => any;
    _getOrCreateEarlyConnection: (ip: any, port: any) => any;
    _ensureConnection: (info: any) => Promise<any>;
    _connect: (connection: any) => Promise<void>;
    _restartIce: (connection: any) => Promise<void>;
    _handleIncomingPacket: (connection: any, raw: any) => void;
    _flushBufferedPackets: (connection: any) => void;
    _sendBufferedPacket: (connection: any, packet: any) => boolean;
    _startIceRttPolling: (connection: any) => void;
    _stopIceRttPolling: (connection: any) => void;
    _readCurrentRoundTripTimeMs: (pc: any) => Promise<number | null>;
    _closeConnection: (id: any) => void;
    _closePeerObjects: (connection: any) => void;
    _loadWrtc: () => any;
}
export default RelayRtcTransport;
//# sourceMappingURL=relay-transport.d.ts.map