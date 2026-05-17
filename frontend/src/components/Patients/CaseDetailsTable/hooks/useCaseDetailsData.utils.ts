import type { AnimalVitalDTO } from "@petec/shared";
import type { AnimalVitals } from "../CaseDetailsTable.types";
import { INITIAL_VITALS, VITAL_NAMES } from "./useCaseDetailsData.constants";

const getVitalValue = (
  vitals: AnimalVitalDTO[],
  vitalsType: string,
  pick: "rangeMax" | "rangeMin",
): number | undefined => vitals.find((v) => v.vitalsType === vitalsType)?.[pick];

export const mapAnimalVitals = (vitals: AnimalVitalDTO[]): AnimalVitals => {
  if (vitals.length === 0) return INITIAL_VITALS;

  return {
    tempRangeMax: getVitalValue(vitals, VITAL_NAMES.TEMP, "rangeMax"),
    tempRangeMin: getVitalValue(vitals, VITAL_NAMES.TEMP, "rangeMin"),
    pulseRangeMax: getVitalValue(vitals, VITAL_NAMES.PULSE, "rangeMax"),
    pulseRangeMin: getVitalValue(vitals, VITAL_NAMES.PULSE, "rangeMin"),
    respirationRangeMax: getVitalValue(vitals, VITAL_NAMES.RESPIRATION, "rangeMax"),
    respirationRangeMin: getVitalValue(vitals, VITAL_NAMES.RESPIRATION, "rangeMin"),
  };
};
