import type { HydratedDocument, Types } from "mongoose";

export interface IMasterCase {
  _id: Types.ObjectId;
  caseIds: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export type MasterCaseDocument = HydratedDocument<IMasterCase>;
