import type { PatientCardRowDTO } from "@petec/shared";
import type { ColumnDef } from "../../../types";

export const PATIENTS_COLUMNS_DATA: ColumnDef[] = [
  { colName: "מספר תיק", searchObjField: "serialId" },
  { colName: "שם", searchObjField: "patientId.name" },
  { colName: ":טלפון בעלים", searchObjField: "patientId.owner.phone" },
];

export const PROCEDURES_COLUMNS_DATA: ColumnDef[] = [
  { colName: "מספר תיק", searchObjField: "serialId", minWidth: "150px" },
  { colName: "שם", searchObjField: "patientId.name", minWidth: "150px" },
  {
    colName: ":טלפון בעלים",
    searchObjField: "patientId.owner.phone",
    minWidth: "150px",
  },
];

export const PATIENT_FLAG_PILLS: ReadonlyArray<{
  key: keyof NonNullable<PatientCardRowDTO["flags"]>;
  label: string;
}> = [
  { key: "isAggressive", label: "תוקפן" },
  { key: "isEscapePotential", label: "ברחן" },
  { key: "isAllergic", label: "אלרגיה" },
  { key: "isRiskAnesthesia", label: "הרדמה בסיכון" },
  { key: "isHeartMurmur", label: "אוושה" },
  { key: "isAMB", label: "AMB" },
];
