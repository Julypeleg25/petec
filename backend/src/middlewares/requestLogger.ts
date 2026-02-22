import { Request, Response, NextFunction } from "express";
import { logger } from "@utils/logger";

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
    const start = Date.now();

    res.on("finish", () => {
        const duration = Date.now() - start;
        logger.http("Request completed", {
            requestId: req.requestId,
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            durationMs: duration,
            userId: req.authenticatedUser?.userId,
        });
    });

    next();
};
