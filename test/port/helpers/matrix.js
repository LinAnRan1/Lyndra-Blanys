// Lyndrā-Blanys: argument samples for calling every public socket method once.
export const PN = '6281234567890@s.whatsapp.net'
export const LID = '226663140991110@lid'
export const G = '120363000000000001@g.us'
export const NL = '120363000000000002@newsletter'
export const COMM = '120363000000000003@g.us'
export const KEY = { remoteJid: G, id: 'MSG1', fromMe: false, participant: LID }
export const IMG = Buffer.from('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=', 'base64')

export const SKIP = new Set([
  'end', 'logout', 'waitForConnectionUpdate', 'waitForMessage', 'waitForSocketOpen', 'registerSocketEndHandler',
  'onUnexpectedError', 'sendNode', 'sendRawMessage', 'requestPairingCode', 'cancelPairingCode', 'generateMessageTag',
  'query', 'sendWAMBuffer', 'executeUSyncQuery'
])

export const ARGS = {
  addChatLabel: [PN, 'L1'], addLabel: [PN, { id: 'L1', name: 'x', color: 1, deleted: false }], addMessageLabel: [PN, 'MSG1', 'L1'],
  addOrEditContact: [PN, { fullName: 'Tes', saveOnPrimaryAddressbook: true }], addOrEditQuickReply: [{ shortcut: 'a', message: 'b', keywords: [], count: 0, timestamp: String(Date.now()) }],
  appPatch: [{ syncAction: { archiveChatAction: { archived: true } }, index: ['archive', PN], type: 'regular_low', apiVersion: 3, operation: 0 }],
  assertSessions: [[PN], false], captureUnifiedResponse: [{ text: 'x' }], cekIDSaluran: ['https://whatsapp.com/channel/0029VaAbCdEfGhIjKl'],
  chatModify: [{ archive: true, lastMessages: [{ key: KEY, messageTimestamp: 1 }] }, PN], checkAccountHealth: [], checkUsernameAvailability: ['lyndra.blanys'],
  cleanDirtyBits: ['groups'], communityAcceptInvite: ['CODE'], communityAcceptInviteV4: [KEY, { groupJid: COMM, inviteCode: 'C', inviteExpiration: 1, groupName: 'x' }],
  communityCreate: ['Subject', 'Desc'], communityCreateGroup: ['Sub', [PN], COMM], communityFetchAllParticipating: [], communityFetchLinkedGroups: [COMM],
  communityGetInviteInfo: ['CODE'], communityInviteCode: [COMM], communityJoinApprovalMode: [COMM, 'on'], communityLeave: [COMM],
  communityLinkGroup: [G, COMM], communityMemberAddMode: [COMM, 'all_member_add'], communityMetadata: [COMM], communityParticipantsUpdate: [COMM, [PN], 'add'],
  communityQuery: [COMM, 'get', []], communityRequestParticipantsList: [COMM], communityRequestParticipantsUpdate: [COMM, [PN], 'approve'],
  communityRevokeInvite: [COMM], communityRevokeInviteV4: [COMM, PN], communitySettingUpdate: [COMM, 'announcement'], communityToggleEphemeral: [COMM, 86400],
  communityUnlinkGroup: [G, COMM], communityUpdateDescription: [COMM, 'd'], communityUpdateSubject: [COMM, 's'],
  createCallLink: ['audio', { startTime: 1 }], createParticipantNodes: [[PN], { conversation: 'x' }, {}], digestKeyBundle: [], executeUSyncQuery: [null],
  executeWMexQuery: [{}, '123', 'X'], fetchAbout: [PN], fetchAccountReachoutTimelock: [], fetchBlocklist: [], fetchDisappearingDuration: [PN],
  fetchMessageHistory: [10, KEY, 1], fetchNewChatMessageCap: [], fetchOptOutList: [], fetchPrivacySettings: [true], fetchProps: [], fetchPushSettings: [],
  fetchServerLinkPreview: ['https://example.com'], fetchStatus: [PN], fetchTextStatus: [PN], fetchUserNotices: [], findUserId: [PN],
  getBotListV2: [], getBusinessProfile: [PN], getCatalog: [{ jid: PN, limit: 5 }], getCollections: [PN, 5], getMediaHost: [], getNewsletterStatusUpdates: [NL],
  getNewsletterStatuses: [NL], getOrderDetails: ['ORD1', 'TOKEN'], getPrivacyTokens: [[PN]], getServerProps: [], getUSyncDevices: [[PN, LID], false, false], getUsername: [PN], getUsernames: [[PN]],
  groupAcceptInvite: ['CODE'], groupAcceptInviteV4: [KEY, { groupJid: G, inviteCode: 'C', inviteExpiration: 1, groupName: 'x' }], groupCreate: ['Sub', [PN]],
  groupFetchAllParticipating: [], groupGetInviteInfo: ['CODE'], groupInviteCode: [G], groupJoinApprovalMode: [G, 'on'], groupLeave: [G], groupMemberAddMode: [G, 'all_member_add'],
  groupMetadata: [G], groupParticipantsUpdate: [G, [PN, LID], 'add'], groupQuery: [G, 'get', []], groupRequestParticipantsList: [G], groupRequestParticipantsUpdate: [G, [LID], 'approve'],
  groupRevokeInvite: [G], groupRevokeInviteV4: [G, PN], groupSettingUpdate: [G, 'announcement'], groupToggleEphemeral: [G, 86400], groupUpdateDescription: [G, 'desc'], groupUpdateSubject: [G, 'sub'],
  issuePrivacyTokens: [[PN]], newsletterAcceptAdminInvite: [NL], newsletterAction: [NL, 'follow'], newsletterAdminCapabilities: [NL], newsletterAdminCount: [NL], newsletterAdminInfo: [NL],
  newsletterAppealReport: ['R1'], newsletterCanPostStatus: [NL], newsletterChangeOwner: [NL, PN], newsletterCreate: ['name', 'desc'], newsletterCreateAdminInvite: [NL, PN],
  newsletterDelete: [NL], newsletterDemote: [NL, PN], newsletterDirectoryCategories: [], newsletterDirectoryList: [], newsletterDirectorySearch: ['x'], newsletterEnforcements: [NL],
  newsletterFetchAllSubscribe: [], newsletterFetchMessageUpdates: [NL, 10], newsletterFetchMessages: ['jid', NL, 10], newsletterFollow: [NL], newsletterFollowers: [NL],
  newsletterInsights: [NL], newsletterLabelAiContent: [NL, true], newsletterLabelPaidPartnership: [NL, true], newsletterMetadata: ['jid', NL], newsletterMultipleFollow: [NL],
  newsletterMute: [NL], newsletterMyAddOns: [NL], newsletterPendingAdminInvites: [], newsletterPinMessages: [NL, ['200']], newsletterPollVoters: [NL, '1'], newsletterQuestionResponseState: [NL, '1'],
  newsletterQuestionResponses: [NL, '1'], newsletterReactMessage: [NL, '1', '👍'], newsletterReactionSenders: [NL, '1', '👍'], newsletterRecommended: [], newsletterRemovePicture: [NL],
  newsletterReports: [NL], newsletterRevokeAdminInvite: [NL, PN], newsletterSendPollVote: [NL, '1', ['a']], newsletterSimilar: [NL], newsletterStatusMyAddOns: [NL], newsletterSubscribed: [],
  newsletterSubscribers: [NL], newsletterUnfollow: [NL], newsletterUnmute: [NL], newsletterUnpinMessages: [NL, ['200']], newsletterUpdate: [NL, { name: 'n' }], newsletterUpdateDescription: [NL, 'd'],
  newsletterUpdateName: [NL, 'n'], newsletterUpdatePicture: [NL, IMG], newsletterUpdateReactions: [NL, 'all'], newsletterUpdateUserSetting: [NL, 'x', true],
  onWhatsApp: [PN, LID], onWhatsAppUsername: ['lyndra.blanys'], presenceSubscribe: [PN], productCreate: [{ name: 'p', price: 1, currency: 'IDR', images: [{ url: 'https://x/y.jpg' }] }],
  productDelete: [['P1']], productUpdate: ['P1', { name: 'p2', price: 2, currency: 'IDR', images: [{ url: 'https://x/y.jpg' }] }], profilePictureUrl: [PN, 'image'], readMessages: [[KEY]],
  refreshMediaConn: [true], rejectCall: ['CALL1', PN], relayMessage: [PN, { conversation: 'x' }, {}], removeChatLabel: [PN, 'L1'], removeContact: [PN], removeCoverPhoto: [], removeMemberLabel: [G],
  removeMessageLabel: [PN, 'MSG1', 'L1'], removeProfilePicture: [PN], removeQuickReply: [String(Date.now())], removeUsername: [], removeUsernamePin: [], reportSpam: [{ jid: PN, messageKey: KEY }],
  requestPlaceholderResend: [KEY], resetGroupSenderKey: [G], resyncAppState: [['regular']], revokeNewsletterStatus: [NL, '1'], rotateSignedPreKey: [],
  sendCodeBlock: [G, 'const a=1'], sendCodeBlockV2: [G, 'const a=1'], sendHD: [PN, IMG], sendImgVid: [PN, IMG, 'cap'], sendLatex: [G, null, { text: 't', expressions: [{ latexExpression: 'x^2', width: 10, height: 10 }] }], sendLatexImage: [G, null, { text: 't', expressions: [{ latexExpression: 'x^2' }] }, async () => ({ buffer: IMG, width: 10, height: 10 }), async () => ({ url: 'https://mmg.whatsapp.net/x', directPath: '/x' })],
  sendLatexInlineImage: [G, null, { text: 't', expressions: [{ latexExpression: 'x^2' }] }, async () => ({ buffer: IMG, width: 10, height: 10 }), async () => ({ url: 'https://mmg.whatsapp.net/x', directPath: '/x' })], sendLink: [G, 'teks', [{ url: 'https://example.com', title: 'judul' }]], sendLinkV2: [G, 'teks', [{ url: 'https://example.com', title: 'judul' }]], sendList: [G, 'T', ['a', 'b']],
  sendMessage: [PN, { text: 'halo' }], sendMessageAck: [{ tag: 'message', attrs: { id: 'M', from: PN, to: ME_PN_PLACEHOLDER() } }], sendNewsletterStatus: [NL, { text: 'hi' }],
  sendNewsletterStatusReaction: [NL, '200', '👍'], sendPeerDataOperationMessage: [{ peerDataOperationRequestType: 0 }], sendPresenceUpdate: ['composing', PN], sendPreview: [PN, { url: 'https://example.com', title: 't' }],
  sendReceipt: [G, LID, ['MSG1'], 'read'], sendReceipts: [[KEY], 'read'], sendRetryRequest: [{ tag: 'message', attrs: { id: 'M', from: PN, t: '1' }, content: [] }], sendRichMessage: [G, { text: 'x' }],
  sendStatusMention: [{ text: 'x' }, [G]], sendTable: [G, 'T', ['a'], [['1']]], sendTableV2: [G, ['a', 'b']],
  sendUnifiedResponse: [G, null, { submessages: [{ messageType: 2, messageText: 'x' }] }], sendUnifiedSession: [G, { text: 'x' }], setUsername: ['lyndra.blanys'], setUsernamePin: ['1234'], star: [PN, [{ id: 'MSG1', fromMe: false }], true],
  subscribeNewsletterUpdates: [NL], swgc: [G, { text: 'status' }], updateBlockStatus: [PN, 'block'], updateBusinessProfile: [{ address: 'x' }], updateBussinesProfile: [{ address: 'x' }],
  updateCallPrivacy: ['all'], updateCoverPhoto: [IMG], updateDefaultDisappearingMode: [86400], updateDisableLinkPreviewsPrivacy: [true], updateGroupsAddPrivacy: ['all'], updateLastSeenPrivacy: ['all'],
  updateMediaMessage: [{ key: KEY, message: { imageMessage: { mediaKey: Buffer.alloc(32), directPath: '/x', url: 'https://x' } } }], updateMemberLabel: [G, 'Admin Kece'], updateMessagesPrivacy: ['all'],
  updateOnlinePrivacy: ['all'], updateOptOut: ['x', true], updateProfileName: ['Lyndra'], updateProfilePicture: [PN, IMG], updateProfilePicturePrivacy: ['all'], updateProfileStatus: ['status'],
  updateReadReceiptsPrivacy: ['all'], updateServerTimeOffset: [{ tag: 'ib', attrs: { t: String(Math.floor(Date.now() / 1000)) } }], updateStatusPrivacy: ['contacts'], updateTextStatus: ['teks'],
  updateUserNoticeStage: ['N1', 'dismissed'], uploadPreKeys: [5], uploadPreKeysToServerIfRequired: [], upsertMessage: [{ key: KEY, message: { conversation: 'x' } }, 'notify'], waUploadToServer: ['/dev/null', { mediaType: 'image', fileEncSha256B64: 'AAA' }]
}
function ME_PN_PLACEHOLDER() { return '6285000000001@s.whatsapp.net' }
