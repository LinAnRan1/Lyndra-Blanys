import type { UserFacingSocketConfig } from '../Types/index.js';
declare const makeWASocket: (config: UserFacingSocketConfig) => {
    communityMetadata: (jid: string) => Promise<import("../index.js").GroupMetadata>;
    communityCreate: (subject: string, body: string) => Promise<import("../index.js").GroupMetadata | null>;
    communityCreateGroup: (subject: string, participants: string[], parentCommunityJid: string) => Promise<import("../index.js").GroupMetadata | null>;
    communityLeave: (id: string) => Promise<void>;
    communityUpdateSubject: (jid: string, subject: string) => Promise<void>;
    communityLinkGroup: (groupJid: string, parentCommunityJid: string) => Promise<void>;
    communityUnlinkGroup: (groupJid: string, parentCommunityJid: string) => Promise<void>;
    communityFetchLinkedGroups: (jid: string) => Promise<{
        communityJid: string;
        isCommunity: boolean;
        linkedGroups: {
            id: string | undefined;
            subject: string;
            creation: number | undefined;
            owner: string | undefined;
            size: number | undefined;
        }[];
    }>;
    communityRequestParticipantsList: (jid: string) => Promise<{
        [key: string]: string;
    }[]>;
    communityRequestParticipantsUpdate: (jid: string, participants: string[], action: "approve" | "reject") => Promise<{
        status: string;
        jid: string | undefined;
    }[]>;
    communityParticipantsUpdate: (jid: string, participants: string[], action: import("../index.js").ParticipantAction) => Promise<{
        status: string;
        jid: string | undefined;
        content: import("../index.js").BinaryNode;
    }[]>;
    communityUpdateDescription: (jid: string, description?: string) => Promise<void>;
    communityInviteCode: (jid: string) => Promise<string | undefined>;
    communityRevokeInvite: (jid: string) => Promise<string | undefined>;
    communityAcceptInvite: (code: string) => Promise<string | undefined>;
    communityRevokeInviteV4: (communityJid: string, invitedJid: string) => Promise<boolean>;
    communityAcceptInviteV4: (key: string | import("../index.js").WAMessageKey, inviteMessage: import("../index.js").proto.Message.IGroupInviteMessage) => Promise<any>;
    communityGetInviteInfo: (code: string) => Promise<import("../index.js").GroupMetadata>;
    communityToggleEphemeral: (jid: string, ephemeralExpiration: number) => Promise<void>;
    communitySettingUpdate: (jid: string, setting: "announcement" | "not_announcement" | "locked" | "unlocked") => Promise<void>;
    communityMemberAddMode: (jid: string, mode: "admin_add" | "all_member_add") => Promise<void>;
    communityJoinApprovalMode: (jid: string, mode: "on" | "off") => Promise<void>;
    communityFetchAllParticipating: () => Promise<{
        [_: string]: import("../index.js").GroupMetadata;
    }>;
    logger: import("../Utils/logger.js").ILogger;
    getOrderDetails: (orderId: string, tokenBase64: string) => Promise<import("../index.js").OrderDetails>;
    getCatalog: ({ jid, limit, cursor }: import("../index.js").GetCatalogOptions) => Promise<{
        products: import("../index.js").Product[];
        nextPageCursor: string | undefined;
    }>;
    getCollections: (jid?: string, limit?: number) => Promise<{
        collections: import("../index.js").CatalogCollection[];
    }>;
    productCreate: (create: import("../index.js").ProductCreate) => Promise<import("../index.js").Product>;
    productDelete: (productIds: string[]) => Promise<{
        deleted: number;
    }>;
    productUpdate: (productId: string, update: import("../index.js").ProductUpdate) => Promise<import("../index.js").Product>;
    updateBussinesProfile: (args: import("../Types/Bussines.js").UpdateBussinesProfileProps) => Promise<any>;
    updateBusinessProfile: (args: import("../Types/Bussines.js").UpdateBussinesProfileProps) => Promise<any>;
    updateCoverPhoto: (photo: import("../index.js").WAMediaUpload) => Promise<number>;
    removeCoverPhoto: (id: string) => Promise<any>;
    sendMessageAck: (node: import("../index.js").BinaryNode, errorCode?: number) => Promise<void>;
    sendRetryRequest: (node: import("../index.js").BinaryNode, forceIncludeKeys?: boolean) => Promise<void>;
    rejectCall: (callId: string, callFrom: string) => Promise<void>;
    fetchMessageHistory: (count: number, oldestMsgKey: import("../index.js").WAMessageKey, oldestMsgTimestamp: number | import("long").default) => Promise<string>;
    requestPlaceholderResend: (messageKey: import("../index.js").WAMessageKey, msgData?: Partial<import("../index.js").WAMessage>) => Promise<string | undefined>;
    messageRetryManager: import("../index.js").MessageRetryManager | null;
    userDevicesCache: import("../index.js").PossiblyExtendedCacheStore | import("@cacheable/node-cache").NodeCache<import("../index.js").JidWithDevice[]>;
    devicesMutex: {
        mutex<T>(code: () => Promise<T> | T): Promise<T>;
    };
    issuePrivacyTokens: (jids: string[], timestamp?: number) => Promise<any>;
    assertSessions: (jids: string[], force?: boolean) => Promise<boolean>;
    relayMessage: (jid: string, message: import("../index.js").proto.IMessage, { messageId: msgId, participant, additionalAttributes, additionalNodes, useUserDevicesCache, useCachedGroupMetadata, statusJidList }: import("../index.js").MessageRelayOptions) => Promise<string>;
    sendReceipt: (jid: string, participant: string | undefined, messageIds: string[], type: import("../index.js").MessageReceiptType) => Promise<void>;
    sendReceipts: (keys: import("../index.js").WAMessageKey[], type: import("../index.js").MessageReceiptType) => Promise<void>;
    readMessages: (keys: import("../index.js").WAMessageKey[]) => Promise<void>;
    refreshMediaConn: (forceGet?: boolean) => Promise<import("../index.js").MediaConnInfo>;
    getMediaHost: () => string;
    waUploadToServer: import("../index.js").WAMediaUploadFunction;
    ourin: import("./dugong.js").Dugong;
    fetchPrivacySettings: (force?: boolean) => Promise<{
        [_: string]: string;
    }>;
    sendPeerDataOperationMessage: (pdoMessage: import("../index.js").proto.Message.IPeerDataOperationRequestMessage) => Promise<string>;
    createParticipantNodes: (recipientJids: string[], message: import("../index.js").proto.IMessage, extraAttrs?: import("../index.js").BinaryNode["attrs"], dsmMessage?: import("../index.js").proto.IMessage) => Promise<{
        nodes: import("../index.js").BinaryNode[];
        shouldIncludeDeviceIdentity: boolean;
    }>;
    getUSyncDevices: (jids: string[], useCache: boolean, ignoreZeroDevices: boolean) => Promise<(import("../index.js").JidWithDevice & {
        jid: string;
    })[]>;
    updateMemberLabel: (jid: string, memberLabel: string) => Promise<string>;
    updateMediaMessage: (message: import("../index.js").WAMessage) => Promise<import("../index.js").WAMessage>;
    sendMessage: (jid: string, content: import("../index.js").AnyMessageContent, options?: import("../index.js").MiscMessageGenerationOptions) => Promise<any>;
    sendStatusMention: (content: import("../index.js").AnyMessageContent, jids?: string[]) => Promise<import("../index.js").WAMessage>;
    getPrivacyTokens: (jids: string[]) => Promise<any>;
    swgc: (jid: string, content: import("../index.js").AnyMessageContent, _options?: import("../index.js").MiscMessageGenerationOptions) => Promise<any>;
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
    }, options?: import("../index.js").MiscMessageGenerationOptions) => Promise<string>;
    sendTable: (jid: string, title: string, headers: string[], rows: string[][], quoted?: import("../index.js").QuotedMessage | null, options?: import("../index.js").RichMessageOptions) => Promise<{
        message: import("../index.js").proto.IMessage;
        messageId: string;
    }>;
    sendTableV2: (jid: string, table: string[], quoted?: import("../index.js").QuotedMessage | null, options?: import("../index.js").TableV2Options) => Promise<{
        message: import("../index.js").proto.IMessage;
        messageId: string;
    }>;
    sendList: (jid: string, title: string, items: (string | string[])[], quoted?: import("../index.js").QuotedMessage | null, options?: import("../index.js").RichMessageOptions) => Promise<{
        message: import("../index.js").proto.IMessage;
        messageId: string;
    }>;
    sendCodeBlock: (jid: string, code: string, quoted?: import("../index.js").QuotedMessage | null, options?: import("../index.js").CodeBlockOptions) => Promise<{
        message: import("../index.js").proto.IMessage;
        messageId: string;
    }>;
    sendCodeBlockV2: (jid: string, code: string, quoted?: import("../index.js").QuotedMessage | null, options?: import("../index.js").CodeBlockV2Options) => Promise<{
        message: import("../index.js").proto.IMessage;
        messageId: string;
    }>;
    sendLink: (jid: string, text: string, links: Parameters<typeof import("../index.js").generateLinkContent>[1], quoted?: import("../index.js").QuotedMessage | null, options?: import("../index.js").LinkMessageOptions) => Promise<{
        message: import("../index.js").proto.IMessage;
        messageId: string;
    }>;
    sendLinkV2: (jid: string, text: string, links: Parameters<typeof import("../index.js").generateLinkContentV2>[1], quoted?: import("../index.js").QuotedMessage | null, options?: import("../index.js").LinkV2MessageOptions) => Promise<{
        message: import("../index.js").proto.IMessage;
        messageId: string;
    }>;
    sendLatex: (jid: string, quoted: import("../index.js").QuotedMessage | null | undefined, options: import("../index.js").LatexOptions) => Promise<{
        message: import("../index.js").proto.IMessage;
        messageId: string;
    }>;
    sendLatexImage: (jid: string, quoted: import("../index.js").QuotedMessage | null | undefined, options: import("../index.js").LatexImageOptions, renderLatexToPng: import("../index.js").LatexRenderFn, uploadFn: import("../index.js").MediaUploadFn) => Promise<{
        message: import("../index.js").proto.IMessage;
        messageId: string;
    }>;
    sendLatexInlineImage: (jid: string, quoted: import("../index.js").QuotedMessage | null | undefined, options: import("../index.js").LatexImageOptions, renderLatexToPng: import("../index.js").LatexRenderFn, uploadFn: import("../index.js").MediaUploadFn) => Promise<{
        message: import("../index.js").proto.IMessage;
        messageId: string;
    }>;
    captureUnifiedResponse: (msg: import("../index.js").proto.IMessage) => import("../index.js").CapturedUnifiedResponse | null;
    sendUnifiedResponse: (jid: string, quoted: import("../index.js").QuotedMessage | null | undefined, captured: import("../index.js").CapturedUnifiedResponse) => Promise<{
        message: import("../index.js").proto.IMessage;
        messageId: string;
    }>;
    sendRichMessage: (jid: string, submessages: any[], quoted?: import("../index.js").QuotedMessage | null, _options?: object) => Promise<{
        message: import("../index.js").proto.IMessage;
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
    newsletterCreate: (name: string, description?: string) => Promise<import("../index.js").NewsletterMetadata>;
    newsletterUpdate: (jid: string, updates: import("../index.js").NewsletterUpdate) => Promise<unknown>;
    newsletterSubscribers: (jid: string) => Promise<{
        subscribers: number;
    }>;
    newsletterMetadata: (type: "invite" | "jid", key: string) => Promise<import("../index.js").NewsletterMetadata | null>;
    newsletterFollow: (jid: string) => Promise<unknown>;
    newsletterUnfollow: (jid: string) => Promise<unknown>;
    newsletterMute: (jid: string) => Promise<unknown>;
    newsletterUnmute: (jid: string) => Promise<unknown>;
    newsletterUpdateName: (jid: string, name: string) => Promise<unknown>;
    newsletterUpdateDescription: (jid: string, description: string) => Promise<unknown>;
    newsletterUpdatePicture: (jid: string, content: import("../index.js").WAMediaUpload) => Promise<unknown>;
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
    groupMetadata: (jid: string) => Promise<import("../index.js").GroupMetadata>;
    groupCreate: (subject: string, participants: string[]) => Promise<import("../index.js").GroupMetadata>;
    groupLeave: (id: string) => Promise<void>;
    groupUpdateSubject: (jid: string, subject: string) => Promise<void>;
    groupRequestParticipantsList: (jid: string) => Promise<{
        [key: string]: string;
    }[]>;
    groupRequestParticipantsUpdate: (jid: string, participants: string[], action: "approve" | "reject") => Promise<{
        status: string;
        jid: string | undefined;
    }[]>;
    groupParticipantsUpdate: (jid: string, participants: string[], action: import("../index.js").ParticipantAction) => Promise<{
        status: string;
        jid: string | undefined;
        content: import("../index.js").BinaryNode;
    }[]>;
    groupUpdateDescription: (jid: string, description?: string) => Promise<void>;
    groupInviteCode: (jid: string) => Promise<string | undefined>;
    groupRevokeInvite: (jid: string) => Promise<string | undefined>;
    groupAcceptInvite: (code: string) => Promise<string | undefined>;
    groupRevokeInviteV4: (groupJid: string, invitedJid: string) => Promise<boolean>;
    groupAcceptInviteV4: (key: string | import("../index.js").WAMessageKey, inviteMessage: import("../index.js").proto.Message.IGroupInviteMessage) => Promise<any>;
    groupGetInviteInfo: (code: string) => Promise<import("../index.js").GroupMetadata>;
    groupToggleEphemeral: (jid: string, ephemeralExpiration: number) => Promise<void>;
    groupSettingUpdate: (jid: string, setting: "announcement" | "not_announcement" | "locked" | "unlocked") => Promise<void>;
    groupMemberAddMode: (jid: string, mode: "admin_add" | "all_member_add") => Promise<void>;
    groupJoinApprovalMode: (jid: string, mode: "on" | "off") => Promise<void>;
    groupFetchAllParticipating: () => Promise<{
        [_: string]: import("../index.js").GroupMetadata;
    }>;
    serverProps: {
        privacyTokenOn1to1: boolean;
        profilePicPrivacyToken: boolean;
        lidTrustedTokenIssueToLid: boolean;
    };
    createCallLink: (type: "audio" | "video", event?: {
        startTime: number;
    }, timeoutMs?: number) => Promise<string | undefined>;
    getBotListV2: () => Promise<import("../index.js").BotListInfo[]>;
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
    upsertMessage: (msg: import("../index.js").WAMessage, type: import("../index.js").MessageUpsertType) => Promise<void>;
    appPatch: (patchCreate: import("../index.js").WAPatchCreate) => Promise<void>;
    sendPresenceUpdate: (type: import("../index.js").WAPresence, toJid?: string) => Promise<void>;
    presenceSubscribe: (toJid: string) => Promise<void>;
    profilePictureUrl: (jid: string, type?: "preview" | "image", timeoutMs?: number) => Promise<string | undefined>;
    fetchBlocklist: () => Promise<(string | undefined)[]>;
    fetchStatus: (...jids: string[]) => Promise<import("../index.js").USyncQueryResultList[] | undefined>;
    fetchDisappearingDuration: (...jids: string[]) => Promise<import("../index.js").USyncQueryResultList[] | undefined>;
    updateProfilePicture: (jid: string, content: import("../index.js").WAMediaUpload, dimensions?: {
        width: number;
        height: number;
    }) => Promise<void>;
    removeProfilePicture: (jid: string) => Promise<void>;
    updateProfileStatus: (status: string) => Promise<void>;
    updateProfileName: (name: string) => Promise<void>;
    updateBlockStatus: (jid: string, action: "block" | "unblock") => Promise<void>;
    updateDisableLinkPreviewsPrivacy: (isPreviewsDisabled: boolean) => Promise<void>;
    updateCallPrivacy: (value: import("../index.js").WAPrivacyCallValue) => Promise<void>;
    updateMessagesPrivacy: (value: import("../index.js").WAPrivacyMessagesValue) => Promise<void>;
    updateLastSeenPrivacy: (value: import("../index.js").WAPrivacyValue) => Promise<void>;
    updateOnlinePrivacy: (value: import("../index.js").WAPrivacyOnlineValue) => Promise<void>;
    updateProfilePicturePrivacy: (value: import("../index.js").WAPrivacyValue) => Promise<void>;
    updateStatusPrivacy: (value: import("../index.js").WAPrivacyValue) => Promise<void>;
    updateReadReceiptsPrivacy: (value: import("../index.js").WAReadReceiptsValue) => Promise<void>;
    updateGroupsAddPrivacy: (value: import("../index.js").WAPrivacyGroupAddValue) => Promise<void>;
    updateDefaultDisappearingMode: (duration: number) => Promise<void>;
    getBusinessProfile: (jid: string) => Promise<import("../index.js").WABusinessProfile | void>;
    resyncAppState: (collections: readonly ("critical_unblock_low" | "regular_high" | "regular_low" | "critical_block" | "regular")[], isInitialSync: boolean) => Promise<void>;
    chatModify: (mod: import("../index.js").ChatModification, jid: string) => Promise<void>;
    cleanDirtyBits: (type: "account_sync" | "groups", fromTimestamp?: number | string) => Promise<void>;
    addOrEditContact: (jid: string, contact: import("../index.js").proto.SyncActionValue.IContactAction) => Promise<void>;
    removeContact: (jid: string) => Promise<void>;
    placeholderResendCache: import("../index.js").CacheStore;
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
    ws: import("./Client/index.js").WebSocketClient;
    ev: import("../index.js").BaileysEventEmitter & {
        process(handler: (events: Partial<import("../index.js").BaileysEventMap>) => void | Promise<void>): () => void;
        buffer(): void;
        createBufferedFunction<A extends any[], T>(work: (...args: A) => Promise<T>): (...args: A) => Promise<T>;
        flush(): boolean;
        isBuffering(): boolean;
        destroy(): void;
    };
    authState: {
        creds: import("../index.js").AuthenticationCreds;
        keys: import("../index.js").SignalKeyStoreWithTransaction;
    };
    signalRepository: import("../index.js").SignalRepositoryWithLIDStore;
    user: import("../index.js").Contact | undefined;
    generateMessageTag: () => string;
    query: (node: import("../index.js").BinaryNode, timeoutMs?: number) => Promise<any>;
    waitForMessage: <T>(msgId: string, timeoutMs?: number | undefined) => Promise<T | undefined>;
    waitForSocketOpen: () => Promise<void>;
    sendRawMessage: (data: Uint8Array | Buffer) => Promise<void>;
    sendNode: (frame: import("../index.js").BinaryNode) => Promise<void>;
    logout: (msg?: string) => Promise<void>;
    end: (error: Error | undefined) => Promise<void>;
    registerSocketEndHandler: (handler: (error: Error | undefined) => void | Promise<void>) => void;
    onUnexpectedError: (err: Error | import("@hapi/boom").Boom, msg: string) => void;
    uploadPreKeys: (count?: number) => Promise<void>;
    uploadPreKeysToServerIfRequired: () => Promise<void>;
    digestKeyBundle: () => Promise<void>;
    rotateSignedPreKey: () => Promise<void>;
    requestPairingCode: (phoneNumber: string, customPairingCode?: string) => Promise<string>;
    updateServerTimeOffset: ({ attrs }: import("../index.js").BinaryNode) => void;
    sendUnifiedSession: () => Promise<void>;
    wamBuffer: import("../index.js").BinaryInfo;
    waitForConnectionUpdate: (check: (u: Partial<import("../index.js").ConnectionState>) => Promise<boolean | undefined>, timeoutMs?: number) => Promise<void>;
    sendWAMBuffer: (wamBuffer: Buffer) => Promise<any>;
    executeUSyncQuery: (usyncQuery: import("../index.js").USyncQuery) => Promise<import("../index.js").USyncQueryResult | undefined>;
    onWhatsApp: (...phoneNumber: string[]) => Promise<{
        jid: string;
        exists: boolean;
    }[] | undefined>;
    fetchAccountReachoutTimelock: () => Promise<import("../index.js").ReachoutTimelockState>;
    fetchNewChatMessageCap: () => Promise<import("../index.js").NewChatMessageCapInfo>;
};
export default makeWASocket;
//# sourceMappingURL=index.d.ts.map