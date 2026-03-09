export interface RequestContextUser {
    userId: string;
    role: string;
    permissions: string[];
}

export interface RequestContext {
    requestId: string;
    user?: RequestContextUser;
}
