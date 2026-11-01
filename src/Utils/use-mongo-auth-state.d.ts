/* Lyndrā-Blanys. Attribution and license terms: see LICENSE and NOTICE.md. */
export interface MongoAuthStateOptions {
    collection?: any;
    db?: any;
    uri?: string;
    clientOptions?: any;
    dbName?: string;
    collectionName?: string;
    session?: string;
}
export function useMongoAuthState(opts?: MongoAuthStateOptions): Promise<{
    state: {
        creds: any;
        keys: {
            get: (type: any, ids: any) => Promise<{}>;
            set: (data: any) => Promise<void>;
        };
    };
    saveCreds: () => Promise<void>;
    clearAuth: () => Promise<void>;
    close: () => Promise<void>;
}>;
