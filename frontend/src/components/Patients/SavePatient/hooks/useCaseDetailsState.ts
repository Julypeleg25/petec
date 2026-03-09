import { useCallback } from "react";
import type { CaseDetailsResponseDTO } from "@petec/shared";
import { patientsApi } from "../../../../features/patients/patients.api";
import { getCaseDayPrimaryDataRow } from "../../CaseDetailsTable/caseGrid.utils";
import { toTodayDate } from "../../CaseDetailsTable/utils/CaseDetailsTable.utils";
import { defaultCaseDailyDataTemplate } from "../types/savePatient.types";
import type { NewPatientData } from "../types/savePatient.types";
import { SAVE_PATIENT_DEFAULTS } from "../constants/savePatient.constants";
import {
    isCatheterReplacementDue,
    mapCaseDetailsApiGridToUi,
    toChildCases,
} from "../utils/savePatient.utils";
import { toLocalDateFromInputValue } from "../utils/savePatientCaseDetails.utils";
import type { PatientFormState } from "./usePatientFormState";

type ShouldApplyState = () => boolean;

export function useCaseDetailsState(
    state: PatientFormState,
    caseIdString: string,
    masterCaseId: string | undefined,
    getRaceTypes: (animalId: number | string) => void,
) {
    const {
        resetPatientForm,
        setCaseDetailsList,
        setChildCases,
        setDisableAddCaseDetailsTable,
        setFormData,
        setIsAggressive,
        setIsAllergic,
        setIsAMB,
        setIsArchived,
        setIsCerenia,
        setIsConvenia,
        setIsEscapePotential,
        setIsHeartMurmur,
        setIsNPO,
        setIsProcedure,
        setIsReleased,
        setIsRiskAnesthesia,
        setInitialStateSnapshot,
        setLoading,
        setPatientId,
        setPhotoName,
        setSelectedAnimalColor,
        setSelectedAnimalType,
        setSelectedCaseDate,
        setSelectedDoctor,
        setSelectedFile,
        setSelectedFoodType,
        setSelectedGenderType,
        setSelectedInsurance,
        setSelectedNurse,
        setSelectedRaceType,
        setSelectedStartHour,
        setShowCaseDetailsDaysOptions,
        setShowCatheterReplacementModal,
    } = state;

    const applyCaseDetailsResponseToState = useCallback(
        (response: CaseDetailsResponseDTO) => {
            const cd = response.caseDetails;

            const nextFormData: NewPatientData = {
                caseId: cd.serial_id,
                name: cd.name,
                owner: { name: cd.owner_name, phone: cd.owner_phone_number },
                admission: {
                    hospitalizationReason: cd.hospitalization_reason,
                    referringDoctor: cd.referring_doctor ?? "",
                    allergicComments: cd.allergic_comments ?? null,
                    bloodTestLink: cd.blood_test_link ?? null,
                },
                patientSnapshot: {
                    weightKg: cd.weight_kg ?? undefined,
                    ageYears: cd.age_years ?? undefined,
                    ageMonths: cd.age_months ?? undefined,
                },
                dates: {
                    catheterDate: toLocalDateFromInputValue(cd.catheter_date_for_input),
                    procedureDate: toLocalDateFromInputValue(cd.procedure_date_for_input),
                },
                comments: cd.comments,
            };

            setFormData(nextFormData);
            resetPatientForm(nextFormData);
            setSelectedFile(null);
            setInitialStateSnapshot(null);

            const isCatheterDue =
                isCatheterReplacementDue(
                    cd.catheter_date_for_input ?? null,
                    SAVE_PATIENT_DEFAULTS.CATHETER_REPLACEMENT_DAYS_THRESHOLD,
                );
            setShowCatheterReplacementModal(isCatheterDue);

            setIsArchived(cd.is_archived);
            setSelectedGenderType(
                cd.gender_type_id ?? SAVE_PATIENT_DEFAULTS.EMPTY_VALUE,
            );
            setSelectedAnimalType(
                cd.animal_type_id ?? SAVE_PATIENT_DEFAULTS.EMPTY_VALUE,
            );
            setSelectedAnimalColor(
                cd.animal_color_id ?? SAVE_PATIENT_DEFAULTS.EMPTY_VALUE,
            );
            setSelectedInsurance(
                cd.insurance_id ?? SAVE_PATIENT_DEFAULTS.EMPTY_VALUE,
            );
            setSelectedFoodType(
                cd.food_type_id ?? SAVE_PATIENT_DEFAULTS.EMPTY_VALUE,
            );
            setSelectedRaceType(
                cd.race_id ?? SAVE_PATIENT_DEFAULTS.EMPTY_VALUE,
            );
            setSelectedDoctor(
                cd.doctor_id ?? SAVE_PATIENT_DEFAULTS.EMPTY_VALUE,
            );
            setSelectedNurse(
                cd.nurse_id ?? SAVE_PATIENT_DEFAULTS.EMPTY_VALUE,
            );

            setIsConvenia(cd.is_convenia);
            setIsAllergic(cd.is_allergic);
            setIsEscapePotential(cd.is_escape_potential);
            setIsNPO(cd.is_npo);
            setIsRiskAnesthesia(cd.is_risk_anesthesia);
            setIsHeartMurmur(cd.is_heart_murmur);
            setIsAMB(cd.is_amb);
            setIsAggressive(cd.is_aggressive);
            setIsCerenia(cd.is_cerenia);
            setIsProcedure(cd.is_procedure);
            setIsReleased(cd.is_released);

            setPhotoName(cd.photo_name);
            setPatientId(cd.patient_id);

            if (cd.animal_type_id) getRaceTypes(cd.animal_type_id);

            const grid = mapCaseDetailsApiGridToUi(response.caseDailyDetails);

            if (grid === null) {
                setDisableAddCaseDetailsTable(false);
                setCaseDetailsList([defaultCaseDailyDataTemplate]);
                setShowCaseDetailsDaysOptions(true);
                setSelectedCaseDate(SAVE_PATIENT_DEFAULTS.CASE_DATE_FALLBACK);
                setSelectedStartHour(SAVE_PATIENT_DEFAULTS.EMPTY_VALUE);
                setChildCases(toChildCases(response.masterCaseDetails));
                return;
            }

            setShowCaseDetailsDaysOptions(true);
            const ordered = grid;
            const currentDay = ordered[0] ?? [];
            const firstDataRow = getCaseDayPrimaryDataRow(currentDay);
            setCaseDetailsList(ordered);
            setSelectedCaseDate(
                firstDataRow?.date ?? SAVE_PATIENT_DEFAULTS.CASE_DATE_FALLBACK,
            );
            setSelectedStartHour(
                String(Number((firstDataRow?.time ?? "").split(":")[0] || "")) ||
                SAVE_PATIENT_DEFAULTS.EMPTY_VALUE,
            );

            setDisableAddCaseDetailsTable(firstDataRow?.date === toTodayDate());
            setChildCases(toChildCases(response.masterCaseDetails));
        },
        [
            getRaceTypes,
            resetPatientForm,
            setCaseDetailsList,
            setChildCases,
            setDisableAddCaseDetailsTable,
            setFormData,
            setIsAggressive,
            setIsAllergic,
            setIsAMB,
            setIsArchived,
            setIsCerenia,
            setIsConvenia,
            setIsEscapePotential,
            setIsHeartMurmur,
            setIsNPO,
            setIsProcedure,
            setIsReleased,
            setIsRiskAnesthesia,
            setInitialStateSnapshot,
            setPatientId,
            setPhotoName,
            setSelectedAnimalColor,
            setSelectedAnimalType,
            setSelectedCaseDate,
            setSelectedDoctor,
            setSelectedFile,
            setSelectedFoodType,
            setSelectedGenderType,
            setSelectedInsurance,
            setSelectedNurse,
            setSelectedRaceType,
            setSelectedStartHour,
            setShowCaseDetailsDaysOptions,
            setShowCatheterReplacementModal,
        ],
    );

    const getCaseDetailsData = useCallback(
        async (shouldApplyState: ShouldApplyState = () => true) => {
            if (!caseIdString) return;

            try {
                const response = await patientsApi.getCaseDetails(
                    caseIdString,
                    masterCaseId,
                );
                if (!shouldApplyState()) return;

                applyCaseDetailsResponseToState(response);
                return mapCaseDetailsApiGridToUi(response.caseDailyDetails);
            } catch {
                if (shouldApplyState()) {
                    setLoading(false);
                }
            }
        },
        [applyCaseDetailsResponseToState, caseIdString, masterCaseId, setLoading],
    );

    return { getCaseDetailsData };
}
