import { Request, Response, NextFunction } from "express";
import { logger } from "@utils/logger";
import { HttpStatus } from "@petec/shared";

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
    const start = Date.now();

    res.on("finish", () => {
        const duration = Date.now() - start;
        const { method, originalUrl: url } = req;
        const { statusCode } = res;

        if (method === "OPTIONS" || url === "/health" || url.startsWith("/static")) {
            return;
        }

        const message = `${method} ${url} ${statusCode} ${duration}ms`;

        if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
            logger.error(message);
        } else if (statusCode >= HttpStatus.BAD_REQUEST) {
            logger.warn(message);
        } else {
            logger.info(message);
        }
    });

    next();
};
