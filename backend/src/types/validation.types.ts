import type { Request } from "express";
import type { ZodSchema } from "zod";

export interface ValidateSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export type ValidatedRequest<
  TBody = object,
  TParams = Record<string, string>,
  TQuery = object
> = Request & { body: TBody; params: TParams; query: TQuery };
