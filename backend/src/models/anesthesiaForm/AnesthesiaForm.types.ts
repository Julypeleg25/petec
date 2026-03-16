import type { HydratedDocument, Types } from "mongoose";

export interface IAnesthesiaForm {
  _id: Types.ObjectId;
  caseId: Types.ObjectId;
  ownerName?: string;
  name?: string;
  date?: Date;
  signature?: string;
  plannedProcedure?: string;
  priceEstimate?: string | number;
  isFastSinceMidnight?: boolean;
  isDistortionHistory?: boolean;
  isMedicationsSensitive?: boolean;
  isNeedToMarkEar?: boolean;
  isSterilization?: boolean;
  isPriceIncludesReleaseMedications?: boolean;
  generalComments?: string;
  distortionComments?: string;
  medicationsSensitiveComments?: string;
  createdByUserId?: Types.ObjectId;
  updatedByUserId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type AnesthesiaFormDocument = HydratedDocument<IAnesthesiaForm>;
