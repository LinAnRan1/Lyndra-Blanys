/* Lyndrā-Blanys: attaches the extra section builders (extras, Meta AI, bot signature, native flow)
 * onto the builder classes. Builder code originates from Nixel's MessageBuilder; see NOTICE.md. */
import { AIRich, Button, ButtonV2, Carousel, MessageBuilder, ORich, Toolkit } from './index.js'
import * as messageBuilderExtras from './extras.js'
import * as metaAiSections from './metaai.js'
import * as botSignature from './bot-signature.js'
import * as nativeFlow from '../Utils/native-flow.js'
import { nativeFlowButtonsViolateConstraints } from '../Utils/messages-extra.js'

let attached = false

/** Idempotent. Runs after the whole module graph has evaluated, so cyclic imports are never read half-initialised. */
export const attachBuilderMembers = () => {
	if (attached) return
	attached = true
	const builderMembers = [
		...Object.entries(messageBuilderExtras),
		...Object.entries(metaAiSections),
		...Object.entries(botSignature),
		...Object.entries(nativeFlow),
		['nativeFlowButtonsViolateConstraints', nativeFlowButtonsViolateConstraints]
	].filter(([name]) => name !== 'default')

	for (const builder of [Button, ButtonV2, Carousel, AIRich, ORich, Toolkit]) {
		for (const [name, member] of builderMembers) {
			if (!(name in builder)) {
				Object.defineProperty(builder, name, { value: member, enumerable: true, configurable: true })
			}
		}
	}

	const mutableBuilder = MessageBuilder
	for (const [name, member] of builderMembers) {
		if (!(name in mutableBuilder)) {
			mutableBuilder[name] = member
		}
	}

	Object.freeze(MessageBuilder)
}

queueMicrotask(attachBuilderMembers)
