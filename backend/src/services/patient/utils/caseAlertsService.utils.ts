import { CASE_ALERT_FIELDS, CASE_ALERT_RULES, CASE_ALERTS_CONSTANTS } from "../../../constants/caseAlerts.constants.js";
import { toMapperIdString, toParsedDate } from "../../../mappers/common/common.mappers.utils.js";
import type {
  ICase,
  ICaseDetailsExamObj,
  ICaseDetailsMedicineObj,
  ICaseDetailsOptionsObj,
  ICaseDetailsRow,
} from "../../../models/case/index.js";
import type { IAnimalVitals } from "../../../models/lookups/index.js";
import type { IPatient } from "../../../models/patient/index.js";
import {
  ANIMAL_VITAL_TYPES,
  getLatestVitalRows,
  isValueInRange,
} from "../../../utils/animalVitals.utils.js";

type CasePatientRef = Partial<Pick<IPatient, "refs">>;

export type CaseAlertRule =
  (typeof CASE_ALERT_RULES)[keyof typeof CASE_ALERT_RULES];

export type CaseAlertField =
  (typeof CASE_ALERT_FIELDS)[keyof typeof CASE_ALERT_FIELDS];

export interface CaseAlert {
  rule: CaseAlertRule;
  field: CaseAlertField;
  rowId?: string;
  dateTime?: Date;
}

export interface CaseAlertSummary {
  total: number;
  alerts: ReadonlyArray<CaseAlert>;
}

export type CaseAlertEvaluable = Pick<
  ICase,
  "caseDetailsGrid" | "dates" | "refs"
> & {
  patientId?: string | CasePatientRef | null;
};

const toAlertCutoffDate = (now: Date = new Date()): Date =>
  new Date(now.getTime() - CASE_ALERTS_CONSTANTS.ALERT_WINDOW_MS);

const isMissingText = (value?: string | null): boolean =>
  typeof value !== "string" || value.trim().length === 0;

const toRowDateTime = (row: Pick<ICaseDetailsRow, "dateTime">): Date | null =>
  toParsedDate(row.dateTime);

const isRowInAlertWindow = (
  row: Pick<ICaseDetailsRow, "dateTime">,
  cutoff: Date,
): boolean => {
  const dateTime = toRowDateTime(row);
  return dateTime !== null && dateTime >= cutoff;
};

const toCaseAlert = (
  row: Pick<ICaseDetailsRow, "_id" | "dateTime"> | undefined,
  rule: CaseAlertRule,
  field: CaseAlertField,
): CaseAlert => ({
  rule,
  field,
  rowId: row?._id?.toString() ?? CASE_ALERTS_CONSTANTS.UNKNOWN_ROW_ID,
  dateTime: row ? (toRowDateTime(row) ?? undefined) : undefined,
});

const isRequiredMedicineMissing = (
  item: Pick<ICaseDetailsMedicineObj, "isEditable" | "isRequired" | "isGiven">,
): boolean =>
  item.isEditable === true &&
  item.isRequired === true &&
  item.isGiven !== true;

const isRequiredOptionMissing = (
  item: Pick<ICaseDetailsOptionsObj, "isEditable" | "isRequired" | "isGiven">,
): boolean =>
  item.isEditable === true &&
  item.isRequired === true &&
  item.isGiven !== true;

const isRequiredExamMissing = (
  item: Pick<ICaseDetailsExamObj, "isEditable" | "isRequired" | "value">,
): boolean =>
  item.isEditable === true &&
  item.isRequired === true &&
  isMissingText(item.value ?? null);

const toTimeZoneDateKey = (
  value: Date,
  timeZone: string,
): string => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(value);

  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const day = parts.find((part) => part.type === "day")?.value ?? "";

  return `${year}-${month}-${day}`;
};

const shouldTriggerCatheterReminder = (
  catheterDate?: Date | null,
  now: Date = new Date(),
): boolean => {
  const parsedCatheterDate = toParsedDate(catheterDate);
  if (!parsedCatheterDate) {
    return false;
  }

  const targetDate = new Date(now);
  targetDate.setDate(
    targetDate.getDate() - CASE_ALERTS_CONSTANTS.CATHETER_REMINDER_DAYS,
  );

  return (
    toTimeZoneDateKey(parsedCatheterDate, CASE_ALERTS_CONSTANTS.TIME_ZONE) ===
    toTimeZoneDateKey(targetDate, CASE_ALERTS_CONSTANTS.TIME_ZONE)
  );
};

const resolveAnimalTypeId = (caseDoc: CaseAlertEvaluable): string => {
  const caseAnimalTypeId = toMapperIdString(caseDoc.refs?.animalTypeId);
  if (caseAnimalTypeId) {
    return caseAnimalTypeId;
  }

  if (
    typeof caseDoc.patientId === "object" &&
    caseDoc.patientId !== null &&
    "refs" in caseDoc.patientId
  ) {
    return toMapperIdString(caseDoc.patientId.refs?.animalTypeId);
  }

  return "";
};

const collectRowAlerts = (
  row: ICaseDetailsRow,
  alerts: CaseAlert[],
): void => {
  row.fluids.forEach((item) => {
    if (isRequiredMedicineMissing(item)) {
      alerts.push(
        toCaseAlert(
          row,
          CASE_ALERT_RULES.REQUIRED_MEDICATION_MISSING,
          CASE_ALERT_FIELDS.FLUID,
        ),
      );
    }
  });

  row.medicines.forEach((item) => {
    if (isRequiredMedicineMissing(item)) {
      alerts.push(
        toCaseAlert(
          row,
          CASE_ALERT_RULES.REQUIRED_MEDICATION_MISSING,
          CASE_ALERT_FIELDS.MEDICINE,
        ),
      );
    }
  });

  row.examinations.forEach((item) => {
    if (isRequiredExamMissing(item)) {
      alerts.push(
        toCaseAlert(
          row,
          CASE_ALERT_RULES.REQUIRED_EXAMINATION_MISSING,
          CASE_ALERT_FIELDS.EXAMINATION,
        ),
      );
    }
  });

  row.foodExtras.forEach((item) => {
    if (isRequiredOptionMissing(item)) {
      alerts.push(
        toCaseAlert(
          row,
          CASE_ALERT_RULES.REQUIRED_FOOD_EXTRA_MISSING,
          CASE_ALERT_FIELDS.FOOD_EXTRA,
        ),
      );
    }
  });

  if (
    row.temperatureIsEditable === true &&
    row.temperatureIsRequired === true &&
    row.temperature == null
  ) {
    alerts.push(
      toCaseAlert(
        row,
        CASE_ALERT_RULES.REQUIRED_FIELD_MISSING,
        CASE_ALERT_FIELDS.TEMPERATURE,
      ),
    );
  }

  if (
    row.pulseIsEditable === true &&
    row.pulseIsRequired === true &&
    row.pulse == null
  ) {
    alerts.push(
      toCaseAlert(
        row,
        CASE_ALERT_RULES.REQUIRED_FIELD_MISSING,
        CASE_ALERT_FIELDS.PULSE,
      ),
    );
  }

  if (
    row.respirationIsEditable === true &&
    row.respirationIsRequired === true &&
    row.respiration == null
  ) {
    alerts.push(
      toCaseAlert(
        row,
        CASE_ALERT_RULES.REQUIRED_FIELD_MISSING,
        CASE_ALERT_FIELDS.RESPIRATION,
      ),
    );
  }

  if (
    row.urineIsEditable === true &&
    row.urineIsRequired === true &&
    row.urineTypeId == null
  ) {
    alerts.push(
      toCaseAlert(
        row,
        CASE_ALERT_RULES.REQUIRED_FIELD_MISSING,
        CASE_ALERT_FIELDS.URINE_TYPE_ID,
      ),
    );
  }

  if (
    row.fecesIsEditable === true &&
    row.fecesIsRequired === true &&
    row.fecesTypeId == null
  ) {
    alerts.push(
      toCaseAlert(
        row,
        CASE_ALERT_RULES.REQUIRED_FIELD_MISSING,
        CASE_ALERT_FIELDS.FECES_TYPE_ID,
      ),
    );
  }

  if (
    row.isBoxCleanIsEditable === true &&
    row.isBoxCleanIsRequired === true &&
    row.isBoxClean == null
  ) {
    alerts.push(
      toCaseAlert(
        row,
        CASE_ALERT_RULES.REQUIRED_FIELD_MISSING,
        CASE_ALERT_FIELDS.IS_BOX_CLEAN,
      ),
    );
  }

  if (
    row.isReleaseIsEditable === true &&
    row.isReleaseIsRequired === true &&
    row.isRelease == null
  ) {
    alerts.push(
      toCaseAlert(
        row,
        CASE_ALERT_RULES.REQUIRED_FIELD_MISSING,
        CASE_ALERT_FIELDS.IS_RELEASE,
      ),
    );
  }

  if (
    row.isTravelIsEditable === true &&
    row.isTravelIsRequired === true &&
    row.isTravel == null
  ) {
    alerts.push(
      toCaseAlert(
        row,
        CASE_ALERT_RULES.REQUIRED_FIELD_MISSING,
        CASE_ALERT_FIELDS.IS_TRAVEL,
      ),
    );
  }

  if (
    row.pukeIsEditable === true &&
    row.pukeIsRequired === true &&
    row.isPuke == null
  ) {
    alerts.push(
      toCaseAlert(
        row,
        CASE_ALERT_RULES.REQUIRED_FIELD_MISSING,
        CASE_ALERT_FIELDS.IS_PUKE,
      ),
    );
  }

  if (
    row.weighIsEditable === true &&
    row.weighIsRequired === true &&
    row.weigh == null
  ) {
    alerts.push(
      toCaseAlert(
        row,
        CASE_ALERT_RULES.REQUIRED_FIELD_MISSING,
        CASE_ALERT_FIELDS.WEIGH,
      ),
    );
  }

  if (
    row.foodAndWaterIsEditable === true &&
    row.foodAndWaterIsRequired === true &&
    isMissingText(row.foodAndWater)
  ) {
    alerts.push(
      toCaseAlert(
        row,
        CASE_ALERT_RULES.REQUIRED_FIELD_MISSING,
        CASE_ALERT_FIELDS.FOOD_AND_WATER,
      ),
    );
  }

  if (
    row.ownerUpdateIsEditable === true &&
    row.ownerUpdateIsRequired === true &&
    isMissingText(row.ownerUpdate)
  ) {
    alerts.push(
      toCaseAlert(
        row,
        CASE_ALERT_RULES.REQUIRED_FIELD_MISSING,
        CASE_ALERT_FIELDS.OWNER_UPDATE,
      ),
    );
  }

  if (
    row.rowCommentsIsEditable === true &&
    row.rowCommentsIsRequired === true &&
    isMissingText(row.rowComments)
  ) {
    alerts.push(
      toCaseAlert(
        row,
        CASE_ALERT_RULES.REQUIRED_FIELD_MISSING,
        CASE_ALERT_FIELDS.ROW_COMMENTS,
      ),
    );
  }
};

const collectVitalRangeAlerts = (
  rows: ReadonlyArray<ICaseDetailsRow>,
  cutoff: Date,
  vitalsMap: Record<string, IAnimalVitals>,
  alerts: CaseAlert[],
): void => {
  const latestVitals = getLatestVitalRows(rows);

  if (
    latestVitals.TRow &&
    isRowInAlertWindow(latestVitals.TRow, cutoff) &&
    vitalsMap[ANIMAL_VITAL_TYPES.TEMPERATURE] &&
    !isValueInRange(
      latestVitals.TRow.temperature,
      vitalsMap[ANIMAL_VITAL_TYPES.TEMPERATURE].rangeMin,
      vitalsMap[ANIMAL_VITAL_TYPES.TEMPERATURE].rangeMax,
    )
  ) {
    alerts.push(
      toCaseAlert(
        latestVitals.TRow,
        CASE_ALERT_RULES.VITAL_OUT_OF_RANGE,
        CASE_ALERT_FIELDS.TEMPERATURE,
      ),
    );
  }

  if (
    latestVitals.PRow &&
    isRowInAlertWindow(latestVitals.PRow, cutoff) &&
    vitalsMap[ANIMAL_VITAL_TYPES.PULSE] &&
    !isValueInRange(
      latestVitals.PRow.pulse,
      vitalsMap[ANIMAL_VITAL_TYPES.PULSE].rangeMin,
      vitalsMap[ANIMAL_VITAL_TYPES.PULSE].rangeMax,
    )
  ) {
    alerts.push(
      toCaseAlert(
        latestVitals.PRow,
        CASE_ALERT_RULES.VITAL_OUT_OF_RANGE,
        CASE_ALERT_FIELDS.PULSE,
      ),
    );
  }

  if (
    latestVitals.RRow &&
    isRowInAlertWindow(latestVitals.RRow, cutoff) &&
    vitalsMap[ANIMAL_VITAL_TYPES.RESPIRATION] &&
    !isValueInRange(
      latestVitals.RRow.respiration,
      vitalsMap[ANIMAL_VITAL_TYPES.RESPIRATION].rangeMin,
      vitalsMap[ANIMAL_VITAL_TYPES.RESPIRATION].rangeMax,
    )
  ) {
    alerts.push(
      toCaseAlert(
        latestVitals.RRow,
        CASE_ALERT_RULES.VITAL_OUT_OF_RANGE,
        CASE_ALERT_FIELDS.RESPIRATION,
      ),
    );
  }
};

export const buildCaseAlertSummary = (
  caseDoc: CaseAlertEvaluable,
  vitalsMap: Record<string, IAnimalVitals>,
  now: Date = new Date(),
): CaseAlertSummary => {
  const alerts: CaseAlert[] = [];
  const cutoff = toAlertCutoffDate(now);
  const caseRows = caseDoc.caseDetailsGrid ?? [];

  caseRows.forEach((row) => {
    if (isRowInAlertWindow(row, cutoff)) {
      collectRowAlerts(row, alerts);
    }
  });

  collectVitalRangeAlerts(caseRows, cutoff, vitalsMap, alerts);

  if (shouldTriggerCatheterReminder(caseDoc.dates?.catheterDate, now)) {
    alerts.push({
      rule: CASE_ALERT_RULES.CATHETER_REMINDER,
      field: CASE_ALERT_FIELDS.CATHETER_DATE,
      rowId: CASE_ALERTS_CONSTANTS.UNKNOWN_ROW_ID,
      dateTime: toParsedDate(caseDoc.dates?.catheterDate) ?? undefined,
    });
  }

  return {
    total: alerts.length,
    alerts,
  };
};

export const getCaseAnimalTypeId = (
  caseDoc: CaseAlertEvaluable,
): string => resolveAnimalTypeId(caseDoc);
