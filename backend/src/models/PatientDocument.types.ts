import type { HydratedDocument, Types } from "mongoose";

export interface IPatientDocument {
  _id: Types.ObjectId;
  patientId: Types.ObjectId;
  caseId?: Types.ObjectId;
  patientDocumentTypeId: Types.ObjectId;
  fileName: string;
  storageKey: string;
  uploadedByUserId?: Types.ObjectId;
  uploadedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type PatientDocumentDocument = HydratedDocument<IPatientDocument>;
