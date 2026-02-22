import winston from "winston";
import { ENV } from "@config/config";

const LOG_LEVELS = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
} as const;

const logFormat = winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    ENV.isProduction
        ? winston.format.json()
        : winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, ...meta }) => {
                const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : "";
                return `${String(timestamp)} [${level}]: ${String(message)}${metaStr}`;
            }),
        ),
);

export const logger = winston.createLogger({
    levels: LOG_LEVELS,
    level: ENV.isProduction ? "info" : "debug",
    format: logFormat,
    transports: [
        new winston.transports.Console(),
    ],
    exitOnError: false,
});
