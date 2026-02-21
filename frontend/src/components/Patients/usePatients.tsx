import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppRoutes } from "../../config/app-routes";
import { PatientCardRowDTO } from "@petec/shared";
import type { ColumnDef } from "../../types";
import {
  DEFAULT_PATIENT_IMAGE,
  MOBILE_TABLE_BREAKPOINT_PX,
  PATIENTS_CARDS_AMOUNT,
  PATIENTS_NAV_TYPES,
  PATIENT_TABLE_TYPES,
} from "./patients.constants";

type PatientTableType = (typeof PATIENT_TABLE_TYPES)[keyof typeof PATIENT_TABLE_TYPES];
type PatientFilters = Record<string, string>;

const patientsColumnsData: ColumnDef[] = [
  { colName: "מספר תיק", searchObjField: "_id" },
  { colName: "מספר תיק מאסטר", searchObjField: "masterCaseId" },
  { colName: "שם", searchObjField: "patientId.name" },
  { colName: ":טלפון בעלים", searchObjField: "patientId.owner.phone" },
];

const proceduresColumnsData: ColumnDef[] = [
  { colName: "מספר תיק", searchObjField: "_id", minWidth: "150px" },
  { colName: "מספר תיק מאסטר", searchObjField: "masterCaseId" },
  { colName: "שם", searchObjField: "patientId.name", minWidth: "150px" },
  {
    colName: ":טלפון בעלים",
    searchObjField: "patientId.owner.phone",
    minWidth: "150px",
  },
];

const buildPatientsArgs = (value: boolean, isArchive: boolean): string[] => [
  String(value),
  String(value),
  String(isArchive),
];

const formatOwnerPhone = (phone?: string): string => {
  if (!phone || phone.length <= 3) return "";
  return `${phone.substring(0, 3)}-${phone.substring(3)}`;
};

const PATIENT_FLAG_PILLS: ReadonlyArray<{
  key: keyof NonNullable<PatientCardRowDTO["flags"]>;
  label: string;
  className?: string;
}> = [
  { key: "isAggressive", label: "תוקפן" },
  { key: "isEscapePotential", label: "ברחן" },
  { key: "isAllergic", label: "אלרגיה" },
  { key: "isRiskAnesthesia", label: "הרדמה בסיכון" },
  { key: "isHeartMurmur", label: "אוושה" },
  { key: "isAMB", label: "AMB", className: "patient-card-special-info-pill-blue" },
];

export function usePatients(patientsNavType?: string) {
  const navigate = useNavigate();
  const isArchive = patientsNavType === PATIENTS_NAV_TYPES.ARCHIVE;
  const [patientSearch, setPatientSearch] = useState("");
  const [proceduresSearch, setProceduresSearch] = useState("");
  const [proceduresFilters, setProceduresFilters] = useState<PatientFilters>({});
  const [patientsFilters, setPatientsFilters] = useState<PatientFilters>({});
  const [patientsArgs, setPatientsArgs] = useState<string[]>(() =>
    buildPatientsArgs(false, isArchive),
  );
  const [reloadProceduresCards, setReloadProceduresCards] = useState(false);
  const [reloadPatientsCards, setReloadPatientsCards] = useState(false);
  const [showOnlyPatientsWithAlerts, setShowOnlyPatientsWithAlerts] =
    useState(false);
  const [showOnlyProceduresWithAlerts, setShowOnlyProceduresWithAlerts] =
    useState(false);
  const [width, setWidth] = useState<number>(() =>
    typeof window === "undefined" ? MOBILE_TABLE_BREAKPOINT_PX : window.innerWidth,
  );
  const [tableType, setTableType] = useState<PatientTableType>(PATIENT_TABLE_TYPES.PATIENTS);
  const isShowOneTable = width < MOBILE_TABLE_BREAKPOINT_PX;

  const resetPatientCards = useCallback((isArchived: boolean) => {
    setPatientsArgs(buildPatientsArgs(false, isArchived));
    setReloadProceduresCards((prev) => !prev);
    setReloadPatientsCards((prev) => !prev);
    setProceduresFilters({});
    setPatientsFilters({});
    setShowOnlyProceduresWithAlerts(false);
    setShowOnlyPatientsWithAlerts(false);
    setProceduresSearch("");
    setPatientSearch("");
  }, []);

  const patientCard = useCallback((row: PatientCardRowDTO, i: number) => {
    const formattedPhoneNumber = formatOwnerPhone(row.patientId?.owner?.phone);
    const patientFlags = row.flags;

    return (
      <div
        key={String(row._id ?? i)}
        className="patient-card"
        onClick={() => {
          navigate(
            AppRoutes.Patients.Details.build(String(row.masterCaseId || row._id), String(row._id)),
          );
        }}
      >
        <div className="patient-card-img-container">
          <img
            src={
              row.patientId?.photoName
                ? row.patientId.photoName
                : DEFAULT_PATIENT_IMAGE
            }
            alt="patient-img"
          />
          <div className="patient-card-special-info">
            {PATIENT_FLAG_PILLS.map((flag) =>
              patientFlags?.[flag.key] ? (
                <div
                  key={flag.key}
                  className={`patient-card-special-info-pill${flag.className ? ` ${flag.className}` : ""}`}
                >
                  {flag.label}
                </div>
              ) : null,
            )}
          </div>
        </div>

        <div className="patient-card-info">
          <span>מספר תיק: {row.masterCaseId}</span>
          <span>שם: {row.patientId?.name}</span>
          <span>שם בעלים: {row.patientId?.owner?.name} </span>
          <span>טלפון בעלים: {formattedPhoneNumber}</span>
          <span>סיבת אישפוז: {row.admission?.hospitalizationReason}</span>
        </div>
        {row.numOfAlerts !== undefined && row.numOfAlerts > 0 && (
          <div
            className="patient-card-alerts"
            title={`לתיק יש ${row.numOfAlerts} התראות`}
          >
            {row.numOfAlerts}
          </div>
        )}
      </div>
    );
  }, [navigate]);

  const handleResize = useCallback(() => {
    setWidth(window.innerWidth);
  }, []);

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [handleResize]);

  return {
    navigate,
    isArchive,
    patientSearch,
    setPatientSearch,
    proceduresSearch,
    setProceduresSearch,
    proceduresFilters,
    setProceduresFilters,
    patientsFilters,
    setPatientsFilters,
    patientsArgs,
    setPatientsArgs,
    reloadProceduresCards,
    setReloadProceduresCards,
    reloadPatientsCards,
    setReloadPatientsCards,
    showOnlyPatientsWithAlerts,
    setShowOnlyPatientsWithAlerts,
    showOnlyProceduresWithAlerts,
    setShowOnlyProceduresWithAlerts,
    tableType,
    setTableType,
    PATIENTS_CARDS_AMOUNT,
    isShowOneTable,
    patientsColumnsData,
    proceduresColumnsData,
    resetPatientCards,
    patientCard,
  };
}
