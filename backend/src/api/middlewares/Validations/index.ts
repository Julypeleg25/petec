import { Request, Response, NextFunction } from "express";
import { Schema } from "joi";


export const validate = (
    req: Request,
    res: Response,
    next: NextFunction,
    schema: Schema
) => {
    const { error, value } = schema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    req.body = value;
    next();
};

export * from "./AdminValidations";
export * from "./AuthValidations";
export * from "./PatientValidations";