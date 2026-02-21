import type { HydratedDocument, Types } from "mongoose";

export interface IPatientOwner {
  name: string;
  phone: string;
}

export interface IPatient {
  _id: Types.ObjectId;
  name: string;
  owner: IPatientOwner;
  photoName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type PatientDocument = HydratedDocument<IPatient>;
