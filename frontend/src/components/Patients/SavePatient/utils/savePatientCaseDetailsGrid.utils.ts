import type { CaseDetailsDataSchema, CaseDetailsResponseDTO } from "@petec/shared";
import type {
  CaseDetailsData,
  CaseDetailsMedicineCell,
  CaseDetailsOptionCell,
} from "../../CaseDetailsTable/CaseDetailsTable.types";
import {
  CASE_GRID_FIRST_DATA_COLUMN_INDEX,
  getCaseDayPrimaryDataRow,
  getCaseGridExpectedHourByIndex,
  sortCaseDayRowsByIndex,
} from "../../CaseDetailsTable/caseGrid.utils";
import { defaultCaseDailyDataTemplate } from "../types/savePatient.types";
import {
  normalizeCaseDetailsDate,
  normalizeCaseDetailsTime,
} from "../hooks/savePatient.utils";
import {
  cloneCells,
  toDateKey,
  toOptionalNumber,
  toOptionalText,
} from "./savePatientCommon.utils";

type CaseDetailsApiRow = NonNullable<
  CaseDetailsResponseDTO["caseDailyDetails"]
>[number][number];
const FOOD_AND_WATER_LABELS = {
  FOOD_HE: "אוכל",
  WATER_HE: "מים",
  FOOD_EN: "food",
  WATER_EN: "water",
} as const;

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

const mapApiMedicineCellsToUiCells = (
  cells: CaseDetailsApiRow["fluids"],
): CaseDetailsData["fluids"] =>
  cells.map((cell) => ({
    value: cell.value,
    text: cell.text,
    measureUnitId: cell.measureUnitTypeId ?? "",
    measureUnitText: "",
    frequencyId: cell.dosageFrequencyId ?? "",
    frequencyText: "",
    doseAmount: toOptionalNumber(cell.doseAmount) ?? 0,
    dosageText: cell.dosageText ?? "",
    medicineRouteId: cell.routeOfAdministrationId ?? "",
    medicineRouteText: "",
    rangeMax: undefined,
    rangeMin: undefined,
    totalDose: undefined,
    comments: cell.comment ?? cell.notes ?? "",
    defaultMedicineRouteId: null,
    defaultFrequencyId: null,
    isGiven: cell.isGiven,
    isRequired: cell.isRequired,
    isEditable: cell.isEditable,
    comment: cell.comment,
  }));

const mapApiOptionCellsToUiCells = (
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

const mapApiExaminationCellsToUiCells = (
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
  cell: CaseDetailsMedicineCell,
): CaseDetailsDataSchema["medicines"][number] | null => {
  const medicineId = toObjectIdString(cell.value);
  if (!medicineId) {
    return null;
  }

  return {
    medicineId,
    name: toOptionalText(cell.text),
    dosageText: toOptionalText(cell.dosageText),
    doseAmount: toOptionalNumber(cell.doseAmount),
    measureUnitTypeId: toObjectIdString(cell.measureUnitId),
    dosageFrequencyId: toObjectIdString(cell.frequencyId),
    routeOfAdministrationId: toObjectIdString(cell.medicineRouteId),
    isGiven: cell.isGiven,
    isRequired: cell.isRequired ?? false,
    isEditable: cell.isEditable ?? true,
    notes: toOptionalText(cell.comment ?? cell.comments),
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

const mapCaseDetailsRowToDto = (
  row: CaseDetailsData,
  fallbackDate: string,
  fallbackTime: string,
): CaseDetailsDataSchema => {
  const foodAndWaterFlags = mapFoodAndWaterFlags(row.foodAndWater);

  return {
    date: normalizeCaseDetailsDate(row.date) ?? fallbackDate,
    time: normalizeCaseDetailsTime(row.time) ?? fallbackTime,
    index: row.index,
    temperature: toOptionalNumber(row.T),
    temperatureIsRequired: row.T_is_required,
    temperatureIsEditable: row.T_is_editable,
    pulse: toOptionalNumber(row.P),
    pulseIsRequired: row.P_is_required,
    pulseIsEditable: row.P_is_editable,
    respiration: toOptionalNumber(row.R),
    respirationIsRequired: row.R_is_required,
    respirationIsEditable: row.R_is_editable,
    urineTypeId: toObjectIdString(row.urineTypeId),
    urineComments: toOptionalText(row.urineComments),
    urineIsRequired: row.urine_is_required,
    urineIsEditable: row.urine_is_editable,
    fecesTypeId: toObjectIdString(row.fecesTypeId),
    fecesComments: toOptionalText(row.fecesComments),
    fecesIsRequired: row.feces_is_required,
    fecesIsEditable: row.feces_is_editable,
    isBoxClean: row.isBoxClean ?? undefined,
    isBoxCleanIsRequired: row.isBoxClean_is_required,
    isBoxCleanIsEditable: row.isBoxClean_is_editable,
    isRelease: row.isRelease ?? undefined,
    isReleaseIsRequired: row.isRelease_is_required,
    isReleaseIsEditable: row.isRelease_is_editable,
    isTravel: row.isTravel ?? undefined,
    isTravelIsRequired: row.isTravel_is_required,
    isTravelIsEditable: row.isTravel_is_editable,
    weigh: toOptionalNumber(row.weigh),
    weighIsRequired: row.weigh_is_required,
    weighIsEditable: row.weigh_is_editable,
    isPuke: row.isPuke ?? undefined,
    pukeComments: toOptionalText(row.pukeComments),
    pukeIsRequired: row.puke_is_required,
    pukeIsEditable: row.puke_is_editable,
    rowComments: toOptionalText(row.comments),
    rowCommentsIsRequired: row.comments_is_required,
    rowCommentsIsEditable: row.comments_is_editable,
    ownerUpdate: toOptionalText(row.ownerUpdate),
    ownerUpdateIsRequired: row.ownerUpdate_is_required,
    ownerUpdateIsEditable: row.ownerUpdate_is_editable,
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

export const mapCaseDetailsGridToDto = (
  rows: CaseDetailsData[][],
): CaseDetailsDataSchema[][] =>
  rows.map((dailyRows) => {
    const orderedRows = sortCaseDayRowsByIndex(dailyRows);
    const rowForFallback = getCaseDayPrimaryDataRow(orderedRows);
    const fallbackDate =
      normalizeCaseDetailsDate(rowForFallback?.date) ?? toDateKey(new Date());
    const startTime = normalizeCaseDetailsTime(rowForFallback?.time) ?? "00:00";
    const startHour = Number.parseInt(startTime.split(":")[0] ?? "0", 10);

    return orderedRows.map((row) => {
      const rowIndex =
        Number.isInteger(row.index) && row.index >= 0
          ? row.index
          : CASE_GRID_FIRST_DATA_COLUMN_INDEX;

      return mapCaseDetailsRowToDto(
        row,
        fallbackDate,
        getCaseGridExpectedHourByIndex(startHour, rowIndex),
      );
    });
  });

const mapCaseDetailsApiRowToUiRow = (
  row: CaseDetailsApiRow,
): CaseDetailsData => ({
  id: row.id,
  index: row.index,
  time: normalizeCaseDetailsTime(row.time) ?? "",
  date: normalizeCaseDetailsDate(row.date) ?? undefined,
  T: row.T,
  T_is_required: row.T_is_required,
  T_is_editable: row.T_is_editable,
  P: row.P,
  P_is_required: row.P_is_required,
  P_is_editable: row.P_is_editable,
  R: row.R,
  R_is_required: row.R_is_required,
  R_is_editable: row.R_is_editable,
  fluids: mapApiMedicineCellsToUiCells(row.fluids),
  medicines: mapApiMedicineCellsToUiCells(row.medicines),
  procedures: mapApiOptionCellsToUiCells(row.procedures),
  foodExtras: mapApiOptionCellsToUiCells(row.foodExtras),
  examinations: mapApiExaminationCellsToUiCells(row.examinations),
  foodAndWater: row.food_and_water,
  foodAndWater_is_required: row.food_and_water_is_required,
  foodAndWater_is_editable: row.food_and_water_is_editable,
  urineTypeId: row.urine_type_id,
  urineTypeText: null,
  urineComments: row.urine_comments,
  urine_is_required: row.urine_is_required,
  urine_is_editable: row.urine_is_editable,
  fecesTypeId: row.feces_type_id,
  fecesTypeText: null,
  fecesComments: row.feces_comments,
  feces_is_required: row.feces_is_required,
  feces_is_editable: row.feces_is_editable,
  isTravel: row.is_walk_trip,
  isTravel_is_required: row.is_walk_trip_is_required,
  isTravel_is_editable: row.is_walk_trip_is_editable,
  isBoxClean: row.is_box_clean,
  isBoxClean_is_required: row.is_box_clean_is_required,
  isBoxClean_is_editable: row.is_box_clean_is_editable,
  isRelease: row.is_release,
  isRelease_is_required: row.is_release_is_required,
  isRelease_is_editable: row.is_release_is_editable,
  weigh: row.weigh,
  weigh_is_required: row.weigh_is_required,
  weigh_is_editable: row.weigh_is_editable,
  isPuke: row.is_puke,
  pukeComments: row.puke_comments,
  puke_is_required: row.puke_is_required,
  puke_is_editable: row.puke_is_editable,
  comments: row.comments,
  comments_is_required: row.comments_is_required,
  comments_is_editable: row.comments_is_editable,
  ownerUpdate: row.owner_update,
  ownerUpdate_is_required: row.owner_update_is_required,
  ownerUpdate_is_editable: row.owner_update_is_editable,
});

const cloneDefaultCaseDailyRow = (index: number): CaseDetailsData => {
  const templateRow = defaultCaseDailyDataTemplate[index];
  return {
    ...templateRow,
    index,
    fluids: cloneCells(templateRow.fluids),
    medicines: cloneCells(templateRow.medicines),
    foodExtras: cloneCells(templateRow.foodExtras),
    examinations: cloneCells(templateRow.examinations),
    procedures: cloneCells(templateRow.procedures),
  };
};

const mapCaseDetailsApiDailyRowsToUi = (
  dailyRows: CaseDetailsApiRow[],
): CaseDetailsData[] => {
  const rowByIndex = new Map<number, CaseDetailsApiRow>();

  for (const row of dailyRows) {
    const normalizedIndex = Number(row.index);
    if (
      !Number.isInteger(normalizedIndex) ||
      normalizedIndex < 0 ||
      normalizedIndex >= defaultCaseDailyDataTemplate.length
    ) {
      continue;
    }

    rowByIndex.set(normalizedIndex, row);
  }

  return defaultCaseDailyDataTemplate.map((_, index) => {
    const row = rowByIndex.get(index);
    if (!row) {
      return cloneDefaultCaseDailyRow(index);
    }

    return {
      ...cloneDefaultCaseDailyRow(index),
      ...mapCaseDetailsApiRowToUiRow(row),
    };
  });
};

export const mapCaseDetailsApiGridToUi = (
  caseDailyDetails: CaseDetailsResponseDTO["caseDailyDetails"],
): CaseDetailsData[][] | null =>
  caseDailyDetails
    ? caseDailyDetails.map(mapCaseDetailsApiDailyRowsToUi)
    : null;
