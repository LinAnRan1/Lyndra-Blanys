import { jest } from '@jest/globals'
import { existsSync } from 'fs'
import { proto } from '../../../WAProto'
import {
	CodeHighlightType,
	generateCodeBlockContentV2,
	generateLinkContent,
	generateWAMessageContent,
	makeStickerPack,
	generateTableContentV2,
	tokenizeCodeV2
} from '../../Utils'

const getRichResponse = (message: proto.IMessage) => message.botForwardedMessage?.message?.richResponseMessage

describe('rich-message utilities', () => {
	it('normalizes sticker-pack descriptors and chooses the first sticker as cover', () => {
		const pack = makeStickerPack({
			name: 'Pack',
			stickers: [Buffer.from('webp'), { sticker: { url: 'https://example.com/sticker.webp' }, emojis: ['✨'] }]
		})

		expect(pack.stickerPack.cover).toEqual(Buffer.from('webp'))
		expect(pack.stickerPack.stickers[0]?.emojis).toEqual(['😀'])
		expect(pack.stickerPack.stickers[1]?.emojis).toEqual(['✨'])
	})

	it('generates and uploads an encrypted sticker-pack protobuf through the RC14 upload contract', async () => {
		const webp = Buffer.alloc(12)
		webp.write('RIFF', 0)
		webp.writeUInt32LE(4, 4)
		webp.write('WEBP', 8)
		const upload = jest.fn(async (filePath: string, options: { mediaType: string }) => {
			expect(existsSync(filePath)).toBe(true)
			return { mediaUrl: 'https://mmg.whatsapp.net/pack', directPath: '/pack' }
		})
		const content = makeStickerPack({ name: 'Pack', stickers: [webp] })
		const message = await generateWAMessageContent(content, { upload })

		expect(upload).toHaveBeenCalledTimes(1)
		expect(upload.mock.calls[0]?.[1].mediaType).toBe('sticker-pack')
		expect(message.stickerPackMessage).toMatchObject({
			name: 'Pack',
			stickerPackSize: expect.any(Number),
			directPath: '/pack',
			stickers: [{ mimetype: 'image/webp', emojis: ['😀'] }]
		})
	})

	it('tokenizes v2 language aliases, comments, strings, and numeric literals', () => {
		const { codeBlock, unified_codeBlock } = tokenizeCodeV2('const value = 0x2a // note\n', 'js')

		expect(
			codeBlock.some(token => token.highlightType === CodeHighlightType.KEYWORD && token.codeContent === 'const')
		).toBe(true)
		expect(
			codeBlock.some(token => token.highlightType === CodeHighlightType.NUMBER && token.codeContent === '0x2a')
		).toBe(true)
		expect(
			codeBlock.some(
				token => token.highlightType === CodeHighlightType.COMMENT && token.codeContent.includes('// note')
			)
		).toBe(true)
		expect(unified_codeBlock.map(token => token.content).join('')).toBe('const value = 0x2a // note\n')
	})

	it('serializes table v2 delimiters and optional sections', () => {
		const generated = generateTableContentV2(['Metrics', 'Name | Count', 'Chats | 42;;Users | 8'], undefined, {
			headerText: 'Summary',
			text: 'Current totals',
			footer: 'Updated'
		})
		const rich = getRichResponse(generated.message as proto.IMessage)
		const response = JSON.parse(Buffer.from(String(rich?.unifiedResponse?.data ?? ''), 'base64').toString()) as {
			sections: Array<{ view_model?: { primitive?: { rows?: Array<{ cells: string[] }> } } }>
		}

		expect(rich?.messageType).toBe(1)
		expect(response.sections).toHaveLength(4)
		expect(response.sections[2]?.view_model?.primitive?.rows?.map(row => row.cells)).toEqual([
			['Name', 'Count'],
			['Chats', '42'],
			['Users', '8']
		])
	})

	it('builds code block v2 as a unified code primitive', () => {
		const generated = generateCodeBlockContentV2('print("ok")', undefined, { language: 'py', text: 'Example' })
		const rich = getRichResponse(generated.message as proto.IMessage)
		const response = JSON.parse(Buffer.from(String(rich?.unifiedResponse?.data ?? ''), 'base64').toString()) as {
			sections: Array<{
				view_model?: { primitive?: { __typename?: string; language?: string; code_blocks?: Array<{ type: string }> } }
			}>
		}

		expect(response.sections[1]?.view_model?.primitive).toMatchObject({
			__typename: 'GenAICodeUXPrimitive',
			language: 'py'
		})
		expect(response.sections[1]?.view_model?.primitive?.code_blocks?.some(token => token.type === 'KEYWORD')).toBe(true)
	})

	it('serializes inline links, citations, and proof metadata', () => {
		const generated = generateLinkContent('{{IE_0}}Docs{{/IE_0}}', ['https://example.com'], undefined, {
			citations: [{ sourceTitle: 'Example', citationNumber: 1 }],
			proofs: [{ version: 1, useCase: 1, signature: 'sig', certificateChain: ['cert'] }]
		})
		const message = generated.message as proto.IMessage
		const rich = getRichResponse(message)
		const response = JSON.parse(Buffer.from(String(rich?.unifiedResponse?.data ?? ''), 'base64').toString()) as {
			sections: Array<{ view_model?: { primitive?: { inline_entities?: unknown[] } } }>
		}

		expect(response.sections[0]?.view_model?.primitive?.inline_entities).toHaveLength(1)
		expect(message.messageContextInfo?.botMetadata?.verificationMetadata?.proofs).toHaveLength(1)
		expect(message.messageContextInfo?.botMetadata?.richResponseSourcesMetadata?.sources?.[0]?.sourceTitle).toBe(
			'Example'
		)
	})
})
