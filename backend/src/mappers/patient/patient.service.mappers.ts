import path from "node:path";
import type { Types } from "mongoose";
import type { ICase } from "@models/Case";
import { PATIENT_STORAGE } from "@constants/patient.constants";
import type {
  CaseDetailsResponseDTO,
  ChartsDataResponseDTO,
  DailyPlanDetailDTO,
} from "@petec/shared";
import { toPatientPhotoUrl } from "@utils/patientPhoto.utils";
import { toMapperNamedReference } from "@mappers/common/common.mappers.utils";
import type {
  CaseWithPopulatedPatient,
  ChartDataPoint,
  DailyPlanPopulatedPatient,
} from "@app-types/patient.types";
import {
  PATIENT_CHART_SERIES_KEYS,
  PATIENT_IMAGE_CONTENT_TYPE_BY_EXTENSION,
  PATIENT_MAPPER_DEFAULTS,
  PATIENT_MAPPER_OBJECT_KEYS,
  PATIENT_PROCEDURE_STATUS,
  type PatientChartSeriesKey,
} from "./patient.mapper.constants";

type MasterCaseDetailsItem = CaseDetailsResponseDTO["masterCaseDetails"][number];

type NamedRefLike = {
  _id?: string | number | Types.ObjectId;
  name?: string;
};

type PlannedExaminationLike = ICase["planned"]["examinations"][number] & {
  examinationTypeId?: ICase["planned"]["examinations"][number]["examinationTypeId"] | NamedRefLike;
};

type PlannedProcedureLike = ICase["planned"]["procedures"][number] & {
  procedureTypeId?: ICase["planned"]["procedures"][number]["procedureTypeId"] | NamedRefLike;
};

type DailyPlanCaseLike = Pick<
  ICase,
  | "_id"
  | "masterCaseId"
  | "serialId"
  | "admission"
  | "dailyPlan"
  | "planned"
  | "patientId"
> & {
  patientId?: ICase["patientId"] | DailyPlanPopulatedPatient;
  planned?: {
    examinations?: PlannedExaminationLike[];
    procedures?: PlannedProcedureLike[];
  };
};

type MasterCasePatientLike = {
  _id: string | number | Types.ObjectId;
  name?: string;
  photoName?: string;
  updatedAt?: Date | string;
};

type ChartGridPoint = {
  pulse?: number;
  rr?: number;
  temp?: number;
  time: string;
};

const EMPTY_CHART_POINTS: ChartGridPoint[] = [
  { pulse: undefined, rr: undefined, temp: undefined, time: "" },
  { pulse: undefined, rr: undefined, temp: undefined, time: "" },
];

const toFiniteNumber = (
  value?: number | string | null,
): number | undefined => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" &&
  value !== null &&
  !Array.isArray(value);

const isObjectIdLike = (value: unknown): value is Types.ObjectId =>
  isPlainObject(value) &&
  PATIENT_MAPPER_OBJECT_KEYS.TO_HEX_STRING in value &&
  typeof value[PATIENT_MAPPER_OBJECT_KEYS.TO_HEX_STRING] === "function";

const toMasterCasePatient = (
  value: CaseWithPopulatedPatient["patientId"],
): MasterCasePatientLike | undefined => {
  if (!isPlainObject(value) || isObjectIdLike(value)) {
    return undefined;
  }
  if (!(PATIENT_MAPPER_OBJECT_KEYS.ID in value)) {
    return undefined;
  }

  const candidate = value as {
    _id: string | number | Types.ObjectId;
    name?: unknown;
    photoName?: unknown;
    updatedAt?: unknown;
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

const toChartSeries = (
  points: ReadonlyArray<ChartGridPoint>,
  key: PatientChartSeriesKey,
): ChartDataPoint[] =>
  points
    .filter((point) => point[key] !== undefined)
    .map((point) => ({ name: point.time, value: point[key] as number }));

const toPlannedRefName = (value?: NamedRefLike | Types.ObjectId): string => {
  const refInfo = toMapperNamedReference(value);
  return refInfo.name || refInfo.id;
};

export const isPhotoStorageKey = (storageKey: string): boolean =>
  storageKey.startsWith(PATIENT_STORAGE.PHOTOS_PREFIX) ||
  storageKey.startsWith(PATIENT_STORAGE.LEGACY_PHOTOS_PREFIX);

export const toPhotoContentType = (storageKey: string): string => {
  const extension = path.extname(storageKey).toLowerCase();
  return (
    PATIENT_IMAGE_CONTENT_TYPE_BY_EXTENSION[extension as keyof typeof PATIENT_IMAGE_CONTENT_TYPE_BY_EXTENSION] ??
    PATIENT_MAPPER_DEFAULTS.DEFAULT_IMAGE_CONTENT_TYPE
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
  caseDoc: Pick<ICase, "caseDetailsGrid" | "patientSnapshot">,
): ChartsDataResponseDTO => {
  const chartPoints = (caseDoc.caseDetailsGrid ?? [])
    .map((row, index) => ({
      pulse: toFiniteNumber(row.pulse),
      rr: toFiniteNumber(row.respiration),
      temp: toFiniteNumber(row.temperature),
      time:
        row.time ||
        `${PATIENT_MAPPER_DEFAULTS.CHART_POINT_LABEL_PREFIX}${index + 1}`,
    }))
    .filter(
      (row) =>
        row.pulse !== undefined ||
        row.rr !== undefined ||
        row.temp !== undefined,
    );

  const pointsForSeries = chartPoints.length === 0 ? EMPTY_CHART_POINTS : chartPoints;
  const numericValues = chartPoints
    .flatMap((point) => [point.pulse, point.rr, point.temp])
    .filter((value): value is number => value !== undefined);

  const dataMin =
    numericValues.length === 0 ? 0 : Math.floor(Math.min(...numericValues));
  const dataMax =
    numericValues.length === 0 ? 100 : Math.ceil(Math.max(...numericValues));

  const weight =
    typeof caseDoc.patientSnapshot?.weightKg === "number"
      ? [
        {
          name: PATIENT_MAPPER_DEFAULTS.WEIGHT_SERIES_NAME,
          value: caseDoc.patientSnapshot.weightKg,
        },
      ]
      : [];

  return {
    temperature: toChartSeries(pointsForSeries, PATIENT_CHART_SERIES_KEYS.TEMP),
    pulse: toChartSeries(pointsForSeries, PATIENT_CHART_SERIES_KEYS.PULSE),
    respiration: toChartSeries(
      pointsForSeries,
      PATIENT_CHART_SERIES_KEYS.RESPIRATION,
    ),
    weight,
    dataMin,
    dataMax,
  };
};

export const mapCaseToDailyPlanDetail = (
  caseDoc: DailyPlanCaseLike,
): DailyPlanDetailDTO => {
  const patient = isDailyPlanPopulatedPatient(caseDoc.patientId)
    ? caseDoc.patientId
    : undefined;
  const plannedExaminations = caseDoc.planned?.examinations ?? [];
  const plannedProcedures = caseDoc.planned?.procedures ?? [];

  return {
    case_id: caseDoc._id.toString(),
    master_case_id: caseDoc.masterCaseId?.toString() ?? caseDoc._id.toString(),
    serial_id: caseDoc.serialId,
    name: patient?.name ?? "",
    owner_name: patient?.owner?.name ?? "",
    owner_phone_number: patient?.owner?.phone ?? "",
    hospitalization_reason: caseDoc.admission?.hospitalizationReason ?? "",
    daily_plan_comments: caseDoc.dailyPlan?.comments ?? "",
    caseExaminations: plannedExaminations.map((exam) => ({
      name: toPlannedRefName(exam.examinationTypeId),
      value: exam.status ?? "",
      date: exam.scheduledFor ? exam.scheduledFor.toISOString() : "",
    })),
    caseProcedures: plannedProcedures.map((procedure) => ({
      name:
        procedure.plannedProcedureText ||
        toPlannedRefName(procedure.procedureTypeId),
      value: procedure.status === PATIENT_PROCEDURE_STATUS.DONE,
      date: procedure.scheduledFor ? procedure.scheduledFor.toISOString() : "",
    })),
    ownerUpdate: [],
    releaseMedicines: [],
  };
};
