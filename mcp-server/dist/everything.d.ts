import { Server } from "@modelcontextprotocol/sdk/server/index.js";
export declare const createServer: () => {
    server: Server<{
        method: string;
        params?: {
            [x: string]: unknown;
            _meta?: {
                [x: string]: unknown;
                progressToken?: string | number;
            };
        };
    }, {
        method: string;
        params?: {
            [x: string]: unknown;
            _meta?: {
                [x: string]: unknown;
            };
        };
    }, {
        [x: string]: unknown;
        _meta?: {
            [x: string]: unknown;
        };
    }>;
    cleanup: () => Promise<void>;
};
