import { Request, Response, NextFunction } from "express";
import { logger } from "@config/logger";
import { HttpStatus } from "@petec/shared";

const parseContentLength = (value?: string | number | string[]): number | undefined => {
    if (value === undefined) return undefined;
    if (typeof value === "number") return value;
    if (Array.isArray(value)) {
        if (value.length === 0) return undefined;
        const parsedFromArray = Number(value[0]);
        return Number.isFinite(parsedFromArray) ? parsedFromArray : undefined;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
};

export const requestLoggerMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    let logged = false;
    const startAt = Date.now();
    const method = req.method;
    const route = req.originalUrl.split("?")[0] || req.originalUrl;
    const requestId = req.requestId;
    const isSkippableRoute = method === "OPTIONS" || route === "/health" || route.startsWith("/static");
    const routeLabel = `[${method} ${route}]`;

    const writeLog = (): void => {
        if (logged) return;
        logged = true;

        if (isSkippableRoute) {
            return;
        }

        const { statusCode } = res;
        const durationMs = Date.now() - startAt;
        const contentLength = parseContentLength(res.getHeader("content-length"));
        const logSummary = res.locals.logSummary;
        const message = `${routeLabel} request completed`;
        const meta = {
            module: "http",
            request_id: requestId,
            status_code: statusCode,
            duration_ms: durationMs,
            ...(req.ctx?.user ? { user_id: req.ctx.user.userId } : {}),
            ...(contentLength !== undefined ? { response_bytes: contentLength } : {}),
            ...(logSummary?.id !== undefined ? { id: logSummary.id } : {}),
            ...(logSummary?.length !== undefined ? { length: logSummary.length } : {}),
            ...(logSummary?.note !== undefined ? { note: logSummary.note } : {}),
        };

        if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
            logger.error(message, meta);
        } else if (statusCode >= HttpStatus.BAD_REQUEST) {
            logger.warn(message, meta);
        } else {
            logger.info(message, meta);
        }
    };

    res.on("finish", writeLog);
    res.on("close", writeLog);

    next();
};
