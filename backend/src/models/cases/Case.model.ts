import mongoose from "mongoose";
import { ICase } from "./Case.types";
import { caseSchema } from "./Case.schema";

export const CaseModel = mongoose.model<ICase>("Case", caseSchema, "cases");
export * from "./Case.types";
export * from "./Case.schema";
