import {
  PatientCardRowDTO,
  TABLE_QUERY_KEYS,
  TABLE_SORT_FIELDS,
} from "@petec/shared";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FaBars, FaTimes } from "react-icons/fa";
import SearchBar from "../../utils/SearchBar/SearchBar";
import TableGenerator from "../../utils/TableGenerator/TableGenerator";
import { TABLE_SORT_DIRECTIONS } from "../../utils/TableGenerator/TableGenerator.types";
import SavePatient from "./SavePatient/SavePatient";
import FormCheckbox from "../../utils/FormCheckbox/FormCheckbox";
import DailyPlan from "../DailyPlan/DailyPlan";
import { AppRoutes } from "../../config/appRoutes";
import { usePatients } from "./hooks/usePatients";
import "./Patients.css";
import {
  buildCaseSearchFilters,
  buildProcedureSearchFilters,
  getButtonClassName,
} from "../../features/patients/utils/patients.utils";
import { PATIENTS_NAV_TYPES } from "../../features/patients/constants/patients.constants";

interface PatientsProps {
  patientsNavType?: string;
}

function Patients({ patientsNavType }: PatientsProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [headerMenuContainer, setHeaderMenuContainer] =
    useState<HTMLElement | null>(null);
  const {
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
    patientsColumnsData,
    proceduresColumnsData,
    resetPatientCards,
    patientCard,
  } = usePatients(patientsNavType);

  const handleMobileMenuAction = (action: () => void) => {
    setIsMobileMenuOpen(false);
    action();
  };

  const isPatientListView =
    patientsNavType === PATIENTS_NAV_TYPES.PATIENTS_LIST ||
    patientsNavType === PATIENTS_NAV_TYPES.PROCEDURES;

  const getSelectedLabel = () => {
    if (isArchive) return "ארכיון";
    if (patientsNavType === PATIENTS_NAV_TYPES.DAILY_PLAN) return "יומי plan";
    if (patientsNavType === PATIENTS_NAV_TYPES.NEW_PATIENT) return "הוספת מטופל";
    if (patientsNavType === PATIENTS_NAV_TYPES.PATIENTS_LIST) return "רשימת מטופלים";
    if (patientsNavType === PATIENTS_NAV_TYPES.PROCEDURES) return "פרוצדרות";
    if (patientsNavType === PATIENTS_NAV_TYPES.PATIENT_CASE) return "פרטי מטופל";
    return "אפשרויות";
  };

  useEffect(() => {
    setHeaderMenuContainer(document.getElementById("header-contextual-menu"));
  }, []);

  return (
    <div className="Patients">
      {headerMenuContainer &&
        createPortal(
        <>
        <div
          className={`patients-mobile-menu ${
            patientsNavType === PATIENTS_NAV_TYPES.PATIENT_CASE
              ? "patients-mobile-menu--with-actions"
              : ""
          }`}
        >
          <button
            type="button"
            className="btn patients-mobile-menu__trigger"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-expanded={isMobileMenuOpen}
            aria-controls="patients-mobile-menu-panel"
          >
            {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
            <span>{getSelectedLabel()}</span>
          </button>
          {isMobileMenuOpen && (
            <div id="patients-mobile-menu-panel" className="patients-mobile-menu__panel">
              <button
                type="button"
                className={
                  patientsNavType === PATIENTS_NAV_TYPES.DAILY_PLAN ? "is-active" : ""
                }
                onClick={() =>
                  handleMobileMenuAction(() =>
                    navigate(AppRoutes.Patients.DailyPlan),
                  )
                }
                disabled={patientsNavType === PATIENTS_NAV_TYPES.DAILY_PLAN}
              >
                יומי plan
              </button>
              <button
                type="button"
                className={isArchive ? "is-active" : ""}
                onClick={() =>
                  handleMobileMenuAction(() => {
                    resetPatientCards(true);
                    navigate(AppRoutes.Patients.Archive);
                  })
                }
                disabled={isArchive}
              >
                ארכיון
              </button>
              <button
                type="button"
                className={
                  patientsNavType === PATIENTS_NAV_TYPES.NEW_PATIENT ? "is-active" : ""
                }
                onClick={() =>
                  handleMobileMenuAction(() =>
                    navigate(AppRoutes.Patients.NewPatient),
                  )
                }
                disabled={patientsNavType === PATIENTS_NAV_TYPES.NEW_PATIENT}
              >
                הוספת מטופל
              </button>
              <button
                type="button"
                className={
                  patientsNavType === PATIENTS_NAV_TYPES.PATIENTS_LIST
                    ? "is-active"
                    : ""
                }
                onClick={() =>
                  handleMobileMenuAction(() => {
                    resetPatientCards(false);
                    navigate(AppRoutes.Patients.List);
                  })
                }
                disabled={patientsNavType === PATIENTS_NAV_TYPES.PATIENTS_LIST}
              >
                רשימת מטופלים
              </button>
            </div>
          )}
        </div>
      </>,
      headerMenuContainer,
    )}
      <nav className="navbar patients-navbar">
        <button
          className={getButtonClassName(
            patientsNavType === PATIENTS_NAV_TYPES.DAILY_PLAN,
          )}
          title="יומי plan"
          onClick={() => {
            navigate(AppRoutes.Patients.DailyPlan);
          }}
          disabled={patientsNavType === PATIENTS_NAV_TYPES.DAILY_PLAN}
        >
          יומי plan
        </button>
        <button
          className={getButtonClassName(isArchive)}
          title="ארכיון"
          onClick={() => {
            resetPatientCards(true);
            navigate(AppRoutes.Patients.Archive);
          }}
          disabled={isArchive}
        >
          ארכיון
        </button>
        <button
          className={getButtonClassName(
            patientsNavType === PATIENTS_NAV_TYPES.NEW_PATIENT,
          )}
          title="הוספת מטופל"
          onClick={() => {
            navigate(AppRoutes.Patients.NewPatient);
          }}
          disabled={patientsNavType === PATIENTS_NAV_TYPES.NEW_PATIENT}
        >
          הוספת מטופל
        </button>
        <button
          className={getButtonClassName(
            patientsNavType === PATIENTS_NAV_TYPES.PATIENTS_LIST,
          )}
          title="רשימת מטופלים"
          onClick={() => {
            resetPatientCards(false);
            navigate(AppRoutes.Patients.List);
          }}
          disabled={patientsNavType === PATIENTS_NAV_TYPES.PATIENTS_LIST}
        >
          רשימת מטופלים
        </button>
      </nav>
      {(patientsNavType === PATIENTS_NAV_TYPES.PATIENTS_LIST ||
        patientsNavType === PATIENTS_NAV_TYPES.PROCEDURES ||
        isArchive) && (
        <div className="patients-list-type-toggle">
          <button
            type="button"
            className={tableType === TABLE_QUERY_KEYS.PROCEDURES ? "is-active" : ""}
            onClick={() => setTableType(TABLE_QUERY_KEYS.PROCEDURES)}
          >
            פרוצדרות
          </button>
          <button
            type="button"
            className={tableType === TABLE_QUERY_KEYS.PATIENTS ? "is-active" : ""}
            onClick={() => setTableType(TABLE_QUERY_KEYS.PATIENTS)}
          >
            אשפוז
          </button>
        </div>
      )}
      <main className="patients-main-section">
        {(patientsNavType === PATIENTS_NAV_TYPES.PATIENTS_LIST ||
          isArchive) && (
          <>
            {(!isShowOneTable || tableType === TABLE_QUERY_KEYS.PROCEDURES) && (
              <div className="patients-cards">
                <div className="patients-section-title">פרוצדרות</div>
                <div className="procedures-search-section">
                  <SearchBar
                    placeholder="חפש לפי מס' תיק / שם / שם בעלים / טלפון"
                    state={proceduresSearch}
                    setState={setProceduresSearch}
                    onEnter={(e) => {
                      setProceduresFilters(
                        buildProcedureSearchFilters(
                          e.currentTarget.value,
                          isArchive,
                          showOnlyProceduresWithAlerts,
                        ),
                      );
                      setReloadProceduresCards((prev) => !prev);
                    }}
                  />
                  <FormCheckbox
                    checked={showOnlyProceduresWithAlerts}
                    setChecked={setShowOnlyProceduresWithAlerts}
                    labelText="הצג רק מטופלים עם התראות"
                    afterChange={(isChecked) => {
                      setProceduresFilters(
                        buildProcedureSearchFilters(
                          proceduresSearch,
                          isArchive,
                          isChecked,
                        ),
                      );
                      setReloadProceduresCards((prev) => !prev);
                    }}
                  />
                </div>
                <div className="cards-section">
                  <TableGenerator<PatientCardRowDTO>
                    queryObj={{
                      query: TABLE_QUERY_KEYS.CASES,
                      orderBy: {
                        [TABLE_SORT_FIELDS.CREATED_AT]:
                          TABLE_SORT_DIRECTIONS.DESC,
                      },
                      filters: proceduresFilters,
                      formatting: {},
                    }}
                    columnsData={proceduresColumnsData}
                    paginationPerPage={PATIENTS_CARDS_AMOUNT}
                    reload={reloadProceduresCards}
                    isCards={true}
                    customCard={patientCard}
                    hiddenCardWidth="230px"
                    hiddenCardMargin="1em"
                  />
                </div>
              </div>
            )}
            {!isShowOneTable && <div className="cards-devider"></div>}
            {(!isShowOneTable || tableType === TABLE_QUERY_KEYS.PATIENTS) && (
              <div className="procedures-cards">
                <div className="patients-section-title">אשפוז</div>
                <div className="procedures-search-section">
                  <SearchBar
                    placeholder="חפש לפי מס' תיק / שם / שם בעלים / טלפון"
                    state={patientSearch}
                    setState={setPatientSearch}
                    onEnter={(e) => {
                      setPatientsFilters(
                        buildCaseSearchFilters(
                          e.currentTarget.value,
                          isArchive,
                          showOnlyPatientsWithAlerts,
                        ),
                      );
                      setReloadPatientsCards((prev) => !prev);
                    }}
                  />
                  <FormCheckbox
                    checked={showOnlyPatientsWithAlerts}
                    setChecked={setShowOnlyPatientsWithAlerts}
                    labelText="הצג רק מטופלים עם התראות"
                    afterChange={(isChecked) => {
                      setPatientsFilters(
                        buildCaseSearchFilters(
                          patientSearch,
                          isArchive,
                          isChecked,
                        ),
                      );
                      setReloadPatientsCards((prev) => !prev);
                    }}
                  />
                </div>
                <div className="cards-section">
                  <TableGenerator<PatientCardRowDTO>
                    queryObj={{
                      query: TABLE_QUERY_KEYS.PATIENTS,
                      orderBy: {
                        [TABLE_SORT_FIELDS.CREATED_AT]:
                          TABLE_SORT_DIRECTIONS.DESC,
                      },
                      filters: patientsFilters,
                      formatting: {},
                    }}
                    columnsData={patientsColumnsData}
                    paginationPerPage={PATIENTS_CARDS_AMOUNT}
                    reload={reloadPatientsCards}
                    isCards={true}
                    customCard={patientCard}
                    hiddenCardWidth="230px"
                    hiddenCardMargin="1em"
                  />
                </div>
              </div>
            )}
          </>
        )}
        {patientsNavType === PATIENTS_NAV_TYPES.PATIENT_CASE && (
          <div className="new-patient-section">
            <SavePatient beforeNavigation={() => resetPatientCards(false)} />
          </div>
        )}
        {patientsNavType === PATIENTS_NAV_TYPES.NEW_PATIENT && (
          <div className="new-patient-section">
            <SavePatient beforeNavigation={() => resetPatientCards(false)} />
          </div>
        )}
        {patientsNavType === PATIENTS_NAV_TYPES.DAILY_PLAN && (
          <div className="daily-plan-section">
            <DailyPlan />
          </div>
        )}
      </main>
    </div>
  );
}

export default Patients;
