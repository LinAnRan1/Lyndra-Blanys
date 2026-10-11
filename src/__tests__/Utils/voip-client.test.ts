import { jest } from '@jest/globals'
import { ActiveCall, CallState, VoipClient } from '../../VoIP/index.js'

describe('VoIP runtime exports', () => {
	it('creates a client without loading optional WebRTC until a socket is connected', () => {
		expect(new VoipClient()).toBeInstanceOf(VoipClient)
		expect(CallState.Idle).toBe(0)
		expect(CallState.Active).toBe(6)
	})

	it('exposes local call state controls without placing a call', () => {
		const engine = { endCall: jest.fn(), setMute: jest.fn() }
		const call = new ActiveCall('local-call', engine, 0)

		expect(call.state).toBe(CallState.Idle)
		call.mute(true)
		call.end()

		expect(engine.setMute).toHaveBeenCalledWith(true)
		expect(engine.endCall).toHaveBeenCalledWith(0, true)
	})
})
