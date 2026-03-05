import type {
  AnimalVitalDTO,
  MedicineDTO,
  SimpleSystemTypeDTO,
} from "@petec/shared";
import type { SelectOptionObj } from "../../../../utils/FormSelect/FormSelect.types";
import type { MedicineSelectOptionObj } from "../../../MedicinePicker/MedicinePicker.types";
import type { AnimalVitals } from "../CaseDetailsTable.types";
import { INITIAL_VITALS, VITAL_NAMES } from "./useCaseDetailsData.constants";

const getVitalMax = (
  vitals: AnimalVitalDTO[],
  name: string,
): number | undefined => vitals.find((item) => item.name === name)?.maxValue;

const getVitalMin = (
  vitals: AnimalVitalDTO[],
  name: string,
): number | undefined => vitals.find((item) => item.name === name)?.minValue;

const CATEGORY_TOKEN_SPLIT_REGEX = /[^A-Za-z0-9\u0590-\u05FF]+/;

const toCategoryLookupTokens = (value: string): string[] =>
  value
    .trim()
    .toLowerCase()
    .split(CATEGORY_TOKEN_SPLIT_REGEX)
    .filter((token) => token.length > 0);

const toNormalizedCategoryLookupKey = (value: string): string =>
  toCategoryLookupTokens(value).sort().join(":");

const isCategoryLookupEquivalent = (left: string, right: string): boolean => {
  const leftKey = toNormalizedCategoryLookupKey(left);
  const rightKey = toNormalizedCategoryLookupKey(right);
  return leftKey.length > 0 && leftKey === rightKey;
};

export const mapSystemTypeToSelectOption = (
  systemType: SimpleSystemTypeDTO,
): SelectOptionObj => ({
  value: systemType.id,
  text: systemType.name,
});

export const resolveMedicineCategoryId = (
  categories: SimpleSystemTypeDTO[],
  lookupValue: string,
): string | null => {
  const match = categories.find((category) => {
    const candidates = [category.serialId, category.name].filter(
      (value): value is string => typeof value === "string" && value.length > 0,
    );
    return candidates.some((value) =>
      isCategoryLookupEquivalent(value, lookupValue),
    );
  });
  return match?.id ?? null;
};

export const mapMedicineToSelectOption = (
  medicine: MedicineDTO,
): MedicineSelectOptionObj => ({
  value: medicine.id,
  text: medicine.name,
  measureUnitId: medicine.measureUnitId ? medicine.measureUnitId._id : "",
  measureUnitText: medicine.measureUnitId
    ? medicine.measureUnitId.name
    : medicine.defaultUnit || "",
  frequencyId: medicine.dosageFrequencyId ? medicine.dosageFrequencyId._id : "",
  frequencyText: "",
  doseAmount: 0,
  medicineRouteId: medicine.routeOfAdministrationId
    ? medicine.routeOfAdministrationId._id
    : "",
  medicineRouteText: "",
  rangeMax:
    medicine.rangeMax !== null && medicine.rangeMax !== undefined
      ? Number(medicine.rangeMax)
      : undefined,
  rangeMin:
    medicine.rangeMin !== null && medicine.rangeMin !== undefined
      ? Number(medicine.rangeMin)
      : undefined,
  totalDose:
    medicine.totalDose !== null && medicine.totalDose !== undefined
      ? Number(medicine.totalDose)
      : undefined,
  comments: medicine.comments || "",
  defaultMedicineRouteId: medicine.routeOfAdministrationId
    ? medicine.routeOfAdministrationId._id
    : null,
  defaultFrequencyId: medicine.dosageFrequencyId
    ? medicine.dosageFrequencyId._id
    : null,
});

export const mapAnimalVitals = (vitals: AnimalVitalDTO[]): AnimalVitals => {
  if (vitals.length === 0) {
    return INITIAL_VITALS;
  }

  return {
    tempRangeMax: getVitalMax(vitals, VITAL_NAMES.TEMP),
    tempRangeMin: getVitalMin(vitals, VITAL_NAMES.TEMP),
    pulseRangeMax: getVitalMax(vitals, VITAL_NAMES.PULSE),
    pulseRangeMin: getVitalMin(vitals, VITAL_NAMES.PULSE),
    respirationRangeMax: getVitalMax(vitals, VITAL_NAMES.RESPIRATION),
    respirationRangeMin: getVitalMin(vitals, VITAL_NAMES.RESPIRATION),
  };
};
