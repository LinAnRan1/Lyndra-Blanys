import makeWASocket from './Socket/index'

export { Dugong } from './Socket/dugong.js'
export { getButtonType } from './Socket/messages-send'
export { VoipClient, ActiveCall, CallState, AudioFeeder, VideoFeeder, VIDEO_FORMAT_I420, makeVoipClient } from './VoIP/index.js'

export * from '../WAProto/index.js'
export * from './Utils/index'
export * from './Store/index.js'
export * from './Types/index'
export * from './Defaults/index'
export * from './WABinary/index'
export * from './WAM/index'
export * from './WAUSync/index'

export type WASocket = ReturnType<typeof makeWASocket>
export { makeWASocket }
export default makeWASocket

export { createAntiBugGuard, detectBug, ANTIBUG_DEFAULTS } from './AnchorGuard/index.js'
export { createBugLogs } from './BugLogs/index.js'
export type { BugLogs, BugLogsConfig, BugLogEntry } from './BugLogs/index.js'
export type { AnchorGuardConfig, AntiBugGuard, AntiBugLimits, DetectResult } from './AnchorGuard/index.js'
