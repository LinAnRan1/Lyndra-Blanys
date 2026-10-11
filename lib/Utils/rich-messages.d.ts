export const JS_KEYWORDS: Set<string>;
export const PYTHON_KEYWORDS: Set<string>;
export const GO_KEYWORDS: Set<string>;
export const LUA_KEYWORDS: Set<string>;
export const BASH_KEYWORDS: Set<string>;
export namespace LANGUAGE_KEYWORDS {
    export { JS_KEYWORDS as javascript };
    export { JS_KEYWORDS as typescript };
    export { JS_KEYWORDS as js };
    export { JS_KEYWORDS as ts };
    export { PYTHON_KEYWORDS as python };
    export { PYTHON_KEYWORDS as py };
    export { GO_KEYWORDS as go };
    export { GO_KEYWORDS as golang };
    export { LUA_KEYWORDS as lua };
    export { BASH_KEYWORDS as bash };
    export { BASH_KEYWORDS as sh };
    export { BASH_KEYWORDS as shell };
}
export const CodeHighlightType: any;
export const RichSubMessageType: any;
export function tokenizeCode(codeStr: any, language?: string): {
    highlightType: any;
    codeContent: string;
}[];
export function buildRichContextInfo(quoted: any): {
    forwardingScore: number;
    isForwarded: boolean;
    forwardedAiBotMessageInfo: {
        botJid: string;
    };
    forwardOrigin: number;
};
export function buildBotForwardedMessage(submessages: any, contextInfo: any, unifiedResponse: any): {
    botForwardedMessage: {
        message: {
            richResponseMessage: {
                messageType: number;
                submessages: any;
                contextInfo: any;
            };
        };
    };
};
export function generateTableContent(title: any, headers: any, rows: any, quoted: any, options?: {}): {
    message: {
        botForwardedMessage: {
            message: {
                richResponseMessage: {
                    messageType: number;
                    submessages: any;
                    contextInfo: any;
                };
            };
        };
    };
    messageId: string;
};
export function generateListContent(title: any, items: any, quoted: any, options?: {}): {
    message: {
        botForwardedMessage: {
            message: {
                richResponseMessage: {
                    messageType: number;
                    submessages: any;
                    contextInfo: any;
                };
            };
        };
    };
    messageId: string;
};
export function generateCodeBlockContent(code: any, quoted: any, options?: {}): {
    message: {
        botForwardedMessage: {
            message: {
                richResponseMessage: {
                    messageType: number;
                    submessages: any;
                    contextInfo: any;
                };
            };
        };
    };
    messageId: string;
};
export function generateLatexContent(quoted: any, options: any): {
    message: {
        botForwardedMessage: {
            message: {
                richResponseMessage: {
                    messageType: number;
                    submessages: any;
                    contextInfo: any;
                };
            };
        };
    };
    messageId: string;
};
export function generateLatexImageContent(quoted: any, options: any, uploadFn: any, renderLatexToPng: any): Promise<{
    message: {
        botForwardedMessage: {
            message: {
                richResponseMessage: {
                    messageType: number;
                    submessages: any;
                    contextInfo: any;
                };
            };
        };
    };
    messageId: string;
}>;
export function generateLatexInlineImageContent(quoted: any, options: any, uploadFn: any, renderLatexToPng: any): Promise<{
    message: {
        botForwardedMessage: {
            message: {
                richResponseMessage: {
                    messageType: number;
                    submessages: any;
                    contextInfo: any;
                };
            };
        };
    };
    messageId: string;
}>;
export function captureUnifiedResponse(msg: any): {
    unifiedResponse: {
        data: any;
    };
    submessages: any;
    contextInfo: any;
} | null;
export function generateUnifiedResponseContent(quoted: any, captured: any): {
    message: {
        botForwardedMessage: {
            message: {
                richResponseMessage: {
                    messageType: number;
                    submessages: any;
                    contextInfo: any;
                };
            };
        };
    };
    messageId: string;
};
export function generateRichMessageContent(submessages: any, quoted: any): {
    message: {
        botForwardedMessage: {
            message: {
                richResponseMessage: {
                    messageType: number;
                    submessages: any;
                    contextInfo: any;
                };
            };
        };
    };
    messageId: string;
};
export function tokenizeCodeV2(code: any, language?: string): {
    codeBlock: any[];
    unified_codeBlock: {
        content: any;
        type: any;
    }[];
};
export function toTableMetadataV2(arr: any): {
    title: any;
    rows: {
        isHeading?: boolean | undefined;
        items: any[];
    }[];
    unified_rows: {
        is_header: boolean;
        cells: any[];
    }[];
};
export function generateTableContentV2(table: any, quoted: any, options?: {}): {
    message: {
        messageContextInfo: {
            threadId: never[];
            deviceListMetadata: {
                senderKeyIndexes: never[];
                recipientKeyIndexes: never[];
                recipientKeyHash: string;
                recipientTimestamp: number;
            };
            deviceListMetadataVersion: number;
            messageSecret: NonSharedBuffer;
        };
        botForwardedMessage: {
            message: {
                richResponseMessage: {
                    submessages: never[];
                    messageType: number;
                    unifiedResponse: {
                        data: string;
                    };
                    contextInfo: {
                        forwardingScore: number;
                        isForwarded: boolean;
                        forwardedAiBotMessageInfo: {
                            botJid: string;
                        };
                        forwardOrigin: number;
                        botMessageSharingInfo: {
                            botEntryPointOrigin: number;
                            forwardScore: number;
                        };
                    };
                };
            };
        };
    };
    messageId: string;
};
export function generateCodeBlockContentV2(code: any, quoted: any, options?: {}): {
    message: {
        messageContextInfo: {
            threadId: never[];
            deviceListMetadata: {
                senderKeyIndexes: never[];
                recipientKeyIndexes: never[];
                recipientKeyHash: string;
                recipientTimestamp: number;
            };
            deviceListMetadataVersion: number;
            messageSecret: NonSharedBuffer;
        };
        botForwardedMessage: {
            message: {
                richResponseMessage: {
                    submessages: never[];
                    messageType: number;
                    unifiedResponse: {
                        data: string;
                    };
                    contextInfo: {
                        mentionedJid: never[];
                        groupMentions: never[];
                        statusAttributions: never[];
                        forwardingScore: number;
                        isForwarded: boolean;
                        forwardedAiBotMessageInfo: {
                            botJid: string;
                        };
                        forwardOrigin: number;
                        botMessageSharingInfo: {
                            botEntryPointOrigin: number;
                            forwardScore: number;
                        };
                    };
                };
            };
        };
    };
    messageId: string;
};
export function generateLinkContent(text: any, links: any, quoted: any, options?: {}): {
    message: {
        messageContextInfo: {
            messageSecret: NonSharedBuffer;
        };
        botForwardedMessage: {
            message: {
                richResponseMessage: {
                    messageType: number;
                    submessages: {
                        messageType: number;
                        messageText: any;
                    }[];
                    unifiedResponse: {
                        data: string;
                    };
                    contextInfo: {
                        forwardingScore: any;
                        isForwarded: boolean;
                        forwardedAiBotMessageInfo: {
                            botJid: any;
                        };
                        forwardOrigin: number;
                        botMessageSharingInfo: {
                            forwardScore: any;
                        };
                    };
                };
            };
        };
    };
    messageId: string;
};
export function generateLinkContentV2(text: any, links: any, quoted: any, options?: {}): {
    message: {
        messageContextInfo: {
            threadId: never[];
            messageSecret: NonSharedBuffer;
        };
        botForwardedMessage: {
            message: {
                richResponseMessage: {
                    messageType: number;
                    submessages: {
                        messageType: number;
                        messageText: any;
                    }[];
                    unifiedResponse: {
                        data: string;
                    };
                    contextInfo: {
                        isForwarded: boolean;
                        forwardOrigin: number;
                    };
                };
            };
        };
    };
    messageId: string;
};
//# sourceMappingURL=rich-messages.d.ts.map