import path from "node:path";
import type { Types } from "mongoose";
import type { ICase } from "../../models/case/index.js";
import { PATIENT_STORAGE } from "../../constants/patient.constants.js";
import {
  DEFAULT_IMAGE_MIME_TYPE,
  IMAGE_MIME_TYPE_BY_EXTENSION,
  getCaseSerialPrefix,
} from "@petec/shared";
import type {
  CaseDetailsResponseDTO,
  ChartsDataResponseDTO,
  DailyPlanDetailDTO,
} from "@petec/shared";
import { toPatientPhotoUrl } from "../../utils/patientPhoto.utils.js";
import { toMapperNamedReference } from "../common/common.mappers.utils.js";
import { toFiniteNumber } from "../common/common.mappers.utils.js";
import {
  toNormalizedDate,
  toNormalizedTime,
} from "../common/common.mappers.utils.js";
import type {
  CaseWithPopulatedPatient,
  ChartDataPoint,
  DailyPlanPopulatedPatient,
} from "../../types/patient.types.js";
import {
  PATIENT_MAPPER_OBJECT_KEYS,
} from "./patient.mapper.constants.js";

type MasterCaseDetailsItem = CaseDetailsResponseDTO["masterCaseDetails"][number];

type NamedReference = {
  _id?: string | number | Types.ObjectId;
  name?: string;
};

type DailyPlanProcedure = ICase["caseDetailsGrid"][number]["procedures"][number] & {
  typeId?: ICase["caseDetailsGrid"][number]["procedures"][number]["typeId"] | NamedReference;
};

type DailyPlanExamination = ICase["caseDetailsGrid"][number]["examinations"][number] & {
  typeId?: ICase["caseDetailsGrid"][number]["examinations"][number]["typeId"] | NamedReference;
};

type DailyPlanRow = ICase["caseDetailsGrid"][number] & {
  procedures?: DailyPlanProcedure[];
  examinations?: DailyPlanExamination[];
};

type DailyPlanCase = Pick<
  ICase,
  | "_id"
  | "serialId"
  | "admission"
  | "dailyPlan"
  | "caseDetailsGrid"
  | "patientId"
> & {
  patientId?: ICase["patientId"] | DailyPlanPopulatedPatient;
  caseDetailsGrid?: DailyPlanRow[];
};

type MasterCasePatient = {
  _id: string | number | Types.ObjectId;
  name?: string;
  photoName?: string;
  updatedAt?: Date | string;
};

const DAILY_PLAN_TIME_ZONE = "Asia/Jerusalem";
const JERUSALEM_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: DAILY_PLAN_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});


const isPlainObject = (value: object | null | string | number | boolean | undefined): value is Record<string, object | null | string | number | boolean | undefined> =>
  typeof value === "object" &&
  value !== null &&
  !Array.isArray(value);

const isObjectIdLike = (value: object | null | string | number | boolean | undefined): value is Types.ObjectId =>
  isPlainObject(value) &&
  PATIENT_MAPPER_OBJECT_KEYS.TO_HEX_STRING in value &&
  typeof value[PATIENT_MAPPER_OBJECT_KEYS.TO_HEX_STRING] === "function";

const toMasterCasePatient = (
  value: CaseWithPopulatedPatient["patientId"],
): MasterCasePatient | undefined => {
  if (!isPlainObject(value) || isObjectIdLike(value)) {
    return undefined;
  }
  if (!(PATIENT_MAPPER_OBJECT_KEYS.ID in value)) {
    return undefined;
  }

  const candidate = value as {
    _id: string | number | Types.ObjectId;
    name?: string | null;
    photoName?: string | null;
    updatedAt?: Date | string | null;
  };

  const updatedAt =
    candidate.updatedAt instanceof Date || typeof candidate.updatedAt === "string"
      ? candidate.updatedAt
      : undefined;

  return {
    _id: candidate._id,
    name: typeof candidate.name === "string" ? candidate.name : undefined,
    photoName:
      typeof candidate.photoName === "string" ? candidate.photoName : undefined,
    updatedAt,
  };
};

const isDailyPlanPopulatedPatient = (
  value?: ICase["patientId"] | DailyPlanPopulatedPatient,
): value is DailyPlanPopulatedPatient =>
  typeof value === "object" &&
  value !== null &&
  !(PATIENT_MAPPER_OBJECT_KEYS.TO_HEX_STRING in value) &&
  (PATIENT_MAPPER_OBJECT_KEYS.NAME in value ||
    PATIENT_MAPPER_OBJECT_KEYS.OWNER in value);

const toPlannedRefName = (value?: NamedReference | Types.ObjectId): string => {
  const refInfo = toMapperNamedReference(value);
  return refInfo.name || refInfo.id;
};

const toFormatterPartValue = (
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes,
): string => parts.find((part) => part.type === type)?.value ?? "";

const toJerusalemDateKey = (value: Date): string => {
  const parts = JERUSALEM_DATE_FORMATTER.formatToParts(value);
  const year = toFormatterPartValue(parts, "year");
  const month = toFormatterPartValue(parts, "month");
  const day = toFormatterPartValue(parts, "day");

  return year && month && day ? `${year}-${month}-${day}` : "";
};

const toTrimmedString = (value?: string | null): string =>
  typeof value === "string" ? value.trim() : "";

const toDisplayDateTime = (
  row: Pick<ICase["caseDetailsGrid"][number], "date" | "dateTime" | "time">,
  fallbackLabel?: string,
): string => {
  const dateKey = toNormalizedDate(row.date, row.dateTime);
  const timeKey = toNormalizedTime(row.time, row.dateTime);

  if (!dateKey) {
    return timeKey || fallbackLabel || "";
  }

  const [year, month, day] = dateKey.split("-");
  const displayDate = year && month && day ? `${day}/${month}/${year}` : dateKey;

  return timeKey ? `${timeKey} ${displayDate}` : displayDate;
};

const toDailyPlanDisplayDate = (row: DailyPlanRow): string => toDisplayDateTime(row);

const toChartDataPoint = (
  value: number | string | null | undefined,
  row: ICase["caseDetailsGrid"][number],
  index: number,
): ChartDataPoint | null => {
  const numericValue = toFiniteNumber(value);

  if (numericValue === undefined) {
    return null;
  }

  return {
    name: toDisplayDateTime(row, `Point ${index + 1}`),
    value: numericValue,
  };
};

const toChartSeries = (
  rows: ReadonlyArray<ICase["caseDetailsGrid"][number]>,
  getValue: (row: ICase["caseDetailsGrid"][number]) => number | string | null | undefined,
): ChartDataPoint[] =>
  rows.flatMap((row, index) => {
    const point = toChartDataPoint(getValue(row), row, index);
    return point ? [point] : [];
  });

const isCurrentOrFutureDailyPlanRow = (
  row: DailyPlanRow,
  currentJerusalemDateKey: string,
): boolean => {
  const dateKey = toNormalizedDate(row.date, row.dateTime);
  return dateKey.length > 0 && dateKey === currentJerusalemDateKey;
};

const compareDailyPlanRowsDesc = (
  left: DailyPlanRow,
  right: DailyPlanRow,
): number => {
  const leftDate = toNormalizedDate(left.date, left.dateTime);
  const rightDate = toNormalizedDate(right.date, right.dateTime);
  const dateCompare = rightDate.localeCompare(leftDate);

  if (dateCompare !== 0) {
    return dateCompare;
  }

  const leftTime = toNormalizedTime(left.time, left.dateTime);
  const rightTime = toNormalizedTime(right.time, right.dateTime);
  const timeCompare = rightTime.localeCompare(leftTime);

  if (timeCompare !== 0) {
    return timeCompare;
  }

  const leftIndex = Number.isFinite(Number(left.index)) ? Number(left.index) : 0;
  const rightIndex = Number.isFinite(Number(right.index)) ? Number(right.index) : 0;

  return rightIndex - leftIndex;
};

export const isPhotoStorageKey = (storageKey: string): boolean =>
  storageKey.startsWith(PATIENT_STORAGE.PHOTOS_PREFIX) || storageKey.startsWith("http");

export const toPhotoContentType = (storageKey: string): string => {
  const extension = path.extname(storageKey).toLowerCase();
  return (
    IMAGE_MIME_TYPE_BY_EXTENSION[
      extension as keyof typeof IMAGE_MIME_TYPE_BY_EXTENSION
    ] ?? DEFAULT_IMAGE_MIME_TYPE
  );
};

export const mapRelatedCasesToMasterCaseDetails = (
  relatedCases: ReadonlyArray<CaseWithPopulatedPatient>,
): MasterCaseDetailsItem[] =>
  relatedCases.map((relatedCase) => {
    const populatedPatient = toMasterCasePatient(relatedCase.patientId);
    const patientId = populatedPatient?._id
      ? String(populatedPatient._id)
      : undefined;

    return {
      caseId: relatedCase._id.toString(),
      patientName: populatedPatient?.name ?? "",
      patientPhotoName: toPatientPhotoUrl(
        patientId,
        populatedPatient?.photoName,
        populatedPatient?.updatedAt,
      ),
      createdAt:
        relatedCase.createdAt instanceof Date
          ? relatedCase.createdAt.toISOString()
          : null,
    };
  });

export const mapCaseToChartsDataResponse = (
  caseDoc: Pick<ICase, "caseDetailsGrid">,
): ChartsDataResponseDTO => {
  const rows = caseDoc.caseDetailsGrid ?? [];
  const temperature = toChartSeries(rows, (row) => row.temperature);
  const pulse = toChartSeries(rows, (row) => row.pulse);
  const respiration = toChartSeries(rows, (row) => row.respiration);
  const weight = toChartSeries(rows, (row) => row.weigh);
  const numericValues = [...temperature, ...pulse, ...respiration, ...weight].map(
    (point) => point.value,
  );

  const dataMin =
    numericValues.length === 0 ? 0 : Math.floor(Math.min(...numericValues));
  const dataMax =
    numericValues.length === 0 ? 100 : Math.ceil(Math.max(...numericValues));

  return {
    temperature,
    pulse,
    respiration,
    weight,
    dataMin,
    dataMax,
  };
};

export const mapCaseToDailyPlanDetail = (
  caseDoc: DailyPlanCase,
): DailyPlanDetailDTO => {
  const patient = isDailyPlanPopulatedPatient(caseDoc.patientId)
    ? caseDoc.patientId
    : undefined;
  const currentJerusalemDateKey = toJerusalemDateKey(new Date());
  const dailyPlanCommentsUpdatedDateKey =
    caseDoc.dailyPlan?.updatedAt instanceof Date
      ? toJerusalemDateKey(caseDoc.dailyPlan.updatedAt)
      : caseDoc.dailyPlan?.updatedAt
        ? toJerusalemDateKey(new Date(caseDoc.dailyPlan.updatedAt))
        : "";
  const filteredRows = [...(caseDoc.caseDetailsGrid ?? [])]
    .filter((row) => isCurrentOrFutureDailyPlanRow(row, currentJerusalemDateKey))
    .sort(compareDailyPlanRowsDesc);

  return {
    case_id: caseDoc._id.toString(),
    master_case_id: getCaseSerialPrefix(caseDoc.serialId) ?? caseDoc.serialId,
    serial_id: caseDoc.serialId,
    name: patient?.name ?? "",
    owner_name: patient?.owner?.name ?? "",
    owner_phone_number: patient?.owner?.phone ?? "",
    hospitalization_reason: caseDoc.admission?.hospitalizationReason ?? "",
    daily_plan_comments:
      dailyPlanCommentsUpdatedDateKey === currentJerusalemDateKey
        ? caseDoc.dailyPlan?.comments ?? ""
        : null,
    caseExaminations: filteredRows.flatMap((row) =>
      (row.examinations ?? [])
        .filter(
          (examination) =>
            examination.isRequired || toTrimmedString(examination.value) !== "",
        )
        .map((examination) => ({
          name: toPlannedRefName(examination.typeId),
          value: toTrimmedString(examination.value),
          date: toDailyPlanDisplayDate(row),
        })),
    ),
    caseProcedures: filteredRows.flatMap((row) =>
      (row.procedures ?? [])
        .filter((procedure) => procedure.isRequired || procedure.isGiven === true)
        .map((procedure) => ({
          name: toPlannedRefName(procedure.typeId),
          value: procedure.isGiven === true,
          date: toDailyPlanDisplayDate(row),
        })),
    ),
    ownerUpdate: filteredRows
      .filter(
        (row) => row.ownerUpdateIsRequired || toTrimmedString(row.ownerUpdate) !== "",
      )
      .map((row) => ({
        value: toTrimmedString(row.ownerUpdate),
        date: toDailyPlanDisplayDate(row),
      })),
    releaseMedicines: filteredRows
      .filter((row) => row.isReleaseIsRequired || row.isRelease === true)
      .map((row) => ({
        value: row.isRelease === true,
        date: toDailyPlanDisplayDate(row),
      })),
  };
};
