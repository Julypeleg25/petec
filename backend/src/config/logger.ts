import winston from "winston";
import { ENV } from "./config.js";
import path from "path";
import { maskSensitiveData } from "../utils/sanitizer.js";
import type { SafeJsonValue } from "../types/sanitizer.types.js";

type LogMetaValue = string | number | boolean | null | undefined | object;
type LogInfoShape = Record<string, unknown> & {
    level: string;
    message: unknown;
    timestamp?: string;
    stack?: string;
};

const safeStringify = (value: object): string => {
    try {
        return JSON.stringify(value);
    } catch {
        return "[unserializable]";
    }
};

const formatMetaValue = (value: LogMetaValue): string => {
    if (value === undefined) return "";
    if (value === null) return "null";
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        return String(value);
    }
    return safeStringify(value);
};

const formatMeta = (meta: Record<string, LogMetaValue>): string => {
    const parts = Object.entries(meta)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => `${key}=${formatMetaValue(value)}`);

    return parts.join(" ");
};

const sanitizeLogInfo = winston.format((info) => {
    const { level, message, timestamp, stack, ...meta } = info as LogInfoShape;
    const sanitizedMeta = maskSensitiveData(meta as SafeJsonValue) as Record<string, unknown>;

    return {
        level,
        message,
        ...(timestamp ? { timestamp } : {}),
        ...(stack ? { stack } : {}),
        ...sanitizedMeta,
    };
});

const defaultMeta = {
    service_name: process.env.RAILWAY_SERVICE_NAME || "backend",
    environment_name: process.env.RAILWAY_ENVIRONMENT_NAME || ENV.nodeEnv,
    deployment_id: process.env.RAILWAY_DEPLOYMENT_ID || undefined,
    replica_id: process.env.RAILWAY_REPLICA_ID || undefined,
};

const logFormat = winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    sanitizeLogInfo(),
    ENV.isProduction
        ? winston.format.json()
        : winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
            const metaStr = formatMeta(meta as Record<string, LogMetaValue>);
            const stackStr = stack ? `\n${String(stack)}` : "";
            const suffix = metaStr.length > 0 ? ` ${metaStr}` : "";
            return `[${String(timestamp)}] ${String(level).toUpperCase()}: ${String(message)}${suffix}${stackStr}`;
        })
);

const transports: winston.transport[] = [
    new winston.transports.Console({
        stderrLevels: ["error"],
    }),
];

const logFilePath = process.env.LOG_FILE_PATH;
if (logFilePath && logFilePath.trim().length > 0) {
    transports.push(
        new winston.transports.File({
            filename: path.resolve(process.cwd(), logFilePath),
            level: ENV.isProduction ? "info" : "debug",
        })
    );
}

export const logger = winston.createLogger({
    level: ENV.isProduction ? "info" : "debug",
    defaultMeta,
    format: logFormat,
    transports,
    exitOnError: false,
});
