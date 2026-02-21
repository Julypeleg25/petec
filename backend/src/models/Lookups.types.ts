import type { HydratedDocument, Types } from "mongoose";

export interface IBaseLookup {
  _id: Types.ObjectId;
  name: string;
  isActive: boolean;
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
  measureUnitId?: Types.ObjectId;
  dosageFrequencyId?: Types.ObjectId;
  routeOfAdministrationId?: Types.ObjectId;
  rangeMin?: number;
  rangeMax?: number;
  totalDose?: number;
  comments?: string;
}

export type MedicineDocument = HydratedDocument<IMedicine>;

export interface IMedicineCategory extends IBaseLookup {}
export type MedicineCategoryDocument = HydratedDocument<IMedicineCategory>;

export interface IAnimalVitals extends ILookupWithAnimalType {
  minValue?: number;
  maxValue?: number;
  unit?: string;
}

export type AnimalVitalsDocument = HydratedDocument<IAnimalVitals>;
