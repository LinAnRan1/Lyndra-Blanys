const DEFAULT_EMOJIS = ['😀', '😂', '😍', '🔥', '👍', '🎉', '😎', '🤩', '💯', '🥳'];
const isStickerDescriptor = (entry) => typeof entry === 'object' && entry !== null && !Buffer.isBuffer(entry) && 'sticker' in entry;
const normalizeSticker = (entry, index) => {
    if (!isStickerDescriptor(entry)) {
        return {
            sticker: entry,
            emojis: [DEFAULT_EMOJIS[index % DEFAULT_EMOJIS.length]],
            accessibilityLabel: ''
        };
    }
    return {
        sticker: entry.sticker,
        emojis: entry.emojis ?? [DEFAULT_EMOJIS[index % DEFAULT_EMOJIS.length]],
        accessibilityLabel: entry.accessibilityLabel ?? ''
    };
};
export const makeStickerPack = ({ name, publisher = 'Ourin AI', description = '', packId, stickers = [], cover, contextInfo }) => {
    if (!name)
        throw new Error('makeStickerPack: name is required');
    if (stickers.length === 0)
        throw new Error('makeStickerPack: at least one sticker is required');
    const normalizedStickers = stickers.map(normalizeSticker);
    return {
        stickerPack: {
            name,
            publisher,
            description,
            ...(packId ? { packId } : {}),
            stickers: normalizedStickers,
            cover: cover ?? normalizedStickers[0].sticker
        },
        ...(contextInfo ? { contextInfo } : {})
    };
};
//# sourceMappingURL=sticker-pack.js.map