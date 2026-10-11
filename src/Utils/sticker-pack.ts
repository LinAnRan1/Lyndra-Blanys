import type { StickerPackContent, WAMediaUpload } from '../Types'

const DEFAULT_EMOJIS = ['😀', '😂', '😍', '🔥', '👍', '🎉', '😎', '🤩', '💯', '🥳']

export type MakeStickerPackOptions = StickerPackContent & {
	contextInfo?: Record<string, unknown>
}

type NormalizedSticker = {
	sticker: WAMediaUpload
	emojis: string[]
	accessibilityLabel: string
}

type StickerDescriptor = Exclude<StickerPackContent['stickers'][number], WAMediaUpload>

const isStickerDescriptor = (entry: StickerPackContent['stickers'][number]): entry is StickerDescriptor =>
	typeof entry === 'object' && entry !== null && !Buffer.isBuffer(entry) && 'sticker' in entry

export type NormalizedStickerPackContent = Omit<StickerPackContent, 'stickers' | 'cover'> & {
	stickers: NormalizedSticker[]
	cover: WAMediaUpload
}

const normalizeSticker = (entry: StickerPackContent['stickers'][number], index: number): NormalizedSticker => {
	if (!isStickerDescriptor(entry)) {
		return {
			sticker: entry,
			emojis: [DEFAULT_EMOJIS[index % DEFAULT_EMOJIS.length]!],
			accessibilityLabel: ''
		}
	}

	return {
		sticker: entry.sticker,
		emojis: entry.emojis ?? [DEFAULT_EMOJIS[index % DEFAULT_EMOJIS.length]!],
		accessibilityLabel: entry.accessibilityLabel ?? ''
	}
}

export const makeStickerPack = ({
	name,
	publisher = 'Ourin AI',
	description = '',
	packId,
	stickers = [],
	cover,
	contextInfo
}: MakeStickerPackOptions): { stickerPack: NormalizedStickerPackContent; contextInfo?: Record<string, unknown> } => {
	if (!name) throw new Error('makeStickerPack: name is required')
	if (stickers.length === 0) throw new Error('makeStickerPack: at least one sticker is required')

	const normalizedStickers = stickers.map(normalizeSticker)
	return {
		stickerPack: {
			name,
			publisher,
			description,
			...(packId ? { packId } : {}),
			stickers: normalizedStickers,
			cover: cover ?? normalizedStickers[0]!.sticker
		},
		...(contextInfo ? { contextInfo } : {})
	}
}