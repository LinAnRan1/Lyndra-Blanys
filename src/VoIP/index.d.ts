import type { EventEmitter } from 'node:events'
import type { CallState as CallStateValue } from './types.js'

export { CallState } from './types.js'
export type { AudioConfig, CallEvents, CallOptions, RelayListUpdate, VoipSdkConfig } from './types.js'

export declare class ActiveCall extends EventEmitter {
	constructor(
		callId: string,
		engine: { endCall: (reason: number, fromMe: boolean) => void; setMute: (muted: boolean) => void },
		durationMs: number
	)
	callId: string
	engine: { endCall: (reason: number, fromMe: boolean) => void; setMute: (muted: boolean) => void }
	state: CallStateValue
	end: () => void
	mute: (muted: boolean) => void
	waitForEnd: () => Promise<string | undefined>
}

export interface VoipClientConfig {
	resourcesPath?: string
	wasmPath?: string
	wasmBinary?: Uint8Array
	enableLogs?: boolean
	options?: Record<string, unknown>
}

export declare class VoipClient {
	constructor(config?: VoipClientConfig)
	connectWithSocket(socket: unknown): Promise<void>
	call(
		phoneNumber: string,
		options?: { durationMs?: number; audioSource?: 'silence' | 'mic' | string }
	): Promise<ActiveCall>
	endCall(): void
}
