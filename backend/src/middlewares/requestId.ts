import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";

const REQUEST_ID_HEADER = "x-request-id";

export const requestId = (req: Request, res: Response, next: NextFunction): void => {
    const id = (req.headers[REQUEST_ID_HEADER] as string | undefined) ?? randomUUID();
    req.requestId = id;
    res.setHeader(REQUEST_ID_HEADER, id);
    next();
};
