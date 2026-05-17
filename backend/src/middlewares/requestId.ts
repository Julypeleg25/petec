import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";
import type { RequestContext } from "../shared/http/requestContext.js";

const REQUEST_ID_HEADER = "x-request-id";
const MAX_REQUEST_ID_LENGTH = 128;
const PRINTABLE_ASCII_REGEX = /^[\x20-\x7E]+$/;

const isValidRequestId = (value: string): boolean =>
    value.length > 0 &&
    value.length <= MAX_REQUEST_ID_LENGTH &&
    PRINTABLE_ASCII_REGEX.test(value);

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    const incoming = req.headers[REQUEST_ID_HEADER];
    const raw = typeof incoming === "string" ? incoming : undefined;
    const id = raw && isValidRequestId(raw) ? raw : randomUUID();

    req.requestId = id;
    res.setHeader(REQUEST_ID_HEADER, id);

    const ctx: RequestContext = { requestId: id };
    req.ctx = ctx;

    next();
};
