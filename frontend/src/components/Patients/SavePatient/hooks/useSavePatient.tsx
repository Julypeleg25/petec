import {
  type CaseDetailsResponseDTO,
  type EditPatientDTO,
  type NewPatientDTO,
} from "@petec/shared";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { downloadFileFromBlob } from "../../../../utils/FileUtils";
import { usePatientApi } from "../../../../features/patients/hooks/usePatientApi";
import {
  useActiveSystemTypes,
  useRaceTypesByAnimal,
} from "../../../../features/system-management/hooks/useSystemTypes";
import { useUserApi } from "../../../../features/system-management/hooks/useUserApi";
import { patientsApi } from "../../../../features/patients/patients.api";
import type { SelectOptionObj } from "../../../../utils/FormSelect/FormSelect.types";
import {
  type NewPatientData,
  type ChildCaseData,
  defaultCaseDailyDataTemplate,
} from "../types/savePatient.types";
import type { CaseDetailsData } from "../../CaseDetailsTable/CaseDetailsTable.types";
import { getCaseDayPrimaryDataRow } from "../../CaseDetailsTable/caseGrid.utils";
import { getDateForInput } from "../../../../utils/DateFormattingUtil";
import {
  SAVE_PATIENT_DEFAULTS,
  SAVE_PATIENT_ELEMENT_IDS,
  SAVE_PATIENT_ROUTES,
  SAVE_PATIENT_SYSTEM_TYPE_NAMES,
} from "../constants/savePatient.constants";
import {
  isCatheterReplacementDue,
  mapCaseDetailsApiGridToUi,
  mapCaseDetailsGridToDto,
  toChildCases,
  toSelectOptions,
  toStaffOptions,
} from "../utils/savePatient.utils";
import {
  buildNewCaseDailyDetailsTemplate,
  normalizeCaseDetailsGridHoursForSave,
  toLocalDateFromInputValue,
  toOptionalNumber,
  validateCaseDetailsGridHours,
} from "./savePatient.utils";
import {
  getEmptyFormData,
  normalizeFormValue,
  type InputChangeEvent,
  savePatientFormResolver,
  setByPath,
} from "./useSavePatient.form.utils";

type ShouldApplyState = () => boolean;

const useMappedSelectOptions = <T,>(
  data: ReadonlyArray<T> | undefined,
  mapper: (items: ReadonlyArray<T>) => SelectOptionObj[],
  setter: React.Dispatch<React.SetStateAction<SelectOptionObj[]>>,
): void => {
  useEffect(() => {
    if (!data) {
      return;
    }

    setter(mapper(data));
  }, [data, mapper, setter]);
};

export function useSavePatient(
  caseIdString: string,
  caseId: string | undefined,
  masterCaseId: string | undefined,
  isEdit: boolean,
) {
  const navigate = useNavigate();
  const mountedRef = useRef(true);

  const {
    createPatient,
    updatePatient,
    uploadPatientPhoto,
    exportCase,
    archivePatient: archivePatientMutation,
  } = usePatientApi();

  const { doctorsQuery, nursesQuery } = useUserApi({
    includeUsersQuery: false,
  });

  // --- System types queries ---
  const genderTypesQuery = useActiveSystemTypes(
    SAVE_PATIENT_SYSTEM_TYPE_NAMES.GENDER,
  );
  const animalTypesQuery = useActiveSystemTypes(
    SAVE_PATIENT_SYSTEM_TYPE_NAMES.ANIMAL,
  );
  const animalColorsQuery = useActiveSystemTypes(
    SAVE_PATIENT_SYSTEM_TYPE_NAMES.ANIMAL_COLOR,
  );
  const insuranceTypesQuery = useActiveSystemTypes(
    SAVE_PATIENT_SYSTEM_TYPE_NAMES.INSURANCE,
  );
  const foodTypesQuery = useActiveSystemTypes(
    SAVE_PATIENT_SYSTEM_TYPE_NAMES.FOOD,
  );

  const [selectedAnimalTypeForRace, setSelectedAnimalTypeForRace] =
    useState<string>(SAVE_PATIENT_DEFAULTS.EMPTY_VALUE);
  const raceTypesQuery = useRaceTypesByAnimal(selectedAnimalTypeForRace);

  // --- Main state ---
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<NewPatientData>(getEmptyFormData());

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

  // --- Flags ---
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

  // --- Case details table UI state ---
  const [selectedCaseDate, setSelectedCaseDate] = useState(
    getDateForInput(new Date()),
  );
  const [selectedStartHour, setSelectedStartHour] = useState<string>(
    SAVE_PATIENT_DEFAULTS.EMPTY_VALUE,
  );
  const [showCaseDetailsDaysOptions, setShowCaseDetailsDaysOptions] =
    useState(false);
  const [caseDetailsList, setCaseDetailsList] = useState<CaseDetailsData[][]>([
    defaultCaseDailyDataTemplate,
  ]);
  const [caseDetailsDataIndex, setCaseDetailsDataIndex] = useState(0);
  const [disableAddCaseDetailsTable, setDisableAddCaseDetailsTable] =
    useState(false);

  // --- Modals ---
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

  // --- Modes ---
  const [paintingMode, setPaintingMode] = useState(false);
  const [editableFieldsMode, setEditableFieldsMode] = useState(false);

  // --- Misc ---
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
    defaultValues: getEmptyFormData(),
  });

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

  const getRaceTypes = useCallback((animalId: number | string) => {
    setSelectedAnimalTypeForRace(String(animalId));
  }, []);

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

      if (
        isCatheterReplacementDue(
          cd.catheter_date_for_input ?? null,
          SAVE_PATIENT_DEFAULTS.CATHETER_REPLACEMENT_DAYS_THRESHOLD,
        )
      ) {
        setShowCatheterReplacementModal(true);
      }

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
      setSelectedFoodType(cd.food_type_id ?? SAVE_PATIENT_DEFAULTS.EMPTY_VALUE);
      setSelectedRaceType(cd.race_id ?? SAVE_PATIENT_DEFAULTS.EMPTY_VALUE);
      setSelectedDoctor(cd.doctor_id ?? SAVE_PATIENT_DEFAULTS.EMPTY_VALUE);
      setSelectedNurse(cd.nurse_id ?? SAVE_PATIENT_DEFAULTS.EMPTY_VALUE);

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

      setDisableAddCaseDetailsTable(grid === null);
      if (grid === null) {
        setCaseDetailsList([defaultCaseDailyDataTemplate]);
        setShowCaseDetailsDaysOptions(false);
        setSelectedCaseDate(SAVE_PATIENT_DEFAULTS.CASE_DATE_FALLBACK);
        setSelectedStartHour(SAVE_PATIENT_DEFAULTS.EMPTY_VALUE);
        return;
      }

      setShowCaseDetailsDaysOptions(true);
      const ordered = [...grid].reverse();
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

      setChildCases(toChildCases(response.masterCaseDetails));
    },
    [getRaceTypes, resetPatientForm],
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
      } catch (e) {
        if (shouldApplyState()) {
          setLoading(false);
        }
      }
    },
    [applyCaseDetailsResponseToState, caseIdString, masterCaseId],
  );

  const setTimeSelectionValue = useCallback((value: string) => {
    if (!value) {
      setSelectedStartHour(SAVE_PATIENT_DEFAULTS.EMPTY_VALUE);
      return;
    }
    setSelectedStartHour(String(Number(value)));
  }, []);

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
        setPhotoName(response.photoName);
      } catch {
        toast.error("שמירת תמונת המטופל נכשלה");
      }
    },
    [uploadPatientPhoto],
  );

  const savePatient = handlePatientFormSubmit(
    async () => {
      const resolvedCaseSerialId = formData.caseId;
      if (!resolvedCaseSerialId) {
        toast.error("אנא הזן/י מספר תיק");
        return;
      }

      let normalizedCaseDetailsList = caseDetailsList;

      if (isEdit) {
        const hourValue = selectedStartHour;
        if (hourValue === SAVE_PATIENT_DEFAULTS.EMPTY_VALUE) {
          toast.error("אנא בחר/י שעה לתחילת הטבלה");
          return;
        }

        normalizedCaseDetailsList =
          normalizeCaseDetailsGridHoursForSave(caseDetailsList);

        const gridHoursError = validateCaseDetailsGridHours(
          normalizedCaseDetailsList,
        );
        if (gridHoursError) {
          toast.error(gridHoursError);
          return;
        }

        setCaseDetailsList(normalizedCaseDetailsList);
      }

      disableSaveBtns(true);

      const baseBody: Omit<NewPatientDTO, "caseId"> = {
        name: formData.name,
        owner: { name: formData.owner.name, phone: formData.owner.phone },
        admission: {
          hospitalizationReason:
            formData.admission?.hospitalizationReason || undefined,
          referringDoctor: formData.admission?.referringDoctor || undefined,
          allergicComments: formData.admission?.allergicComments || undefined,
          bloodTestLink: formData.admission?.bloodTestLink || undefined,
        },
        patientSnapshot: {
          ageYears: toOptionalNumber(formData.patientSnapshot?.ageYears),
          ageMonths: toOptionalNumber(formData.patientSnapshot?.ageMonths),
          weightKg: toOptionalNumber(formData.patientSnapshot?.weightKg),
        },
        flags: {
          isAllergic,
          isEscapePotential,
          isNPO,
          isRiskAnesthesia,
          isHeartMurmur,
          isAMB,
          isAggressive,
          isConvenia,
          isCerenia,
          isProcedure,
        },
        dates: {
          catheterDate: formData.dates?.catheterDate
            ? new Date(formData.dates.catheterDate)
            : undefined,
          procedureDate: formData.dates?.procedureDate
            ? new Date(formData.dates.procedureDate)
            : undefined,
        },
        refs: {
          animalTypeId: selectedAnimalType || undefined,
          genderTypeId: selectedGenderType || undefined,
          raceTypeId: selectedRaceType || undefined,
          animalColorId: selectedAnimalColor || undefined,
          insuranceTypeId: selectedInsurance || undefined,
          foodTypeId: selectedFoodType || undefined,
        },
        doctorUserId: selectedDoctor || undefined,
        nurseUserId: selectedNurse || undefined,
        comments: formData.comments || undefined,
      };

      if (isEdit) {
        if (!caseId) {
          toast.error("פרטי התיק חסרים");
          disableSaveBtns(false);
          return;
        }

        const editBody: EditPatientDTO = {
          ...baseBody,
          caseId: resolvedCaseSerialId,
          caseDetails: mapCaseDetailsGridToDto(normalizedCaseDetailsList),
        };
        try {
          await updatePatient.mutateAsync(editBody);
          await uploadPatientImageIfNeeded(patientId, selectedFile);
          setSelectedFile(null);
          exportCaseDetails();
        } catch {
          // Keep existing mutation error handling behavior.
        } finally {
          disableSaveBtns(false);
          setDisableAddCaseDetailsTable(false);
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
          await uploadPatientImageIfNeeded(created.patientId, selectedFile);
        } else if (selectedFile) {
          toast.error("המטופל נשמר ללא מזהה מטופל, העלאת תמונה דולגה");
        }
        setSelectedFile(null);
        navigate(SAVE_PATIENT_ROUTES.PATIENTS_LIST);
      } catch {
        disableSaveBtns(false);
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
      const defaultCaseDailyData =
        buildNewCaseDailyDetailsTemplate(caseDetailsList);
      setCaseDetailsList([defaultCaseDailyData, ...caseDetailsList]);
      setCaseDetailsDataIndex(0);
      setShowCaseDetailsDaysOptions(true);
      setDisableAddCaseDetailsTable(true);
      setTimeSelectionValue(SAVE_PATIENT_DEFAULTS.EMPTY_VALUE);
      const firstDataRow = getCaseDayPrimaryDataRow(defaultCaseDailyData);
      setSelectedCaseDate(
        firstDataRow?.date ?? SAVE_PATIENT_DEFAULTS.CASE_DATE_FALLBACK,
      );
    },
    [caseDetailsList, setTimeSelectionValue],
  );

  const exportCaseDetails = useCallback(() => {
    if (!caseId) return;
    exportCase.mutate(caseId, {
      onSuccess: (blob: Blob) => {
        downloadFileFromBlob(
          { data: blob, headers: {} },
          SAVE_PATIENT_DEFAULTS.PDF_MIME_TYPE,
          SAVE_PATIENT_DEFAULTS.PDF_FILE_NAME,
        );
      },
    });
  }, [caseId, exportCase]);

  const archivePatient = useCallback(() => {
    const caseSerialId = formData.caseId;
    if (!caseSerialId) return;
    archivePatientMutation.mutate(
      { caseId: caseSerialId },
      {
        onSuccess: () => {
          setShowArchiveConfirmationModal(false);
          setIsArchived((prev) => !prev);
        },
      },
    );
  }, [archivePatientMutation, formData.caseId]);

  const handleCellClick = useCallback(
    async (e: React.MouseEvent<HTMLElement>, currentIsEditableVal: boolean) => {
      if (paintingMode) {
        let counter = 0;
        let target = e.target as HTMLElement;

        while (
          !target.classList.contains("case-details-table-body-row-cell") &&
          counter < SAVE_PATIENT_DEFAULTS.MAX_PARENT_HOPS
        ) {
          counter++;
          target = target.parentElement as HTMLElement;
        }

        const isRequired = target.classList.contains("required-cell");
        target.classList.toggle("required-cell");
        return !isRequired;
      }

      if (editableFieldsMode) return !currentIsEditableVal;
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
    [],
  );

  const handleSetEditableFieldsButtonClick = useCallback(
    (e: React.MouseEvent | React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      setEditableFieldsMode((prev) => !prev);
      setPaintingMode(false);
    },
    [],
  );

  const handlePaintingModeDocumentClick = useCallback(
    (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        paintingMode &&
        target &&
        !target.closest(".case-details-table-body") &&
        !target.closest(`#${SAVE_PATIENT_ELEMENT_IDS.PAINT_BUTTON}`)
      ) {
        setPaintingMode(false);
      }
    },
    [paintingMode],
  );

  const handleSetEditableFieldsModeDocumentClick = useCallback(
    (e: MouseEvent) => {
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
    },
    [editableFieldsMode],
  );

  // --- Derived option mapping effects ---
  useMappedSelectOptions(
    genderTypesQuery.data,
    toSelectOptions,
    setGenderTypes,
  );
  useMappedSelectOptions(
    animalTypesQuery.data,
    toSelectOptions,
    setAnimalTypes,
  );
  useMappedSelectOptions(
    animalColorsQuery.data,
    toSelectOptions,
    setAnimalColors,
  );
  useMappedSelectOptions(
    insuranceTypesQuery.data,
    toSelectOptions,
    setInsuranceList,
  );
  useMappedSelectOptions(foodTypesQuery.data, toSelectOptions, setFoodTypes);
  useMappedSelectOptions(doctorsQuery.data, toStaffOptions, setDoctors);
  useMappedSelectOptions(nursesQuery.data, toStaffOptions, setNurses);
  useMappedSelectOptions(raceTypesQuery.data, toSelectOptions, setRaceTypes);

  // --- Load case details ---
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
      setLoading(false);
    }

    return () => {
      isMounted = false;
      mountedRef.current = false;
    };
  }, [getCaseDetailsData, isEdit, reloadCase, setTimeSelectionValue]);

  // --- Document click handlers ---
  useEffect(() => {
    document.addEventListener(
      "click",
      handleSetEditableFieldsModeDocumentClick,
    );
    document.addEventListener("click", handlePaintingModeDocumentClick);
    return () => {
      document.removeEventListener(
        "click",
        handleSetEditableFieldsModeDocumentClick,
      );
      document.removeEventListener("click", handlePaintingModeDocumentClick);
    };
  }, [
    handlePaintingModeDocumentClick,
    handleSetEditableFieldsModeDocumentClick,
  ]);

  return {
    navigate,
    isSaveButtonsDisabled,
    loading,
    setLoading,
    formData,
    handleInputChange,

    isArchived,
    selectedFile,
    setSelectedFile,

    genderTypes,
    selectedGenderType,
    setSelectedGenderType,
    animalTypes,
    selectedAnimalType,
    setSelectedAnimalType,
    animalColors,
    selectedAnimalColor,
    setSelectedAnimalColor,
    insuranceList,
    selectedInsurance,
    setSelectedInsurance,
    foodTypes,
    selectedFoodType,
    setSelectedFoodType,
    raceTypes,
    selectedRaceType,
    setSelectedRaceType,
    doctors,
    selectedDoctor,
    setSelectedDoctor,
    nurses,
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
    disableAddCaseDetailsTable,
    setDisableAddCaseDetailsTable,
    childCases,
    setChildCases,
    reloadCase,
    setReloadCase,

    savePatient,
    getRaceTypes,
    addNewCaseDailyDetails,
    exportCaseDetails,
    handleCellClick,
    handlePaintingModeButtonClick,
    handleSetEditableFieldsButtonClick,
    archivePatient,
    setTimeSelectionValue,
  };
}
