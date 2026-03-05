import type { RequestContext } from "../shared/http/requestContext";

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
