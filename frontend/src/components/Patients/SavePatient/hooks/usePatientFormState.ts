import React, { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import type { SelectOptionObj } from "../../../../utils/FormSelect/FormSelect.types";
import type { NewPatientData, ChildCaseData } from "../types/savePatient.types";
import type { CaseDetailsData } from "../../CaseDetailsTable/CaseDetailsTable.types";
import { getDateForInput } from "../../../../utils/DateFormattingUtil";
import { SAVE_PATIENT_DEFAULTS } from "../constants/savePatient.constants";
import { buildEmptyCaseDailyDetailsTemplate } from "../utils/savePatientCaseDetails.utils";
import {
    getEmptyFormData,
    normalizeFormValue,
    savePatientFormResolver,
    setByPath,
    type InputChangeEvent,
} from "../utils/savePatientForm.utils";

export function usePatientFormState(initialFormData?: NewPatientData) {
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState<NewPatientData>(
        () => initialFormData ?? getEmptyFormData(),
    );
    const [initialStateSnapshot, setInitialStateSnapshot] = useState<string | null>(null);

    const [isArchived, setIsArchived] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const [genderTypes, setGenderTypes] = useState<SelectOptionObj[]>([]);
    const [selectedGenderType, setSelectedGenderType] = useState<string>(
        SAVE_PATIENT_DEFAULTS.EMPTY_VALUE,
    );

    const [animalTypes, setAnimalTypes] = useState<SelectOptionObj[]>([]);
    const [selectedAnimalType, setSelectedAnimalType] = useState<string>(
        SAVE_PATIENT_DEFAULTS.EMPTY_VALUE,
    );

    const [animalColors, setAnimalColors] = useState<SelectOptionObj[]>([]);
    const [selectedAnimalColor, setSelectedAnimalColor] = useState<string>(
        SAVE_PATIENT_DEFAULTS.EMPTY_VALUE,
    );

    const [insuranceList, setInsuranceList] = useState<SelectOptionObj[]>([]);
    const [selectedInsurance, setSelectedInsurance] = useState<string>(
        SAVE_PATIENT_DEFAULTS.EMPTY_VALUE,
    );

    const [foodTypes, setFoodTypes] = useState<SelectOptionObj[]>([]);
    const [selectedFoodType, setSelectedFoodType] = useState<string>(
        SAVE_PATIENT_DEFAULTS.EMPTY_VALUE,
    );

    const [raceTypes, setRaceTypes] = useState<SelectOptionObj[]>([]);
    const [selectedRaceType, setSelectedRaceType] = useState<string>(
        SAVE_PATIENT_DEFAULTS.EMPTY_VALUE,
    );

    const [doctors, setDoctors] = useState<SelectOptionObj[]>([]);
    const [selectedDoctor, setSelectedDoctor] = useState<string>(
        SAVE_PATIENT_DEFAULTS.EMPTY_VALUE,
    );

    const [nurses, setNurses] = useState<SelectOptionObj[]>([]);
    const [selectedNurse, setSelectedNurse] = useState<string>(
        SAVE_PATIENT_DEFAULTS.EMPTY_VALUE,
    );

    const [isConvenia, setIsConvenia] = useState(false);
    const [isAllergic, setIsAllergic] = useState(false);
    const [isEscapePotential, setIsEscapePotential] = useState(false);
    const [isNPO, setIsNPO] = useState(false);
    const [isRiskAnesthesia, setIsRiskAnesthesia] = useState(false);
    const [isHeartMurmur, setIsHeartMurmur] = useState(false);
    const [isAMB, setIsAMB] = useState(false);
    const [isAggressive, setIsAggressive] = useState(false);
    const [isCerenia, setIsCerenia] = useState(false);
    const [isProcedure, setIsProcedure] = useState(false);
    const [isReleased, setIsReleased] = useState(false);

    const [selectedCaseDate, setSelectedCaseDate] = useState(
        getDateForInput(new Date()),
    );
    const [selectedStartHour, setSelectedStartHour] = useState<string>(
        SAVE_PATIENT_DEFAULTS.EMPTY_VALUE,
    );
    const [showCaseDetailsDaysOptions, setShowCaseDetailsDaysOptions] =
        useState(false);
    const [caseDetailsList, setCaseDetailsList] = useState<CaseDetailsData[][]>(() => [
        buildEmptyCaseDailyDetailsTemplate(),
    ]);
    const [caseDetailsDataIndex, setCaseDetailsDataIndex] = useState(0);

    const [showReleasePatientModal, setShowReleasePatientModal] = useState(false);
    const [showPatientDocumentsModal, setShowPatientDocumentsModal] =
        useState(false);
    const [showPatientChartsModal, setShowPatientChartsModal] = useState(false);
    const [showDeletePatientCaseModal, setShowDeletePatientCaseModal] =
        useState(false);
    const [showArchiveConfirmationModal, setShowArchiveConfirmationModal] =
        useState(false);
    const [showCatheterReplacementModal, setShowCatheterReplacementModal] =
        useState(false);

    const [paintingMode, setPaintingMode] = useState(false);
    const [editableFieldsMode, setEditableFieldsMode] = useState(false);

    const [photoName, setPhotoName] = useState<string | undefined>();
    const [patientId, setPatientId] = useState<string>(
        SAVE_PATIENT_DEFAULTS.INITIAL_PATIENT_ID,
    );
    const [childCases, setChildCases] = useState<ChildCaseData[]>([]);
    const [reloadCase, setReloadCase] = useState(false);
    const [isSaveButtonsDisabled, setIsSaveButtonsDisabled] = useState(false);

    const {
        handleSubmit: handlePatientFormSubmit,
        setValue: setPatientFormValue,
        reset: resetPatientForm,
    } = useForm<NewPatientData>({
        resolver: savePatientFormResolver,
        defaultValues: initialFormData ?? getEmptyFormData(),
    });

    const withDirty = useCallback(
        <T,>(setter: React.Dispatch<React.SetStateAction<T>>) =>
            (value: React.SetStateAction<T>) => {
                setter(value);
            },
        [],
    );

    const disableSaveBtns = useCallback((isDisable: boolean) => {
        setIsSaveButtonsDisabled(isDisable);
    }, []);

    const handleInputChange = useCallback(
        (valOrEvent: InputChangeEvent, nameParams?: string | number | object) => {
            const isPrimitive =
                valOrEvent === null ||
                valOrEvent instanceof Date ||
                typeof valOrEvent === "string";

            const name = isPrimitive
                ? typeof nameParams === "string"
                    ? nameParams
                    : ""
                : valOrEvent.target.name;
            const rawValue = isPrimitive
                ? (valOrEvent as string | Date | null)
                : valOrEvent.target.value;

            if (!name) return;

            const normalizedValue = normalizeFormValue(name, rawValue);
            type SetPatientFormValueName = Parameters<typeof setPatientFormValue>[0];
            type SetPatientFormValuePayload = Parameters<
                typeof setPatientFormValue
            >[1];

            setFormData((prev) => setByPath(prev, name, normalizedValue));
            setPatientFormValue(
                name as SetPatientFormValueName,
                normalizedValue as SetPatientFormValuePayload,
                {
                    shouldDirty: true,
                    shouldValidate: true,
                },
            );
        },
        [setPatientFormValue],
    );

    const setTimeSelectionValue = useCallback((value: string) => {
        if (!value) {
            setSelectedStartHour(SAVE_PATIENT_DEFAULTS.EMPTY_VALUE);
            return;
        }
        setSelectedStartHour(String(Number(value)));
    }, []);

    return {
        loading,
        setLoading,
        formData,
        setFormData,
        initialStateSnapshot,
        setInitialStateSnapshot,
        isSaveButtonsDisabled,
        disableSaveBtns,

        isArchived,
        setIsArchived,
        selectedFile,
        setSelectedFile,

        genderTypes,
        setGenderTypes,
        selectedGenderType,
        setSelectedGenderType,
        animalTypes,
        setAnimalTypes,
        selectedAnimalType,
        setSelectedAnimalType,
        animalColors,
        setAnimalColors,
        selectedAnimalColor,
        setSelectedAnimalColor,
        insuranceList,
        setInsuranceList,
        selectedInsurance,
        setSelectedInsurance,
        foodTypes,
        setFoodTypes,
        selectedFoodType,
        setSelectedFoodType,
        raceTypes,
        setRaceTypes,
        selectedRaceType,
        setSelectedRaceType,
        doctors,
        setDoctors,
        selectedDoctor,
        setSelectedDoctor,
        nurses,
        setNurses,
        selectedNurse,
        setSelectedNurse,

        isConvenia,
        setIsConvenia,
        isAllergic,
        setIsAllergic,
        isEscapePotential,
        setIsEscapePotential,
        isNPO,
        setIsNPO,
        isRiskAnesthesia,
        setIsRiskAnesthesia,
        isHeartMurmur,
        setIsHeartMurmur,
        isAMB,
        setIsAMB,
        isAggressive,
        setIsAggressive,
        isCerenia,
        setIsCerenia,
        isProcedure,
        setIsProcedure,
        isReleased,
        setIsReleased,

        selectedCaseDate,
        setSelectedCaseDate,
        selectedStartHour,
        setSelectedStartHour,
        showCaseDetailsDaysOptions,
        setShowCaseDetailsDaysOptions,
        caseDetailsList,
        setCaseDetailsList,
        caseDetailsDataIndex,
        setCaseDetailsDataIndex,

        showReleasePatientModal,
        setShowReleasePatientModal,
        showPatientDocumentsModal,
        setShowPatientDocumentsModal,
        showPatientChartsModal,
        setShowPatientChartsModal,
        showDeletePatientCaseModal,
        setShowDeletePatientCaseModal,
        showArchiveConfirmationModal,
        setShowArchiveConfirmationModal,
        showCatheterReplacementModal,
        setShowCatheterReplacementModal,

        paintingMode,
        setPaintingMode,
        editableFieldsMode,
        setEditableFieldsMode,

        photoName,
        setPhotoName,
        patientId,
        setPatientId,
        childCases,
        setChildCases,
        reloadCase,
        setReloadCase,

        handleInputChange,
        handlePatientFormSubmit,
        resetPatientForm,
        setTimeSelectionValue,
        withDirty,
    };
}

export type PatientFormState = ReturnType<typeof usePatientFormState>;
