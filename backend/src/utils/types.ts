import type { IBaseLookup, ILookupWithAnimalType, IMedicine } from "@models/Lookups.types";

type MongoFilterPrimitive = string | number | boolean | null | Date;
export interface MongoFilter {
  [key: string]: MongoFilterPrimitive | MongoFilter | readonly MongoFilterPrimitive[] | readonly MongoFilter[];
}

export type BaseLookup = IBaseLookup | ILookupWithAnimalType | IMedicine;

export type SortDirection = 1 | -1;

export type SortRecord = Record<string, SortDirection>;
