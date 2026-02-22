import type { IBaseLookup, ILookupWithAnimalType, IMedicine } from "@models/Lookups";
import type { ZodSchema } from "zod";

export type MongoFilter = Record<string, unknown>;

export type BaseLookup = IBaseLookup | ILookupWithAnimalType | IMedicine;

export type SortDirection = 1 | -1;

export type SortRecord = Record<string, SortDirection>;

export interface ValidateSchemas {
    body?: ZodSchema;
    query?: ZodSchema;
    params?: ZodSchema;
}
