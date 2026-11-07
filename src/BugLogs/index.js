/* Lyndrā-Blanys: BugLogs, an on/off error printer for finding bugs. Copyright (c) 2026 Lín Ān Rán. See LICENSE. */

const SKIP = new Set(['end', 'generateMessageTag', 'onUnexpectedError', 'ev'])
const SKIP_PREFIX = ['waitFor']

const short = (value, max = 60) => {
    if (typeof value === 'string') return value.length > max ? `${value.slice(0, max)}...` : value
    if (value === null || value === undefined) return String(value)
    if (Buffer.isBuffer(value)) return `<Buffer ${value.length}b>`
    if (typeof value === 'function') return '<fn>'
    if (typeof value === 'object') {
        const keys = Object.keys(value)
        return `{${keys.slice(0, 6).join(',')}${keys.length > 6 ? ',...' : ''}}`
    }
    return String(value)
}

const describeArgs = args => args.map(a => short(a)).join(', ')

/**
 * Wrap the public methods of a socket so every rejection or throw is printed (console by default)
 * with the method name, a short argument summary, the status code and (optionally) the stack.
 * The error is always rethrown unchanged, so behaviour does not change; only the printing does.
 * Printing can be switched on and off at runtime through the returned controller.
 */
export const createBugLogs = (sock, options = {}) => {
    const config = {
        enabled: true,
        stack: false,
        decryptFailures: true,
        connectionErrors: true,
        capture: 50,
        sink: null,
        prefix: '[Lyndrā-Blanys:bug]',
        include: null,
        exclude: [],
        ...options
    };
    let enabled = config.enabled !== false;
    const recent = [];
    const out = (entry) => {
        recent.push(entry);
        if (recent.length > config.capture) recent.shift();
        if (!enabled) return;
        const line = `${config.prefix} ${entry.scope}: ${entry.message}${entry.code ? ` (code ${entry.code})` : ''}`;
        if (typeof config.sink === 'function') {
            config.sink(entry, line);
        } else if (config.sink && typeof config.sink.error === 'function') {
            config.sink.error({ ...entry, stack: config.stack ? entry.stack : undefined }, line);
        } else {
            console.error(line);
            if (config.stack && entry.stack) console.error(entry.stack);
        }
    };
    const record = (scope, error, extra = {}) => {
        const e = error instanceof Error ? error : new Error(String(error));
        out({
            time: Date.now(),
            scope,
            message: e.message,
            code: e.output?.statusCode ?? e.statusCode ?? e.code,
            stack: e.stack,
            ...extra
        });
    };
    const wanted = (name) => {
        if (SKIP.has(name) || SKIP_PREFIX.some(p => name.startsWith(p)) || config.exclude.includes(name)) return false;
        return !config.include || config.include.includes(name);
    };
    const originals = new Map();
    for (const name of Object.keys(sock)) {
        const fn = sock[name];
        if (typeof fn !== 'function' || !wanted(name)) continue;
        const wrapped = function (...args) {
            let result;
            try {
                result = fn.apply(this, args);
            } catch (error) {
                record(`${name}(${describeArgs(args)})`, error);
                throw error;
            }
            if (result && typeof result.then === 'function') {
                return result.then(undefined, (error) => {
                    record(`${name}(${describeArgs(args)})`, error);
                    throw error;
                });
            }
            return result;
        };
        Object.assign(wrapped, fn);
        originals.set(name, fn);
        sock[name] = wrapped;
    }
    const onUpsert = ({ messages }) => {
        if (!config.decryptFailures || !Array.isArray(messages)) return;
        for (const m of messages) {
            // stub type 2 = CIPHERTEXT: the message arrived but could not be decrypted
            if (m?.messageStubType === 2 || m?.messageStubType === 'CIPHERTEXT') {
                out({
                    time: Date.now(),
                    scope: 'decrypt',
                    message: `could not decrypt message ${m.key?.id} from ${m.key?.participant || m.key?.remoteJid}`,
                    params: m.messageStubParameters,
                    key: m.key
                });
            }
        }
    };
    const onConnection = ({ connection, lastDisconnect }) => {
        if (!config.connectionErrors || connection !== 'close' || !lastDisconnect?.error) return;
        record('connection', lastDisconnect.error);
    };
    sock.ev?.on?.('messages.upsert', onUpsert);
    sock.ev?.on?.('connection.update', onConnection);
    return {
        enable: () => ((enabled = true), true),
        disable: () => ((enabled = false), false),
        get enabled() {
            return enabled;
        },
        /** the last `capture` errors, oldest first, kept even while printing is off */
        recent: () => recent.slice(),
        clear: () => {
            recent.length = 0;
        },
        stop: () => {
            for (const [name, fn] of originals) sock[name] = fn;
            sock.ev?.off?.('messages.upsert', onUpsert);
            sock.ev?.off?.('connection.update', onConnection);
        }
    };
};
