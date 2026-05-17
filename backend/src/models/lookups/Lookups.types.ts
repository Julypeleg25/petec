import type { HydratedDocument, Types } from "mongoose";
import type { MedicineCategoryType } from "@petec/shared";

export interface IBaseLookup {
  _id: Types.ObjectId;
  serialId?: string;
  name: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type BaseLookupDocument = HydratedDocument<IBaseLookup>;

export interface ILookupWithAnimalType extends IBaseLookup {
  animalTypeId: Types.ObjectId;
}

export type LookupWithAnimalTypeDocument = HydratedDocument<ILookupWithAnimalType>;

export interface IMedicine extends IBaseLookup {
  categoryId?: Types.ObjectId;
  measureUnitTypeId?: Types.ObjectId;
  dosageFrequencyId?: Types.ObjectId;
  routeOfAdministrationId?: Types.ObjectId;
  rangeMin?: number;
  rangeMax?: number;
  totalDose?: number;
  comments?: string;
}

export type MedicineDocument = HydratedDocument<IMedicine>;

export interface IMedicineCategory extends IBaseLookup {
  type: MedicineCategoryType;
}
export type MedicineCategoryDocument = HydratedDocument<IMedicineCategory>;

export interface IAnimalVitals extends ILookupWithAnimalType {
  vitalsType?: string;
  rangeMin?: number;
  rangeMax?: number;
}

export type AnimalVitalsDocument = HydratedDocument<IAnimalVitals>;
