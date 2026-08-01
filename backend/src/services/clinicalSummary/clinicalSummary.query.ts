import { CaseModel } from "../../models/index.js";
import {
  CASE_SUMMARY_POPULATE_PATHS,
  CASE_SUMMARY_PROJECTION,
} from "./clinicalSummary.constants.js";

export const findLatestClinicalCase = (patientId: string) => {
  const query = CaseModel.findOne({ patientId, isDeleted: false })
    .sort({ updatedAt: -1 })
    .select(CASE_SUMMARY_PROJECTION);

  CASE_SUMMARY_POPULATE_PATHS.forEach((path) => {
    query.populate(path, "name");
  });

  return query.lean().exec();
};
