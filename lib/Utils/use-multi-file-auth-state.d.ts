import type { AuthenticationState } from '../Types/index.js';
/** how many auth files currently hold a write lock (useful to confirm nothing is stuck) */
export declare const countAuthFileLocks: () => number;
/**
 * stores the full authentication state in a single folder.
 * Far more efficient than singlefileauthstate
 *
 * Again, I wouldn't endorse this for any production level use other than perhaps a bot.
 * Would recommend writing an auth state for use with a proper SQL or No-SQL DB
 * */
export declare const useMultiFileAuthState: (folder: string) => Promise<{
    state: AuthenticationState;
    saveCreds: () => Promise<void>;
}>;
//# sourceMappingURL=use-multi-file-auth-state.d.ts.map