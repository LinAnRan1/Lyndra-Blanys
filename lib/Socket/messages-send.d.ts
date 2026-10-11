import NodeCache from '@cacheable/node-cache';
import { Boom } from '@hapi/boom';
import { proto } from '../../WAProto/index.js';
import type { AnyMessageContent, MediaConnInfo, MessageReceiptType, MessageRelayOptions, MiscMessageGenerationOptions, SocketConfig, WAMessage, WAMessageKey } from '../Types/index.js';
import { MessageRetryManager } from '../Utils/index.js';
import { generateLinkContent, generateLinkContentV2, type CapturedUnifiedResponse, type CodeBlockOptions, type CodeBlockV2Options, type LatexImageOptions, type LatexOptions, type LatexRenderFn, type LinkMessageOptions, type LinkV2MessageOptions, type MediaUploadFn, type QuotedMessage, type RichMessageOptions, type TableV2Options } from '../Utils/rich-messages.js';
import { type BinaryNode, type JidWithDevice } from '../WABinary/index.js';
import { USyncQuery } from '../WAUSync/index.js';
import { Dugong } from './dugong.js';
/**
 * Detect which kind of WhatsApp business "button" payload a message carries.
 * The result decides which `<biz>` node must be attached to the stanza so the
 * recipient's client actually renders buttons / lists / native-flow messages.
 * Returns `null` for ordinary messages.
 */
export declare const getButtonType: (message: proto.IMessage) => string | null;
export declare const makeMessagesSocket: (config: SocketConfig) => {
    userDevicesCache: import("../Types/index.js").PossiblyExtendedCacheStore | NodeCache<JidWithDevice[]>;
    devicesMutex: {
        mutex<T>(code: () => Promise<T> | T): Promise<T>;
    };
    issuePrivacyTokens: (jids: string[], timestamp?: number) => Promise<any>;
    assertSessions: (jids: string[], force?: boolean) => Promise<boolean>;
    relayMessage: (jid: string, message: proto.IMessage, { messageId: msgId, participant, additionalAttributes, additionalNodes, useUserDevicesCache, useCachedGroupMetadata, statusJidList }: MessageRelayOptions) => Promise<string>;
    sendReceipt: (jid: string, participant: string | undefined, messageIds: string[], type: MessageReceiptType) => Promise<void>;
    sendReceipts: (keys: WAMessageKey[], type: MessageReceiptType) => Promise<void>;
    readMessages: (keys: WAMessageKey[]) => Promise<void>;
    refreshMediaConn: (forceGet?: boolean) => Promise<MediaConnInfo>;
    getMediaHost: () => string;
    waUploadToServer: import("../Types/index.js").WAMediaUploadFunction;
    ourin: Dugong;
    fetchPrivacySettings: (force?: boolean) => Promise<{
        [_: string]: string;
    }>;
    sendPeerDataOperationMessage: (pdoMessage: proto.Message.IPeerDataOperationRequestMessage) => Promise<string>;
    createParticipantNodes: (recipientJids: string[], message: proto.IMessage, extraAttrs?: BinaryNode["attrs"], dsmMessage?: proto.IMessage) => Promise<{
        nodes: BinaryNode[];
        shouldIncludeDeviceIdentity: boolean;
    }>;
    getUSyncDevices: (jids: string[], useCache: boolean, ignoreZeroDevices: boolean) => Promise<(JidWithDevice & {
        jid: string;
    })[]>;
    messageRetryManager: MessageRetryManager | null;
    updateMemberLabel: (jid: string, memberLabel: string) => Promise<string>;
    updateMediaMessage: (message: WAMessage) => Promise<WAMessage>;
    sendMessage: (jid: string, content: AnyMessageContent, options?: MiscMessageGenerationOptions) => Promise<any>;
    sendStatusMention: (content: AnyMessageContent, jids?: string[]) => Promise<WAMessage>;
    /** ourin-baileys alias of `issuePrivacyTokens` */
    getPrivacyTokens: (jids: string[]) => Promise<any>;
    /** Send a story/status inside a group (ourin-baileys `swgc`). */
    swgc: (jid: string, content: AnyMessageContent, _options?: MiscMessageGenerationOptions) => Promise<any>;
    /**
     * Send a link message with a fully custom preview card (title, description, thumbnail).
     * `image` may be a Buffer, an http(s) URL string, or a base64 JPEG thumbnail buffer.
     */
    sendPreview: (jid: string, preview: {
        text?: string;
        caption?: string;
        url?: string;
        matchedText?: string;
        title?: string;
        description?: string;
        previewType?: number;
        inviteLinkGroupTypeV2?: number;
        image?: Buffer | string;
        jpegThumbnail?: Buffer | Uint8Array;
        thumbnailWidth?: number;
        thumbnailHeight?: number;
    }, options?: MiscMessageGenerationOptions) => Promise<string>;
    sendTable: (jid: string, title: string, headers: string[], rows: string[][], quoted?: QuotedMessage | null, options?: RichMessageOptions) => Promise<{
        message: proto.IMessage;
        messageId: string;
    }>;
    sendTableV2: (jid: string, table: string[], quoted?: QuotedMessage | null, options?: TableV2Options) => Promise<{
        message: proto.IMessage;
        messageId: string;
    }>;
    sendList: (jid: string, title: string, items: (string | string[])[], quoted?: QuotedMessage | null, options?: RichMessageOptions) => Promise<{
        message: proto.IMessage;
        messageId: string;
    }>;
    sendCodeBlock: (jid: string, code: string, quoted?: QuotedMessage | null, options?: CodeBlockOptions) => Promise<{
        message: proto.IMessage;
        messageId: string;
    }>;
    sendCodeBlockV2: (jid: string, code: string, quoted?: QuotedMessage | null, options?: CodeBlockV2Options) => Promise<{
        message: proto.IMessage;
        messageId: string;
    }>;
    sendLink: (jid: string, text: string, links: Parameters<typeof generateLinkContent>[1], quoted?: QuotedMessage | null, options?: LinkMessageOptions) => Promise<{
        message: proto.IMessage;
        messageId: string;
    }>;
    sendLinkV2: (jid: string, text: string, links: Parameters<typeof generateLinkContentV2>[1], quoted?: QuotedMessage | null, options?: LinkV2MessageOptions) => Promise<{
        message: proto.IMessage;
        messageId: string;
    }>;
    sendLatex: (jid: string, quoted: QuotedMessage | null | undefined, options: LatexOptions) => Promise<{
        message: proto.IMessage;
        messageId: string;
    }>;
    sendLatexImage: (jid: string, quoted: QuotedMessage | null | undefined, options: LatexImageOptions, renderLatexToPng: LatexRenderFn, uploadFn: MediaUploadFn) => Promise<{
        message: proto.IMessage;
        messageId: string;
    }>;
    sendLatexInlineImage: (jid: string, quoted: QuotedMessage | null | undefined, options: LatexImageOptions, renderLatexToPng: LatexRenderFn, uploadFn: MediaUploadFn) => Promise<{
        message: proto.IMessage;
        messageId: string;
    }>;
    captureUnifiedResponse: (msg: proto.IMessage) => CapturedUnifiedResponse | null;
    sendUnifiedResponse: (jid: string, quoted: QuotedMessage | null | undefined, captured: CapturedUnifiedResponse) => Promise<{
        message: proto.IMessage;
        messageId: string;
    }>;
    sendRichMessage: (jid: string, submessages: any[], quoted?: QuotedMessage | null, _options?: object) => Promise<{
        message: proto.IMessage;
        messageId: string;
    }>;
    newsletterFetchAllSubscribe: () => Promise<unknown>;
    newsletterAction: (jid: string, type: string) => Promise<void>;
    newsletterMultipleFollow: (jids: string) => Promise<void>;
    cekIDSaluran: (url: string) => Promise<{
        id: string | undefined;
        state: string | undefined;
        creation_time: number;
        name: string | undefined;
        description: string | undefined;
        invite: string | undefined;
        picture: string;
        preview: string;
        subscribers: number;
        verification: string | undefined;
        viewer_metadata: unknown;
    }>;
    newsletterCreate: (name: string, description?: string) => Promise<import("../Types/index.js").NewsletterMetadata>;
    newsletterUpdate: (jid: string, updates: import("../Types/index.js").NewsletterUpdate) => Promise<unknown>;
    newsletterSubscribers: (jid: string) => Promise<{
        subscribers: number;
    }>;
    newsletterMetadata: (type: "invite" | "jid", key: string) => Promise<import("../Types/index.js").NewsletterMetadata | null>;
    newsletterFollow: (jid: string) => Promise<unknown>;
    newsletterUnfollow: (jid: string) => Promise<unknown>;
    newsletterMute: (jid: string) => Promise<unknown>;
    newsletterUnmute: (jid: string) => Promise<unknown>;
    newsletterUpdateName: (jid: string, name: string) => Promise<unknown>;
    newsletterUpdateDescription: (jid: string, description: string) => Promise<unknown>;
    newsletterUpdatePicture: (jid: string, content: import("../Types/index.js").WAMediaUpload) => Promise<unknown>;
    newsletterRemovePicture: (jid: string) => Promise<unknown>;
    newsletterReactMessage: (jid: string, serverId: string, reaction?: string) => Promise<void>;
    newsletterFetchMessages: (jid: string, count: number, since: number, after: number) => Promise<any>;
    subscribeNewsletterUpdates: (jid: string) => Promise<{
        duration: string;
    } | null>;
    newsletterAdminCount: (jid: string) => Promise<number>;
    newsletterChangeOwner: (jid: string, newOwnerJid: string) => Promise<void>;
    newsletterDemote: (jid: string, userJid: string) => Promise<void>;
    newsletterDelete: (jid: string) => Promise<void>;
    groupMetadata: (jid: string) => Promise<import("../Types/index.js").GroupMetadata>;
    groupCreate: (subject: string, participants: string[]) => Promise<import("../Types/index.js").GroupMetadata>;
    groupLeave: (id: string) => Promise<void>;
    groupUpdateSubject: (jid: string, subject: string) => Promise<void>;
    groupRequestParticipantsList: (jid: string) => Promise<{
        [key: string]: string;
    }[]>;
    groupRequestParticipantsUpdate: (jid: string, participants: string[], action: "approve" | "reject") => Promise<{
        status: string;
        jid: string | undefined;
    }[]>;
    groupParticipantsUpdate: (jid: string, participants: string[], action: import("../Types/index.js").ParticipantAction) => Promise<{
        status: string;
        jid: string | undefined;
        content: BinaryNode;
    }[]>;
    groupUpdateDescription: (jid: string, description?: string) => Promise<void>;
    groupInviteCode: (jid: string) => Promise<string | undefined>;
    groupRevokeInvite: (jid: string) => Promise<string | undefined>;
    groupAcceptInvite: (code: string) => Promise<string | undefined>;
    groupRevokeInviteV4: (groupJid: string, invitedJid: string) => Promise<boolean>;
    groupAcceptInviteV4: (key: string | WAMessageKey, inviteMessage: proto.Message.IGroupInviteMessage) => Promise<any>;
    groupGetInviteInfo: (code: string) => Promise<import("../Types/index.js").GroupMetadata>;
    groupToggleEphemeral: (jid: string, ephemeralExpiration: number) => Promise<void>;
    groupSettingUpdate: (jid: string, setting: "announcement" | "not_announcement" | "locked" | "unlocked") => Promise<void>;
    groupMemberAddMode: (jid: string, mode: "admin_add" | "all_member_add") => Promise<void>;
    groupJoinApprovalMode: (jid: string, mode: "on" | "off") => Promise<void>;
    groupFetchAllParticipating: () => Promise<{
        [_: string]: import("../Types/index.js").GroupMetadata;
    }>;
    serverProps: {
        privacyTokenOn1to1: boolean;
        profilePicPrivacyToken: boolean;
        lidTrustedTokenIssueToLid: boolean;
    };
    createCallLink: (type: "audio" | "video", event?: {
        startTime: number;
    }, timeoutMs?: number) => Promise<string | undefined>;
    getBotListV2: () => Promise<import("../Types/index.js").BotListInfo[]>;
    messageMutex: {
        mutex<T>(code: () => Promise<T> | T): Promise<T>;
    };
    receiptMutex: {
        mutex<T>(code: () => Promise<T> | T): Promise<T>;
    };
    appStatePatchMutex: {
        mutex<T>(code: () => Promise<T> | T): Promise<T>;
    };
    notificationMutex: {
        mutex<T>(code: () => Promise<T> | T): Promise<T>;
    };
    upsertMessage: (msg: WAMessage, type: import("../Types/index.js").MessageUpsertType) => Promise<void>;
    appPatch: (patchCreate: import("../Types/index.js").WAPatchCreate) => Promise<void>;
    sendPresenceUpdate: (type: import("../Types/index.js").WAPresence, toJid?: string) => Promise<void>;
    presenceSubscribe: (toJid: string) => Promise<void>;
    profilePictureUrl: (jid: string, type?: "preview" | "image", timeoutMs?: number) => Promise<string | undefined>;
    fetchBlocklist: () => Promise<(string | undefined)[]>;
    fetchStatus: (...jids: string[]) => Promise<import("../WAUSync/index.js").USyncQueryResultList[] | undefined>;
    fetchDisappearingDuration: (...jids: string[]) => Promise<import("../WAUSync/index.js").USyncQueryResultList[] | undefined>;
    updateProfilePicture: (jid: string, content: import("../Types/index.js").WAMediaUpload, dimensions?: {
        width: number;
        height: number;
    }) => Promise<void>;
    removeProfilePicture: (jid: string) => Promise<void>;
    updateProfileStatus: (status: string) => Promise<void>;
    updateProfileName: (name: string) => Promise<void>;
    updateBlockStatus: (jid: string, action: "block" | "unblock") => Promise<void>;
    updateDisableLinkPreviewsPrivacy: (isPreviewsDisabled: boolean) => Promise<void>;
    updateCallPrivacy: (value: import("../Types/index.js").WAPrivacyCallValue) => Promise<void>;
    updateMessagesPrivacy: (value: import("../Types/index.js").WAPrivacyMessagesValue) => Promise<void>;
    updateLastSeenPrivacy: (value: import("../Types/index.js").WAPrivacyValue) => Promise<void>;
    updateOnlinePrivacy: (value: import("../Types/index.js").WAPrivacyOnlineValue) => Promise<void>;
    updateProfilePicturePrivacy: (value: import("../Types/index.js").WAPrivacyValue) => Promise<void>;
    updateStatusPrivacy: (value: import("../Types/index.js").WAPrivacyValue) => Promise<void>;
    updateReadReceiptsPrivacy: (value: import("../Types/index.js").WAReadReceiptsValue) => Promise<void>;
    updateGroupsAddPrivacy: (value: import("../Types/index.js").WAPrivacyGroupAddValue) => Promise<void>;
    updateDefaultDisappearingMode: (duration: number) => Promise<void>;
    getBusinessProfile: (jid: string) => Promise<import("../Types/index.js").WABusinessProfile | void>;
    resyncAppState: (collections: readonly ("critical_unblock_low" | "regular_high" | "regular_low" | "critical_block" | "regular")[], isInitialSync: boolean) => Promise<void>;
    chatModify: (mod: import("../Types/index.js").ChatModification, jid: string) => Promise<void>;
    cleanDirtyBits: (type: "account_sync" | "groups", fromTimestamp?: number | string) => Promise<void>;
    addOrEditContact: (jid: string, contact: proto.SyncActionValue.IContactAction) => Promise<void>;
    removeContact: (jid: string) => Promise<void>;
    placeholderResendCache: import("../Types/index.js").CacheStore;
    addLabel: (jid: string, labels: import("../Types/Label.js").LabelActionBody) => Promise<void>;
    addChatLabel: (jid: string, labelId: string) => Promise<void>;
    removeChatLabel: (jid: string, labelId: string) => Promise<void>;
    addMessageLabel: (jid: string, messageId: string, labelId: string) => Promise<void>;
    removeMessageLabel: (jid: string, messageId: string, labelId: string) => Promise<void>;
    star: (jid: string, messages: {
        id: string;
        fromMe?: boolean;
    }[], star: boolean) => Promise<void>;
    addOrEditQuickReply: (quickReply: import("../Types/Bussines.js").QuickReplyAction) => Promise<void>;
    removeQuickReply: (timestamp: string) => Promise<void>;
    type: "md";
    ws: import("./Client/websocket.js").WebSocketClient;
    ev: import("../Types/index.js").BaileysEventEmitter & {
        process(handler: (events: Partial<import("../Types/index.js").BaileysEventMap>) => void | Promise<void>): () => void;
        buffer(): void;
        createBufferedFunction<A extends any[], T>(work: (...args: A) => Promise<T>): (...args: A) => Promise<T>;
        flush(): boolean;
        isBuffering(): boolean;
        destroy(): void;
    };
    authState: {
        creds: import("../Types/index.js").AuthenticationCreds;
        keys: import("../Types/index.js").SignalKeyStoreWithTransaction;
    };
    signalRepository: import("../Types/index.js").SignalRepositoryWithLIDStore;
    user: import("../Types/index.js").Contact | undefined;
    generateMessageTag: () => string;
    query: (node: BinaryNode, timeoutMs?: number) => Promise<any>;
    waitForMessage: <T>(msgId: string, timeoutMs?: number | undefined) => Promise<T | undefined>;
    waitForSocketOpen: () => Promise<void>;
    sendRawMessage: (data: Uint8Array | Buffer) => Promise<void>;
    sendNode: (frame: BinaryNode) => Promise<void>;
    logout: (msg?: string) => Promise<void>;
    end: (error: Error | undefined) => Promise<void>;
    registerSocketEndHandler: (handler: (error: Error | undefined) => void | Promise<void>) => void;
    onUnexpectedError: (err: Error | Boom, msg: string) => void;
    uploadPreKeys: (count?: number) => Promise<void>;
    uploadPreKeysToServerIfRequired: () => Promise<void>;
    digestKeyBundle: () => Promise<void>;
    rotateSignedPreKey: () => Promise<void>;
    requestPairingCode: (phoneNumber: string, customPairingCode?: string) => Promise<string>;
    updateServerTimeOffset: ({ attrs }: BinaryNode) => void;
    sendUnifiedSession: () => Promise<void>;
    wamBuffer: import("../index.js").BinaryInfo;
    waitForConnectionUpdate: (check: (u: Partial<import("../Types/index.js").ConnectionState>) => Promise<boolean | undefined>, timeoutMs?: number) => Promise<void>;
    sendWAMBuffer: (wamBuffer: Buffer) => Promise<any>;
    executeUSyncQuery: (usyncQuery: USyncQuery) => Promise<import("../WAUSync/index.js").USyncQueryResult | undefined>;
    onWhatsApp: (...phoneNumber: string[]) => Promise<{
        jid: string;
        exists: boolean;
    }[] | undefined>;
    fetchAccountReachoutTimelock: () => Promise<import("../Types/index.js").ReachoutTimelockState>;
    fetchNewChatMessageCap: () => Promise<import("../Types/index.js").NewChatMessageCapInfo>;
};
//# sourceMappingURL=messages-send.d.ts.map