/* Lyndrā-Blanys. Attribution and license terms: see LICENSE and NOTICE.md. */
import { Boom } from '@hapi/boom'
import { proto } from '../../WAProto/index.js'
import { AssociationType } from '../Types/Message.js'
import { generateMessageIDV2 } from '../Utils/generics.js'
import { generateWAMessage } from '../Utils/messages.js'
import { senderKeyResetSummary } from '../Utils/sender-key-memory.js'
import { isJidGroup } from '../WABinary/index.js'

export const makeSendExtensions = ({ config, logger, authState, messageMutex, upsertMessage, relayMessage, waUploadToServer, updateMemberLabel }) => {
    const sendHD = async (jid, content, options = {}) => {
        const userJid = authState.creds.me.id;
        const isVideo = !!content.video;
        const media = isVideo ? content.video : content.image;
        if (!media) {
            throw new Boom('sendHD needs { image } or { video }', { statusCode: 400 });
        }
        const hdSource = (content.hd && content.hd !== true) ? content.hd : media;
        const parentContent = { ...content };
        delete parentContent.hd;
        const mediaKey = isVideo ? 'videoMessage' : 'imageMessage';
        const parentPaired = isVideo ? proto.ContextInfo.PairedMediaType.SD_VIDEO_PARENT : proto.ContextInfo.PairedMediaType.SD_IMAGE_PARENT;
        const childPaired = isVideo ? proto.ContextInfo.PairedMediaType.HD_VIDEO_CHILD : proto.ContextInfo.PairedMediaType.HD_IMAGE_CHILD;
        const association = isVideo ? AssociationType.HD_VIDEO_DUAL_UPLOAD : AssociationType.HD_IMAGE_DUAL_UPLOAD;
        const genOpts = {
            logger,
            userJid,
            upload: waUploadToServer,
            mediaCache: config.mediaCache,
            options: config.options,
            ...options
        };
        const relayOpts = {
            useCachedGroupMetadata: options.useCachedGroupMetadata,
            statusJidList: options.statusJidList,
            additionalAttributes: options.additionalAttributes,
            additionalNodes: options.additionalNodes
        };
        const emit = message => {
            if (config.emitOwnEvents) {
                process.nextTick(() => { messageMutex.mutex(() => upsertMessage(message, 'append')); });
            }
        };
        const parent = await generateWAMessage(jid, parentContent, { ...genOpts, messageId: generateMessageIDV2(userJid) });
        parent.message[mediaKey].contextInfo = { ...(parent.message[mediaKey].contextInfo || {}), pairedMediaType: parentPaired };
        await relayMessage(jid, parent.message, { messageId: parent.key.id, ...relayOpts });
        emit(parent);
        const child = await generateWAMessage(jid, isVideo ? { video: hdSource } : { image: hdSource }, { ...genOpts, messageId: generateMessageIDV2(userJid) });
        child.message[mediaKey].contextInfo = { ...(child.message[mediaKey].contextInfo || {}), pairedMediaType: childPaired };
        child.message.messageContextInfo = { ...(child.message.messageContextInfo || {}), messageAssociation: { parentMessageKey: parent.key, associationType: association } };
        await relayMessage(jid, child.message, { messageId: child.key.id, ...relayOpts });
        emit(child);
        return parent;
    };
    const sendImgVid = async (jid, content, options = {}) => {
        const userJid = authState.creds.me.id;
        const { image, video, caption } = content;
        if (!image || !video) {
            throw new Boom('sendImgVid needs { image, video }', { statusCode: 400 });
        }
        const genOpts = {
            logger,
            userJid,
            upload: waUploadToServer,
            mediaCache: config.mediaCache,
            options: config.options,
            ...options
        };
        const relayOpts = {
            useCachedGroupMetadata: options.useCachedGroupMetadata,
            statusJidList: options.statusJidList,
            additionalAttributes: options.additionalAttributes,
            additionalNodes: options.additionalNodes
        };
        const emit = message => {
            if (config.emitOwnEvents) {
                process.nextTick(() => { messageMutex.mutex(() => upsertMessage(message, 'append')); });
            }
        };
        const parent = await generateWAMessage(jid, { image, caption }, { ...genOpts, messageId: generateMessageIDV2(userJid) });
        await relayMessage(jid, parent.message, { messageId: parent.key.id, ...relayOpts });
        emit(parent);
        const child = await generateWAMessage(jid, { video }, { ...genOpts, messageId: generateMessageIDV2(userJid) });
        child.message.messageContextInfo = { ...(child.message.messageContextInfo || {}), messageAssociation: { associationType: AssociationType.MOTION_PHOTO, parentMessageKey: parent.key } };
        await relayMessage(jid, child.message, { messageId: child.key.id, ...relayOpts });
        emit(child);
        return parent;
    };
    const resetGroupSenderKey = async (jid) => {
        if (!isJidGroup(jid)) {
            throw new Boom('resetGroupSenderKey needs a group jid', { statusCode: 400 })
        }
        const stored = await authState.keys.get('sender-key-memory', [jid])
        const summary = senderKeyResetSummary(stored, jid)
        await authState.keys.set({ 'sender-key-memory': { [jid]: null } })
        logger.info(summary, 'cleared sender key memory, the next send redistributes the key')
        return summary
    }
    const removeMemberLabel = (jid) => updateMemberLabel(jid, '')
    return { sendHD, sendImgVid, resetGroupSenderKey, removeMemberLabel }
}
