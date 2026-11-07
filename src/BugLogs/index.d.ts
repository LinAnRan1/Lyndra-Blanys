export interface BugLogsConfig {
	/** print errors (default true once BugLogs is created; it can be switched later) */
	enabled?: boolean
	/** also print the stack trace (default false) */
	stack?: boolean
	/** report messages that arrived but could not be decrypted (default true) */
	decryptFailures?: boolean
	/** report why a connection closed (default true) */
	connectionErrors?: boolean
	/** how many recent errors to keep for `recent()` (default 50) */
	capture?: number
	/** where lines go: a function, a pino-style logger, or console.error when omitted */
	sink?: ((entry: BugLogEntry, line: string) => void) | { error: (obj: any, msg?: string) => void } | null
	prefix?: string
	/** only wrap these socket methods */
	include?: string[] | null
	/** never wrap these socket methods */
	exclude?: string[]
}

export interface BugLogEntry {
	time: number
	scope: string
	message: string
	code?: number | string
	stack?: string
	[key: string]: unknown
}

export interface BugLogs {
	enable: () => boolean
	disable: () => boolean
	readonly enabled: boolean
	recent: () => BugLogEntry[]
	clear: () => void
	stop: () => void
}

export declare const createBugLogs: (sock: any, options?: BugLogsConfig) => BugLogs
