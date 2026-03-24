import { createLogger, format, transports } from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import * as path from "path";
import * as fs from "fs";

const logDirectory = process.env.LOG_DIR || path.join(__dirname, "logs");

if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory, { recursive: true });
}

const customFormat = format.combine(
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  format.printf(
    (info) => `${info.timestamp} [${info.level.toUpperCase()}]: ${info.message}`
  )
);

const winstonLogger = createLogger({
  format: customFormat,
  transports: [
    new DailyRotateFile({
      filename: path.join(logDirectory, "PetEC-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "90d", // Keep logs for 90 days
    }),
  ],
});

// If we're not in production then log to the console with the format:
if (process.env.NODE_ENV !== "production") {
  winstonLogger.add(
    new transports.Console({
      format: format.combine(format.colorize(), customFormat),
    })
  );
}

export default winstonLogger;
