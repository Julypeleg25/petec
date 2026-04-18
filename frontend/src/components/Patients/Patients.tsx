import {
  PatientCardRowDTO,
  TABLE_QUERY_KEYS,
  TABLE_SORT_FIELDS,
} from "@petec/shared";
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

  return (
    <div className="Patients">
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
        patientsNavType === PATIENTS_NAV_TYPES.PROCEDURES) && (
        <nav className="nav-patients-cards">
          <button
            className={getButtonClassName(
              tableType === TABLE_QUERY_KEYS.PROCEDURES,
            )}
            title="פרוצדרות"
            onClick={() => {
              setTableType(TABLE_QUERY_KEYS.PROCEDURES);
            }}
            disabled={tableType === TABLE_QUERY_KEYS.PROCEDURES}
          >
            פרוצדרות
          </button>
          <button
            className={getButtonClassName(
              tableType === TABLE_QUERY_KEYS.PATIENTS,
            )}
            title="אשפוז"
            onClick={() => {
              setTableType(TABLE_QUERY_KEYS.PATIENTS);
            }}
            disabled={tableType === TABLE_QUERY_KEYS.PATIENTS}
          >
            אשפוז
          </button>
        </nav>
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
