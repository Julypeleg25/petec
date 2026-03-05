/**
 * Represents the authenticated user attached to a request context.
 */
export interface RequestContextUser {
    userId: string;
    role: string;
    permissions: string[];
}

/**
 * Per-request context attached to every Express request as `req.ctx`.
 * Initialized by the requestId middleware and enriched by auth middleware.
 * Never stored globally — always passed via the request object.
 */
export interface RequestContext {
    requestId: string;
    user?: RequestContextUser;
}
