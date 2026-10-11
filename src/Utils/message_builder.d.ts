import type { proto } from '../../WAProto/index.js'
import type { MessageRelayOptions, WAMediaUpload, WAMessage, WAMessageContent } from '../Types'
import type { BinaryNode } from '../WABinary'

export type MessageBuilderOptions = Record<string, unknown> & {
	messageId?: string
	userJid?: string
	additionalNodes?: BinaryNode[]
	bypassDownload?: boolean
	forwarded?: boolean
	notification?: boolean
	includesUnifiedResponse?: boolean
	includesSubmessages?: boolean
	quoted?: WAMessage | { key?: WAMessage['key']; message?: WAMessageContent; id?: string }
	quotedParticipant?: string
}

export interface MessageBuilderClient {
	relayMessage: (jid: string, message: proto.IMessage, options?: MessageRelayOptions) => Promise<string>
	user?: { id?: string }
	authState?: { creds?: { me?: { id?: string } } }
	waUploadToServer?: (...args: unknown[]) => Promise<unknown>
}

interface BaseBuilderMethods {
	setTitle(title: string): this
	setSubtitle(subtitle: string): this
	setBody(body: string): this
	setFooter(footer: string): this
	setContextInfo(contextInfo: Record<string, unknown>): this
	addPayload(payload: Record<string, unknown>): this
	title(value: string): this
	subtitle(value: string): this
	text(value: string): this
	footer(value: string): this
	image(url: string | WAMediaUpload, options?: Record<string, unknown>): this
}

export declare const VERSION: '4.7'

export declare class Button implements BaseBuilderMethods {
	constructor(client: MessageBuilderClient)
	setTitle(title: string): this
	setSubtitle(subtitle: string): this
	setBody(body: string): this
	setFooter(footer: string): this
	setContextInfo(contextInfo: Record<string, unknown>): this
	addPayload(payload: Record<string, unknown>): this
	title(value: string): this
	subtitle(value: string): this
	text(value: string): this
	footer(value: string): this
	image(url: string | WAMediaUpload, options?: Record<string, unknown>): this
	loadFrom(message: WAMessage | proto.IMessage): this
	setImage(path: string | Buffer, options?: Record<string, unknown>): this
	setDocument(path: string | Buffer, options?: Record<string, unknown>): this
	setMedia(media: Record<string, unknown>): this
	clearButtons(): this
	setParams(params: Record<string, unknown>): this
	addButton(name: string, params: string | Record<string, unknown>): this
	addSelection(title: string, options?: Record<string, unknown>): this
	makeSection(title?: string, highlightLabel?: string): this
	makeRow(header?: string, title?: string, description?: string, id?: string): this
	addLocation(options?: Record<string, unknown>): this
	addUrl(displayText?: string, url?: string, webviewInteraction?: boolean, options?: Record<string, unknown>): this
	addCopy(displayText?: string, copyCode?: string, options?: Record<string, unknown>): this
	build(jid: string, options?: MessageBuilderOptions): Promise<WAMessage>
	send(jid: string, options?: MessageBuilderOptions): Promise<WAMessage>
}

export declare class ButtonV2 implements BaseBuilderMethods {
	constructor(client: MessageBuilderClient)
	setTitle(title: string): this
	setSubtitle(subtitle: string): this
	setBody(body: string): this
	setFooter(footer: string): this
	setContextInfo(contextInfo: Record<string, unknown>): this
	addPayload(payload: Record<string, unknown>): this
	title(value: string): this
	subtitle(value: string): this
	text(value: string): this
	footer(value: string): this
	image(url: string | WAMediaUpload, options?: Record<string, unknown>): this
	loadFrom(message: WAMessage | proto.IMessage): this
	addButton(displayText?: string, buttonId?: string): this
	addRawButton(button: Record<string, unknown>): this
	setRawThumbnail(thumbnail: WAMediaUpload): this
	setThumbnail(path: string): this
	setMedia(media: Record<string, unknown>): this
	build(jid: string, options?: MessageBuilderOptions): Promise<WAMessage>
	send(jid: string, options?: MessageBuilderOptions): Promise<WAMessage>
}

export declare class Carousel implements BaseBuilderMethods {
	constructor(client: MessageBuilderClient)
	setTitle(title: string): this
	setSubtitle(subtitle: string): this
	setBody(body: string): this
	setFooter(footer: string): this
	setContextInfo(contextInfo: Record<string, unknown>): this
	addPayload(payload: Record<string, unknown>): this
	title(value: string): this
	subtitle(value: string): this
	text(value: string): this
	footer(value: string): this
	image(url: string | WAMediaUpload, options?: Record<string, unknown>): this
	loadFrom(message: WAMessage | proto.IMessage): this
	addCard(card: Record<string, unknown>): this
	build(jid: string, options?: MessageBuilderOptions): WAMessage
	send(jid: string, options?: MessageBuilderOptions): Promise<WAMessage>
}

export declare class AIRich implements BaseBuilderMethods {
	constructor(client: MessageBuilderClient, options?: { dynamic?: boolean; unsupportedTypeAlert?: boolean })
	setTitle(title: string): this
	setSubtitle(subtitle: string): this
	setBody(body: string): this
	setFooter(footer: string): this
	setContextInfo(contextInfo: proto.IContextInfo): this
	addPayload(payload: Partial<proto.IMessage>): this
	title(value: string): this
	subtitle(value: string): this
	text(value: string): this
	footer(value: string): this
	image(url: string | WAMediaUpload, options?: Record<string, unknown>): this
	loadFrom(message: WAMessage | proto.IMessage): this
	setResponseId(id: string): this
	refreshResponseId(): this
	setBotResponseId(id: string): this
	refreshBotResponseId(): this
	addText(text: string, options?: Record<string, unknown>): this
	addFOAText(text: string, options?: Record<string, unknown>): this
	addCode(language: string, code: string, options?: Record<string, unknown>): this
	addTable(table: string[][], options?: Record<string, unknown>): this
	addSource(sources?: unknown[], options?: Record<string, unknown>): this
	addReels(items?: unknown[], options?: Record<string, unknown>): this
	addImage(imageUrl: string | Record<string, unknown>, options?: Record<string, unknown>): this
	addVideo(videoUrl: string | Record<string, unknown>, options?: Record<string, unknown>): this
	addProduct(data?: Record<string, unknown>, options?: Record<string, unknown>): this
	addPost(data?: Record<string, unknown>, options?: Record<string, unknown>): this
	addMetadata(text: string, options?: Record<string, unknown>): this
	addTip(text: string, options?: Record<string, unknown>): this
	addWidget(data: Record<string, unknown>, options?: Record<string, unknown>): this
	addFooterAction(data: Record<string, unknown>, options?: Record<string, unknown>): this
	addSuggest(suggestions: string | string[], options?: Record<string, unknown>): this
	addSubmessage(
		submessage: proto.IAIRichResponseSubMessage | proto.IAIRichResponseSubMessage[],
		options?: Record<string, unknown>
	): this
	addSection(section: Record<string, unknown> | Record<string, unknown>[], options?: Record<string, unknown>): this
	delete(target: string | number): this
	hasId(id: string): boolean
	getIds(): string[]
	peek(id: string): Record<string, unknown> | undefined
	assignId(index: number, id: string): this
	build(jid: string, options?: MessageBuilderOptions): Promise<WAMessage>
	buildEdit(
		jid: string,
		targetId: string,
		options?: MessageBuilderOptions & { msg?: proto.IMessage }
	): Promise<WAMessage>
	sendEdit(jid: string, id: string, options?: MessageBuilderOptions & { msg?: proto.IMessage }): Promise<WAMessage>
	send(jid: string, options?: MessageBuilderOptions): Promise<WAMessage>
	static tokenizer(code: string, language?: string): { codeBlock: unknown[]; unified_codeBlock: unknown[] }
	static toTableMetadata(table: string[][], options?: Record<string, unknown>): Record<string, unknown>
	static generateVerificationMetadata(): proto.BotSignatureVerificationMetadata
	static newLayout(name: string, data: unknown, extra?: Record<string, unknown>): Record<string, unknown>
}

export declare class ORich extends AIRich {}

export declare class Toolkit {
	static extractIE(text: string, options?: Record<string, unknown>): Record<string, unknown>
	static resize(buffer: Buffer, width: number, height: number, fit?: string): Promise<Buffer>
	static waitAllPromises<T>(input: T): Promise<T>
	static fetchBuffer(url: string, options?: RequestInit, config?: { silent?: boolean }): Promise<Buffer>
	static toUrl(client: MessageBuilderClient, path: string, mediaType?: string): Promise<string>
	static resolveMedia(
		client: MessageBuilderClient,
		media: WAMediaUpload,
		mediaType?: string,
		options?: Record<string, unknown>
	): Promise<unknown>
	static getMp4Duration(buffer: Buffer, options?: { silent?: boolean }): number
	static getMp4Preview(buffer: Buffer, options?: Record<string, unknown>): Promise<Buffer | string>
	static stringifyEscaped(value: unknown): string
}
