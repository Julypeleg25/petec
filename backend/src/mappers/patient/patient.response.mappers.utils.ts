import type { CaseDetailsResponseDTO } from "@petec/shared";
import type { Types } from "mongoose";
import type {
  ICaseDetailsRow,
  ICaseDetailsMedicineObj,
  ICaseDetailsOptionsObj,
  ICaseDetailsExamObj,
} from "@models/Case";
import {
  toMapperIdString,
  type MapperIdLike,
} from "@mappers/common/common.mappers.utils";
import type {
  CaseRefsLike,
  PopulatedPatient,
} from "./patient.response.mappers.types";
import {
  PATIENT_MAPPER_DEFAULTS,
  PATIENT_MAPPER_OBJECT_KEYS,
} from "./patient.mapper.constants";

type CaseDailyDetailsMatrix = NonNullable<
  CaseDetailsResponseDTO["caseDailyDetails"]
>;
type CaseDailyDetailsRowDTO = CaseDailyDetailsMatrix[number][number];
type ResponseMedicineItemDTO = CaseDailyDetailsRowDTO["medicines"][number];
type ResponseOptionItemDTO = CaseDailyDetailsRowDTO["procedures"][number];
type ResponseExaminationItemDTO =
  CaseDailyDetailsRowDTO["examinations"][number];

const DATE_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;
const DATE_TIME_PREFIX_REGEX = /^(\d{4})-(\d{2})-(\d{2})T/;
const TIME_REGEX = /^([01]?\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/;

const toGiven = (value?: boolean | null): boolean => value === true;
const toBooleanOrNull = (value?: boolean | null): boolean | null =>
  typeof value === "boolean" ? value : null;
const toBoolean = (value: boolean | undefined, fallback: boolean): boolean =>
  typeof value === "boolean" ? value : fallback;
const toStringOrNull = (value?: string | number | null): string | null =>
  value == null ? null : String(value);
const toNullableIdString = (value: MapperIdLike): string | null => {
  const id = toMapperIdString(value);
  return id.length > 0 ? id : null;
};

const toTwoDigits = (value: number): string => String(value).padStart(2, "0");

const toLocalDateKey = (value: Date): string =>
  `${value.getFullYear()}-${toTwoDigits(value.getMonth() + 1)}-${toTwoDigits(value.getDate())}`;

const toTimeKey = (value: Date): string =>
  `${toTwoDigits(value.getHours())}:${toTwoDigits(value.getMinutes())}`;

const toParsedDate = (value: unknown): Date | null => {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
};

const toNormalizedDate = (
  date?: string | null,
  dateTime?: Date | string,
): string => {
  if (typeof date === "string") {
    const trimmedDate = date.trim();
    if (trimmedDate.length > 0) {
      const dateMatch = DATE_REGEX.exec(trimmedDate);
      if (dateMatch) {
        return `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
      }

      const dateTimePrefixMatch = DATE_TIME_PREFIX_REGEX.exec(trimmedDate);
      if (dateTimePrefixMatch) {
        return `${dateTimePrefixMatch[1]}-${dateTimePrefixMatch[2]}-${dateTimePrefixMatch[3]}`;
      }

      const parsedDate = toParsedDate(trimmedDate);
      if (parsedDate) {
        return toLocalDateKey(parsedDate);
      }
    }
  }

  const parsedDateTime = toParsedDate(dateTime);
  return parsedDateTime ? toLocalDateKey(parsedDateTime) : "";
};

const toNormalizedTime = (
  time?: string | null,
  dateTime?: Date | string,
): string => {
  if (typeof time === "string") {
    const trimmedTime = time.trim();
    if (trimmedTime.length > 0) {
      const timeMatch = TIME_REGEX.exec(trimmedTime);
      if (timeMatch) {
        return `${timeMatch[1].padStart(2, "0")}:${timeMatch[2]}`;
      }
    }
  }

  const parsedDateTime = toParsedDate(dateTime);
  return parsedDateTime ? toTimeKey(parsedDateTime) : "";
};

const toRowIdString = (
  value: MapperIdLike | number | string | undefined,
  fallbackIndex: number,
): string => {
  const str = toMapperIdString(value);
  if (str) return str;
  if (typeof value === "string" && value.length > 0) return value;
  if (typeof value === "number") return String(value);
  return String(fallbackIndex + 1);
};

const mapMedicineCell = (
  item: ICaseDetailsMedicineObj,
): ResponseMedicineItemDTO => ({
  medicineId: item.medicineId?.toString() ?? "",
  value: item.medicineId?.toString() ?? "",
  text: item.name ?? "",
  isGiven: toGiven(item.isGiven),
  isRequired: toBoolean(item.isRequired, false),
  isEditable: toBoolean(item.isEditable, true),
  comment: item.notes ?? item.comment ?? null,
  dosageText: item.dosageText ?? null,
  doseAmount:
    typeof item.doseAmount === "number"
      ? item.doseAmount
      : item.doseAmount
        ? Number(item.doseAmount)
        : null,
  measureUnitTypeId: toMapperIdString(item.measureUnitTypeId) || null,
  dosageFrequencyId: toMapperIdString(item.dosageFrequencyId) || null,
  routeOfAdministrationId:
    toMapperIdString(item.routeOfAdministrationId) || null,
});

const mapOptionCell = (
  item: ICaseDetailsOptionsObj,
): ResponseOptionItemDTO => ({
  value: item.typeId?.toString() ?? "",
  text: item.name ?? "",
  isGiven: toGiven(item.isGiven),
  isRequired: toBoolean(item.isRequired, false),
  isEditable: toBoolean(item.isEditable, true),
  comment: item.comment ?? null,
});

const mapExamCell = (
  item: ICaseDetailsExamObj,
): ResponseExaminationItemDTO => ({
  value: item.typeId?.toString() ?? "",
  text: item.name ?? "",
  exam_value: item.value ?? null,
  isRequired: toBoolean(item.isRequired, false),
  isEditable: toBoolean(item.isEditable, true),
  comment: item.comment ?? null,
});

const mapMedicineCollection = (
  collection?: ICaseDetailsMedicineObj[],
): ResponseMedicineItemDTO[] => (collection ?? []).map(mapMedicineCell);

const mapOptionCollection = (
  collection?: ICaseDetailsOptionsObj[],
): ResponseOptionItemDTO[] => (collection ?? []).map(mapOptionCell);

const mapExamCollection = (
  collection?: ICaseDetailsExamObj[],
): ResponseExaminationItemDTO[] => (collection ?? []).map(mapExamCell);

export const resolveCaseRefs = (
  caseRefs?: CaseRefsLike,
  patient?: PopulatedPatient,
): CaseRefsLike => ({
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

export const mapGridRowToDto = (
  row: ICaseDetailsRow,
  fallbackIndex: number,
): CaseDailyDetailsRowDTO => ({
  id: toRowIdString(row._id, fallbackIndex),
  index: typeof row.index === "number" ? row.index : fallbackIndex,
  time: toNormalizedTime(row.time, row.dateTime),
  date: toNormalizedDate(row.date, row.dateTime),

  T: toStringOrNull(row.temperature),
  T_is_required: toBoolean(row.temperatureIsRequired, false),
  T_is_editable: toBoolean(row.temperatureIsEditable, true),

  P: toStringOrNull(row.pulse),
  P_is_required: toBoolean(row.pulseIsRequired, false),
  P_is_editable: toBoolean(row.pulseIsEditable, true),

  R: toStringOrNull(row.respiration),
  R_is_required: toBoolean(row.respirationIsRequired, false),
  R_is_editable: toBoolean(row.respirationIsEditable, true),

  fluids: mapMedicineCollection(row.fluids),
  medicines: mapMedicineCollection(row.medicines),
  procedures: mapOptionCollection(row.procedures),
  foodExtras: mapOptionCollection(row.foodExtras),
  examinations: mapExamCollection(row.examinations),

  food_and_water: row.foodAndWater ?? null,
  food_and_water_is_required: toBoolean(row.foodAndWaterIsRequired, false),
  food_and_water_is_editable: toBoolean(row.foodAndWaterIsEditable, true),

  urine_type_id: toNullableIdString(row.urineTypeId),
  urine_comments: row.urineComments ?? null,
  urine_is_required: toBoolean(row.urineIsRequired, false),
  urine_is_editable: toBoolean(row.urineIsEditable, true),

  feces_type_id: toNullableIdString(row.fecesTypeId),
  feces_comments: row.fecesComments ?? null,
  feces_is_required: toBoolean(row.fecesIsRequired, false),
  feces_is_editable: toBoolean(row.fecesIsEditable, true),

  is_box_clean: toBooleanOrNull(row.isBoxClean),
  is_box_clean_is_required: toBoolean(row.isBoxCleanIsRequired, false),
  is_box_clean_is_editable: toBoolean(row.isBoxCleanIsEditable, true),

  is_release: toBooleanOrNull(row.isRelease),
  is_release_is_required: toBoolean(row.isReleaseIsRequired, false),
  is_release_is_editable: toBoolean(row.isReleaseIsEditable, true),

  is_walk_trip: toBooleanOrNull(row.isTravel),
  is_walk_trip_is_required: toBoolean(row.isTravelIsRequired, false),
  is_walk_trip_is_editable: toBoolean(row.isTravelIsEditable, true),

  is_puke: toBooleanOrNull(row.isPuke),
  puke_comments: row.pukeComments ?? null,
  puke_is_required: toBoolean(row.pukeIsRequired, false),
  puke_is_editable: toBoolean(row.pukeIsEditable, true),

  weigh: toStringOrNull(row.weigh),
  weigh_is_required: toBoolean(row.weighIsRequired, false),
  weigh_is_editable: toBoolean(row.weighIsEditable, true),

  comments: row.rowComments ?? null,
  comments_is_required: toBoolean(row.rowCommentsIsRequired, false),
  comments_is_editable: toBoolean(row.rowCommentsIsEditable, true),

  owner_update: row.ownerUpdate ?? null,
  owner_update_is_required: toBoolean(row.ownerUpdateIsRequired, false),
  owner_update_is_editable: toBoolean(row.ownerUpdateIsEditable, true),
});

export const groupCaseDetailsRows = (
  rows: ReadonlyArray<ICaseDetailsRow>,
): ICaseDetailsRow[][] => {
  if (rows.length === 0) return [];

  const byDate = new Map<string, ICaseDetailsRow[]>();

  for (const row of rows) {
    const dateKey =
      toNormalizedDate(row.date, row.dateTime) ||
      PATIENT_MAPPER_DEFAULTS.UNKNOWN_DATE_GROUP;
    const groupedRows = byDate.get(dateKey) ?? [];
    groupedRows.push(row);
    byDate.set(dateKey, groupedRows);
  }

  const dates = Array.from(byDate.keys()).sort((left, right) => {
    if (left === PATIENT_MAPPER_DEFAULTS.UNKNOWN_DATE_GROUP) {
      return 1;
    }
    if (right === PATIENT_MAPPER_DEFAULTS.UNKNOWN_DATE_GROUP) {
      return -1;
    }
    return left.localeCompare(right);
  });

  return dates.map((date) => {
    const groupedRows = byDate.get(date) ?? [];
    return [...groupedRows].sort((left, right) => {
      const leftTime = toNormalizedTime(left.time, left.dateTime);
      const rightTime = toNormalizedTime(right.time, right.dateTime);
      const timeCompare = leftTime.localeCompare(rightTime);
      if (timeCompare !== 0) {
        return timeCompare;
      }

      const leftIndex = Number.isFinite(Number(left.index))
        ? Number(left.index)
        : 0;
      const rightIndex = Number.isFinite(Number(right.index))
        ? Number(right.index)
        : 0;
      return leftIndex - rightIndex;
    });
  });
};
