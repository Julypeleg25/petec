import type { Types } from "mongoose";
import type {
  CaseRefsReference,
  PopulatedPatient,
} from "./patient.response.mappers.types";
import { PATIENT_MAPPER_OBJECT_KEYS } from "./patient.mapper.constants";

export const resolveCaseRefs = (
  caseRefs?: CaseRefsReference,
  patient?: PopulatedPatient,
): CaseRefsReference => ({
  animalTypeId: caseRefs?.animalTypeId ?? patient?.refs?.animalTypeId,
  genderTypeId: caseRefs?.genderTypeId ?? patient?.refs?.genderTypeId,
  raceTypeId: caseRefs?.raceTypeId ?? patient?.refs?.raceTypeId,
  animalColorId: caseRefs?.animalColorId ?? patient?.refs?.animalColorId,
  insuranceTypeId: caseRefs?.insuranceTypeId ?? patient?.refs?.insuranceTypeId,
  foodTypeId: caseRefs?.foodTypeId ?? patient?.refs?.foodTypeId,
});

export const isPopulatedPatient = (
  value?: Types.ObjectId | PopulatedPatient | string,
): value is PopulatedPatient =>
  typeof value === "object" &&
  value !== null &&
  !(PATIENT_MAPPER_OBJECT_KEYS.TO_HEX_STRING in value);
