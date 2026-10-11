import { proto } from '../../WAProto/index.js';
import type { MessageRelayOptions } from '../Types/index.js';
type RichRelayClient = {
    relayMessage: (jid: string, message: proto.IMessage, options?: MessageRelayOptions) => Promise<string>;
};
type RichBuildOptions = {
    forwarded?: boolean;
    notification?: boolean;
    includesUnifiedResponse?: boolean;
    includesSubmessages?: boolean;
    quoted?: {
        key?: {
            id?: string | null;
            participant?: string | null;
            remoteJid?: string | null;
        };
        message?: proto.IMessage | null;
        id?: string;
    };
    quotedParticipant?: string;
};
type RichSection = Record<string, unknown>;
type RichSubmessage = proto.IAIRichResponseSubMessage;
export declare class AIRich {
    private readonly client;
    private readonly submessages;
    private readonly sections;
    private readonly sources;
    private titleText;
    private footerText;
    private contextInfo;
    private extraPayload;
    constructor(client: RichRelayClient);
    setTitle(title: string): this;
    setFooter(footer: string): this;
    setContextInfo(contextInfo: proto.IContextInfo): this;
    addPayload(payload: Partial<proto.IMessage>): this;
    title(value: string): this;
    footer(value: string): this;
    text(value: string): this;
    addText(text: string): this;
    addCode(language: string, code: string): this;
    addTable(table: string[][], title?: string): this;
    addSource(sources: proto.BotSourcesMetadata.IBotSourceItem | proto.BotSourcesMetadata.IBotSourceItem[]): this;
    addSuggest(suggestions: string | string[]): this;
    addSubmessage(submessages: RichSubmessage | RichSubmessage[]): this;
    addSection(sections: RichSection | RichSection[]): this;
    build(options?: RichBuildOptions): Promise<proto.IMessage>;
    send(jid: string, options?: RichBuildOptions & MessageRelayOptions): Promise<string>;
}
export declare class ORich extends AIRich {
}
export {};
//# sourceMappingURL=rich-message-builder.d.ts.map