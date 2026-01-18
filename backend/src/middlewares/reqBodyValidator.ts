import { HttpStatusCode } from "axios";
import { Request, Response, NextFunction } from "express";
import { ZodObject, flattenError } from "zod";

export const validateBody =
  (schema: ZodObject) => (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return res.status(HttpStatusCode.BadRequest).json({
        error: "Validation request failed",
        fields: flattenError(result.error).fieldErrors,
      });
    }

    req.body = result.data;
    next();
  };
