import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaExclamationTriangle } from "react-icons/fa";
import { AppRoutes } from "../../../config/appRoutes";
import { PatientCardRowDTO, TABLE_QUERY_KEYS } from "@petec/shared";
import {
  PATIENTS_CARDS_AMOUNT,
  PATIENTS_NAV_TYPES,
} from "../../../features/patients";
import {
  type PatientCardsFilter,
  buildCaseSearchFilters,
  buildProcedureSearchFilters,
  formatOwnerPhone,
  getInitialViewportWidth,
} from "../../../features/patients";
import {
  getPatientImageSrc,
  handlePatientImageLoadError,
} from "../../../features/patients";
import {
  PATIENT_FLAG_PILLS,
  PATIENTS_COLUMNS_DATA,
  PROCEDURES_COLUMNS_DATA,
} from "./usePatients.constants";

type PatientTableType =
  (typeof TABLE_QUERY_KEYS)[keyof typeof TABLE_QUERY_KEYS];

const ALERT_BADGE_PULSE_DURATION_MS = 3600;

function PatientAlertBadge({ count }: { count: number }) {
  const [isPulsing, setIsPulsing] = useState(true);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setIsPulsing(false);
    }, ALERT_BADGE_PULSE_DURATION_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [count]);

  return (
    <div
      className={`patient-card-alerts${isPulsing ? " patient-card-alerts-pulse" : ""}`}
      title={`לתיק יש ${count} התראות`}
    >
      <FaExclamationTriangle aria-hidden="true" />
      <span>{count}</span>
    </div>
  );
}

export function usePatients(patientsNavType?: string) {
  const navigate = useNavigate();
  const isArchive = patientsNavType === PATIENTS_NAV_TYPES.ARCHIVE;
  const [patientSearch, setPatientSearch] = useState("");
  const [proceduresSearch, setProceduresSearch] = useState("");
  const [proceduresFilters, setProceduresFilters] =
    useState<PatientCardsFilter>(() =>
      buildProcedureSearchFilters("", isArchive, false),
    );
  const [patientsFilters, setPatientsFilters] = useState<PatientCardsFilter>(
    () => buildCaseSearchFilters("", isArchive, false),
  );
  const [reloadProceduresCards, setReloadProceduresCards] = useState(false);
  const [reloadPatientsCards, setReloadPatientsCards] = useState(false);
  const [showOnlyPatientsWithAlerts, setShowOnlyPatientsWithAlerts] =
    useState(false);
  const [showOnlyProceduresWithAlerts, setShowOnlyProceduresWithAlerts] =
    useState(false);
  const [width, setWidth] = useState<number>(getInitialViewportWidth);
  const [tableType, setTableType] = useState<PatientTableType>(
    TABLE_QUERY_KEYS.PATIENTS,
  );
  const isShowOneTable = width < 750;
  const lastAppliedArchiveModeRef = useRef(isArchive);

  const resetPatientCards = useCallback((isArchived: boolean) => {
    lastAppliedArchiveModeRef.current = isArchived;
    setReloadProceduresCards((prev) => !prev);
    setReloadPatientsCards((prev) => !prev);
    setProceduresFilters(buildProcedureSearchFilters("", isArchived, false));
    setPatientsFilters(buildCaseSearchFilters("", isArchived, false));
    setShowOnlyProceduresWithAlerts(false);
    setShowOnlyPatientsWithAlerts(false);
    setProceduresSearch("");
    setPatientSearch("");
  }, []);

  const patientCard = useCallback(
    (row: PatientCardRowDTO, i: number) => {
      const formattedPhoneNumber = formatOwnerPhone(
        row.patientId?.owner?.phone,
      );
      const patientFlags = row.flags;

      return (
        <div
          key={String(row._id ?? i)}
          className="patient-card"
          onClick={() => {
            navigate(
              AppRoutes.Patients.Details.build(
                String(row.masterCaseId || row._id),
                String(row._id),
              ),
            );
          }}
        >
          <div className="patient-card-img-container">
            <img
              src={getPatientImageSrc(row.patientId?.photoName)}
              onError={handlePatientImageLoadError}
              alt="patient-img"
            />
            <div className="patient-card-special-info">
              {PATIENT_FLAG_PILLS.map((flag) =>
                patientFlags?.[flag.key] ? (
                  <div
                    key={flag.key}
                    className={`patient-card-special-info-pill${flag.key === "isAMB" ? " patient-card-special-info-pill-blue" : ""}`}
                  >
                    {flag.label}
                  </div>
                ) : null,
              )}
            </div>
          </div>

          <div className="patient-card-info">
            <span>מספר תיק: {row.serialId}</span>
            <span>שם: {row.patientId?.name}</span>
            <span>שם בעלים: {row.patientId?.owner?.name} </span>
            <span>טלפון בעלים: {formattedPhoneNumber}</span>
            <span>סיבת אישפוז: {row.admission?.hospitalizationReason}</span>
          </div>
          {row.numOfAlerts !== undefined && row.numOfAlerts > 0 ? (
            <PatientAlertBadge count={row.numOfAlerts} />
          ) : null}
        </div>
      );
    },
    [navigate],
  );

  const handleResize = useCallback(() => {
    setWidth(window.innerWidth);
  }, []);

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [handleResize]);

  useEffect(() => {
    const isCardsView =
      patientsNavType === PATIENTS_NAV_TYPES.PATIENTS_LIST ||
      patientsNavType === PATIENTS_NAV_TYPES.ARCHIVE;

    if (!isCardsView || lastAppliedArchiveModeRef.current === isArchive) {
      return;
    }

    resetPatientCards(isArchive);
  }, [isArchive, patientsNavType, resetPatientCards]);

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
    patientsColumnsData: PATIENTS_COLUMNS_DATA,
    proceduresColumnsData: PROCEDURES_COLUMNS_DATA,
    resetPatientCards,
    patientCard,
  };
}
