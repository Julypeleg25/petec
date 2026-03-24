import React, { useCallback, useState } from "react";
import {
    SYSTEM_TYPE_NAMES,
    type AnimalVitalDTO,
    type EditPatientDTO,
    type NewPatientDTO,
    type ReleasePatientDataResponseDTO,
    type SimpleSystemTypeDTO,
} from "@petec/shared";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { usePatientApi } from "../../../../features/patients/hooks/usePatientApi";
import { patientsApi } from "../../../../features/patients/patients.api";
import { systemTypesApi } from "../../../../features/system-management/systemTypes.api";
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
import { downloadCaseExportPdf } from "../utils/savePatientExport.utils";
import type { SelectOptionObj } from "../../../../utils/FormSelect/FormSelect.types";

interface SavePatientChangesOptions {
    navigateOnCreate?: boolean;
    reloadAfterEdit?: boolean;
}

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
    beforeNavigation?: () => void,
) {
    const navigate = useNavigate();
    const [isExporting, setIsExporting] = useState(false);

    const {
        createPatient,
        updatePatient,
        uploadPatientPhoto,
        archivePatient: archivePatientMutation,
    } = usePatientApi();

    const isSaving = updatePatient.isPending || createPatient.isPending;
    const isArchiving = archivePatientMutation.isPending;

    const getSelectedOptionText = useCallback(
        (
            options: readonly SelectOptionObj[],
            selectedValue: string,
        ): string => options.find((option) => option.value === selectedValue)?.text ?? "",
        [],
    );

    const getExportLookups = useCallback(async (): Promise<{
        animalColorText: string;
        animalTypeText: string;
        doctorText: string;
        fecesTypes: SimpleSystemTypeDTO[];
        foodTypeText: string;
        genderText: string;
        insuranceText: string;
        releaseData: ReleasePatientDataResponseDTO;
        urineTypes: SimpleSystemTypeDTO[];
        vitals: AnimalVitalDTO[];
    }> => {
        if (!caseId) {
            throw new Error("Missing case id");
        }

        const animalTypeId =
            state.selectedAnimalType !== SAVE_PATIENT_DEFAULTS.EMPTY_VALUE
                ? state.selectedAnimalType
                : "";

        const [releaseData, urineTypes, fecesTypes, vitals] = await Promise.all([
            patientsApi.getReleasePatientData(caseId),
            systemTypesApi.getActive(SYSTEM_TYPE_NAMES.URINE_TYPES),
            systemTypesApi.getActive(SYSTEM_TYPE_NAMES.FECES_TYPES),
            animalTypeId
                ? systemTypesApi.getAnimalVitalsByAnimal(animalTypeId)
                : Promise.resolve([]),
        ]);

        return {
            animalColorText: getSelectedOptionText(
                state.animalColors,
                state.selectedAnimalColor,
            ),
            animalTypeText: getSelectedOptionText(
                state.animalTypes,
                state.selectedAnimalType,
            ),
            doctorText: getSelectedOptionText(state.doctors, state.selectedDoctor),
            fecesTypes,
            foodTypeText: getSelectedOptionText(state.foodTypes, state.selectedFoodType),
            genderText: getSelectedOptionText(
                state.genderTypes,
                state.selectedGenderType,
            ),
            insuranceText: getSelectedOptionText(
                state.insuranceList,
                state.selectedInsurance,
            ),
            releaseData,
            urineTypes,
            vitals,
        };
    }, [caseId, getSelectedOptionText, state]);

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

    const exportCaseDetails = useCallback(async () => {
        if (!caseId) {
            return;
        }

        setIsExporting(true);
        try {
            const exportLookups = await getExportLookups();
            const didGeneratePdf = await downloadCaseExportPdf(
                state.formData,
                state.caseDetailsList,
                state.selectedCaseDate,
                exportLookups,
            );

            if (!didGeneratePdf) {
                toast.error("לא ניתן לייצא את הקובץ");
            }
        } catch {
            toast.error("ייצוא הקובץ נכשל");
        } finally {
            setIsExporting(false);
        }
    }, [
        caseId,
        getExportLookups,
        state.caseDetailsList,
        state.formData,
        state.selectedCaseDate,
    ]);

    const savePatientChanges = useCallback(
        async ({
            navigateOnCreate = false,
            reloadAfterEdit = true,
        }: SavePatientChangesOptions = {}): Promise<boolean> => {
            if (!hasChanges) {
                return false;
            }

            const resolvedCaseSerialId = state.formData.caseId;
            if (!resolvedCaseSerialId) {
                toast.error("אנא הזן/י מספר תיק");
                return false;
            }

            let normalizedCaseDetailsList = state.caseDetailsList;

            if (isEdit) {
                const hourValue = state.selectedStartHour;
                if (hourValue === SAVE_PATIENT_DEFAULTS.EMPTY_VALUE) {
                    toast.error("אנא בחר/י שעה לתחילת הטבלה");
                    return false;
                }

                normalizedCaseDetailsList =
                    normalizeCaseDetailsGridHoursForSave(state.caseDetailsList);

                const gridHoursError = validateCaseDetailsGridHours(
                    normalizedCaseDetailsList,
                );
                if (gridHoursError) {
                    toast.error(gridHoursError);
                    return false;
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
                    return false;
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
                    if (reloadAfterEdit) {
                        state.setReloadCase((previousReloadCase) => !previousReloadCase);
                    }
                    return true;
                } catch {
                    return false;
                } finally {
                    state.disableSaveBtns(false);
                    state.setDisableAddCaseDetailsTable(false);
                }
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
                state.setInitialStateSnapshot(null);
                state.disableSaveBtns(false);
                if (navigateOnCreate) {
                    beforeNavigation?.();
                    navigate(AppRoutes.Patients.List);
                }
                return true;
            } catch {
                state.disableSaveBtns(false);
                return false;
            }
        },
        [
            beforeNavigation,
            caseId,
            createPatient,
            hasChanges,
            isEdit,
            navigate,
            state,
            updatePatient,
            uploadPatientImageIfNeeded,
        ],
    );

    const savePatient = state.handlePatientFormSubmit(
        async () => {
            await savePatientChanges({
                navigateOnCreate: true,
                reloadAfterEdit: true,
            });
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
        const shouldArchive = !state.isArchived;
        archivePatientMutation.mutate(
            { caseId: caseSerialId, shouldArchive },
            {
                onSuccess: () => {
                    state.setShowArchiveConfirmationModal(false);
                    state.setIsArchived(shouldArchive);
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
        savePatientChanges,
        exportCaseDetails,
        addNewCaseDailyDetails,
        archivePatient,
    };
}
