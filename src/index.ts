import makeWASocket from './Socket/index'

export { Dugong } from './Socket/dugong.js'
export { getButtonType } from './Socket/messages-send'
export { VoipClient, ActiveCall, CallState } from './VoIP/index.js'

export * from '../WAProto/index.js'
export * from './Utils/index'
export * from './Types/index'
export * from './Defaults/index'
export * from './WABinary/index'
export * from './WAM/index'
export * from './WAUSync/index'

export type WASocket = ReturnType<typeof makeWASocket>
export { makeWASocket }
export default makeWASocket
