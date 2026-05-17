import type { HydratedDocument, Types } from "mongoose";

export interface IPatientMedicine {
  _id: Types.ObjectId;
  patientId: Types.ObjectId;
  caseId?: Types.ObjectId;
  medicineId: Types.ObjectId;
  dosageFrequencyId?: Types.ObjectId;
  routeOfAdministrationId?: Types.ObjectId;
  measureUnitTypeId?: Types.ObjectId;
  doseAmount?: number | string;
  notes?: string;
  startDate?: Date;
  endDate?: Date;
  isDeleted?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type PatientMedicineDocument = HydratedDocument<IPatientMedicine>;
