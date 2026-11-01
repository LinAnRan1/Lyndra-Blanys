import { createAntiBugGuard } from '../AnchorGuard/index.js'
import { DEFAULT_CONNECTION_CONFIG } from '../Defaults'
import type { UserFacingSocketConfig } from '../Types'
import { prepareModernMessageContent } from '../Utils/modern-messages.js'
import {
	makeNewsletterStatusFetcher,
	makeNewsletterStatusReactionSender,
	makeNewsletterStatusRevokeSender,
	makeNewsletterStatusSender,
	makeNewsletterStatusUpdatesFetcher
} from '../Utils/newsletter-status.js'
import { bindVoiceRecognition } from '../Utils/voice-recognition.js'
import { makeCommunitiesSocket } from './communities'

// export the last socket layer
const makeWASocket = (config: UserFacingSocketConfig) => {
	const newConfig = {
		...DEFAULT_CONNECTION_CONFIG,
		...config
	}

	const sock = makeCommunitiesSocket(newConfig)
	bindVoiceRecognition(sock as any, newConfig as any)

	// modern content shorthands (html apps, status extras, ...) are resolved before sending
	const sendMessage = sock.sendMessage.bind(sock)
	sock.sendMessage = ((jid: any, content: any, options: any = {}) =>
		sendMessage(jid, prepareModernMessageContent(content) as any, options)) as typeof sock.sendMessage

	const extended = Object.assign(sock, {
		sendNewsletterStatus: makeNewsletterStatusSender(sock as any, newConfig as any),
		sendNewsletterStatusReaction: makeNewsletterStatusReactionSender(sock as any),
		revokeNewsletterStatus: makeNewsletterStatusRevokeSender(sock as any),
		getNewsletterStatuses: makeNewsletterStatusFetcher(sock as any),
		getNewsletterStatusUpdates: makeNewsletterStatusUpdatesFetcher(sock as any)
	})

	// opt-in anti force-close guard; off unless `AnchorGuard: true`
	const anchorGuard = newConfig.AnchorGuard
		? createAntiBugGuard(extended, { logger: extended.logger, ...(newConfig.AnchorGuardConfig ?? {}) })
		: undefined

	return Object.assign(extended, { anchorGuard })
}

export default makeWASocket
