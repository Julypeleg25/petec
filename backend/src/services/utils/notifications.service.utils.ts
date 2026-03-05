import type { CaseDocument, ICaseDetailsRow } from "@models/Case";

export const NOTIFICATIONS_CONSTANTS = {
  MODULE: "notifications",
  ALERT_WINDOW_MS: 12 * 60 * 60 * 1000,
  UNKNOWN_ROW_ID: "unknown",
} as const;

export interface VitalAlert {
  caseSerialId: string;
  patientName: string;
  rowId: string;
  field: string;
  message: string;
  dateTime: Date;
}

export const toAlertCutoffDate = (): Date =>
  new Date(Date.now() - NOTIFICATIONS_CONSTANTS.ALERT_WINDOW_MS);

export const getCasePatientName = (
  caseDoc: CaseDocument & { patientId?: { name?: string } },
): string =>
  typeof caseDoc.patientId === "object" &&
  caseDoc.patientId !== null &&
  "name" in caseDoc.patientId
    ? caseDoc.patientId.name ?? ""
    : "";

export const getRecentCaseDetailRows = (
  rows: ReadonlyArray<ICaseDetailsRow>,
  cutoff: Date,
): ICaseDetailsRow[] =>
  rows.filter(
    (row) => row.dateTime && new Date(row.dateTime) >= cutoff,
  );

export const checkCaseDetailRowForAlerts = (
  row: ICaseDetailsRow,
  caseSerialId: string,
  patientName: string,
): VitalAlert[] => {
  const alerts: VitalAlert[] = [];
  const rowId = row._id?.toString() ?? NOTIFICATIONS_CONSTANTS.UNKNOWN_ROW_ID;

  if (row.temperatureIsRequired && row.temperatureIsEditable && row.temperature == null) {
    alerts.push({
      caseSerialId,
      patientName,
      rowId,
      field: "temperature",
      message: "Missing temperature reading",
      dateTime: row.dateTime,
    });
  }
  if (row.pulseIsRequired && row.pulseIsEditable && row.pulse == null) {
    alerts.push({
      caseSerialId,
      patientName,
      rowId,
      field: "pulse",
      message: "Missing pulse reading",
      dateTime: row.dateTime,
    });
  }
  if (row.respirationIsRequired && row.respirationIsEditable && row.respiration == null) {
    alerts.push({
      caseSerialId,
      patientName,
      rowId,
      field: "respiration",
      message: "Missing respiration reading",
      dateTime: row.dateTime,
    });
  }

  return alerts;
};
