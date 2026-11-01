/* Lyndrā-Blanys. Attribution and license terms: see LICENSE and NOTICE.md. */
import { Boom } from '@hapi/boom'
import { createHash, randomBytes } from 'crypto'
import { proto } from '../../WAProto/index.js'
import { CALL_AUDIO_PREFIX, CALL_VIDEO_PREFIX, DONATE_URL, LIBRARY_NAME } from '../Defaults/index.js'
import { ButtonHeaderType, ButtonType, CarouselCardType, ListType, WAProto } from '../Types/index.js'
import { generateMessageIDV2 } from './generics.js'
import { encryptedStream, extractImageThumb, getStream, toBuffer } from './messages-media.js'
import { buildMusicMessage } from './status-stickers.js'
import { buildSocialPreview } from './link-preview-metadata.js'
import { buildPaymentReminder, buildSplitPayment, buildSplitPaymentUpdate } from './payment-messages.js'
import { NATIVE_FLOW_BUTTON_LIMIT, WEB_SUPPORTED_INTERACTIVE_FLOWS, getNativeFlowNameByButtonName } from './native-flow.js'
import { promises as fs } from 'fs'
import { unixTimestampSeconds } from './generics.js'

export { buildSocialPreview }
const hasNonNullishProperty = (message, key) => message != null && typeof message === 'object' && key in message && message[key] != null
const hasOptionalProperty = (obj, key) => obj != null && typeof obj === 'object' && key in obj && obj[key] != null
const trimEmptyValues = (object) => {
    for (const key of Object.keys(object)) {
        if (object[key] === undefined) {
            delete object[key];
        }
    }
    return object;
};

/**
 * externalAdReply wants the artwork inline as jpeg bytes, and a full cover is
 * far past what a thumbnail may weigh, so it is downscaled when an image
 * library is around and passed through untouched when none is.
 */
const songThumbnail = async (artwork, width, logger) => {
    const source = Buffer.isBuffer(artwork) ? artwork : await toBuffer(await getStream(artwork).then(({ stream }) => stream));
    try {
        const { buffer } = await extractImageThumb(source, width);
        return buffer;
    }
    catch (error) {
        logger?.warn?.({ trace: error?.message }, 'could not downscale the song artwork, sending it whole');
        return source;
    }
};
export const prepareLinkThumbnail = async (image, options, { thumbnailWidth = 640, upload = true } = {}) => {
    if (upload && typeof options?.upload !== 'function') {
        throw new Boom('a large link thumbnail has to be uploaded, so this needs an upload function', { statusCode: 400 });
    }
    const source = Buffer.isBuffer(image) ? image : await toBuffer(await getStream(image).then(({ stream }) => stream));
    let full;
    let width;
    let height;
    try {
        const probe = await extractImageThumb(source, thumbnailWidth);
        const original = probe.original;
        width = Math.min(thumbnailWidth, original.width);
        height = Math.round(original.height * width / original.width);
        full = width === thumbnailWidth ? probe.buffer : (await extractImageThumb(source, width)).buffer;
    }
    catch (error) {
        options.logger?.warn?.({ trace: error?.message }, 'no image library could measure the link thumbnail, so the card stays small');
        return { jpegThumbnail: source };
    }
    let jpegThumbnail;
    try {
        jpegThumbnail = (await extractImageThumb(source, Math.min(192, width))).buffer;
    }
    catch {
        jpegThumbnail = full;
    }
    if (!upload) {
        return { jpegThumbnail };
    }
    const blob = await encryptedStream(full, 'thumbnail-link', {
        logger: options.logger,
        opts: options.options
    });
    let result;
    try {
        result = await options.upload(blob.encFilePath, {
            fileEncSha256B64: blob.fileEncSha256.toString('base64'),
            mediaType: 'thumbnail-link',
            timeoutMs: options.mediaUploadTimeoutMs
        });
    }
    finally {
        fs.unlink(blob.encFilePath).catch(() => options.logger?.warn?.('failed to remove tmp file'));
    }
    return {
        jpegThumbnail,
        highQualityThumbnail: {
            directPath: result.directPath,
            mediaKey: blob.mediaKey,
            mediaKeyTimestamp: unixTimestampSeconds(),
            fileSha256: blob.fileSha256,
            fileEncSha256: blob.fileEncSha256,
            width,
            height
        }
    };
};
const eventSeconds = (value, name) => {
    if (value instanceof Date) {
        return Math.floor(value.getTime() / 1000);
    }
    const number = Number(value);
    if (!Number.isFinite(number)) {
        throw new Boom(`event ${name} must be a Date or a unix timestamp`, { statusCode: 400 });
    }
    return Math.floor(number > 1e11 ? number / 1000 : number);
};
const assertColor = async (color) => {
    if (typeof color === 'number') {
        return color >= 0 ? color : 0xffffffff + color + 1;
    }
    let hex = color.trim().replace('#', '');
    if (hex.length <= 6) {
        hex = 'FF' + hex.padStart(6, '0');
    }
    return parseInt(hex, 16);
};
export const getPollOptionHash = (optionName, fileSha256) => {
    const nameHash = createHash('sha256').update(String(optionName), 'utf-8').digest('hex');
    const fileHash = fileSha256 ? Buffer.from(fileSha256).toString('base64') : '';
    return createHash('sha256').update(nameHash + fileHash, 'utf-8').digest('hex');
};
const prepareProductMessage = async (message, options, prepareWAMessageMedia) => {
    if (!message.businessOwnerJid) {
        throw new Boom('"businessOwnerJid" is missing from the content', { statusCode: 400 });
    }
    const { imageMessage } = await prepareWAMessageMedia({ image: message.image || message.product.productImage }, options);

    const { image, ...content } = message;
    content.product = {
        currencyCode: 'IDR',
        priceAmount1000: 1000,
        title: LIBRARY_NAME,
        ...message.product,
        productImage: imageMessage
    };
    return content;
};

const buttonLimitFor = buttons => buttons[0]?.name === 'quick_reply'
    ? NATIVE_FLOW_BUTTON_LIMIT.quickReply
    : NATIVE_FLOW_BUTTON_LIMIT.other;

export const nativeFlowButtonsViolateConstraints = (buttons = []) => {
    if (!buttons.length) {
        return false;
    }
    const isQuickReply = button => button?.name === 'quick_reply';
    const firstIsQuickReply = isQuickReply(buttons[0]);
    if (buttons.length > buttonLimitFor(buttons)) {
        return true;
    }
    return !buttons.slice(1).every(button => {
        const mapped = getNativeFlowNameByButtonName(button?.name);
        const nameAllowed = mapped == null || WEB_SUPPORTED_INTERACTIVE_FLOWS.includes(mapped);
        return nameAllowed && firstIsQuickReply === isQuickReply(button);
    });
};

const warnOnNativeFlowConstraints = (buttons, logger) => {
    if (!logger?.warn || !nativeFlowButtonsViolateConstraints(buttons)) {
        return;
    }
    const limit = buttonLimitFor(buttons);
    const kinds = [...new Set(buttons.map(button => button?.name))];
    logger.warn({ buttons: buttons.length, limit, kinds }, 'these native flow buttons break the client\'s button constraints, '
        + 'so it cannot work out a flow name and draws the whole message as unsupported: keep every button the same kind as the first '
        + `and at most ${limit} of them`);
};

const prepareNativeFlowButtons = (message, options) => {
    const buttons = message.nativeFlow;
    const isButtonsFieldArray = Array.isArray(buttons);
    const correctedField = isButtonsFieldArray ? buttons : buttons.buttons;
    const messageParamsJson = {};

    if (hasOptionalProperty(message, 'offerText') && !!message.offerText) {
        Object.assign(messageParamsJson, {
            limited_time_offer: {
                text: message.offerText || LIBRARY_NAME,
                url: message.offerUrl || DONATE_URL,
                copy_code: message.offerCode,
                expiration_time: message.offerExpiration
            }
        });
    }
    if (hasOptionalProperty(message, 'optionText') && !!message.optionText) {
        Object.assign(messageParamsJson, {
            bottom_sheet: {
                in_thread_buttons_limit: 1,
                divider_indices: Array.from({ length: correctedField.length }, (_, index) => index),
                list_title: message.optionTitle || '📄 Select Options',
                button_title: message.optionText
            }
        });
    }
    const prepared = correctedField.map(button => {
            const buttonText = button.text || button.buttonText;
            const buttonIcon = button.icon?.toUpperCase();
            if (hasOptionalProperty(button, 'id') && !!button.id) {
                return {
                    name: 'quick_reply',
                    buttonParamsJson: JSON.stringify({
                        display_text: buttonText || '👉🏻 Click',
                        id: button.id,
                        icon: buttonIcon
                    })
                };
            }
            else if (hasOptionalProperty(button, 'copy') && !!button.copy) {
                return {
                    name: 'cta_copy',
                    buttonParamsJson: JSON.stringify({
                        display_text: buttonText || '📋 Copy',
                        copy_code: button.copy,
                        icon: buttonIcon
                    })
                };
            }
            else if (hasOptionalProperty(button, 'url') && !!button.url) {
                return {
                    name: 'cta_url',
                    buttonParamsJson: JSON.stringify({
                        display_text: buttonText || '🌐 Visit',
                        url: button.url,
                        merchant_url: button.url,
                        webview_interaction: button.useWebview,
                        icon: buttonIcon
                    })
                };
            }
            else if (hasOptionalProperty(button, 'call') && !!button.call) {
                return {
                    name: 'cta_call',
                    buttonParamsJson: JSON.stringify({
                        display_text: buttonText || '📞 Call',
                        phone_number: button.call,
                        icon: buttonIcon
                    })
                };
            }

            else if (hasOptionalProperty(button, 'sections') && !!button.sections) {
                return {
                    name: 'single_select',
                    buttonParamsJson: JSON.stringify({
                        title: buttonText || '📋 Select',
                        sections: button.sections,
                        icon: buttonIcon
                    })
                };
            }
            return button;
        });
    warnOnNativeFlowConstraints(prepared, options?.logger);
    return {
        buttons: prepared,
        messageParamsJson: JSON.stringify(messageParamsJson),
        name: message.flowName || 'mixed',
        messageVersion: 1
    };
};

export const hasValidAlbumMedia = (message) => {
    return !!(message.imageMessage ||
        message.videoMessage);
};
export const hasValidInteractiveHeader = (message) => {
    return !!(message.imageMessage ||
        message.videoMessage ||
        message.documentMessage ||
        message.productMessage ||
        message.locationMessage);
};

const headerText = ({ title, subtitle }) => ({
    ...(title ? { title } : {}),
    ...(subtitle ? { subtitle } : {})
});

export const hasValidCarouselHeader = (message) => {
    return !!(message.imageMessage ||
        message.videoMessage ||
        message.productMessage);
};
/** Branches that must run before the plain text branch. Returns undefined when not handled. */
export const buildLeadContent = async (message, options) => {
    let m = {}
    if (hasNonNullishProperty(message, 'raw')) {
        delete message.raw;
        return { raw: message };
    }
    else if (hasNonNullishProperty(message, 'richLink')) {
        const { text, url, title, description, image, large = true, previewType, thumbnailWidth, ...rest } = message.richLink;
        if (!url || typeof url !== 'string') {
            throw new Boom('richLink needs a url', { statusCode: 400 });
        }
        let body = text ?? url;
        if (!body.includes(url)) {
            body = `${body}\n\n${url}`;
        }
        const extContent = {
            ...rest,
            text: body,
            matchedText: url,
            title,
            description,
            previewType: previewType ?? 0
        };
        if (image) {
            const thumbnails = await prepareLinkThumbnail(image, options, { thumbnailWidth, upload: large });
            extContent.jpegThumbnail = thumbnails.jpegThumbnail;
            const hq = thumbnails.highQualityThumbnail;
            if (hq) {
                extContent.thumbnailDirectPath = hq.directPath;
                extContent.mediaKey = hq.mediaKey;
                extContent.mediaKeyTimestamp = hq.mediaKeyTimestamp;
                extContent.thumbnailSha256 = hq.fileSha256;
                extContent.thumbnailEncSha256 = hq.fileEncSha256;
                extContent.thumbnailWidth = hq.width;
                extContent.thumbnailHeight = hq.height;
            }
        }
        m.extendedTextMessage = trimEmptyValues(extContent);
    }
    else {
        return undefined
    }
    return { m }
}

/** Extra content kinds; returns undefined when the message is not one of them. */
export const buildExtraContent = async (message, options, h) => {
    const { prepareWAMessageMedia } = h
    let m = {}
    if (hasNonNullishProperty(message, 'keep')) {
        m.keepInChatMessage = {};
        m.keepInChatMessage.key = message.keep;
        m.keepInChatMessage.keepType = message.type;
        m.keepInChatMessage.timestampMs = Date.now();
    }
    else if (hasNonNullishProperty(message, 'flowReply')) {
        m.interactiveResponseMessage = {
            body: {
                format: message.flowReply.format || proto.Message.InteractiveResponseMessage.Body.Format.DEFAULT,
                text: message.flowReply.text
            },
            nativeFlowResponseMessage: {
                name: message.flowReply.name,
                paramsJson: message.flowReply.paramsJson || '{}',
                version: message.flowReply.version || 1
            }
        };
    }
    else if (hasNonNullishProperty(message, 'event')) {
        m.eventMessage = {};
        const startTime = eventSeconds(message.event.startDate, 'startDate');
        if (message.event.call && options.getCallLink) {
            const token = await options.getCallLink(message.event.call, { startTime });
            m.eventMessage.joinLink = (message.event.call === 'audio' ? CALL_AUDIO_PREFIX : CALL_VIDEO_PREFIX) + token;
        }
        m.messageContextInfo = {

            messageSecret: message.event.messageSecret || randomBytes(32)
        };
        m.eventMessage.name = message.event.name;
        m.eventMessage.description = message.event.description;
        m.eventMessage.startTime = startTime;
        m.eventMessage.endTime = message.event.endDate ? eventSeconds(message.event.endDate, 'endDate') : undefined;
        m.eventMessage.isCanceled = message.event.isCancelled ?? false;
        m.eventMessage.extraGuestsAllowed = message.event.extraGuestsAllowed;
        m.eventMessage.isScheduleCall = message.event.isScheduleCall ?? false;
        m.eventMessage.location = message.event.location;
    }
    else if (hasNonNullishProperty(message, 'poll')) {
        message.poll.selectableCount ||= 0;
        message.poll.toAnnouncementGroup ||= false;
        if (!Array.isArray(message.poll.values)) {
            throw new Boom('Invalid poll values', { statusCode: 400 });
        }
        if (message.poll.selectableCount < 0 || message.poll.selectableCount > message.poll.values.length) {
            throw new Boom(`poll.selectableCount in poll should be >= 0 and <= ${message.poll.values.length}`, {
                statusCode: 400
            });
        }
        let hasPollOptionImage = false;
        const pollOptions = [];
        for (const value of message.poll.values) {
            if (typeof value === 'string') {
                pollOptions.push({ optionName: value });
                continue;
            }
            if (!value?.name) {
                throw new Boom('Each photo poll option needs a name', { statusCode: 400 });
            }
            if (value.optionHash) {
                hasPollOptionImage = true;
                pollOptions.push({ optionName: value.name, optionHash: value.optionHash });
                continue;
            }
            if (!value.image) {
                pollOptions.push({ optionName: value.name });
                continue;
            }
            const prepared = await prepareWAMessageMedia({ image: value.image }, options);
            hasPollOptionImage = true;
            pollOptions.push({
                optionName: value.name,
                optionHash: getPollOptionHash(value.name, prepared.imageMessage?.fileSha256)
            });
        }
        const usesExtendedPollSettings = Boolean(message.poll.endDate) ||
            message.poll.hideVoter === true ||
            message.poll.canAddOption === true;
        const pollCreationMessage = {
            name: message.poll.name,
            selectableOptionsCount: message.poll.selectableCount,
            options: pollOptions,
            endTime: message.poll.endDate ? message.poll.endDate.getTime() : undefined,

            hideParticipantName: message.poll.hideVoter || undefined,
            allowAddOption: message.poll.canAddOption || undefined
        };
        if (hasPollOptionImage) {
            pollCreationMessage.pollContentType = proto.Message.PollContentType.IMAGE;
        }
        if (message.poll.toAnnouncementGroup) {

            m.pollCreationMessageV2 = pollCreationMessage;
        }
        else {

            if (message.poll.pollType === 1) {
                if (!message.poll.correctAnswer) {
                    throw new Boom('No "correctAnswer" provided for quiz', { statusCode: 400 });
                }
                m.pollCreationMessageV5 = {

                    ...pollCreationMessage,
                    correctAnswer: {
                        optionName: message.poll.correctAnswer.toString()
                    },
                    pollType: 1,
                    selectableOptionsCount: 1
                };
            }
            else if (hasPollOptionImage) {

                m.pollCreationMessageV3 = pollCreationMessage;
            }
            else if (usesExtendedPollSettings) {

                m.pollCreationMessageV6 = pollCreationMessage;
            }
            else if (message.poll.selectableCount === 1) {

                m.pollCreationMessageV3 = pollCreationMessage;
            }
            else {

                m.pollCreationMessage = pollCreationMessage;
            }
        }
        m.messageContextInfo = {

            messageSecret: message.poll.messageSecret || randomBytes(32)
        };
    }

    else if (hasNonNullishProperty(message, 'pollResult')) {
        const pollResultSnapshotMessage = {
            name: message.pollResult.name,
            pollVotes: message.pollResult.votes.map(vote => ({
                optionName: vote.name,
                optionVoteCount: parseInt(vote.voteCount)
            }))
        };
        if (message.pollResult.pollType === 1) {
            pollResultSnapshotMessage.pollType = proto.Message.PollType.QUIZ;
            m.pollResultSnapshotMessageV3 = pollResultSnapshotMessage;
        }
        else {
            pollResultSnapshotMessage.pollType = proto.Message.PollType.POLL;
            m.pollResultSnapshotMessage = pollResultSnapshotMessage;
        }
    }

    else if (hasNonNullishProperty(message, 'pollUpdate')) {
        if (!message.pollUpdate.key) {
            throw new Boom('Message key is required', { statusCode: 400 });
        }
        if (!message.pollUpdate.vote) {
            throw new Boom('Encrypted vote payload is required', { statusCode: 400 });
        }
        m.pollUpdateMessage = {
            metadata: message.pollUpdate.metadata,
            pollCreationMessageKey: message.pollUpdate.key,
            senderTimestampMs: Date.now(),
            vote: message.pollUpdate.vote
        };
    }

    else if (hasNonNullishProperty(message, 'paymentInviteServiceType')) {
        m.paymentInviteMessage = {
            expiryTimestamp: Date.now(),
            serviceType: message.paymentInviteServiceType
        };
    }

    else if (hasNonNullishProperty(message, 'orderText')) {
        if (!Buffer.isBuffer(message.thumbnail)) {
            throw new Boom('Must provide thumbnail buffer in order message', { statusCode: 400 });
        }
        m.orderMessage = {
            itemCount: 1,
            messageVersion: 1,
            orderTitle: LIBRARY_NAME,
            status: proto.Message.OrderMessage.OrderStatus.INQUIRY,
            surface: proto.Message.OrderMessage.OrderSurface.CATALOG,
            token: generateMessageIDV2(),
            totalAmount1000: 1000,
            totalCurrencyCode: 'IDR',
            ...message,
            message: message.orderText
        };
        delete m.orderMessage.orderText;
    }

    else if (hasNonNullishProperty(message, 'music')) {
        m.musicMessage = buildMusicMessage(message.music);
    }
    else if (hasNonNullishProperty(message, 'splitPayment')) {
        m.splitPaymentMessage = buildSplitPayment(message.splitPayment);
    }
    else if (hasNonNullishProperty(message, 'splitPaymentUpdate')) {
        m.splitPaymentUpdateMessage = buildSplitPaymentUpdate(message.splitPaymentUpdate);
    }
    else if (hasNonNullishProperty(message, 'paymentReminder')) {
        m.paymentReminderMessage = buildPaymentReminder(message.paymentReminder);
    }
    else if (hasNonNullishProperty(message, 'song')) {
        const { audio, artwork, title, author, url, largeThumbnail = true, thumbnailWidth = 640, mediaType = 1, ...rest } = message.song;
        if (!audio) {
            throw new Boom('song needs audio', { statusCode: 400 });
        }
        const mimetype = rest.mimetype ?? 'audio/mpeg';
        if (rest.ptt === true && !/opus/i.test(mimetype)) {
            options.logger?.warn?.({ mimetype }, 'ptt asks for a voice note but this is not opus, and nothing here transcodes it');
        }
        m = await prepareWAMessageMedia({ audio, ...rest, mimetype }, options);
        const thumbnail = artwork ? await songThumbnail(artwork, thumbnailWidth, options.logger) : undefined;
        m.audioMessage.contextInfo = {
            ...m.audioMessage.contextInfo,
            externalAdReply: trimEmptyValues({
                title: title || LIBRARY_NAME,
                body: author,
                thumbnail,
                mediaType,
                renderLargerThumbnail: !!largeThumbnail,
                showAdAttribution: false,
                sourceUrl: url,
                mediaUrl: url
            })
        };
    }
    else {
        return undefined
    }
    return m
}

/** Wrapping, buttons and context decoration applied after the base content exists. */
export const applyPostContent = async (m, message, options, h) => {
    const { prepareWAMessageMedia, getContentType } = h
    if (hasNonNullishProperty(message, 'buttons')) {
        const buttonsMessage = {
            buttons: message.buttons.map(button => {

                const buttonText = button.text || button.buttonText;
                if (hasOptionalProperty(button, 'sections')) {
                    return {
                        nativeFlowInfo: {
                            name: 'single_select',
                            paramsJson: JSON.stringify({
                                title: buttonText,
                                sections: button.sections
                            })
                        },
                        type: ButtonType.NATIVE_FLOW
                    };
                }
                else if (hasOptionalProperty(button, 'name')) {
                    return {
                        nativeFlowInfo: {
                            name: button.name,
                            paramsJson: button.paramsJson
                        },
                        type: ButtonType.NATIVE_FLOW
                    };
                }
                return {
                    buttonId: button.id || button.buttonId,
                    buttonText: typeof buttonText === 'string' ? { displayText: buttonText } : buttonText,
                    type: button.type || ButtonType.RESPONSE
                };
            })
        };
        if (hasOptionalProperty(message, 'text')) {
            buttonsMessage.contentText = message.text;
            buttonsMessage.headerType = ButtonHeaderType.EMPTY;
        }
        else {
            if (hasOptionalProperty(message, 'caption')) {
                buttonsMessage.contentText = message.caption;
            }
            const type = Object.keys(m)[0].replace('Message', '').toUpperCase();
            buttonsMessage.headerType = ButtonHeaderType[type];
            Object.assign(buttonsMessage, m);
        }
        if (hasOptionalProperty(message, 'footer')) {
            buttonsMessage.footerText = message.footer;
        }
        m = { buttonsMessage };
    }
    else if (hasNonNullishProperty(message, 'sections')) {
        const listMessage = {
            sections: message.sections,
            buttonText: message.buttonText,
            title: message.title,
            footerText: message.footer,
            description: message.text,
            listType: ListType.SINGLE_SELECT
        };
        m = { listMessage };
    }

    else if (hasNonNullishProperty(message, 'templateButtons')) {
        const hydratedTemplate = {
            hydratedButtons: message.templateButtons.map((button, i) => {
                const buttonText = button.text || button.buttonText;
                if (hasOptionalProperty(button, 'id')) {
                    return {
                        index: i,
                        quickReplyButton: {
                            displayText: buttonText || '👉🏻 Click',
                            id: button.id
                        }
                    };
                }
                else if (hasOptionalProperty(button, 'url')) {
                    return {
                        index: i,
                        urlButton: {
                            displayText: buttonText || '🌐 Visit',
                            url: button.url
                        }
                    };
                }
                else if (hasOptionalProperty(button, 'call')) {
                    return {
                        index: i,
                        callButton: {
                            displayText: buttonText || '📞 Call',
                            phoneNumber: button.call
                        }
                    };
                }
                button.index = button.index || i;
                return button;
            })
        };
        if (hasOptionalProperty(message, 'text')) {
            hydratedTemplate.hydratedContentText = message.text;
        }
        else {
            if (hasOptionalProperty(message, 'caption')) {
                hydratedTemplate.hydratedTitleText = message.title;
                hydratedTemplate.hydratedContentText = message.caption;
            }
            ;
            Object.assign(hydratedTemplate, m);
        }
        if (hasOptionalProperty(message, 'footer')) {
            hydratedTemplate.hydratedFooterText = message.footer;
        }
        hydratedTemplate.templateId = message.id || 'template-' + Date.now();
        m = {
            templateMessage: {
                hydratedFourRowTemplate: hydratedTemplate,
                hydratedTemplate: hydratedTemplate
            }
        };
    }
    else if (hasNonNullishProperty(message, 'nativeFlow')) {
        const interactiveMessage = {
            nativeFlowMessage: prepareNativeFlowButtons(message, options)
        };
        if (hasNonNullishProperty(message, 'bloksWidget')) {
            interactiveMessage.bloksWidget = message.bloksWidget;
        }
        if (hasOptionalProperty(message, 'bizJid')) {
            interactiveMessage.collectionMessage = {
                bizJid: message.bizJid,
                id: message.id,
                messageVersion: 1
            };
        }
        else if (hasOptionalProperty(message, 'shopSurface')) {
            interactiveMessage.shopStorefrontMessage = {
                surface: message.shopSurface,
                id: message.id,
                messageVersion: 1
            };
        }
        if (hasOptionalProperty(message, 'text')) {
            interactiveMessage.body = { text: message.text };
        }
        else {
            if (hasOptionalProperty(message, 'caption')) {
                const isValidHeader = hasValidInteractiveHeader(m);
                if (!isValidHeader) {
                    throw new Boom('Invalid media type for interactive message header', { statusCode: 400 });
                }
                interactiveMessage.header = {
                    ...headerText(message),
                    hasMediaAttachment: isValidHeader
                };
                interactiveMessage.body = { text: message.caption };
            }
            if (hasOptionalProperty(message, 'thumbnail') && !!message.thumbnail) {
                interactiveMessage.jpegThumbnail = message.thumbnail;
            }
            interactiveMessage.header ||= { hasMediaAttachment: hasValidInteractiveHeader(m) };
            Object.assign(interactiveMessage.header, m);
        }
        if (hasOptionalProperty(message, 'audioFooter')) {
            const { audioMessage } = await prepareWAMessageMedia({
                audio: message.audioFooter
            }, options);
            interactiveMessage.footer = {
                audioMessage,
                hasMediaAttachment: true
            };
        }
        else if (hasOptionalProperty(message, 'footer')) {
            interactiveMessage.footer = { text: message.footer };
        }
        m = { interactiveMessage };
    }
    else if (hasNonNullishProperty(message, 'cards')) {
        const interactiveMessage = {
            carouselMessage: {
                cards: await Promise.all(message.cards.map(async (card) => {
                    let carouselHeader = {};
                    if (hasNonNullishProperty(card, 'product')) {
                        carouselHeader.productMessage = await prepareProductMessage(card, options, prepareWAMessageMedia);
                    }
                    else {
                        carouselHeader = await prepareWAMessageMedia(card, options).catch(() => ({}));
                    }
                    const isValidHeader = hasValidCarouselHeader(carouselHeader);
                    if (!isValidHeader) {
                        throw new Boom('Invalid media type for carousel card', { statusCode: 400 });
                    }
                    const carouselCard = {
                        nativeFlowMessage: prepareNativeFlowButtons(card.nativeFlow ? card : [], options)
                    };
                    if (hasOptionalProperty(card, 'text')) {
                        carouselCard.body = { text: card.text };
                    }
                    else {
                        if (hasOptionalProperty(card, 'caption')) {
                            carouselCard.header = {
                                ...headerText(card),
                                hasMediaAttachment: isValidHeader
                            };
                            carouselCard.body = { text: card.caption };
                        }
                        if (hasOptionalProperty(card, 'thumbnail') && !!card.thumbnail) {
                            carouselCard.jpegThumbnail = card.thumbnail;
                        }
                        carouselCard.header ||= { hasMediaAttachment: isValidHeader };
                        Object.assign(carouselCard.header, carouselHeader);
                    }
                    if (hasOptionalProperty(card, 'audioFooter')) {
                        const { audioMessage } = await prepareWAMessageMedia({
                            audio: card.audioFooter
                        }, options);
                        carouselCard.footer = {
                            audioMessage,
                            hasMediaAttachment: true
                        };
                    }
                    else if (hasOptionalProperty(card, 'footer')) {
                        carouselCard.footer = { text: card.footer };
                    }
                    return carouselCard;
                })),
                carouselCardType: CarouselCardType.UNKNOWN,
                messageVersion: 1
            }
        };
        if (hasOptionalProperty(message, 'text')) {
            interactiveMessage.body = { text: message.text };
        }
        if (hasOptionalProperty(message, 'footer')) {
            interactiveMessage.footer = { text: message.footer };
        }
        m = { interactiveMessage };
    }

    else if (hasNonNullishProperty(message, 'requestPaymentFrom')) {
        const requestPaymentMessage = {
            amount: {
                currencyCode: 'IDR',
                offset: 1000,
                value: 1000
            },
            amount1000: 1000,
            currencyCodeIso4217: 'IDR',
            expiryTimestamp: Date.now(),
            noteMessage: m,
            requestFrom: message.requestPaymentFrom,
            ...message
        };
        delete requestPaymentMessage.requestPaymentFrom;
        if (hasNonNullishProperty(m, 'extendedTextMessage') || hasNonNullishProperty(m, 'stickerMessage')) {
            Object.assign(requestPaymentMessage.noteMessage, m);
        }
        else {
            throw new Boom('Invalid message type for request payment note message', { statusCode: 400 });
        }
        m = { requestPaymentMessage };
    }

    else if (hasNonNullishProperty(message, 'invoiceNote')) {
        const attachment = m.imageMessage || m.documentMessage;
        const type = Object.keys(m)[0].replace('Message', '').toUpperCase();
        const invoiceMessage = {
            attachmentType: proto.Message.InvoiceMessage.AttachmentType[type === 'DOCUMENT' ? 'PDF' : 'IMAGE'],
            note: message.invoiceNote
        };
        if (attachment) {
            const { directPath, fileEncSha256, fileSha256, jpegThumbnail = undefined, mediaKey, mediaKeyTimestamp, mimetype } = attachment;
            Object.assign(invoiceMessage, {
                attachmentDirectPath: directPath,
                attachmentFileEncSha256: fileEncSha256,
                attachmentFileSha256: fileSha256,
                attachmentJpegThumbnail: jpegThumbnail,
                attachmentMediaKey: mediaKey,
                attachmentMediaKeyTimestamp: mediaKeyTimestamp,
                attachmentMimetype: mimetype,
                token: generateMessageIDV2()
            });
        }
        else {
            throw new Boom('Invalid media type for invoice message', { statusCode: 400 });
        }
        m = { invoiceMessage };
    }

    if (hasNonNullishProperty(message, 'statusLinkPreview')) {
        const style = Number(message.statusLinkPreview.style ?? message.statusLinkPreview);
        if (!Number.isInteger(style) || style < 0) {
            throw new Boom('statusLinkPreview style must be a non-negative integer', { statusCode: 400 });
        }
        m.statusLinkPreviewMetadata = { style };
    }
    if (hasOptionalProperty(message, 'externalAdReply') && !!message.externalAdReply) {
        const messageType = Object.keys(m)[0];
        const key = m[messageType];
        const content = message.externalAdReply;
        if ('thumbnail' in content && !Buffer.isBuffer(content.thumbnail)) {
            throw new Boom('Thumbnail must in buffer type', { statusCode: 400 });
        }
        if (!content.url || typeof content.url !== 'string') {
            content.url = DONATE_URL;
        }
        const externalAdReply = {
            ...content,
            body: content.body,
            mediaType: content.mediaType || 1,
            renderLargerThumbnail: content.largeThumbnail,
            sourceUrl: content.url,
            thumbnail: content.thumbnail,
            title: content.title || LIBRARY_NAME
        };
        if (content.thumbnailUrl) {
            externalAdReply.thumbnailUrl = content.thumbnailUrl;
        }
        if (content.mediaUrl) {
            externalAdReply.mediaUrl = content.mediaUrl;
        }
        delete externalAdReply.subTitle;
        delete externalAdReply.largeThumbnail;
        delete externalAdReply.url;
        if (!externalAdReply.thumbnail && !externalAdReply.thumbnailUrl) {
            options.logger?.warn?.('externalAdReply has no thumbnail and no thumbnailUrl, so the card draws without a picture');
        }
        if ('contextInfo' in key && !!key.contextInfo) {
            key.contextInfo.externalAdReply = { ...key.contextInfo.externalAdReply, ...externalAdReply };
        }
        else if (key) {
            key.contextInfo = { externalAdReply };
        }
    }
    if ((hasOptionalProperty(message, 'mentions') && message.mentions?.length) ||
        (hasOptionalProperty(message, 'mentionAll') && message.mentionAll) ||
        (hasOptionalProperty(message, 'groupMentions') && message.groupMentions?.length)) {
        const messageType = Object.keys(m)[0];
        const key = m[messageType];
        if (key && typeof key === 'object') {
            key.contextInfo = ('contextInfo' in key && key.contextInfo) ? key.contextInfo : {};
            if (message.mentions?.length) {
                key.contextInfo.mentionedJid = message.mentions;
            }
            if (message.mentionAll) {
                key.contextInfo.nonJidMentions = 1;
            }
            if (message.groupMentions?.length) {
                const normalized = message.groupMentions
                    .filter((gm) => gm?.groupJid)
                    .map((gm) => ({
                        groupJid: `${String(gm.groupJid).split('@')[0]}@g.us`,
                        groupSubject: gm.groupSubject
                    }));
                key.contextInfo.groupMentions = normalized;
                const field = 'text' in key ? 'text' : 'caption' in key ? 'caption' : null;
                if (field) {
                    let body = key[field] || '';
                    for (const gm of normalized) {
                        const token = `@${gm.groupJid}`;
                        if (!body.includes(token)) {
                            body = body.length ? `${body} ${token}` : token;
                        }
                    }
                    key[field] = body;
                }
            }
        }
    }
    if (hasOptionalProperty(message, 'forwardedNewsletter') && !!message.forwardedNewsletter) {
        const messageType = Object.keys(m)[0];
        const key = m[messageType];
        if (key && typeof key === 'object') {
            const info = message.forwardedNewsletter;
            const forwardedNewsletterMessageInfo = { newsletterJid: info.newsletterJid };
            if (info.serverMessageId !== undefined) {
                forwardedNewsletterMessageInfo.serverMessageId = Number(info.serverMessageId) || 0;
            }
            if (info.newsletterName !== undefined) {
                forwardedNewsletterMessageInfo.newsletterName = info.newsletterName;
            }
            if (info.contentType !== undefined) {
                forwardedNewsletterMessageInfo.contentType = info.contentType;
            }
            if (info.accessibilityText !== undefined) {
                forwardedNewsletterMessageInfo.accessibilityText = info.accessibilityText;
            }
            key.contextInfo = ('contextInfo' in key && key.contextInfo) ? key.contextInfo : {};
            key.contextInfo.forwardedNewsletterMessageInfo = forwardedNewsletterMessageInfo;
            key.contextInfo.isForwarded = true;
        }
    }
    if (hasOptionalProperty(message, 'contextInfo') && !!message.contextInfo) {
        const messageType = Object.keys(m)[0];
        const key = m[messageType];
        if ('contextInfo' in key && !!key.contextInfo) {
            key.contextInfo = { ...key.contextInfo, ...message.contextInfo };
        }
        else if (key) {
            key.contextInfo = message.contextInfo;
        }
    }

    if (hasOptionalProperty(message, 'groupStatus') && !!message.groupStatus) {
        const messageType = Object.keys(m)[0];
        const key = m[messageType];
        if ('contextInfo' in key && !!key.contextInfo) {
            key.contextInfo.isGroupStatus = message.groupStatus;
        }
        else if (key) {
            key.contextInfo = {
                isGroupStatus: message.groupStatus
            };
        }
        m = { groupStatusMessageV2: { message: m } };
        delete message.groupStatus;
    }

    if (hasOptionalProperty(message, 'spoiler') && !!message.spoiler) {
        const messageType = Object.keys(m)[0];
        const key = m[messageType];
        if ('contextInfo' in key && !!key.contextInfo) {
            key.contextInfo.isSpoiler = message.spoiler;
        }
        else if (key) {
            key.contextInfo = {
                isSpoiler: message.spoiler
            };
        }
        m = { spoilerMessage: { message: m } };
        delete message.spoiler;
    }

    else if (hasOptionalProperty(message, 'interactiveAsTemplate') && !!message.interactiveAsTemplate) {
        if (!m.interactiveMessage) {
            throw new Boom('Invalid message type for template', { statusCode: 400 });
        }
        m = {
            templateMessage: {
                interactiveMessageTemplate: m.interactiveMessage,
                templateId: message.id || 'template-' + Date.now()
            }
        };
        delete message.interactiveAsTemplate;
    }

    if (hasOptionalProperty(message, 'ephemeral') && !!message.ephemeral) {
        m = { ephemeralMessage: { message: m } };
        delete message.ephemeral;
    }

    const markInnerViewOnce = (inner) => {
        const key = getContentType(inner);
        const target = key && inner[key];
        if (target && typeof target === 'object' && 'viewOnce' in proto.Message[key.charAt(0).toUpperCase() + key.slice(1)].prototype) {
            target.viewOnce = true;
        }
    };
    if (hasOptionalProperty(message, 'isLottie') && !!message.isLottie) {
        m = { lottieStickerMessage: { message: m } };
    }
    else if (hasOptionalProperty(message, 'viewOnce') && !!message.viewOnce) {
        markInnerViewOnce(m);
        m = { viewOnceMessage: { message: m } };
    }

    else if (hasOptionalProperty(message, 'viewOnceV2') && !!message.viewOnceV2) {
        markInnerViewOnce(m);
        m = { viewOnceMessageV2: { message: m } };
        delete message.viewOnceV2;
    }

    else if (hasOptionalProperty(message, 'viewOnceV2Extension') && !!message.viewOnceV2Extension) {
        markInnerViewOnce(m);
        m = { viewOnceMessageV2Extension: { message: m } };
        delete message.viewOnceV2Extension;
    }
    if (hasOptionalProperty(message, 'edit')) {
        m = {
            protocolMessage: {
                key: message.edit,
                editedMessage: m,
                timestampMs: Date.now(),
                type: WAProto.Message.ProtocolMessage.Type.MESSAGE_EDIT
            }
        };
    }
    if (hasOptionalProperty(message, 'messageAssociation') && !!message.messageAssociation) {
        m.messageContextInfo = m.messageContextInfo || {};
        m.messageContextInfo.messageAssociation = message.messageAssociation;
    }
    if (hasOptionalProperty(message, 'albumParentKey') && !!message.albumParentKey) {
        m.messageContextInfo = {
            ...m.messageContextInfo,
            messageAssociation: {
                associationType: WAProto.MessageAssociation.AssociationType.MEDIA_ALBUM,
                parentMessageKey: message.albumParentKey
            }
        }
    }
    return m
}
