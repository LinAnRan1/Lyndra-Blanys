import type { StickerPackContent, WAMediaUpload } from '../Types/index.js';
export type MakeStickerPackOptions = StickerPackContent & {
    contextInfo?: Record<string, unknown>;
};
type NormalizedSticker = {
    sticker: WAMediaUpload;
    emojis: string[];
    accessibilityLabel: string;
};
export type NormalizedStickerPackContent = Omit<StickerPackContent, 'stickers' | 'cover'> & {
    stickers: NormalizedSticker[];
    cover: WAMediaUpload;
};
export declare const makeStickerPack: ({ name, publisher, description, packId, stickers, cover, contextInfo }: MakeStickerPackOptions) => {
    stickerPack: NormalizedStickerPackContent;
    contextInfo?: Record<string, unknown>;
};
export {};
//# sourceMappingURL=sticker-pack.d.ts.map