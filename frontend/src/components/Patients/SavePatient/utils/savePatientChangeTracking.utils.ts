import type { CaseDetailsData } from "../../CaseDetailsTable/CaseDetailsTable.types";
import type { NewPatientData } from "../types/savePatient.types";
import { normalizeCaseDetailsGridHoursForSave } from "./savePatientCaseDetails.utils";
import { mapCaseDetailsGridToDto } from "./savePatient.utils";

interface BuildSavePatientChangeSnapshotParams {
  isEdit: boolean;
  formData: NewPatientData;
  selectedFile: File | null;
  selectedGenderType: string;
  selectedAnimalType: string;
  selectedAnimalColor: string;
  selectedInsurance: string;
  selectedFoodType: string;
  selectedRaceType: string;
  selectedDoctor: string;
  selectedNurse: string;
  isConvenia: boolean;
  isAllergic: boolean;
  isEscapePotential: boolean;
  isNPO: boolean;
  isRiskAnesthesia: boolean;
  isHeartMurmur: boolean;
  isAMB: boolean;
  isAggressive: boolean;
  isCerenia: boolean;
  isProcedure: boolean;
  caseDetailsList: CaseDetailsData[][];
}

const toFileSignature = (file: File | null) =>
  file
    ? {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
      }
    : null;

export const buildSavePatientChangeSnapshot = ({
  isEdit,
  formData,
  selectedFile,
  selectedGenderType,
  selectedAnimalType,
  selectedAnimalColor,
  selectedInsurance,
  selectedFoodType,
  selectedRaceType,
  selectedDoctor,
  selectedNurse,
  isConvenia,
  isAllergic,
  isEscapePotential,
  isNPO,
  isRiskAnesthesia,
  isHeartMurmur,
  isAMB,
  isAggressive,
  isCerenia,
  isProcedure,
  caseDetailsList,
}: BuildSavePatientChangeSnapshotParams): string =>
  JSON.stringify({
    formData,
    selectedFile: toFileSignature(selectedFile),
    refs: {
      selectedGenderType,
      selectedAnimalType,
      selectedAnimalColor,
      selectedInsurance,
      selectedFoodType,
      selectedRaceType,
      selectedDoctor,
      selectedNurse,
    },
    flags: {
      isConvenia,
      isAllergic,
      isEscapePotential,
      isNPO,
      isRiskAnesthesia,
      isHeartMurmur,
      isAMB,
      isAggressive,
      isCerenia,
      isProcedure,
    },
    caseDetails: isEdit
      ? mapCaseDetailsGridToDto(
          normalizeCaseDetailsGridHoursForSave(caseDetailsList),
        )
      : [],
  });
