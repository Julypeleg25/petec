import type { HydratedDocument, Types } from "mongoose";

export interface IPatientOwner {
  name: string;
  phone: string;
}

export interface IPatient {
  _id: Types.ObjectId;
  serialId: string;
  name: string;
  owner: IPatientOwner;
  photoName?: string;
  refs?: {
    animalTypeId?: Types.ObjectId;
    genderTypeId?: Types.ObjectId;
    raceTypeId?: Types.ObjectId;
    animalColorId?: Types.ObjectId;
    insuranceTypeId?: Types.ObjectId;
    foodTypeId?: Types.ObjectId;
  };
  createdAt: Date;
  updatedAt: Date;
}

export type PatientDocument = HydratedDocument<IPatient>;
