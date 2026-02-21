import type { PatientCardRowDTO } from "@petec/shared";
import SearchBar from "../../utils/SearchBar/SearchBar";
import TableGenerator from "../../utils/TableGenerator/TableGenerator";
import SavePatient from "./SavePatient/SavePatient";
import FormCheckbox from "../../utils/FormCheckbox/FormCheckbox";
import DailyPlan from "../DailyPlan/DailyPlan";
import { AppRoutes } from "../../config/app-routes";
import { usePatients } from "./usePatients";
import "./Patients.css";
import { IPatientsProps } from "./Patients.types";
import {
  CARD_LAYOUT,
  PATIENTS_NAV_TYPES,
  PATIENT_TABLE_TYPES,
  SEARCH_FILTER_KEYS,
  TABLE_ORDER_BY,
  TABLE_QUERY_KEYS,
} from "./patients.constants";

const toPatientsArgs = (value: boolean, isArchive: boolean): string[] => [
  String(value),
  String(value),
  String(isArchive),
];

function Patients({ patientsNavType }: IPatientsProps) {
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
  } = usePatients(patientsNavType);

  return (
    <div className="Patients">
      <nav className="navbar patients-navbar">
          <button
            className={`btn ${
              patientsNavType === PATIENTS_NAV_TYPES.DAILY_PLAN ? "" : "btn-active"
            }`}
            title="יומי plan"
            onClick={() => {
              navigate(AppRoutes.Patients.DailyPlan);
            }}
            disabled={patientsNavType === PATIENTS_NAV_TYPES.DAILY_PLAN}
          >
            יומי plan
          </button>
          <button
            className={`btn ${isArchive ? "" : "btn-active"}`}
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
            className={`btn ${
              patientsNavType === PATIENTS_NAV_TYPES.NEW_PATIENT ? "" : "btn-active"
            }`}
            title="הוספת מטופל"
            onClick={() => {
              navigate(AppRoutes.Patients.NewPatient);
            }}
            disabled={patientsNavType === PATIENTS_NAV_TYPES.NEW_PATIENT}
          >
            הוספת מטופל
          </button>
          <button
            className={`btn ${
              patientsNavType === PATIENTS_NAV_TYPES.PATIENTS_LIST ? "" : "btn-active"
            }`}
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
        patientsNavType === PATIENTS_NAV_TYPES.PROCEDURES) && (
        <nav className="nav-patients-cards">
          <button
            className={`btn ${tableType === PATIENT_TABLE_TYPES.PROCEDURES ? "" : "btn-active"}`}
            title="פרוצדרות"
            onClick={() => {
              setTableType(PATIENT_TABLE_TYPES.PROCEDURES);
            }}
            disabled={tableType === PATIENT_TABLE_TYPES.PROCEDURES}
          >
            פרוצדרות
          </button>
          <button
            className={`btn ${tableType === PATIENT_TABLE_TYPES.PATIENTS ? "" : "btn-active"}`}
            title="אשפוז"
            onClick={() => {
              setTableType(PATIENT_TABLE_TYPES.PATIENTS);
            }}
            disabled={tableType === PATIENT_TABLE_TYPES.PATIENTS}
          >
            אשפוז
          </button>
        </nav>
      )}
      <main className="patients-main-section">
        {(patientsNavType === PATIENTS_NAV_TYPES.PATIENTS_LIST || isArchive) && (
          <>
            {(!isShowOneTable || tableType === PATIENT_TABLE_TYPES.PROCEDURES) && (
              <div className="patients-cards">
                <div className="patients-section-title">פרוצדרות</div>
                <div className="procedures-search-section">
                  <SearchBar
                    placeholder="חפש לפי מספר תיק"
                    state={proceduresSearch}
                    setState={setProceduresSearch}
                    onEnter={(e) => {
                      setProceduresFilters({
                        [SEARCH_FILTER_KEYS.MASTER_CASE_ID]: e.target.value,
                      });
                      setReloadProceduresCards((prev) => !prev);
                    }}
                  />
                  <FormCheckbox
                    checked={showOnlyProceduresWithAlerts}
                    setChecked={setShowOnlyProceduresWithAlerts}
                    labelText="הצג רק מטופלים עם התראות"
                    afterChange={(isChecked) => {
                      setPatientsArgs(toPatientsArgs(isChecked, isArchive));
                      setReloadProceduresCards((prev) => !prev);
                    }}
                  />
                </div>
                <div className="cards-section">
                  <TableGenerator<PatientCardRowDTO>
                    queryObj={{
                      query: TABLE_QUERY_KEYS.CASES,
                      orderBy: { [TABLE_ORDER_BY.CREATED_AT]: TABLE_ORDER_BY.DESC },
                      filters: proceduresFilters,
                      args: patientsArgs,
                      formatting: {},
                    }}
                    columnsData={proceduresColumnsData}
                    paginationPerPage={PATIENTS_CARDS_AMOUNT}
                    reload={reloadProceduresCards}
                    isCards={true}
                    customCard={patientCard}
                    hiddenCardWidth={CARD_LAYOUT.WIDTH}
                    hiddenCardMargin={CARD_LAYOUT.MARGIN}
                  />
                </div>
              </div>
            )}
            {!isShowOneTable && <div className="cards-devider"></div>}
            {(!isShowOneTable || tableType === PATIENT_TABLE_TYPES.PATIENTS) && (
              <div className="procedures-cards">
                <div className="patients-section-title">אשפוז</div>
                <div className="procedures-search-section">
                  <SearchBar
                    placeholder="חפש לפי מספר תיק"
                    state={patientSearch}
                    setState={setPatientSearch}
                    onEnter={(e) => {
                      setPatientsFilters({
                        [SEARCH_FILTER_KEYS.MASTER_CASE_ID]: e.target.value,
                      });
                      setReloadPatientsCards((prev) => !prev);
                    }}
                  />
                  <FormCheckbox
                    checked={showOnlyPatientsWithAlerts}
                    setChecked={setShowOnlyPatientsWithAlerts}
                    labelText="הצג רק מטופלים עם התראות"
                    afterChange={(isChecked) => {
                      setPatientsArgs(toPatientsArgs(isChecked, isArchive));
                      setReloadPatientsCards((prev) => !prev);
                    }}
                  />
                </div>
                <div className="cards-section">
                  <TableGenerator<PatientCardRowDTO>
                    queryObj={{
                      query: TABLE_QUERY_KEYS.PATIENTS,
                      orderBy: { [TABLE_ORDER_BY.CREATED_AT]: TABLE_ORDER_BY.DESC },
                      filters: patientsFilters,
                      args: patientsArgs,
                      formatting: {},
                    }}
                    columnsData={patientsColumnsData}
                    paginationPerPage={PATIENTS_CARDS_AMOUNT}
                    reload={reloadPatientsCards}
                    isCards={true}
                    customCard={patientCard}
                    hiddenCardWidth={CARD_LAYOUT.WIDTH}
                    hiddenCardMargin={CARD_LAYOUT.MARGIN}
                  />
                </div>
              </div>
            )}
          </>
        )}
        {patientsNavType === PATIENTS_NAV_TYPES.PATIENT_CASE && (
          <div className="new-patient-section">
            <SavePatient />
          </div>
        )}
        {patientsNavType === PATIENTS_NAV_TYPES.NEW_PATIENT && (
          <div className="new-patient-section">
            <SavePatient />
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
