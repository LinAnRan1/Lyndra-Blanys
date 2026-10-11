import { jest } from '@jest/globals'
import { proto } from '../../../WAProto'
import { AIRich, Button, ButtonV2, Carousel, ORich, Toolkit, VERSION } from '../../Utils'

describe('AIRich', () => {
	it('exports the v4.7 builder and builds protobuf rich content', async () => {
		const client = { user: { id: '123@s.whatsapp.net' }, relayMessage: async () => 'sent-id' }
		const builder = new AIRich(client)
			.setTitle('Example')
			.addText('A response')
			.addCode('javascript', 'const answer = 42')
			.addSuggest(['Continue', 'More'])
		const generated = await builder.build('chat@s.whatsapp.net', {
			forwarded: false,
			bypassDownload: false,
			userJid: client.user.id
		})
		const encoded = proto.Message.encode(generated.message!).finish()
		const decoded = proto.Message.decode(encoded)
		const rich = decoded.botForwardedMessage?.message?.richResponseMessage

		expect(VERSION).toBe('4.7')
		expect(new ORich(client)).toBeInstanceOf(AIRich)
		expect(rich?.messageType).toBe(1)
		expect(rich?.submessages?.map(item => item.messageType)).toEqual([2, 5, 2])
		expect(rich?.submessages?.[0]?.messageText).toBe('A response')
		expect(rich?.submessages?.[1]?.codeMetadata?.codeBlocks?.map(block => block.codeContent).join('')).toBe(
			'const answer = 42'
		)
		const responseData = Buffer.from(rich?.unifiedResponse?.data ?? []).toString()
		const response = JSON.parse(responseData) as {
			sections: Array<{ __typename?: string; view_model?: { __typename?: string; primitives?: unknown[] } }>
		}
		expect(response.sections.map(section => section.view_model?.__typename)).toEqual([
			'GenAISingleLayoutViewModel',
			'GenAISingleLayoutViewModel',
			'GenAIHScrollLayoutViewModel'
		])
		expect(response.sections[2]?.__typename).toBe('GenAIUnifiedResponseSection')
		expect(response.sections[2]?.view_model?.primitives).toHaveLength(2)
	})

	it('builds native-flow, legacy-button, and carousel messages locally', async () => {
		const client = { user: { id: '123@s.whatsapp.net' }, relayMessage: async () => 'sent-id' }
		const options = { userJid: client.user.id }

		const nativeFlow = await new Button(client)
			.setBody('Choose')
			.addButton('quick_reply', { display_text: 'Continue', id: 'continue' })
			.build('chat@s.whatsapp.net', options)
		expect(nativeFlow.message?.interactiveMessage?.nativeFlowMessage?.buttons?.[0]?.name).toBe('quick_reply')

		const legacyButtons = await new ButtonV2(client)
			.setBody('Choose')
			.addButton('Continue', 'continue')
			.build('chat@s.whatsapp.net', options)
		expect(legacyButtons.message?.buttonsMessage?.buttons?.[0]?.buttonId).toBe('continue')

		const carousel = new Carousel(client).setBody('Cards').addCard({
			header: { hasMediaAttachment: true, imageMessage: {} },
			body: { text: 'Card' },
			footer: { text: '' },
			nativeFlowMessage: { buttons: [] }
		})
		const carouselMessage = carousel.build('chat@s.whatsapp.net', options)
		expect(carouselMessage.message?.interactiveMessage?.carouselMessage?.cards).toHaveLength(1)
		expect(Toolkit.stringifyEscaped({ text: 'ok' })).toBe('{"text":"ok"}')
	})

	it('relays v4.7 output without requiring optional media dependencies', async () => {
		const relayMessage = jest.fn(async () => 'message-id')
		const client = { user: { id: '123@s.whatsapp.net' }, relayMessage }
		const builder = new AIRich(client).addText('send me')

		await expect(
			builder.send('chat@s.whatsapp.net', {
				forwarded: false,
				bypassDownload: false,
				userJid: client.user.id
			})
		).resolves.toMatchObject({ key: { remoteJid: 'chat@s.whatsapp.net' } })
		expect(relayMessage).toHaveBeenCalledWith(
			'chat@s.whatsapp.net',
			expect.objectContaining({ botForwardedMessage: expect.any(Object) }),
			expect.objectContaining({ userJid: client.user.id })
		)
	})
})
