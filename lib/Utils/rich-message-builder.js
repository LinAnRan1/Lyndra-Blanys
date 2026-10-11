import { randomUUID } from 'crypto';
import { proto } from '../../WAProto/index.js';
const makeSection = (name, primitive, typename) => ({
    ...(typename ? { __typename: typename } : {}),
    view_model: {
        [Array.isArray(primitive) ? 'primitives' : 'primitive']: primitive,
        __typename: `GenAI${name}LayoutViewModel`
    }
});
export class AIRich {
    constructor(client) {
        this.submessages = [];
        this.sections = [];
        this.sources = [];
        this.titleText = '';
        this.footerText = '';
        this.contextInfo = {};
        this.extraPayload = {};
        if (!client?.relayMessage)
            throw new Error('Socket with relayMessage is required');
        this.client = client;
    }
    setTitle(title) {
        this.titleText = title;
        return this;
    }
    setFooter(footer) {
        this.footerText = footer;
        return this;
    }
    setContextInfo(contextInfo) {
        this.contextInfo = contextInfo;
        return this;
    }
    addPayload(payload) {
        this.extraPayload = { ...this.extraPayload, ...payload };
        return this;
    }
    title(value) {
        return this.setTitle(value);
    }
    footer(value) {
        return this.setFooter(value);
    }
    text(value) {
        return this.addText(value);
    }
    addText(text) {
        if (typeof text !== 'string')
            throw new TypeError('Text must be a string');
        this.submessages.push({ messageType: 2, messageText: text });
        this.sections.push(makeSection('Single', { text, __typename: 'GenAIMarkdownTextUXPrimitive' }));
        return this;
    }
    addCode(language, code) {
        if (typeof language !== 'string' || typeof code !== 'string') {
            throw new TypeError('Language and code must be strings');
        }
        this.submessages.push({
            messageType: 5,
            codeMetadata: {
                codeLanguage: language,
                codeBlocks: [{ highlightType: 0, codeContent: code }]
            }
        });
        this.sections.push(makeSection('Single', {
            language,
            code_blocks: [{ content: code, type: 'DEFAULT' }],
            __typename: 'GenAICodeUXPrimitive'
        }));
        return this;
    }
    addTable(table, title = '') {
        if (!Array.isArray(table) || table.some(row => !Array.isArray(row) || row.some(cell => typeof cell !== 'string'))) {
            throw new TypeError('Table must be an array of string rows');
        }
        const rows = table.map((items, index) => ({ items, isHeading: index === 0 }));
        this.submessages.push({ messageType: 4, tableMetadata: { title, rows } });
        this.sections.push(makeSection('Single', {
            rows: rows.map(row => ({ is_header: row.isHeading, cells: row.items })),
            __typename: 'GenATableUXPrimitive'
        }));
        return this;
    }
    addSource(sources) {
        this.sources.push(...(Array.isArray(sources) ? sources : [sources]));
        return this;
    }
    addSuggest(suggestions) {
        const items = Array.isArray(suggestions) ? suggestions : [suggestions];
        if (items.some(item => typeof item !== 'string'))
            throw new TypeError('Suggestions must be strings');
        const primitives = items.map(prompt_text => ({
            prompt_text,
            prompt_type: 'SUGGESTED_PROMPT',
            __typename: 'GenAIFollowUpSuggestionPillPrimitive'
        }));
        this.sections.push(makeSection(items.length === 1 ? 'Single' : 'HScroll', items.length === 1 ? primitives[0] : primitives, 'GenAIUnifiedResponseSection'));
        return this;
    }
    addSubmessage(submessages) {
        this.submessages.push(...(Array.isArray(submessages) ? submessages : [submessages]));
        return this;
    }
    addSection(sections) {
        this.sections.push(...(Array.isArray(sections) ? sections : [sections]));
        return this;
    }
    async build(options = {}) {
        const { forwarded = true, notification = false, includesUnifiedResponse = true, includesSubmessages = true, quoted, quotedParticipant } = options;
        const sections = [...this.sections];
        if (this.footerText) {
            sections.push(makeSection('Single', { text: this.footerText, __typename: 'GenAIMetadataTextPrimitive' }));
        }
        const contextInfo = { ...this.contextInfo };
        if (forwarded) {
            contextInfo.forwardingScore = 1;
            contextInfo.isForwarded = true;
            contextInfo.forwardedAiBotMessageInfo = { botJid: '0@bot' };
            contextInfo.forwardOrigin = 4;
        }
        if (quoted) {
            contextInfo.stanzaId = quoted.key?.id ?? quoted.id;
            contextInfo.participant = quotedParticipant ?? quoted.key?.participant ?? quoted.key?.remoteJid;
            contextInfo.quotedType = 0;
            contextInfo.quotedMessage = quoted.message ?? undefined;
        }
        return proto.Message.create({
            ...this.extraPayload,
            messageContextInfo: {
                deviceListMetadata: {},
                deviceListMetadataVersion: 2,
                botMetadata: {
                    messageDisclaimerText: this.titleText,
                    richResponseSourcesMetadata: { sources: this.sources },
                    ...(notification
                        ? {
                            sessionTransparencyMetadata: {
                                disclaimerText: 'Automated response',
                                hcaId: `hca_${Date.now()}`,
                                sessionTransparencyType: 1
                            }
                        }
                        : {})
                }
            },
            botForwardedMessage: {
                message: {
                    richResponseMessage: {
                        messageType: 1,
                        submessages: includesSubmessages ? this.submessages : [],
                        unifiedResponse: {
                            data: includesUnifiedResponse
                                ? Buffer.from(JSON.stringify({ response_id: randomUUID(), sections }))
                                : Buffer.alloc(0)
                        },
                        contextInfo
                    }
                }
            }
        });
    }
    async send(jid, options = {}) {
        const message = await this.build(options);
        return this.client.relayMessage(jid, message, options);
    }
}
export class ORich extends AIRich {
}
//# sourceMappingURL=rich-message-builder.js.map