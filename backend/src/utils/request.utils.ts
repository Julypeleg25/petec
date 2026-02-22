import type { Request } from "express";

export const getParam = (req: Request, key: string): string => {
    const val = req.params[key];
    return Array.isArray(val) ? val[0] : val;
};
