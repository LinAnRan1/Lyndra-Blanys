import { Boom } from '@hapi/boom'
import { randomBytes } from 'crypto'
import type {
	AlbumMessageContent,
	AlbumMessageItem,
	MiscMessageGenerationOptions,
	WAMessage,
	WAMessageContent
} from '../Types'

type AlbumMessageOperations = {
	createParentMessage: (message: WAMessageContent, quoted?: WAMessage) => Promise<WAMessage>
	createMediaMessage: (content: AlbumMessageItem & { albumParentKey: WAMessage['key'] }) => Promise<WAMessage>
	relayMessage: (message: WAMessage) => Promise<void>
}

export const sendAlbumMessage = async (
	jid: string,
	content: AlbumMessageContent,
	options: MiscMessageGenerationOptions,
	operations: AlbumMessageOperations
): Promise<WAMessage> => {
	const items = content.albumMessage
	if (items.length === 0 || items.some(item => 'image' in item === 'video' in item)) {
		throw new Boom('albumMessage requires at least one image or video item', { statusCode: 400 })
	}

	const album = await operations.createParentMessage(
		{
			messageContextInfo: { messageSecret: randomBytes(32) },
			albumMessage: {
				expectedImageCount: items.filter(item => 'image' in item).length,
				expectedVideoCount: items.filter(item => 'video' in item).length
			}
		},
		options.quoted
	)
	if (!album.message || !album.key.id) {
		throw new Boom('failed to generate album parent message', { statusCode: 500 })
	}

	await operations.relayMessage(album)

	for (const item of items) {
		const contextInfo =
			content.contextInfo && Object.keys(content.contextInfo).length > 0 && !item.contextInfo
				? content.contextInfo
				: item.contextInfo
		const mediaMessage = await operations.createMediaMessage({
			...item,
			...(contextInfo ? { contextInfo } : {}),
			albumParentKey: album.key
		})
		if (!mediaMessage.message || !mediaMessage.key.id) {
			throw new Boom('failed to generate album media message', { statusCode: 500 })
		}

		await operations.relayMessage(mediaMessage)
	}

	return album
}
