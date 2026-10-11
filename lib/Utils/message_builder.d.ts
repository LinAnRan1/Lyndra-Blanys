export const VERSION: "4.7";
export class Button extends BaseBuilder {
    static paramsList: {
        limited_time_offer: {
            text: string;
            url: string;
            copy_code: string;
            expiration_time: string;
        };
        bottom_sheet: {
            in_thread_buttons_limit: string;
            divider_indices: string[];
            list_title: string;
            button_title: string;
        };
        tap_target_configuration: {
            title: string;
            description: string;
            canonical_url: string;
            domain: string;
            buttonIndex: string;
        };
    };
    constructor(client: any);
    _buttons: any[];
    _currentSelectionIndex: number;
    _currentSectionIndex: number;
    _params: {};
    loadFrom(msg: any): this;
    _data: any;
    setImage(path: any, options?: {}): this;
    setDocument(path: any, options?: {}): this;
    setMedia(obj: any): this;
    clearButtons(): this;
    setParams(obj: any): this;
    addButton(name: any, params: any): this;
    makeRow(header?: string, title?: string, description?: string, id?: string): this;
    makeSection(title?: string, highlight_label?: string): this;
    addSelection(title: any, options?: {}): this;
    addReply(display_text?: string, id?: string, options?: {}): this;
    addCall(display_text?: string, id?: string, options?: {}): this;
    addReminder(display_text?: string, id?: string, options?: {}): this;
    addCancelReminder(display_text?: string, id?: string, options?: {}): this;
    addAddress(display_text?: string, id?: string, options?: {}): this;
    addLocation(options?: {}): this;
    addUrl(display_text?: string, url?: string, webview_interaction?: boolean, options?: {}): this;
    addCopy(display_text?: string, copy_code?: string, options?: {}): this;
    toCard(): Promise<{
        body: {
            text: string;
        };
        footer: {
            text: string;
        };
        header: any;
        nativeFlowMessage: {
            messageParamsJson: string;
            buttons: any[];
        };
    }>;
    build(jid: any, { messageId, ...options }?: {}): Promise<import("../index.js").WAMessage>;
    send(jid: any, { messageId, additionalNodes, ...options }?: {
        additionalNodes?: never[] | undefined;
    }): Promise<import("../index.js").WAMessage>;
    #private;
}
export class ButtonV2 extends BaseBuilder {
    constructor(client: any);
    _buttons: any[];
    loadFrom(msg: any): this;
    _image: any;
    _data: any;
    addButton(displayText?: string, buttonId?: `${string}-${string}-${string}-${string}-${string}`): this;
    addRawButton(obj: any): this;
    setRawThumbnail(thumbnail: any): this;
    setThumbnail(path: any): this;
    setMedia(obj: any): this;
    build(jid: any, { messageId, ...options }?: {}): Promise<import("../index.js").WAMessage>;
    send(jid: any, { messageId, additionalNodes, ...options }?: {
        additionalNodes?: never[] | undefined;
    }): Promise<import("../index.js").WAMessage>;
    #private;
}
export class Carousel extends BaseBuilder {
    constructor(client: any);
    _cards: any[];
    loadFrom(msg: any): this;
    addCard(card: any): this;
    build(jid: any, { messageId, ...options }?: {}): import("../index.js").WAMessage;
    send(jid: any, { messageId, additionalNodes, ...options }?: {
        additionalNodes?: never[] | undefined;
    }): Promise<import("../index.js").WAMessage>;
    #private;
}
export class AIRich extends BaseBuilder {
    static tokenizer(code: any, lang?: string): {
        codeBlock: any[];
        unified_codeBlock: {
            content: any;
            type: any;
        }[];
    };
    static toTableMetadata(arr: any, { hyperlink, citation, latex }?: {
        hyperlink?: boolean | undefined;
        citation?: boolean | undefined;
        latex?: boolean | undefined;
    }): {
        title: string;
        rows: {
            isHeading?: boolean | undefined;
            items: any[];
        }[];
        unified_rows: {
            markdown_cells?: {
                inline_entities?: never[] | ({
                    key: any;
                    metadata: {
                        display_name: any;
                        is_trusted: any;
                        url: any;
                        __typename: string;
                        reference_id?: undefined;
                        reference_url?: undefined;
                        reference_title?: undefined;
                        reference_display_name?: undefined;
                        sources?: undefined;
                        latex_expression?: undefined;
                        latex_image?: undefined;
                        font_height?: undefined;
                        padding?: undefined;
                    };
                } | {
                    key: any;
                    metadata: {
                        reference_id: any;
                        reference_url: any;
                        reference_title: any;
                        reference_display_name: any;
                        sources: never[];
                        __typename: string;
                        display_name?: undefined;
                        is_trusted?: undefined;
                        url?: undefined;
                        latex_expression?: undefined;
                        latex_image?: undefined;
                        font_height?: undefined;
                        padding?: undefined;
                    };
                } | {
                    key: any;
                    metadata: {
                        latex_expression: any;
                        latex_image: {
                            url: any;
                            width: number;
                            height: number;
                        };
                        font_height: number;
                        padding: number;
                        __typename: string;
                        display_name?: undefined;
                        is_trusted?: undefined;
                        url?: undefined;
                        reference_id?: undefined;
                        reference_url?: undefined;
                        reference_title?: undefined;
                        reference_display_name?: undefined;
                        sources?: undefined;
                    };
                })[] | undefined;
                text: any;
            }[] | undefined;
            is_header: boolean;
            cells: any[];
        }[];
    };
    static generateVerificationMetadata(): {
        proofs: {
            version: number;
            useCase: number;
            signature: string;
            certificateChain: string[];
        }[];
    };
    static newLayout(name: any, data: any, extra?: {}): {
        view_model: {
            [x: string]: any;
            __typename: string;
        };
    };
    constructor(client: any, { dynamic, unsupportedTypeAlert }?: {
        dynamic?: boolean | undefined;
        unsupportedTypeAlert?: boolean | undefined;
    });
    _nodes: any[];
    _idIndex: Map<any, any>;
    _unsupportedTypeAlert: boolean;
    _dynamic: boolean;
    _responseId: `${string}-${string}-${string}-${string}-${string}`;
    _botResponseId: `${string}-${string}-${string}-${string}-${string}`;
    _lastMessageKey: (import("../index.js").proto.IMessageKey & {
        remoteJidAlt?: string;
        remoteJidUsername?: string;
        participantAlt?: string;
        participantUsername?: string;
        server_id?: string;
        addressingMode?: string;
        isViewOnce?: boolean;
    }) | null;
    loadFrom(msg: any): this;
    setResponseId(id: any): this;
    refreshResponseId(): this;
    setBotResponseId(id: any): this;
    refreshBotResponseId(): this;
    createAlert(type: any): {
        messageType: number;
        messageText: string;
    } | undefined;
    addText(text: any, { hyperlink, citation, latex, id, replace, insertAt }?: {
        hyperlink?: boolean | undefined;
        citation?: boolean | undefined;
        latex?: boolean | undefined;
    }): this;
    addFOAText(text: any, { id, replace, insertAt }?: {}): this;
    addCode(language: any, code: any, { id, replace, insertAt }?: {}): this;
    addTable(table: any, { hyperlink, citation, latex, id, replace, insertAt }?: {
        hyperlink?: boolean | undefined;
        citation?: boolean | undefined;
        latex?: boolean | undefined;
    }): this;
    addSource(sources?: any[], { id, replace, insertAt }?: {}): this;
    addReels(reelsItems?: any[], { id, replace, insertAt }?: {}): this;
    addImage(imageUrl: any, { width, height, status, update_text, resolveUrl, id, replace, insertAt }?: {
        status?: string | undefined;
        resolveUrl?: boolean | undefined;
    }): this;
    addVideo(videoUrl: any, { autoFill, status, estimatedTime, id, replace, insertAt }?: {
        autoFill?: boolean | undefined;
        status?: string | undefined;
    }): this;
    addProduct(data?: {}, { id, replace, insertAt }?: {}): this;
    addPost(data?: {}, { id, replace, insertAt }?: {}): this;
    addMetadata(text: any, { id, replace, insertAt }?: {}): this;
    addTip(text: any, { id, replace, insertAt }?: {}): this;
    addWidget(data: any, { layout, id, replace, insertAt, ...options }?: {}): this;
    addFooterAction(data: any, { layout, id, replace, insertAt, ...options }?: {}): this;
    addSuggest(suggestion: any, { scroll, layout, id, replace, insertAt }?: {
        scroll?: boolean | undefined;
    }): this;
    build(jid: any, { bypassDownload, forwarded, notification, includesUnifiedResponse, includesSubmessages, quoted, quotedParticipant, messageId, ...options }?: {
        bypassDownload?: boolean | undefined;
        forwarded?: boolean | undefined;
        notification?: boolean | undefined;
        includesUnifiedResponse?: boolean | undefined;
        includesSubmessages?: boolean | undefined;
    }): Promise<import("../index.js").WAMessage>;
    buildEdit(targetJid: any, targetId: any, { msg, messageId, ...options }?: {}): Promise<import("../index.js").WAMessage>;
    sendEdit(jid: any, id: any, { msg, messageId, additionalNodes, ...options }?: {
        additionalNodes?: never[] | undefined;
    }): Promise<import("../index.js").WAMessage>;
    send(jid: any, { bypassDownload, forwarded, notification, includesUnifiedResponse, includesSubmessages, messageId, additionalNodes, ...options }?: {
        bypassDownload?: boolean | undefined;
        forwarded?: boolean | undefined;
        notification?: boolean | undefined;
        includesUnifiedResponse?: boolean | undefined;
        includesSubmessages?: boolean | undefined;
        additionalNodes?: never[] | undefined;
    }): Promise<import("../index.js").WAMessage>;
    _makeNode(id: any, section: any, submessage: any): {
        id: any;
        section: any;
        submessage: any;
    };
    _registerId(node: any, id: any): void;
    _unregisterId(node: any): void;
    hasId(id: any): boolean;
    getIds(): any[];
    peek(id: any): {
        id: any;
        section: any;
        submessage: any;
    } | null;
    assignId(index: any, id: any): this;
    _getNode(id: any): any;
    _resolveTarget(target: any): {
        id: string;
        offset: any;
    };
    _resolveNodeIndex(target: any): {
        id: string;
        offset: any;
        baseIndex: number;
        index: any;
    };
    _validateSections(section: any): any[];
    _validateSubmessages(submessage: any): any[];
    _pairSubmessages(sections: any, submessages: any): any;
    _addContent(section: any, submessage: any, { id, replace, insertAt }?: {}): this;
    addSection(section: any, options?: {}): this;
    addSubmessage(submessage: any, options?: {}): this;
    delete(target: any): this;
    get _sections(): any[];
    get _submessages(): any[];
    get sections(): any[];
    get items(): any[];
    #private;
}
export class ORich extends AIRich {
}
export class Toolkit {
    static extractIE(text: any, { extract, hyperlink, citation, latex }?: {
        extract?: boolean | undefined;
        hyperlink?: boolean | undefined;
        citation?: boolean | undefined;
        latex?: boolean | undefined;
    }): {
        text: any;
        ie: never[];
        inline_entities: never[];
    } | {
        text: string;
        ie: ({
            type: string;
            ie: {
                key: string;
                text: any;
                url: any;
                width: any;
                height: any;
                font_height: any;
                padding: any;
                is_trusted?: undefined;
                reference_id?: undefined;
            };
        } | {
            type: string;
            ie: {
                key: string;
                text: any;
                url: any;
                is_trusted: boolean;
                width?: undefined;
                height?: undefined;
                font_height?: undefined;
                padding?: undefined;
                reference_id?: undefined;
            };
        } | {
            type: string;
            ie: {
                reference_id: number;
                key: string;
                text: string;
                url: any;
                width?: undefined;
                height?: undefined;
                font_height?: undefined;
                padding?: undefined;
                is_trusted?: undefined;
            };
        })[];
        inline_entities: ({
            key: any;
            metadata: {
                display_name: any;
                is_trusted: any;
                url: any;
                __typename: string;
                reference_id?: undefined;
                reference_url?: undefined;
                reference_title?: undefined;
                reference_display_name?: undefined;
                sources?: undefined;
                latex_expression?: undefined;
                latex_image?: undefined;
                font_height?: undefined;
                padding?: undefined;
            };
        } | {
            key: any;
            metadata: {
                reference_id: any;
                reference_url: any;
                reference_title: any;
                reference_display_name: any;
                sources: never[];
                __typename: string;
                display_name?: undefined;
                is_trusted?: undefined;
                url?: undefined;
                latex_expression?: undefined;
                latex_image?: undefined;
                font_height?: undefined;
                padding?: undefined;
            };
        } | {
            key: any;
            metadata: {
                latex_expression: any;
                latex_image: {
                    url: any;
                    width: number;
                    height: number;
                };
                font_height: number;
                padding: number;
                __typename: string;
                display_name?: undefined;
                is_trusted?: undefined;
                url?: undefined;
                reference_id?: undefined;
                reference_url?: undefined;
                reference_title?: undefined;
                reference_display_name?: undefined;
                sources?: undefined;
            };
        })[];
    };
    static resize(buffer: any, x: any, y: any, fit?: string): Promise<any>;
    static waitAllPromises(input: any): Promise<any>;
    static fetchBuffer(url: any, options?: {}, { silent }?: {
        silent?: boolean | undefined;
    }): Promise<Buffer<ArrayBuffer>>;
    static toUrl(_client: any, path: any, mediaType?: string): Promise<any>;
    static resolveMedia(_client: any, media: any, mediaType?: string, { resolveUrl, resolveWAUrl, result, resize, width, height }?: {
        resolveUrl?: boolean | undefined;
        resolveWAUrl?: boolean | undefined;
        result?: string | undefined;
        resize?: boolean | undefined;
        width?: number | undefined;
        height?: number | undefined;
    }): any;
    static getMp4Duration(buffer: any, { silent }?: {
        silent?: boolean | undefined;
    }): number;
    static getMp4Preview(videoBuffer: any, { time, result, resize, width, height, silent }?: {
        result?: string | undefined;
        resize?: boolean | undefined;
        width?: number | undefined;
        height?: number | undefined;
        silent?: boolean | undefined;
    }): Promise<any>;
    static stringifyEscaped(obj: any): string;
}
declare class BaseBuilder {
    _title: string;
    _subtitle: string;
    _body: string;
    _footer: string;
    _contextInfo: {};
    _extraPayload: {};
    setTitle(title: any): this;
    setSubtitle(subtitle: any): this;
    setBody(body: any): this;
    setFooter(footer: any): this;
    setContextInfo(obj: any): this;
    addPayload(obj: any): this;
}
export {};
//# sourceMappingURL=message_builder.d.ts.map