import type { proto } from '../../WAProto/index.js'

export interface AntiBugLimits {
	maxText: number
	maxCaption: number
	maxMentions: number
	maxGroupMentions: number
	maxButtons: number
	maxSections: number
	maxRows: number
	maxCards: number
	maxDepth: number
	maxNodes: number
	maxBytes: number
	maxParamsJson: number
	maxInvisibleRun: number
	maxCombiningRun: number
	maxControlChars: number
	maxNewlines: number
	maxPollOptions: number
	maxContacts: number
	maxAiRichItems: number
}

export declare const ANTIBUG_DEFAULTS: AntiBugLimits

export interface DetectResult {
	flagged: boolean
	reasons: string[]
}

export declare const detectBug: (
	message: unknown,
	options?: Partial<AntiBugLimits> & { proto?: typeof proto | null }
) => DetectResult

export interface AnchorGuardConfig {
	autoDelete?: boolean
	deleteMode?: string
	guardIncoming?: boolean
	guardOutgoing?: boolean
	blockOnBug?: boolean
	selfOnly?: boolean
	revokeForEveryoneIfAdmin?: boolean
	kickOnBug?: boolean
	leaveGroupOnBurst?: boolean
	burstThreshold?: number
	burstWindowMs?: number
	cooldownMs?: number
	guardGroupAdds?: boolean
	autoKickBadAdds?: boolean
	metaAiNumbers?: boolean
	addWatchlist?: string[]
	groupMetadata?: ((jid: string) => Promise<any>) | null
	thresholds?: Partial<AntiBugLimits>
	onDetect?: ((event: Record<string, unknown>) => void | Promise<void>) | null
	proto?: typeof proto | null
	logger?: any
	ownJid?: string
}

export interface AntiBugGuard {
	detect: (message: unknown) => DetectResult
	stop: () => void
}

export declare const createAntiBugGuard: (sock: any, options?: AnchorGuardConfig) => AntiBugGuard
