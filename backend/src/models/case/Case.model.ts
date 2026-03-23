import mongoose from "mongoose";
import { ICase } from "./Case.types.js";
import { caseSchema } from "./Case.schema.js";

export const CaseModel = mongoose.model<ICase>("Case", caseSchema, "cases");
export * from "./Case.types.js";
export * from "./Case.schema.js";
