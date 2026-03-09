import React, { useCallback } from "react";
import {
    buildPatientExportFileName,
    type EditPatientDTO,
    type NewPatientDTO,
} from "@petec/shared";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { downloadFileFromBlob } from "../../../../utils/FileUtils";
import { usePatientApi } from "../../../../features/patients/hooks/usePatientApi";
import { AppRoutes } from "../../../../config/appRoutes";
import { getCaseDayPrimaryDataRow, resolveCaseDayStartHour } from "../../CaseDetailsTable/caseGrid.utils";
import { SAVE_PATIENT_DEFAULTS } from "../constants/savePatient.constants";
import { mapCaseDetailsGridToDto } from "../utils/savePatient.utils";
import {
    buildNewCaseDailyDetailsTemplate,
    normalizeCaseDetailsGridHoursForSave,
    toOptionalNumber,
    validateCaseDetailsGridHours,
} from "../utils/savePatientCaseDetails.utils";
import type { PatientFormState } from "./usePatientFormState";

const toRequestDateValue = (
    value?: Date | null,
): Date | null | undefined => {
    if (value instanceof Date) {
        return Number.isFinite(value.getTime()) ? value : undefined;
    }
    return value === null ? null : undefined;
};

export function useSavePatientActions(
    state: PatientFormState,
    caseId: string | undefined,
    isEdit: boolean,
    hasChanges: boolean,
) {
    const navigate = useNavigate();

    const {
        createPatient,
        updatePatient,
        uploadPatientPhoto,
        exportCase,
        archivePatient: archivePatientMutation,
    } = usePatientApi();

    const isSaving = updatePatient.isPending || createPatient.isPending;
    const isExporting = exportCase.isPending;
    const isArchiving = archivePatientMutation.isPending;

    const uploadPatientImageIfNeeded = useCallback(
        async (resolvedPatientId: string, file: File | null): Promise<void> => {
            if (!file) {
                return;
            }
            try {
                const response = await uploadPatientPhoto.mutateAsync({
                    patientId: resolvedPatientId,
                    file,
                });
                state.setPhotoName(response.photoName);
            } catch {
                toast.error("שמירת תמונת המטופל נכשלה");
            }
        },
        [uploadPatientPhoto, state],
    );

    const exportCaseDetails = useCallback(() => {
        if (!caseId) return;
        exportCase.mutate({ caseId, date: state.selectedCaseDate }, {
            onSuccess: (blob: Blob) => {
                downloadFileFromBlob(
                    { data: blob, headers: {} },
                    "application/pdf",
                    buildPatientExportFileName(state.formData.caseId),
                );
            },
        });
    }, [caseId, exportCase, state.formData.caseId, state.selectedCaseDate]);

    const savePatient = state.handlePatientFormSubmit(
        async () => {
            if (!hasChanges) {
                return;
            }

            const resolvedCaseSerialId = state.formData.caseId;
            if (!resolvedCaseSerialId) {
                toast.error("אנא הזן/י מספר תיק");
                return;
            }

            let normalizedCaseDetailsList = state.caseDetailsList;

            if (isEdit) {
                const hourValue = state.selectedStartHour;
                if (hourValue === SAVE_PATIENT_DEFAULTS.EMPTY_VALUE) {
                    toast.error("אנא בחר/י שעה לתחילת הטבלה");
                    return;
                }

                normalizedCaseDetailsList =
                    normalizeCaseDetailsGridHoursForSave(state.caseDetailsList);

                const gridHoursError = validateCaseDetailsGridHours(
                    normalizedCaseDetailsList,
                );
                if (gridHoursError) {
                    toast.error(gridHoursError);
                    return;
                }

                state.setCaseDetailsList(normalizedCaseDetailsList);
            }

            state.disableSaveBtns(true);

            const baseBody: Omit<NewPatientDTO, "caseId"> = {
                name: state.formData.name,
                owner: {
                    name: state.formData.owner.name,
                    phone: state.formData.owner.phone,
                },
                admission: {
                    hospitalizationReason:
                        state.formData.admission?.hospitalizationReason || undefined,
                    referringDoctor:
                        state.formData.admission?.referringDoctor || undefined,
                    allergicComments:
                        state.formData.admission?.allergicComments || undefined,
                    bloodTestLink:
                        state.formData.admission?.bloodTestLink || undefined,
                },
                patientSnapshot: {
                    ageYears: toOptionalNumber(state.formData.patientSnapshot?.ageYears),
                    ageMonths: toOptionalNumber(state.formData.patientSnapshot?.ageMonths),
                    weightKg: toOptionalNumber(state.formData.patientSnapshot?.weightKg),
                },
                flags: {
                    isAllergic: state.isAllergic,
                    isEscapePotential: state.isEscapePotential,
                    isNPO: state.isNPO,
                    isRiskAnesthesia: state.isRiskAnesthesia,
                    isHeartMurmur: state.isHeartMurmur,
                    isAMB: state.isAMB,
                    isAggressive: state.isAggressive,
                    isConvenia: state.isConvenia,
                    isCerenia: state.isCerenia,
                    isProcedure: state.isProcedure,
                },
                dates: {
                    catheterDate: toRequestDateValue(
                        state.formData.dates?.catheterDate,
                    ),
                    procedureDate: toRequestDateValue(
                        state.formData.dates?.procedureDate,
                    ),
                },
                refs: {
                    animalTypeId: state.selectedAnimalType || undefined,
                    genderTypeId: state.selectedGenderType || undefined,
                    raceTypeId: state.selectedRaceType || undefined,
                    animalColorId: state.selectedAnimalColor || undefined,
                    insuranceTypeId: state.selectedInsurance || undefined,
                    foodTypeId: state.selectedFoodType || undefined,
                },
                doctorUserId: state.selectedDoctor || undefined,
                nurseUserId: state.selectedNurse || undefined,
                comments: state.formData.comments || undefined,
            };

            if (isEdit) {
                if (!caseId) {
                    toast.error("פרטי התיק חסרים");
                    state.disableSaveBtns(false);
                    return;
                }

                const editBody: EditPatientDTO = {
                    ...baseBody,
                    caseId: resolvedCaseSerialId,
                    caseDetails: mapCaseDetailsGridToDto(normalizedCaseDetailsList),
                };
                try {
                    await updatePatient.mutateAsync(editBody);
                    await uploadPatientImageIfNeeded(state.patientId, state.selectedFile);
                    state.setSelectedFile(null);
                    state.setInitialStateSnapshot(null);
                    state.setReloadCase((previousReloadCase) => !previousReloadCase);
                } catch {
                } finally {
                    state.disableSaveBtns(false);
                    state.setDisableAddCaseDetailsTable(false);
                }
                return;
            }

            const createBody: NewPatientDTO = {
                ...baseBody,
                caseId: resolvedCaseSerialId,
            };
            try {
                const created = await createPatient.mutateAsync(createBody);
                if (created.patientId) {
                    await uploadPatientImageIfNeeded(created.patientId, state.selectedFile);
                } else if (state.selectedFile) {
                    toast.error("המטופל נשמר ללא מזהה מטופל, העלאת תמונה דולגה");
                }
                state.setSelectedFile(null);
                navigate(AppRoutes.Patients.List);
            } catch {
                state.disableSaveBtns(false);
            }
        },
        (formErrors) => {
            const firstError = Object.values(formErrors)[0];
            if (firstError?.message) toast.error(firstError.message.toString());
        },
    );

    const addNewCaseDailyDetails = useCallback(
        (e: React.MouseEvent | React.ChangeEvent<HTMLInputElement>) => {
            e.preventDefault();

            const hasOnlyEmptyPlaceholder =
                state.caseDetailsList.length === 1 &&
                !getCaseDayPrimaryDataRow(state.caseDetailsList[0])?.date;

            const defaultCaseDailyData =
                buildNewCaseDailyDetailsTemplate(state.caseDetailsList);

            const nextList = hasOnlyEmptyPlaceholder
                ? [defaultCaseDailyData]
                : [defaultCaseDailyData, ...state.caseDetailsList];

            state.setCaseDetailsList(nextList);
            state.setCaseDetailsDataIndex(0);
            state.setShowCaseDetailsDaysOptions(true);
            state.setDisableAddCaseDetailsTable(true);

            const previousStartHour = resolveCaseDayStartHour(state.caseDetailsList[0] ?? []);
            state.setTimeSelectionValue(
                previousStartHour !== null
                    ? String(previousStartHour)
                    : SAVE_PATIENT_DEFAULTS.EMPTY_VALUE
            );

            const firstDataRow = getCaseDayPrimaryDataRow(defaultCaseDailyData);
            state.setSelectedCaseDate(
                firstDataRow?.date ?? SAVE_PATIENT_DEFAULTS.CASE_DATE_FALLBACK,
            );
        },
        [state],
    );

    const archivePatient = useCallback(() => {
        const caseSerialId = state.formData.caseId;
        if (!caseSerialId) return;
        archivePatientMutation.mutate(
            { caseId: caseSerialId },
            {
                onSuccess: () => {
                    state.setShowArchiveConfirmationModal(false);
                    state.setIsArchived((prev) => !prev);
                    state.setSelectedFile(null);
                    state.setInitialStateSnapshot(null);
                    state.setReloadCase((previousReloadCase) => !previousReloadCase);
                },
            },
        );
    }, [archivePatientMutation, state]);

    return {
        navigate,
        isSaving,
        isExporting,
        isArchiving,
        savePatient,
        exportCaseDetails,
        addNewCaseDailyDetails,
        archivePatient,
    };
}
