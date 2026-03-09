import type {
  CaseDetailsDataSchema,
  CaseDetailsResponseRowDTO,
} from "@petec/shared";
import type {
  CaseDetailsData,
  CaseDetailsOptionCell,
} from "../../CaseDetailsTable/CaseDetailsTable.types";
import {
  normalizeCaseDetailsDate,
  normalizeCaseDetailsTime,
} from "./savePatientCaseDetails.utils";
import {
  toOptionalNumber,
  toOptionalText,
} from "./savePatientCommon.utils";

const FOOD_AND_WATER_LABELS = {
  FOOD_HE: "אוכל",
  WATER_HE: "מים",
  FOOD_EN: "food",
  WATER_EN: "water",
} as const;

type CaseDetailsApiRow = CaseDetailsResponseRowDTO;
type CaseDailyDetailsMedicineItem = CaseDetailsData["medicines"][number];

const toObjectIdString = (
  value?: string | number | null,
): string | undefined => {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }

  return String(value);
};

const isDefined = <T>(value: T | null | undefined): value is T =>
  value !== null && value !== undefined;

export const mapApiMedicineCellsToUiCells = (
  cells: CaseDetailsApiRow["fluids"],
): CaseDetailsData["fluids"] =>
  cells.map((cell) => ({
    medicineId: cell.medicineId ?? cell.value,
    value: cell.value,
    text: cell.text,
    isGiven: cell.isGiven,
    isRequired: cell.isRequired,
    isEditable: cell.isEditable,
    dosageText: cell.dosageText,
    doseAmount: cell.doseAmount,
    measureUnitTypeId: cell.measureUnitType?.id ?? null,
    measureUnitText: cell.measureUnitType?.name ?? "",
    dosageFrequencyId: cell.dosageFrequency?.id ?? null,
    frequencyText: cell.dosageFrequency?.name ?? "",
    routeOfAdministrationId: cell.routeOfAdministration?.id ?? null,
    medicineRouteText: cell.routeOfAdministration?.name ?? "",
    comment: cell.comment ?? undefined,
  }));

export const mapApiOptionCellsToUiCells = (
  cells: CaseDetailsApiRow["foodExtras"],
): CaseDetailsData["foodExtras"] =>
  cells.map((cell) => ({
    value: cell.value,
    text: cell.text,
    isGiven: cell.isGiven,
    isRequired: cell.isRequired,
    isEditable: cell.isEditable,
    comment: cell.comment,
  }));

export const mapApiExaminationCellsToUiCells = (
  cells: CaseDetailsApiRow["examinations"],
): CaseDetailsData["examinations"] =>
  cells.map((cell) => ({
    value: cell.value,
    text: cell.text,
    exam_value: cell.exam_value,
    isRequired: cell.isRequired,
    isEditable: cell.isEditable,
    comment: cell.comment,
  }));

const mapFoodAndWaterFlags = (
  value: string | null,
): Pick<CaseDetailsDataSchema, "foodGiven" | "waterGiven"> => {
  if (!value) {
    return {};
  }

  const normalizedValue = value.toLowerCase();

  return {
    foodGiven:
      normalizedValue.includes(FOOD_AND_WATER_LABELS.FOOD_EN) ||
      value.includes(FOOD_AND_WATER_LABELS.FOOD_HE),
    waterGiven:
      normalizedValue.includes(FOOD_AND_WATER_LABELS.WATER_EN) ||
      value.includes(FOOD_AND_WATER_LABELS.WATER_HE),
  };
};

const mapUiMedicineCellToDto = (
  cell: CaseDailyDetailsMedicineItem,
): CaseDetailsDataSchema["medicines"][number] | null => {
  const medicineId = toObjectIdString(cell.medicineId ?? cell.value);
  if (!medicineId) {
    return null;
  }

  return {
    medicineId,
    name: toOptionalText(cell.text),
    dosageText: toOptionalText(cell.dosageText),
    doseAmount: toOptionalNumber(cell.doseAmount),
    measureUnitTypeId: toObjectIdString(cell.measureUnitTypeId),
    dosageFrequencyId: toObjectIdString(cell.dosageFrequencyId),
    routeOfAdministrationId: toObjectIdString(cell.routeOfAdministrationId),
    isGiven: cell.isGiven,
    isRequired: cell.isRequired ?? false,
    isEditable: cell.isEditable ?? true,
    comment: toOptionalText(cell.comment),
  };
};

const mapUiOptionCellToDto = (
  cell: CaseDetailsOptionCell,
): CaseDetailsDataSchema["foodExtras"][number] | null => {
  const typeId = toObjectIdString(cell.value);
  if (!typeId) {
    return null;
  }

  return {
    typeId,
    name: toOptionalText(cell.text),
    isGiven: cell.isGiven,
    isRequired: cell.isRequired ?? false,
    isEditable: cell.isEditable ?? true,
    comment: toOptionalText(cell.comment),
  };
};

const mapUiExaminationCellToDto = (
  cell: CaseDetailsOptionCell,
): CaseDetailsDataSchema["examinations"][number] | null => {
  const typeId = toObjectIdString(cell.value);
  if (!typeId) {
    return null;
  }

  return {
    typeId,
    name: toOptionalText(cell.text),
    value: toOptionalText(cell.exam_value ?? null) ?? null,
    isRequired: cell.isRequired ?? false,
    isEditable: cell.isEditable ?? true,
    comment: toOptionalText(cell.comment),
  };
};

export const mapCaseDetailsRowToDto = (
  row: CaseDetailsData,
  fallbackDate: string,
  fallbackTime: string,
): CaseDetailsDataSchema => {
  const foodAndWaterFlags = mapFoodAndWaterFlags(row.foodAndWater);

  return {
    date: normalizeCaseDetailsDate(row.date) ?? fallbackDate,
    time: normalizeCaseDetailsTime(row.time) ?? fallbackTime,
    index: row.index,
    temperature: toOptionalNumber(row.temperature),
    temperatureIsRequired: row.temperatureIsRequired,
    temperatureIsEditable: row.temperatureIsEditable,
    pulse: toOptionalNumber(row.pulse),
    pulseIsRequired: row.pulseIsRequired,
    pulseIsEditable: row.pulseIsEditable,
    respiration: toOptionalNumber(row.respiration),
    respirationIsRequired: row.respirationIsRequired,
    respirationIsEditable: row.respirationIsEditable,
    urineTypeId: toObjectIdString(row.urineTypeId),
    urineComments: toOptionalText(row.urineComments),
    urineIsRequired: row.urineIsRequired,
    urineIsEditable: row.urineIsEditable,
    fecesTypeId: toObjectIdString(row.fecesTypeId),
    fecesComments: toOptionalText(row.fecesComments),
    fecesIsRequired: row.fecesIsRequired,
    fecesIsEditable: row.fecesIsEditable,
    isBoxClean: row.isBoxClean ?? undefined,
    isBoxCleanIsRequired: row.isBoxCleanIsRequired,
    isBoxCleanIsEditable: row.isBoxCleanIsEditable,
    isRelease: row.isRelease ?? undefined,
    isReleaseIsRequired: row.isReleaseIsRequired,
    isReleaseIsEditable: row.isReleaseIsEditable,
    isTravel: row.isTravel ?? undefined,
    isTravelIsRequired: row.isTravelIsRequired,
    isTravelIsEditable: row.isTravelIsEditable,
    weigh: toOptionalNumber(row.weigh),
    weighIsRequired: row.weighIsRequired,
    weighIsEditable: row.weighIsEditable,
    isPuke: row.isPuke ?? undefined,
    pukeComments: toOptionalText(row.pukeComments),
    pukeIsRequired: row.pukeIsRequired,
    pukeIsEditable: row.pukeIsEditable,
    rowComments: toOptionalText(row.rowComments),
    rowCommentsIsRequired: row.rowCommentsIsRequired,
    rowCommentsIsEditable: row.rowCommentsIsEditable,
    ownerUpdate: toOptionalText(row.ownerUpdate),
    ownerUpdateIsRequired: row.ownerUpdateIsRequired,
    ownerUpdateIsEditable: row.ownerUpdateIsEditable,
    foodAndWater: toOptionalText(row.foodAndWater ?? null) ?? null,
    foodAndWaterIsRequired: row.foodAndWaterIsRequired,
    foodAndWaterIsEditable: row.foodAndWaterIsEditable,
    foodGiven: foodAndWaterFlags.foodGiven,
    waterGiven: foodAndWaterFlags.waterGiven,
    fluids: row.fluids.map(mapUiMedicineCellToDto).filter(isDefined),
    medicines: row.medicines.map(mapUiMedicineCellToDto).filter(isDefined),
    procedures: row.procedures.map(mapUiOptionCellToDto).filter(isDefined),
    examinations: row.examinations
      .map(mapUiExaminationCellToDto)
      .filter(isDefined),
    foodExtras: row.foodExtras.map(mapUiOptionCellToDto).filter(isDefined),
  };
};

export const mapCaseDetailsApiRowToUiRow = (
  row: CaseDetailsApiRow,
): CaseDetailsData => ({
  id: row.id,
  index: row.index,
  time: normalizeCaseDetailsTime(row.time) ?? "",
  date: normalizeCaseDetailsDate(row.date) ?? "",
  temperature: row.temperature,
  temperatureIsRequired: row.temperatureIsRequired,
  temperatureIsEditable: row.temperatureIsEditable,
  pulse: row.pulse,
  pulseIsRequired: row.pulseIsRequired,
  pulseIsEditable: row.pulseIsEditable,
  respiration: row.respiration,
  respirationIsRequired: row.respirationIsRequired,
  respirationIsEditable: row.respirationIsEditable,
  fluids: mapApiMedicineCellsToUiCells(row.fluids),
  medicines: mapApiMedicineCellsToUiCells(row.medicines),
  procedures: mapApiOptionCellsToUiCells(row.procedures),
  foodExtras: mapApiOptionCellsToUiCells(row.foodExtras),
  examinations: mapApiExaminationCellsToUiCells(row.examinations),
  foodAndWater: row.foodAndWater,
  foodAndWaterIsRequired: row.foodAndWaterIsRequired,
  foodAndWaterIsEditable: row.foodAndWaterIsEditable,
  urineTypeId: row.urineTypeId,
  urineComments: row.urineComments,
  urineIsRequired: row.urineIsRequired,
  urineIsEditable: row.urineIsEditable,
  fecesTypeId: row.fecesTypeId,
  fecesComments: row.fecesComments,
  fecesIsRequired: row.fecesIsRequired,
  fecesIsEditable: row.fecesIsEditable,
  isTravel: row.isTravel,
  isTravelIsRequired: row.isTravelIsRequired,
  isTravelIsEditable: row.isTravelIsEditable,
  isBoxClean: row.isBoxClean,
  isBoxCleanIsRequired: row.isBoxCleanIsRequired,
  isBoxCleanIsEditable: row.isBoxCleanIsEditable,
  isRelease: row.isRelease,
  isReleaseIsRequired: row.isReleaseIsRequired,
  isReleaseIsEditable: row.isReleaseIsEditable,
  weigh: row.weigh,
  weighIsRequired: row.weighIsRequired,
  weighIsEditable: row.weighIsEditable,
  isPuke: row.isPuke,
  pukeComments: row.pukeComments,
  pukeIsRequired: row.pukeIsRequired,
  pukeIsEditable: row.pukeIsEditable,
  rowComments: row.rowComments,
  rowCommentsIsRequired: row.rowCommentsIsRequired,
  rowCommentsIsEditable: row.rowCommentsIsEditable,
  ownerUpdate: row.ownerUpdate,
  ownerUpdateIsRequired: row.ownerUpdateIsRequired,
  ownerUpdateIsEditable: row.ownerUpdateIsEditable,
});
