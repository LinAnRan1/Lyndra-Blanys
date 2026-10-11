import type { AlbumMessageContent, AlbumMessageItem, MiscMessageGenerationOptions, WAMessage, WAMessageContent } from '../Types/index.js';
type AlbumMessageOperations = {
    createParentMessage: (message: WAMessageContent, quoted?: WAMessage) => Promise<WAMessage>;
    createMediaMessage: (content: AlbumMessageItem & {
        albumParentKey: WAMessage['key'];
    }) => Promise<WAMessage>;
    relayMessage: (message: WAMessage) => Promise<void>;
};
export declare const sendAlbumMessage: (jid: string, content: AlbumMessageContent, options: MiscMessageGenerationOptions, operations: AlbumMessageOperations) => Promise<WAMessage>;
export {};
//# sourceMappingURL=album.d.ts.map