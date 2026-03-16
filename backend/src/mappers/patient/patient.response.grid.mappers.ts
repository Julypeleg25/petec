import type {
  CaseDetailsResponseExaminationItemDTO,
  CaseDetailsResponseMedicineItemDTO,
  CaseDetailsResponseOptionItemDTO,
  CaseDetailsResponseRowDTO,
} from "@petec/shared";
import type {
  ICaseDetailsExamObj,
  ICaseDetailsMedicineObj,
  ICaseDetailsOptionsObj,
  ICaseDetailsRow,
} from "@models/case";
import {
  toBooleanOrNull,
  toBooleanWithDefault,
  toGiven,
  toMapperIdString,
  toMapperNamedReference,
  toNormalizedDate,
  toNormalizedTime,
  toOptionalBoolean,
  toOptionalString,
  toStringOrNull,
  type MapperReferenceId,
} from "@mappers/common/common.mappers.utils";
import { PATIENT_MAPPER_DEFAULTS } from "./patient.mapper.constants";

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

const toNullableIdString = (value: MapperReferenceId): string | null => {
  const id = toMapperIdString(value);
  return id.length > 0 ? id : null;
};

const toObjectIdStringOrNull = (value: MapperReferenceId): string | null => {
  const id = toMapperIdString(value);
  return OBJECT_ID_REGEX.test(id) ? id : null;
};

const toRowIdString = (
  value: MapperReferenceId | number | string | undefined,
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
): CaseDetailsResponseMedicineItemDTO | null => {
  const medicineRef = toMapperNamedReference(item.medicineId);
  const measureUnitRef = toMapperNamedReference(item.measureUnitTypeId);
  const dosageFrequencyRef = toMapperNamedReference(item.dosageFrequencyId);
  const routeRef = toMapperNamedReference(item.routeOfAdministrationId);
  const medicineId = toObjectIdStringOrNull(medicineRef.id);

  if (!medicineId) {
    return null;
  }

  return {
    medicineId,
    value: medicineId,
    text: medicineRef.name,
    isGiven: toGiven(item.isGiven),
    isRequired: toBooleanWithDefault(item.isRequired, false),
    isEditable: toBooleanWithDefault(item.isEditable, true),
    dosageText: item.dosageText ?? null,
    doseAmount:
      typeof item.doseAmount === "number"
        ? item.doseAmount
        : item.doseAmount
          ? Number(item.doseAmount)
          : null,
    measureUnitType:
      measureUnitRef.id && measureUnitRef.name
        ? { id: measureUnitRef.id, name: measureUnitRef.name }
        : null,
    dosageFrequency:
      dosageFrequencyRef.id && dosageFrequencyRef.name
        ? { id: dosageFrequencyRef.id, name: dosageFrequencyRef.name }
        : null,
    routeOfAdministration:
      routeRef.id && routeRef.name
        ? { id: routeRef.id, name: routeRef.name }
        : null,
    comment: toOptionalString(item.comment) ?? null,
  };
};

const mapOptionCell = (
  item: ICaseDetailsOptionsObj,
): CaseDetailsResponseOptionItemDTO => ({
  value: toMapperIdString(item.typeId),
  text: toMapperNamedReference(item.typeId).name,
  isGiven: toGiven(item.isGiven),
  isRequired: toBooleanWithDefault(item.isRequired, false),
  isEditable: toBooleanWithDefault(item.isEditable, true),
  comment: item.comment ?? null,
});

const mapExamCell = (
  item: ICaseDetailsExamObj,
): CaseDetailsResponseExaminationItemDTO => ({
  value: toMapperIdString(item.typeId),
  text: toMapperNamedReference(item.typeId).name,
  exam_value: item.value ?? null,
  isRequired: toBooleanWithDefault(item.isRequired, false),
  isEditable: toBooleanWithDefault(item.isEditable, true),
  comment: item.comment ?? null,
});

const mapMedicineCollection = (
  collection?: ICaseDetailsMedicineObj[],
): CaseDetailsResponseMedicineItemDTO[] => (collection ?? [])
  .map(mapMedicineCell)
  .filter((item): item is CaseDetailsResponseMedicineItemDTO => item !== null);

const mapOptionCollection = (
  collection?: ICaseDetailsOptionsObj[],
): CaseDetailsResponseOptionItemDTO[] => (collection ?? []).map(mapOptionCell);

const mapExamCollection = (
  collection?: ICaseDetailsExamObj[],
): CaseDetailsResponseExaminationItemDTO[] => (collection ?? []).map(mapExamCell);

export const mapGridRowToDto = (
  row: ICaseDetailsRow,
  fallbackIndex: number,
): CaseDetailsResponseRowDTO => ({
  id: toRowIdString(row._id, fallbackIndex),
  index: typeof row.index === "number" ? row.index : fallbackIndex,
  time: toNormalizedTime(row.time, row.dateTime),
  date: toNormalizedDate(row.date, row.dateTime),
  temperature: toStringOrNull(row.temperature),
  temperatureIsRequired: toBooleanWithDefault(row.temperatureIsRequired, false),
  temperatureIsEditable: toBooleanWithDefault(row.temperatureIsEditable, true),
  pulse: toStringOrNull(row.pulse),
  pulseIsRequired: toBooleanWithDefault(row.pulseIsRequired, false),
  pulseIsEditable: toBooleanWithDefault(row.pulseIsEditable, true),
  respiration: toStringOrNull(row.respiration),
  respirationIsRequired: toBooleanWithDefault(row.respirationIsRequired, false),
  respirationIsEditable: toBooleanWithDefault(row.respirationIsEditable, true),
  fluids: mapMedicineCollection(row.fluids),
  medicines: mapMedicineCollection(row.medicines),
  procedures: mapOptionCollection(row.procedures),
  foodExtras: mapOptionCollection(row.foodExtras),
  examinations: mapExamCollection(row.examinations),
  foodGiven: toOptionalBoolean(row.foodGiven),
  waterGiven: toOptionalBoolean(row.waterGiven),
  foodAndWater: row.foodAndWater ?? null,
  foodAndWaterIsRequired: toBooleanWithDefault(row.foodAndWaterIsRequired, false),
  foodAndWaterIsEditable: toBooleanWithDefault(row.foodAndWaterIsEditable, true),
  urineTypeId: toNullableIdString(row.urineTypeId),
  urineComments: row.urineComments ?? null,
  urineIsRequired: toBooleanWithDefault(row.urineIsRequired, false),
  urineIsEditable: toBooleanWithDefault(row.urineIsEditable, true),
  fecesTypeId: toNullableIdString(row.fecesTypeId),
  fecesComments: row.fecesComments ?? null,
  fecesIsRequired: toBooleanWithDefault(row.fecesIsRequired, false),
  fecesIsEditable: toBooleanWithDefault(row.fecesIsEditable, true),
  isBoxClean: toBooleanOrNull(row.isBoxClean),
  isBoxCleanIsRequired: toBooleanWithDefault(row.isBoxCleanIsRequired, false),
  isBoxCleanIsEditable: toBooleanWithDefault(row.isBoxCleanIsEditable, true),
  isRelease: toBooleanOrNull(row.isRelease),
  isReleaseIsRequired: toBooleanWithDefault(row.isReleaseIsRequired, false),
  isReleaseIsEditable: toBooleanWithDefault(row.isReleaseIsEditable, true),
  isTravel: toBooleanOrNull(row.isTravel),
  isTravelIsRequired: toBooleanWithDefault(row.isTravelIsRequired, false),
  isTravelIsEditable: toBooleanWithDefault(row.isTravelIsEditable, true),
  isPuke: toBooleanOrNull(row.isPuke),
  pukeComments: row.pukeComments ?? null,
  pukeIsRequired: toBooleanWithDefault(row.pukeIsRequired, false),
  pukeIsEditable: toBooleanWithDefault(row.pukeIsEditable, true),
  weigh: toStringOrNull(row.weigh),
  weighIsRequired: toBooleanWithDefault(row.weighIsRequired, false),
  weighIsEditable: toBooleanWithDefault(row.weighIsEditable, true),
  rowComments: row.rowComments ?? null,
  rowCommentsIsRequired: toBooleanWithDefault(row.rowCommentsIsRequired, false),
  rowCommentsIsEditable: toBooleanWithDefault(row.rowCommentsIsEditable, true),
  ownerUpdate: row.ownerUpdate ?? null,
  ownerUpdateIsRequired: toBooleanWithDefault(row.ownerUpdateIsRequired, false),
  ownerUpdateIsEditable: toBooleanWithDefault(row.ownerUpdateIsEditable, true),
});

export const groupCaseDetailsRows = (
  rows: ReadonlyArray<ICaseDetailsRow>,
): ICaseDetailsRow[][] => {
  if (rows.length === 0) {
    return [];
  }

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
