import type { Request, Response } from "express";
import { HttpStatus } from "@petec/shared";
import { logger } from "../../config/logger.js";
import { ENV } from "../../config/config.js";
import type { RequestContext } from "../http/requestContext.js";

type SafeMetaValue = string | number | boolean | null | undefined;
type SafeMeta = Record<string, SafeMetaValue | SafeMetaValue[] | Record<string, SafeMetaValue>>;

interface AppErrorLike {
    name: string;
    message: string;
    statusCode?: number;
    isOperational?: boolean;
    details?: Record<string, string[]>;
    cause?: Error;
    stack?: string;
}

interface ValidationIssue {
    path: string;
    message: string;
}



const baseMeta = (ctx: RequestContext, module: string): Record<string, SafeMetaValue> => ({
    module,
    request_id: ctx.requestId,
    ...(ctx.user ? { user_id: ctx.user.userId } : {}),
});



export const logInfo = (
    ctx: RequestContext,
    module: string,
    message: string,
    meta?: SafeMeta,
): void => {
    logger.info(message, { ...baseMeta(ctx, module), ...meta });
};

export const logWarn = (
    ctx: RequestContext,
    module: string,
    message: string,
    meta?: SafeMeta,
): void => {
    logger.warn(message, { ...baseMeta(ctx, module), ...meta });
};

export const logError = (
    ctx: RequestContext,
    module: string,
    err: Error,
    meta?: SafeMeta,
): void => {
    const safe = toSafeErrorMeta(err);
    const { error_message, ...errorMeta } = safe;
    logger.error(String(error_message), {
        ...baseMeta(ctx, module),
        ...errorMeta,
        ...meta,
    });
};

export const logDebug = (
    ctx: RequestContext,
    module: string,
    message: string,
    meta?: SafeMeta,
): void => {
    logger.debug(message, { ...baseMeta(ctx, module), ...meta });
};



export const logRequestStart = (
    ctx: RequestContext,
    req: Request,
): void => {
    const route = `${req.method} ${req.originalUrl.split("?")[0] || req.originalUrl}`;
    logger.info(`[${route}] request started`, {
        ...baseMeta(ctx, "http"),
        route,
        ip: req.ip,
    });
};

export const logRequestEnd = (
    ctx: RequestContext,
    req: Request,
    res: Response,
    durationMs: number,
): void => {
    const route = `${req.method} ${req.originalUrl.split("?")[0] || req.originalUrl}`;
    const { statusCode } = res;
    const contentLength = res.getHeader("content-length");
    const meta: Record<string, SafeMetaValue> = {
        ...baseMeta(ctx, "http"),
        route,
        status_code: statusCode,
        duration_ms: durationMs,
        ...(contentLength !== undefined ? { response_bytes: Number(contentLength) } : {}),
    };

    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
        logger.error(`[${route}] request failed`, meta);
    } else if (statusCode >= HttpStatus.BAD_REQUEST) {
        logger.warn(`[${route}] request completed with client error`, meta);
    } else {
        logger.info(`[${route}] request completed`, meta);
    }
};



export const toSafeErrorMeta = (
    err: Error | AppErrorLike,
): Record<string, SafeMetaValue | ValidationIssue[]> => {
    const appErr = err as AppErrorLike;
    const meta: Record<string, SafeMetaValue | ValidationIssue[]> = {
        error_name: err.name,
        error_message: err.message,
    };

    if (appErr.statusCode !== undefined) {
        meta.http_status = appErr.statusCode;
    }

    if (!ENV.isProduction && err.stack) {
        meta.stack = err.stack;
    }

    if (err.cause instanceof Error) {
        meta.cause = err.cause.message;
    }


    if (appErr.details) {
        const issues: ValidationIssue[] = [];
        for (const [path, messages] of Object.entries(appErr.details)) {
            for (const message of messages) {
                issues.push({ path, message });
            }
        }
        if (issues.length > 0) {
            meta.validation_issues = issues;
        }
    }

    return meta;
};
