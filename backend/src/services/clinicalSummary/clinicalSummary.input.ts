import type { ClinicalSummaryInput } from "./clinicalSummary.types.js";
import {
  CLINICAL_SUMMARY_LIMITS,
  CLINICAL_SUMMARY_TIME_ZONE,
} from "./clinicalSummary.constants.js";

type UnknownRecord = Record<string, unknown>;

const asRecord = (value: unknown): UnknownRecord =>
  value !== null && typeof value === "object" ? (value as UnknownRecord) : {};
const asArray = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : [];
const asText = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim()
    ? value.trim().slice(0, CLINICAL_SUMMARY_LIMITS.noteCharacters)
    : undefined;
const asNumber = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;
const iso = (value: unknown): string | undefined => {
  const date =
    value instanceof Date
      ? value
      : typeof value === "string"
        ? new Date(value)
        : null;
  return date && !Number.isNaN(date.getTime()) ? date.toISOString() : undefined;
};
export const toJerusalemDateTime = (value: unknown): string | undefined => {
  const date =
    value instanceof Date
      ? value
      : typeof value === "string"
        ? new Date(value)
        : null;
  if (!date || Number.isNaN(date.getTime())) return undefined;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CLINICAL_SUMMARY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")} ${part("hour")}:${part("minute")}:${part("second")}`;
};

export const toClinicalDisplayDate = (value: unknown): string | undefined => {
  const dateTime = toJerusalemDateTime(value);
  if (!dateTime) return undefined;

  const [date] = dateTime.split(" ");
  const [year, month, day] = date.split("-");
  return year && month && day ? `${day}/${month}/${year}` : undefined;
};
const populatedName = (value: unknown): string | undefined =>
  asText(asRecord(value).name);
const unique = (values: Array<string | undefined>): string[] => [
  ...new Set(values.filter((v): v is string => Boolean(v))),
];

const sanitizeRecursively = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(sanitizeRecursively);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as UnknownRecord)
      .filter(
        ([key]) =>
          !/(^_?id$|Id$|owner|phone|email|address|photo|document|url|token|secret|password|billing|payment|audit)/i.test(
            key,
          ),
      )
      .map(([key, child]) => [key, sanitizeRecursively(child)]),
  );
};

const rowTimestamp = (row: UnknownRecord): string =>
  asText(row.date) && asText(row.time)
    ? // date/time are the clinician-entered Jerusalem wall-clock values. Prefer them over
      // dateTime, whose historical value may have been created in a UTC Railway process.
      `${asText(row.date)} ${asText(row.time)}:00`
    : (toJerusalemDateTime(row.dateTime) ??
      `${asText(row.date) ?? ""} ${asText(row.time) ?? "00:00"}`);

export const getClinicalSummaryDates = (rawCase: unknown): string[] => {
  const caseRecord = asRecord(rawCase);
  return unique(
    asArray(caseRecord.caseDetailsGrid).map((row) =>
      asText(asRecord(row).date),
    ),
  ).sort((left, right) => right.localeCompare(left));
};

export type ClinicalCaseDetailItem = {
  category:
    "medicine" | "fluid" | "procedure" | "examination" | "food_extra" | "care";
  name: string;
  scheduledAt: string;
  status: "received" | "not_received_yet" | "recorded";
  value?: string;
  dosage?: string;
  route?: string;
  frequency?: string;
  comment?: string;
};

export const buildClinicalCaseDetailItems = (
  rawCase: unknown,
  selectedDate: string,
): ClinicalCaseDetailItem[] => {
  const rows = asArray(asRecord(rawCase).caseDetailsGrid)
    .map(asRecord)
    .filter((row) => asText(row.date) === selectedDate)
    .sort((left, right) =>
      rowTimestamp(left).localeCompare(rowTimestamp(right)),
    );
  const items: ClinicalCaseDetailItem[] = [];
  const addTickedItems = (
    row: UnknownRecord,
    values: unknown,
    category: "medicine" | "fluid" | "procedure" | "food_extra",
    referenceKey: "medicineId" | "typeId",
  ) => {
    for (const rawItem of asArray(values)) {
      const item = asRecord(rawItem);
      const isCompleted = item.isGiven === true;
      const isOpenAndRequired = item.isRequired === true && !isCompleted;
      if (!isCompleted && !isOpenAndRequired) continue;
      const name = populatedName(item[referenceKey]);
      if (!name) continue;
      const dosage =
        asText(item.dosageText) ??
        (item.doseAmount !== undefined
          ? [String(item.doseAmount), populatedName(item.measureUnitTypeId)]
              .filter(Boolean)
              .join(" ")
          : undefined);
      items.push({
        category,
        name,
        scheduledAt: rowTimestamp(row),
        status: isCompleted ? "received" : "not_received_yet",
        ...(dosage ? { dosage } : {}),
        ...(populatedName(item.routeOfAdministrationId)
          ? { route: populatedName(item.routeOfAdministrationId) }
          : {}),
        ...(populatedName(item.dosageFrequencyId)
          ? { frequency: populatedName(item.dosageFrequencyId) }
          : {}),
        ...(asText(item.comment) ? { comment: asText(item.comment) } : {}),
      });
    }
  };

  for (const row of rows) {
    addTickedItems(row, row.medicines, "medicine", "medicineId");
    addTickedItems(row, row.fluids, "fluid", "medicineId");
    addTickedItems(row, row.procedures, "procedure", "typeId");
    addTickedItems(row, row.foodExtras, "food_extra", "typeId");
    for (const rawExam of asArray(row.examinations)) {
      const exam = asRecord(rawExam);
      const name = populatedName(exam.typeId);
      const value = asText(exam.value);
      const comment = asText(exam.comment);
      const hasRecordedData = Boolean(value || comment);
      if (name && (hasRecordedData || exam.isRequired === true))
        items.push({
          category: "examination",
          name,
          scheduledAt: rowTimestamp(row),
          status: hasRecordedData ? "recorded" : "not_received_yet",
          ...(value ? { value } : {}),
          ...(comment ? { comment } : {}),
        });
    }
    const addCare = (
      name: string,
      value: unknown,
      comment?: unknown,
      isRequired?: unknown,
    ) => {
      const hasValue = value !== undefined && value !== null && value !== "";
      const recordedComment = asText(comment);
      const hasRecordedData = hasValue || Boolean(recordedComment);
      if (!hasRecordedData && isRequired !== true) return;
      items.push({
        category: "care",
        name,
        scheduledAt: rowTimestamp(row),
        status: hasRecordedData ? "recorded" : "not_received_yet",
        ...(hasValue ? { value: String(value) } : {}),
        ...(recordedComment ? { comment: recordedComment } : {}),
      });
    };
    const addTickedCare = (
      name: string,
      value: unknown,
      isRequired?: unknown,
    ) => {
      const isRecorded = value === true;
      if (!isRecorded && isRequired !== true) return;
      items.push({
        category: "care",
        name,
        scheduledAt: rowTimestamp(row),
        status: isRecorded ? "recorded" : "not_received_yet",
      });
    };
    addCare("טמפרטורה", row.temperature, undefined, row.temperatureIsRequired);
    addCare("דופק", row.pulse, undefined, row.pulseIsRequired);
    addCare("נשימות", row.respiration, undefined, row.respirationIsRequired);
    addCare("משקל", row.weigh, undefined, row.weighIsRequired);
    addCare(
      "שתן",
      populatedName(row.urineTypeId),
      row.urineComments,
      row.urineIsRequired,
    );
    addCare(
      "צואה",
      populatedName(row.fecesTypeId),
      row.fecesComments,
      row.fecesIsRequired,
    );
    addCare(
      "מזון ומים",
      row.foodAndWater,
      undefined,
      row.foodAndWaterIsRequired,
    );
    addTickedCare("אוכל", row.foodGiven);
    addTickedCare("מים", row.waterGiven);
    addTickedCare("ניקוי תא", row.isBoxClean, row.isBoxCleanIsRequired);
    addTickedCare("יציאה לטיול", row.isTravel, row.isTravelIsRequired);
    addTickedCare("שחרור", row.isRelease, row.isReleaseIsRequired);
    addCare(
      "הקאה",
      row.isPuke === true ? "כן" : undefined,
      row.pukeComments,
      row.pukeIsRequired,
    );
    addCare("הערת שורה", row.rowComments, undefined, row.rowCommentsIsRequired);
    addCare("עדכון", row.ownerUpdate, undefined, row.ownerUpdateIsRequired);
  }
  return items;
};

export const buildClinicalSummaryInput = (
  rawCase: unknown,
  selectedDate?: string,
): ClinicalSummaryInput => {
  const caseRecord = asRecord(rawCase);
  const refs = asRecord(caseRecord.refs);
  const snapshot = asRecord(caseRecord.patientSnapshot);
  const admission = asRecord(caseRecord.admission);
  const flags = asRecord(caseRecord.flags);
  const rows = asArray(caseRecord.caseDetailsGrid)
    .map(asRecord)
    .filter((row) => !selectedDate || asText(row.date) === selectedDate)
    .sort((a, b) => rowTimestamp(b).localeCompare(rowTimestamp(a)));
  let inputWasTruncated = false;

  const observations = unique(
    rows.flatMap((row) => [
      asText(row.rowComments),
      asText(row.urineComments),
      asText(row.fecesComments),
      asText(row.pukeComments),
      asText(row.foodAndWater),
    ]),
  );
  if (observations.length > CLINICAL_SUMMARY_LIMITS.recentObservations)
    inputWasTruncated = true;

  const examinations = rows
    .flatMap((row) =>
      asArray(row.examinations).map((exam) => {
        const record = asRecord(exam);
        const name = populatedName(record.typeId);
        const value = asText(record.value);
        return name && value
          ? `${rowTimestamp(row)} — ${name}: ${value}`
          : undefined;
      }),
    )
    .filter((v): v is string => Boolean(v));

  const vitalSigns = rows
    .map((row) => ({
      recordedAt: rowTimestamp(row),
      ...(asNumber(row.temperature) !== undefined
        ? { temperatureC: asNumber(row.temperature) }
        : {}),
      ...(asNumber(row.pulse) !== undefined
        ? { heartRate: asNumber(row.pulse) }
        : {}),
      ...(asNumber(row.respiration) !== undefined
        ? { respiratoryRate: asNumber(row.respiration) }
        : {}),
    }))
    .filter((vital) => Object.keys(vital).length > 1);
  if (vitalSigns.length > CLINICAL_SUMMARY_LIMITS.recentVitals)
    inputWasTruncated = true;

  const treatmentByName = new Map<
    string,
    ClinicalSummaryInput["treatments"][number]
  >();
  for (const row of rows) {
    for (const item of [...asArray(row.medicines), ...asArray(row.fluids)]) {
      const treatment = asRecord(item);
      if (treatment.isGiven !== true && treatment.isRequired !== true) continue;
      const name = populatedName(treatment.medicineId);
      if (!name || treatmentByName.has(name)) continue;
      const dosage =
        asText(treatment.dosageText) ??
        (treatment.doseAmount !== undefined
          ? [
              String(treatment.doseAmount),
              populatedName(treatment.measureUnitTypeId),
            ]
              .filter(Boolean)
              .join(" ")
          : undefined);
      treatmentByName.set(name, {
        name,
        ...(dosage ? { dosage } : {}),
        ...(populatedName(treatment.routeOfAdministrationId)
          ? { route: populatedName(treatment.routeOfAdministrationId) }
          : {}),
        ...(populatedName(treatment.dosageFrequencyId)
          ? { frequency: populatedName(treatment.dosageFrequencyId) }
          : {}),
        administrationStatus:
          treatment.isGiven === true ? "received" : "not_received_yet",
        scheduledAt: rowTimestamp(row),
      });
    }
  }

  const otherAlerts = unique([
    flags.isEscapePotential === true ? "פוטנציאל בריחה" : undefined,
    flags.isNPO === true ? "בצום (NPO)" : undefined,
    flags.isHeartMurmur === true ? "אוושה לבבית" : undefined,
    flags.isAggressive === true ? "התנהגות אגרסיבית" : undefined,
    flags.isAMB === true ? "AMB מסומן ברשומה" : undefined,
    flags.isCerenia === true ? "Cerenia מסומן ברשומה" : undefined,
    flags.isConvenia === true ? "Convenia מסומן ברשומה" : undefined,
  ]);
  const allergy =
    flags.isAllergic === true
      ? (asText(admission.allergicComments) ?? "אלרגיה מסומנת ברשומה ללא פירוט")
      : undefined;
  const admissionDate = toClinicalDisplayDate(caseRecord.createdAt);

  const input: ClinicalSummaryInput = {
    patient: {
      ...(populatedName(refs.animalTypeId)
        ? { species: populatedName(refs.animalTypeId) }
        : {}),
      ...(populatedName(refs.raceTypeId)
        ? { breed: populatedName(refs.raceTypeId) }
        : {}),
      ...(snapshot.ageYears !== undefined || snapshot.ageMonths !== undefined
        ? {
            age: `${asNumber(snapshot.ageYears) ?? 0} שנים, ${asNumber(snapshot.ageMonths) ?? 0} חודשים`,
          }
        : {}),
      ...(populatedName(refs.genderTypeId)
        ? { sex: populatedName(refs.genderTypeId) }
        : {}),
      ...(asNumber(snapshot.weightKg) !== undefined
        ? { weightKg: asNumber(snapshot.weightKg) }
        : {}),
    },
    hospitalization: {
      ...(admissionDate ? { admittedAt: admissionDate } : {}),
      ...(asText(admission.hospitalizationReason)
        ? { reason: asText(admission.hospitalizationReason) }
        : {}),
      ...(asText(caseRecord.comments)
        ? { relevantBackground: [asText(caseRecord.comments)!] }
        : {}),
    },
    currentStatus: {
      ...(observations.length
        ? {
            observations: observations.slice(
              0,
              CLINICAL_SUMMARY_LIMITS.recentObservations,
            ),
          }
        : {}),
      ...(examinations[0] ? { latestExamination: examinations[0] } : {}),
    },
    vitalSigns: vitalSigns.slice(0, CLINICAL_SUMMARY_LIMITS.recentVitals),
    treatments: [...treatmentByName.values()],
    alerts: {
      ...(allergy ? { allergies: [allergy] } : {}),
      ...(flags.isRiskAnesthesia === true
        ? { anesthesiaRisks: ["סיכון הרדמה מסומן ברשומה"] }
        : {}),
      ...(otherAlerts.length ? { other: otherAlerts } : {}),
    },
    pendingItems: unique([
      asText(asRecord(caseRecord.dailyPlan).comments),
      toJerusalemDateTime(asRecord(caseRecord.dates).nextInspectionDate)
        ? `ביקורת: ${toJerusalemDateTime(asRecord(caseRecord.dates).nextInspectionDate)}`
        : undefined,
      toJerusalemDateTime(asRecord(caseRecord.dates).stitchesRemovalDate)
        ? `הסרת תפרים: ${toJerusalemDateTime(asRecord(caseRecord.dates).stitchesRemovalDate)}`
        : undefined,
    ]),
    sourceMetadata: {
      recordUpdatedAt: iso(caseRecord.updatedAt) ?? new Date(0).toISOString(),
      inputWasTruncated,
    },
  };

  // The response schema allows 20 medicine lines. Reject rather than silently omit a medicine.
  if (input.treatments.length > 20) {
    throw new Error("CLINICAL_SUMMARY_INPUT_TOO_LARGE");
  }

  // Deterministically remove older, low-priority narrative before protected data.
  while (
    JSON.stringify(input).length >
      CLINICAL_SUMMARY_LIMITS.inputJsonCharacters &&
    (input.currentStatus.observations?.length ?? 0) > 1
  ) {
    input.currentStatus.observations?.pop();
    input.sourceMetadata.inputWasTruncated = true;
  }
  while (
    JSON.stringify(input).length >
      CLINICAL_SUMMARY_LIMITS.inputJsonCharacters &&
    input.vitalSigns.length > 1
  ) {
    input.vitalSigns.pop();
    input.sourceMetadata.inputWasTruncated = true;
  }
  const sanitized = sanitizeRecursively(input) as ClinicalSummaryInput;
  if (
    JSON.stringify(sanitized).length >
    CLINICAL_SUMMARY_LIMITS.inputJsonCharacters
  ) {
    throw new Error("CLINICAL_SUMMARY_INPUT_TOO_LARGE");
  }
  return sanitized;
};

export const hasClinicalSummaryContent = (
  input: ClinicalSummaryInput,
): boolean =>
  Boolean(
    input.hospitalization.reason ||
    input.hospitalization.relevantBackground?.length ||
    input.currentStatus.latestExamination ||
    input.currentStatus.observations?.length ||
    input.vitalSigns.length ||
    input.treatments.length ||
    input.alerts.allergies?.length ||
    input.alerts.anesthesiaRisks?.length ||
    input.alerts.other?.length,
  );
