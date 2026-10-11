import { jest } from '@jest/globals'
import type {
	AlbumMessageContent,
	AlbumMessageItem,
	MiscMessageGenerationOptions,
	WAMessage,
	WAMessageContent
} from '../../Types'
import { sendAlbumMessage } from '../../Socket/album'

const makeMessage = (id: string, message: WAMessageContent): WAMessage => ({ key: { id }, message }) as WAMessage

const options: MiscMessageGenerationOptions = {}
type AlbumOperations = Parameters<typeof sendAlbumMessage>[3]

describe('sendAlbumMessage', () => {
	it('relays an album parent followed by associated media in order', async () => {
		const parentKey = makeMessage('album-id', {}).key
		const albumContent: AlbumMessageContent = {
			albumMessage: [{ image: Buffer.from('image'), caption: 'first' }, { video: Buffer.from('video') }],
			contextInfo: { mentionedJid: ['123@s.whatsapp.net'] }
		}
		const mediaItems: (AlbumMessageItem & { albumParentKey: WAMessage['key'] })[] = []
		const relayed: string[] = []
		const operations = {
			createParentMessage: jest.fn(async (message: WAMessageContent) => makeMessage('album-id', message)),
			createMediaMessage: jest.fn(async (content: AlbumMessageItem & { albumParentKey: WAMessage['key'] }) => {
				mediaItems.push(content)
				return makeMessage(`media-${mediaItems.length}`, {})
			}),
			relayMessage: jest.fn(async (message: WAMessage) => {
				relayed.push(message.key.id!)
			})
		}

		const result = await sendAlbumMessage('chat@s.whatsapp.net', albumContent, options, operations)

		expect(result.key.id).toBe('album-id')
		expect(operations.createParentMessage).toHaveBeenCalledWith(
			expect.objectContaining({
				albumMessage: { expectedImageCount: 1, expectedVideoCount: 1 }
			}),
			undefined
		)
		const parentContent = operations.createParentMessage.mock.calls[0]?.[0]
		expect(parentContent?.messageContextInfo?.messageSecret).toHaveLength(32)
		expect(mediaItems).toHaveLength(2)
		expect(mediaItems[0]?.albumParentKey).toEqual(parentKey)
		expect(mediaItems[0]?.contextInfo?.mentionedJid).toEqual(['123@s.whatsapp.net'])
		expect(relayed).toEqual(['album-id', 'media-1', 'media-2'])
	})

	it('stops and propagates a media generation failure', async () => {
		const failure = new Error('media upload failed')
		const relayed: string[] = []
		let mediaCount = 0
		const operations: AlbumOperations = {
			createParentMessage: async (_message, _quoted) => makeMessage('album-id', {}),
			createMediaMessage: async () => {
				mediaCount += 1
				if (mediaCount === 2) throw failure
				return makeMessage(`media-${mediaCount}`, {})
			},
			relayMessage: async message => {
				relayed.push(message.key.id!)
			}
		}
		const albumContent: AlbumMessageContent = {
			albumMessage: [{ image: Buffer.from('first') }, { video: Buffer.from('second') }, { image: Buffer.from('third') }]
		}

		await expect(sendAlbumMessage('chat@s.whatsapp.net', albumContent, options, operations)).rejects.toBe(failure)
		expect(relayed).toEqual(['album-id', 'media-1'])
	})
})
