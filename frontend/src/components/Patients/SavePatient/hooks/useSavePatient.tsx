import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useActiveSystemTypes,
  useRaceTypesByAnimal,
  useUserApi,
} from "../../../../features/system-management";
import {
  SAVE_PATIENT_DEFAULTS,
  SAVE_PATIENT_ELEMENT_IDS,
  SAVE_PATIENT_SYSTEM_TYPE_NAMES,
} from "../constants/savePatient.constants";
import {
  toSelectOptions,
  toStaffOptions,
} from "../utils/savePatient.utils";
import { useMappedSelectOptions } from "./useMappedSelectOptions";
import { usePatientFormState } from "./usePatientFormState";
import { useCaseDetailsState } from "./useCaseDetailsState";
import { useSavePatientActions } from "./useSavePatientActions";
import { buildSavePatientChangeSnapshot } from "../utils/savePatientChangeTracking.utils";
import type { NewPatientData } from "../types/savePatient.types";
import type { ClinicaNewPatientState } from "../../../../features/clinica/types/clinicaNewPatient.types";
import { mapClinicaStateToNewPatientFormData } from "../../../../features/clinica/mappers/clinicaClientToNewPatient.mapper";
import type { SelectOptionObj } from "../../../../utils/FormSelect/FormSelect.types";

const normalizeOptionText = (value?: string): string =>
  value?.trim().replace(/\s+/g, " ").toLowerCase() ?? "";

const findOptionValueByText = (
  options: readonly SelectOptionObj[],
  value?: string,
): string => {
  const normalizedValue = normalizeOptionText(value);

  if (!normalizedValue) {
    return "";
  }

  return (
    options.find((option) => normalizeOptionText(option.text) === normalizedValue)
      ?.value ?? ""
  );
};

export function useSavePatient(
  caseIdString: string,
  caseId: string | undefined,
  masterCaseId: string | undefined,
  isEdit: boolean,
  beforeNavigation?: () => void,
  initialFormData?: NewPatientData,
  initialClinicaState?: ClinicaNewPatientState,
) {
  const mountedRef = useRef(true);
  const clinicaSelectPrefillRef = useRef({
    animal: false,
    color: false,
    doctor: false,
    gender: false,
    insurance: false,
    race: false,
  });
  const [activeClinicaPrefillState, setActiveClinicaPrefillState] =
    useState<ClinicaNewPatientState | undefined>(initialClinicaState);
  const state = usePatientFormState(initialFormData);
  const {
    editableFieldsMode,
    paintingMode,
    reloadCase,
    setEditableFieldsMode,
    setLoading,
    setPaintingMode,
    setShowCatheterReplacementModal,
    setTimeSelectionValue,
  } = state;

  const [selectedAnimalTypeForRace, setSelectedAnimalTypeForRace] =
    useState<string>(SAVE_PATIENT_DEFAULTS.EMPTY_VALUE);

  const getRaceTypes = useCallback((animalId: number | string) => {
    setSelectedAnimalTypeForRace(String(animalId));
  }, []);

  const { doctorsQuery, nursesQuery } = useUserApi({
    includeUsersQuery: false,
  });
  const genderTypesQuery = useActiveSystemTypes(SAVE_PATIENT_SYSTEM_TYPE_NAMES.GENDER);
  const animalTypesQuery = useActiveSystemTypes(SAVE_PATIENT_SYSTEM_TYPE_NAMES.ANIMAL);
  const animalColorsQuery = useActiveSystemTypes(SAVE_PATIENT_SYSTEM_TYPE_NAMES.ANIMAL_COLOR);
  const insuranceTypesQuery = useActiveSystemTypes(SAVE_PATIENT_SYSTEM_TYPE_NAMES.INSURANCE);
  const foodTypesQuery = useActiveSystemTypes(SAVE_PATIENT_SYSTEM_TYPE_NAMES.FOOD);
  const raceTypesQuery = useRaceTypesByAnimal(selectedAnimalTypeForRace);

  useMappedSelectOptions(genderTypesQuery.data, toSelectOptions, state.setGenderTypes);
  useMappedSelectOptions(animalTypesQuery.data, toSelectOptions, state.setAnimalTypes);
  useMappedSelectOptions(animalColorsQuery.data, toSelectOptions, state.setAnimalColors);
  useMappedSelectOptions(insuranceTypesQuery.data, toSelectOptions, state.setInsuranceList);
  useMappedSelectOptions(foodTypesQuery.data, toSelectOptions, state.setFoodTypes);
  useMappedSelectOptions(doctorsQuery.data, toStaffOptions, state.setDoctors);
  useMappedSelectOptions(nursesQuery.data, toStaffOptions, state.setNurses);
  useMappedSelectOptions(raceTypesQuery.data, toSelectOptions, state.setRaceTypes);

  useEffect(() => {
    if (!activeClinicaPrefillState || isEdit) {
      return;
    }

    const snapshot = activeClinicaPrefillState.patientSnapshot;
    const prefillStatus = clinicaSelectPrefillRef.current;

    if (!prefillStatus.gender && state.selectedGenderType === SAVE_PATIENT_DEFAULTS.EMPTY_VALUE) {
      const value = findOptionValueByText(state.genderTypes, snapshot.gender);
      if (value) {
        state.setSelectedGenderType(value);
        prefillStatus.gender = true;
      }
    }

    if (!prefillStatus.animal && state.selectedAnimalType === SAVE_PATIENT_DEFAULTS.EMPTY_VALUE) {
      const value = findOptionValueByText(state.animalTypes, snapshot.species);
      if (value) {
        state.setSelectedAnimalType(value);
        getRaceTypes(value);
        prefillStatus.animal = true;
      }
    }

    if (!prefillStatus.race && state.selectedRaceType === SAVE_PATIENT_DEFAULTS.EMPTY_VALUE) {
      const value = findOptionValueByText(state.raceTypes, snapshot.breed);
      if (value) {
        state.setSelectedRaceType(value);
        prefillStatus.race = true;
      }
    }

    if (!prefillStatus.color && state.selectedAnimalColor === SAVE_PATIENT_DEFAULTS.EMPTY_VALUE) {
      const value = findOptionValueByText(state.animalColors, snapshot.color);
      if (value) {
        state.setSelectedAnimalColor(value);
        prefillStatus.color = true;
      }
    }

    if (!prefillStatus.insurance && state.selectedInsurance === SAVE_PATIENT_DEFAULTS.EMPTY_VALUE) {
      const value = findOptionValueByText(state.insuranceList, snapshot.insurance);
      if (value) {
        state.setSelectedInsurance(value);
        prefillStatus.insurance = true;
      }
    }

    if (!prefillStatus.doctor && state.selectedDoctor === SAVE_PATIENT_DEFAULTS.EMPTY_VALUE) {
      const value = findOptionValueByText(state.doctors, snapshot.treatingDoctor);
      if (value) {
        state.setSelectedDoctor(value);
        prefillStatus.doctor = true;
      }
    }
  }, [
    getRaceTypes,
    activeClinicaPrefillState,
    isEdit,
    state.animalColors,
    state.animalTypes,
    state.doctors,
    state.genderTypes,
    state.insuranceList,
    state.raceTypes,
    state.selectedAnimalColor,
    state.selectedAnimalType,
    state.selectedDoctor,
    state.selectedGenderType,
    state.selectedInsurance,
    state.selectedRaceType,
    state.setSelectedAnimalColor,
    state.setSelectedAnimalType,
    state.setSelectedDoctor,
    state.setSelectedGenderType,
    state.setSelectedInsurance,
    state.setSelectedRaceType,
  ]);

  const applyClinicaPrefill = useCallback(
    (clinicaState: ClinicaNewPatientState) => {
      const nextFormData = mapClinicaStateToNewPatientFormData(clinicaState);
      const snapshot = clinicaState.patientSnapshot;

      clinicaSelectPrefillRef.current = {
        animal: false,
        color: false,
        doctor: false,
        gender: false,
        insurance: false,
        race: false,
      };
      state.setSelectedAnimalColor(SAVE_PATIENT_DEFAULTS.EMPTY_VALUE);
      state.setSelectedAnimalType(SAVE_PATIENT_DEFAULTS.EMPTY_VALUE);
      state.setSelectedDoctor(SAVE_PATIENT_DEFAULTS.EMPTY_VALUE);
      state.setSelectedGenderType(SAVE_PATIENT_DEFAULTS.EMPTY_VALUE);
      state.setSelectedInsurance(SAVE_PATIENT_DEFAULTS.EMPTY_VALUE);
      state.setSelectedRaceType(SAVE_PATIENT_DEFAULTS.EMPTY_VALUE);
      setActiveClinicaPrefillState(clinicaState);

      state.handleInputChange(nextFormData.caseId ?? "", "caseId");
      state.handleInputChange(nextFormData.name ?? "", "name");
      state.handleInputChange(nextFormData.owner?.name ?? "", "owner.name");
      state.handleInputChange(nextFormData.owner?.phone ?? "", "owner.phone");
      state.handleInputChange(nextFormData.comments ?? "", "comments");
      state.handleInputChange(
        nextFormData.admission?.referringDoctor ?? "",
        "admission.referringDoctor",
      );
      state.handleInputChange(
        snapshot.weightKg === undefined ? "" : String(snapshot.weightKg),
        "patientSnapshot.weightKg",
      );
      state.handleInputChange(
        snapshot.ageYears === undefined ? "" : String(snapshot.ageYears),
        "patientSnapshot.ageYears",
      );
      state.handleInputChange(
        snapshot.ageMonths === undefined ? "" : String(snapshot.ageMonths),
        "patientSnapshot.ageMonths",
      );
    },
    [
      state.handleInputChange,
      state.setSelectedAnimalColor,
      state.setSelectedAnimalType,
      state.setSelectedDoctor,
      state.setSelectedGenderType,
      state.setSelectedInsurance,
      state.setSelectedRaceType,
    ],
  );

  const clearClinicaPrefill = useCallback(() => {
    clinicaSelectPrefillRef.current = {
      animal: false,
      color: false,
      doctor: false,
      gender: false,
      insurance: false,
      race: false,
    };
    setActiveClinicaPrefillState(undefined);
    state.setSelectedAnimalColor(SAVE_PATIENT_DEFAULTS.EMPTY_VALUE);
    state.setSelectedAnimalType(SAVE_PATIENT_DEFAULTS.EMPTY_VALUE);
    state.setSelectedDoctor(SAVE_PATIENT_DEFAULTS.EMPTY_VALUE);
    state.setSelectedGenderType(SAVE_PATIENT_DEFAULTS.EMPTY_VALUE);
    state.setSelectedInsurance(SAVE_PATIENT_DEFAULTS.EMPTY_VALUE);
    state.setSelectedRaceType(SAVE_PATIENT_DEFAULTS.EMPTY_VALUE);
    state.handleInputChange("", "caseId");
    state.handleInputChange("", "name");
    state.handleInputChange("", "owner.name");
    state.handleInputChange("", "owner.phone");
    state.handleInputChange("", "comments");
    state.handleInputChange("", "admission.referringDoctor");
    state.handleInputChange("", "patientSnapshot.weightKg");
    state.handleInputChange("", "patientSnapshot.ageYears");
    state.handleInputChange("", "patientSnapshot.ageMonths");
  }, [
    state.handleInputChange,
    state.setSelectedAnimalColor,
    state.setSelectedAnimalType,
    state.setSelectedDoctor,
    state.setSelectedGenderType,
    state.setSelectedInsurance,
    state.setSelectedRaceType,
  ]);

  const { getCaseDetailsData } = useCaseDetailsState(
    state,
    caseIdString,
    masterCaseId,
    getRaceTypes,
  );

  const currentStateSnapshot = useMemo(
    () =>
      buildSavePatientChangeSnapshot({
        isEdit,
        formData: state.formData,
        selectedFile: state.selectedFile,
        selectedGenderType: state.selectedGenderType,
        selectedAnimalType: state.selectedAnimalType,
        selectedAnimalColor: state.selectedAnimalColor,
        selectedInsurance: state.selectedInsurance,
        selectedFoodType: state.selectedFoodType,
        selectedRaceType: state.selectedRaceType,
        selectedDoctor: state.selectedDoctor,
        selectedNurse: state.selectedNurse,
        isConvenia: state.isConvenia,
        isAllergic: state.isAllergic,
        isEscapePotential: state.isEscapePotential,
        isNPO: state.isNPO,
        isRiskAnesthesia: state.isRiskAnesthesia,
        isHeartMurmur: state.isHeartMurmur,
        isAMB: state.isAMB,
        isAggressive: state.isAggressive,
        isCerenia: state.isCerenia,
        isProcedure: state.isProcedure,
        caseDetailsList: state.caseDetailsList,
      }),
    [
      isEdit,
      state.caseDetailsList,
      state.formData,
      state.isAMB,
      state.isAggressive,
      state.isAllergic,
      state.isCerenia,
      state.isConvenia,
      state.isEscapePotential,
      state.isHeartMurmur,
      state.isNPO,
      state.isProcedure,
      state.isRiskAnesthesia,
      state.selectedAnimalColor,
      state.selectedAnimalType,
      state.selectedDoctor,
      state.selectedFile,
      state.selectedFoodType,
      state.selectedGenderType,
      state.selectedInsurance,
      state.selectedNurse,
      state.selectedRaceType,
    ],
  );

  useEffect(() => {
    if (state.loading || state.initialStateSnapshot !== null) {
      return;
    }

    state.setInitialStateSnapshot(currentStateSnapshot);
  }, [currentStateSnapshot, state, state.initialStateSnapshot, state.loading, state.setInitialStateSnapshot]);

  const hasChanges =
    state.initialStateSnapshot !== null &&
    currentStateSnapshot !== state.initialStateSnapshot;

  const actions = useSavePatientActions(
    state,
    caseId,
    isEdit,
    hasChanges,
    beforeNavigation,
  );

  const handleCellClick = useCallback(
    async (
      e: React.MouseEvent<HTMLElement>,
      currentIsEditableVal: boolean,
      currentIsRequiredVal: boolean,
    ) => {
      if (paintingMode) {
        e.preventDefault();
        e.stopPropagation();
        return !currentIsRequiredVal;
      }
      if (editableFieldsMode) {
        e.preventDefault();
        e.stopPropagation();
        return !currentIsEditableVal;
      }
      return null;
    },
    [editableFieldsMode, paintingMode],
  );

  const handlePaintingModeButtonClick = useCallback(
    (e: React.MouseEvent | React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      setPaintingMode((prev) => !prev);
      setEditableFieldsMode(false);
    },
    [setEditableFieldsMode, setPaintingMode],
  );

  const handleSetEditableFieldsButtonClick = useCallback(
    (e: React.MouseEvent | React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      setEditableFieldsMode((prev) => !prev);
      setPaintingMode(false);
    },
    [setEditableFieldsMode, setPaintingMode],
  );

  useEffect(() => {
    mountedRef.current = true;
    let isMounted = true;

    setLoading(true);
    if (isEdit) {
      getCaseDetailsData(() => isMounted).then(() => {
        if (!isMounted) return;
        setLoading(false);
      });
    } else {
      setShowCatheterReplacementModal(false);
      setLoading(false);
    }

    return () => {
      isMounted = false;
      mountedRef.current = false;
    };
  }, [
    getCaseDetailsData,
    isEdit,
    reloadCase,
    setLoading,
    setShowCatheterReplacementModal,
    setTimeSelectionValue,
  ]);

  useEffect(() => {
    const handlePaintingClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        paintingMode &&
        target &&
        !target.closest(".case-details-table-body") &&
        !target.closest(`#${SAVE_PATIENT_ELEMENT_IDS.PAINT_BUTTON}`)
      ) {
        setPaintingMode(false);
      }
    };

    const handleEditableClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        editableFieldsMode &&
        target &&
        !target.closest(".case-details-table-body") &&
        !target.closest(".un-editable-cell") &&
        !target.closest(
          `#${SAVE_PATIENT_ELEMENT_IDS.SET_EDITABLE_FIELDS_BUTTON}`,
        )
      ) {
        setEditableFieldsMode(false);
      }
    };

    document.addEventListener("click", handleEditableClick);
    document.addEventListener("click", handlePaintingClick);
    return () => {
      document.removeEventListener("click", handleEditableClick);
      document.removeEventListener("click", handlePaintingClick);
    };
  }, [editableFieldsMode, paintingMode, setEditableFieldsMode, setPaintingMode]);

  return {
    navigate: actions.navigate,
    isSaveButtonsDisabled: state.isSaveButtonsDisabled,
    hasChanges,
    isSaving: actions.isSaving,
    isExporting: actions.isExporting,
    isArchiving: actions.isArchiving,
    loading: state.loading,
    formData: state.formData,
    handleInputChange: state.handleInputChange,
    applyClinicaPrefill,
    clearClinicaPrefill,

    isArchived: state.isArchived,
    selectedFile: state.selectedFile,
    setSelectedFile: state.withDirty(state.setSelectedFile),

    genderTypes: state.genderTypes,
    selectedGenderType: state.selectedGenderType,
    setSelectedGenderType: state.withDirty(state.setSelectedGenderType),
    animalTypes: state.animalTypes,
    selectedAnimalType: state.selectedAnimalType,
    setSelectedAnimalType: state.withDirty(state.setSelectedAnimalType),
    animalColors: state.animalColors,
    selectedAnimalColor: state.selectedAnimalColor,
    setSelectedAnimalColor: state.withDirty(state.setSelectedAnimalColor),
    insuranceList: state.insuranceList,
    selectedInsurance: state.selectedInsurance,
    setSelectedInsurance: state.withDirty(state.setSelectedInsurance),
    foodTypes: state.foodTypes,
    selectedFoodType: state.selectedFoodType,
    setSelectedFoodType: state.withDirty(state.setSelectedFoodType),
    raceTypes: state.raceTypes,
    selectedRaceType: state.selectedRaceType,
    setSelectedRaceType: state.withDirty(state.setSelectedRaceType),
    doctors: state.doctors,
    selectedDoctor: state.selectedDoctor,
    setSelectedDoctor: state.withDirty(state.setSelectedDoctor),
    nurses: state.nurses,
    selectedNurse: state.selectedNurse,
    setSelectedNurse: state.withDirty(state.setSelectedNurse),

    isConvenia: state.isConvenia,
    setIsConvenia: state.withDirty(state.setIsConvenia),
    isAllergic: state.isAllergic,
    setIsAllergic: state.withDirty(state.setIsAllergic),
    isEscapePotential: state.isEscapePotential,
    setIsEscapePotential: state.withDirty(state.setIsEscapePotential),
    isNPO: state.isNPO,
    setIsNPO: state.withDirty(state.setIsNPO),
    isRiskAnesthesia: state.isRiskAnesthesia,
    setIsRiskAnesthesia: state.withDirty(state.setIsRiskAnesthesia),
    isHeartMurmur: state.isHeartMurmur,
    setIsHeartMurmur: state.withDirty(state.setIsHeartMurmur),
    isAMB: state.isAMB,
    setIsAMB: state.withDirty(state.setIsAMB),
    isAggressive: state.isAggressive,
    setIsAggressive: state.withDirty(state.setIsAggressive),
    isCerenia: state.isCerenia,
    setIsCerenia: state.withDirty(state.setIsCerenia),
    isProcedure: state.isProcedure,
    setIsProcedure: state.withDirty(state.setIsProcedure),
    isReleased: state.isReleased,
    setIsReleased: state.setIsReleased,

    selectedCaseDate: state.selectedCaseDate,
    setSelectedCaseDate: state.setSelectedCaseDate,
    selectedStartHour: state.selectedStartHour,
    showCaseDetailsDaysOptions: state.showCaseDetailsDaysOptions,
    caseDetailsList: state.caseDetailsList,
    setCaseDetailsList: state.withDirty(state.setCaseDetailsList),
    caseDetailsDataIndex: state.caseDetailsDataIndex,
    setCaseDetailsDataIndex: state.setCaseDetailsDataIndex,

    showReleasePatientModal: state.showReleasePatientModal,
    setShowReleasePatientModal: state.setShowReleasePatientModal,
    showPatientDocumentsModal: state.showPatientDocumentsModal,
    setShowPatientDocumentsModal: state.setShowPatientDocumentsModal,
    showPatientChartsModal: state.showPatientChartsModal,
    setShowPatientChartsModal: state.setShowPatientChartsModal,
    showDeletePatientCaseModal: state.showDeletePatientCaseModal,
    setShowDeletePatientCaseModal: state.setShowDeletePatientCaseModal,
    showArchiveConfirmationModal: state.showArchiveConfirmationModal,
    setShowArchiveConfirmationModal: state.setShowArchiveConfirmationModal,
    showCatheterReplacementModal: state.showCatheterReplacementModal,
    setShowCatheterReplacementModal: state.setShowCatheterReplacementModal,

    paintingMode: state.paintingMode,
    editableFieldsMode: state.editableFieldsMode,

    photoName: state.photoName,
    patientId: state.patientId,
    childCases: state.childCases,
    setReloadCase: state.setReloadCase,

    savePatient: actions.savePatient,
    savePatientChanges: actions.savePatientChanges,
    getRaceTypes,
    addNewCaseDailyDetails: actions.addNewCaseDailyDetails,
    deleteSelectedCaseDailyDetails: actions.deleteSelectedCaseDailyDetails,
    exportCaseDetails: actions.exportCaseDetails,
    handleCellClick,
    handlePaintingModeButtonClick,
    handleSetEditableFieldsButtonClick,
    archivePatient: actions.archivePatient,
    setTimeSelectionValue: state.setTimeSelectionValue,
  };
}
