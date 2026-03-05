import winston from "winston";
import { ENV } from "@config/config";
import path from "path";

type LogMetaValue = string | number | boolean | null | undefined | object;

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

const logFormat = winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    ENV.isProduction
        ? winston.format.json()
        : winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
                const metaStr = formatMeta(meta as Record<string, LogMetaValue>);
                const stackStr = stack ? `\n${String(stack)}` : "";
                const suffix = metaStr.length > 0 ? ` ${metaStr}` : "";
                return `[${String(timestamp)}] ${level}: ${String(message)}${suffix}${stackStr}`;
            })
        )
);

const transports: winston.transport[] = [
    new winston.transports.Console({
        stderrLevels: ["error"],
        consoleWarnLevels: ["warn"],
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
    format: logFormat,
    transports,
    exitOnError: false,
});
