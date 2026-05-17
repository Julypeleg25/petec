import type { NewPatientDTO } from "@petec/shared";
import { DAILY_CASE_TABLE_COLUMN_COUNT } from "../../CaseDetailsTable/CaseDetailsTable.constants";
import type { CaseDetailsData } from "../../CaseDetailsTable/CaseDetailsTable.types";

export type NewPatientData = NewPatientDTO;

export interface ChildCaseData {
  caseId: string;
  patientName: string;
  patientPhotoName: string | null;
  visitDate: string | null;
}

export const defaultCaseDailyDataTemplate: CaseDetailsData[] = Array.from(
  { length: DAILY_CASE_TABLE_COLUMN_COUNT },
  (_, i) => {
    return {
      id: "",
      index: i,
      time: "",
      date: "",
      temperature: null,
      temperatureIsRequired: false,
      temperatureIsEditable: true,
      pulse: null,
      pulseIsRequired: false,
      pulseIsEditable: true,
      respiration: null,
      respirationIsRequired: false,
      respirationIsEditable: true,
      fluids: [],
      medicines: [],
      foodExtras: [],
      examinations: [],
      procedures: [],
      foodAndWater: null,
      foodAndWaterIsRequired: false,
      foodAndWaterIsEditable: true,
      urineTypeId: null,
      urineComments: null,
      urineIsRequired: false,
      urineIsEditable: true,
      fecesTypeId: null,
      fecesComments: null,
      fecesIsRequired: false,
      fecesIsEditable: true,
      isTravel: null,
      isTravelIsRequired: false,
      isTravelIsEditable: true,
      isBoxClean: null,
      isBoxCleanIsRequired: false,
      isBoxCleanIsEditable: true,
      isRelease: null,
      isReleaseIsRequired: false,
      isReleaseIsEditable: true,
      weigh: null,
      weighIsRequired: false,
      weighIsEditable: true,
      isPuke: null,
      pukeComments: null,
      pukeIsRequired: false,
      pukeIsEditable: true,
      rowComments: null,
      rowCommentsIsRequired: false,
      rowCommentsIsEditable: true,
      ownerUpdate: null,
      ownerUpdateIsRequired: false,
      ownerUpdateIsEditable: true,
    };
  },
);
