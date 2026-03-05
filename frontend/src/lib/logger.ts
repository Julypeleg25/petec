
type LogLevel = "debug" | "info" | "warn" | "error";
type LogValue =
    | string
    | number
    | boolean
    | null
    | undefined
    | object
    | LogValue[]
    | readonly LogValue[]

interface LogPayload {
    msg: string;
    data?: LogValue;
    error?: LogValue;
}

class Logger {
    private log(level: LogLevel, payload: LogPayload) {
        const timestamp = new Date().toISOString();
        const formattedMessage = `[${timestamp}] [${level.toUpperCase()}] ${payload.msg}`;

        let logFn = console.log;
        if (level === "error") logFn = console.error;
        else if (level === "warn") logFn = console.warn;
        else if (level === "debug") logFn = console.debug;

        if (payload.data !== undefined || payload.error !== undefined) {
            logFn(formattedMessage, { data: payload.data, error: payload.error });
        } else {
            logFn(formattedMessage);
        }
    }

    debug(msg: string, data?: LogValue) {
        this.log("debug", { msg, data });
    }

    info(msg: string, data?: LogValue) {
        this.log("info", { msg, data });
    }

    warn(msg: string, data?: LogValue) {
        this.log("warn", { msg, data });
    }

    error(msg: string, error?: LogValue, data?: LogValue) {
        this.log("error", { msg, error, data });
    }
}

export const logger = new Logger();
