import type {
  IAnimalVitals,
  IBaseLookup,
  ILookupWithAnimalType,
  IMedicine,
} from "@models/lookups";
import type { Types } from "mongoose";

type MongoFilterPrimitive =
  | string
  | number
  | boolean
  | null
  | Date
  | RegExp
  | Types.ObjectId;
export interface MongoFilter {
  [key: string]: MongoFilterPrimitive | MongoFilter | readonly MongoFilterPrimitive[] | readonly MongoFilter[];
}

export type BaseLookup =
  | IBaseLookup
  | ILookupWithAnimalType
  | IAnimalVitals
  | IMedicine;

export type SortDirection = 1 | -1;

export type SortRecord = Record<string, SortDirection>;
