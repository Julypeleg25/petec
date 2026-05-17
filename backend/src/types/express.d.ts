import type { RequestContext } from "../shared/http/requestContext.js";

declare global {
    namespace Express {
        interface Request {
            requestId: string;
            ctx: RequestContext;
        }

        interface Locals {
            logSummary?: {
                id?: string;
                length?: number;
                note?: string;
            };
        }
    }
}
