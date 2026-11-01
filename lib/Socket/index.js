import { createAntiBugGuard } from '../AnchorGuard/index.js';
import { DEFAULT_CONNECTION_CONFIG } from '../Defaults/index.js';
import { prepareModernMessageContent } from '../Utils/modern-messages.js';
import { makeNewsletterStatusFetcher, makeNewsletterStatusReactionSender, makeNewsletterStatusRevokeSender, makeNewsletterStatusSender, makeNewsletterStatusUpdatesFetcher } from '../Utils/newsletter-status.js';
import { bindVoiceRecognition } from '../Utils/voice-recognition.js';
import { makeCommunitiesSocket } from './communities.js';
// export the last socket layer
const makeWASocket = (config) => {
    const newConfig = {
        ...DEFAULT_CONNECTION_CONFIG,
        ...config
    };
    const sock = makeCommunitiesSocket(newConfig);
    bindVoiceRecognition(sock, newConfig);
    // modern content shorthands (html apps, status extras, ...) are resolved before sending
    const sendMessage = sock.sendMessage.bind(sock);
    sock.sendMessage = ((jid, content, options = {}) => sendMessage(jid, prepareModernMessageContent(content), options));
    const extended = Object.assign(sock, {
        sendNewsletterStatus: makeNewsletterStatusSender(sock, newConfig),
        sendNewsletterStatusReaction: makeNewsletterStatusReactionSender(sock),
        revokeNewsletterStatus: makeNewsletterStatusRevokeSender(sock),
        getNewsletterStatuses: makeNewsletterStatusFetcher(sock),
        getNewsletterStatusUpdates: makeNewsletterStatusUpdatesFetcher(sock)
    });
    // opt-in anti force-close guard; off unless `AnchorGuard: true`
    const anchorGuard = newConfig.AnchorGuard
        ? createAntiBugGuard(extended, { logger: extended.logger, ...(newConfig.AnchorGuardConfig ?? {}) })
        : undefined;
    return Object.assign(extended, { anchorGuard });
};
export default makeWASocket;
//# sourceMappingURL=index.js.map