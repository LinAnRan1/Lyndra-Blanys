import { jest } from '@jest/globals'
import { EventEmitter } from 'events'
import type { SocketConfig } from '../../Types'

const sendNode = jest.fn(async (_node: unknown) => undefined)

jest.unstable_mockModule('../../Socket/newsletter', () => ({
	makeNewsletterSocket: jest.fn(() => ({
		ev: Object.assign(new EventEmitter(), {
			buffer: () => {},
			flush: () => true,
			createBufferedFunction: (f: unknown) => f
		}),
		authState: {
			creds: { me: { id: '6281234567890:1@s.whatsapp.net' } },
			keys: { get: async () => ({}), set: async () => {} }
		},
		messageMutex: { mutex: (f: () => unknown) => f() },
		signalRepository: { lidMapping: { getLIDForPN: async () => null, getPNForLID: async () => null } },
		upsertMessage: async () => {},
		query: async () => ({ tag: 'iq', attrs: {} }),
		fetchPrivacySettings: async () => ({}),
		sendNode,
		groupMetadata: async () => ({}),
		groupToggleEphemeral: async () => {},
		registerSocketEndHandler: () => {},
		user: { id: '6281234567890:1@s.whatsapp.net' }
	}))
}))

const { makeMessagesSocket, getButtonType } = await import('../../Socket/messages-send')

describe('getButtonType', () => {
	it('returns null for ordinary messages', () => {
		expect(getButtonType({ conversation: 'hi' })).toBeNull()
		expect(getButtonType({ extendedTextMessage: { text: 'hi' } })).toBeNull()
	})

	it('detects legacy buttons and lists', () => {
		expect(getButtonType({ buttonsMessage: {} })).toBe('buttons')
		expect(getButtonType({ listMessage: {} })).toBe('list')
	})

	it('detects native-flow interactive messages, including inside viewOnce', () => {
		const interactiveMessage = { nativeFlowMessage: { buttons: [{ name: 'quick_reply' }] } }
		expect(getButtonType({ interactiveMessage })).toBe('interactive')
		expect(getButtonType({ viewOnceMessage: { message: { interactiveMessage } } })).toBe('interactive')
	})

	it('maps payment/order native-flow buttons to their biz flow name', () => {
		const make = (name: string) => ({ interactiveMessage: { nativeFlowMessage: { buttons: [{ name }] } } })
		expect(getButtonType(make('review_and_pay'))).toBe('order_details')
		expect(getButtonType(make('review_order'))).toBe('order_status')
		expect(getButtonType(make('payment_info'))).toBe('payment_info')
	})

	it('ignores interactive messages that have no native flow', () => {
		expect(getButtonType({ interactiveMessage: {} })).toBeNull()
	})
})

describe('ourin rich-send API surface', () => {
	it('exposes every ourin-baileys send* helper on the socket', () => {
		const sock = makeMessagesSocket({
			logger: { child: () => ({}), debug() {}, info() {}, warn() {}, error() {}, trace() {} },
			options: {},
			maxMsgRetryCount: 5
		} as unknown as SocketConfig) as Record<string, unknown>

		for (const name of [
			'sendTable',
			'sendTableV2',
			'sendList',
			'sendCodeBlock',
			'sendCodeBlockV2',
			'sendLink',
			'sendLinkV2',
			'sendLatex',
			'sendLatexImage',
			'sendLatexInlineImage',
			'sendUnifiedResponse',
			'captureUnifiedResponse',
			'sendRichMessage',
			'sendStatusMention',
			'sendPreview',
			'swgc',
			'getPrivacyTokens'
		]) {
			expect(typeof sock[name]).toBe('function')
		}
	})
})
