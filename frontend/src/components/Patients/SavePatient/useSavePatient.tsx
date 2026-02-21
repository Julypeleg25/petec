import type { SimpleSystemTypeDTO, StaffMemberDTO } from "@petec/shared";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { downloadFileFromBlob } from "../../../utils/FileUtils";
import { usePatientApi } from "../../../features/patients/usePatientApi";
import {
  useSystemTypes,
  useRaceTypesByAnimal,
} from "../../../features/system-management/system-types.hooks";
import { useUserApi } from "../../../features/system-management/hooks/useUserApi";
import { patientsApi } from "../../../features/patients/patients.api";
import { SelectOptionObj } from "../../../utils/FormSelect/FormSelect.types";
import {
  NewPatientData,
  ChildCaseData,
  defaultCaseDailyDataTemplate,
} from "./SavePatient.types";
import { caseDetailsData } from "../CaseDetailsTable/CaseDetailsTable.types";
import { getFormattedDate } from "../../../utils/FormattingUtil";
import {
  SAVE_PATIENT_DEFAULTS,
  SAVE_PATIENT_ELEMENT_IDS,
  SAVE_PATIENT_ROUTES,
  SAVE_PATIENT_SYSTEM_TYPE_NAMES,
} from "./save-patient.constants";

export function useSavePatient(
  caseIdString: string,
  caseId: string | undefined,
  masterCaseId: string | undefined,
  isEdit: boolean,
) {
  const navigate = useNavigate();
  const saveBtnRef = useRef<HTMLButtonElement>(null);
  const saveDailyDetailsBtnRef = useRef<HTMLButtonElement>(null);
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const {
    createPatient,
    updatePatient,
    exportCase,
    archivePatient: archivePatientMutation,
  } = usePatientApi();
  const { doctorsQuery, nursesQuery } = useUserApi();

  const genderTypesQuery = useSystemTypes(SAVE_PATIENT_SYSTEM_TYPE_NAMES.GENDER);
  const animalTypesQuery = useSystemTypes(SAVE_PATIENT_SYSTEM_TYPE_NAMES.ANIMAL);
  const animalColorsQuery = useSystemTypes(SAVE_PATIENT_SYSTEM_TYPE_NAMES.ANIMAL_COLOR);
  const insuranceTypesQuery = useSystemTypes(SAVE_PATIENT_SYSTEM_TYPE_NAMES.INSURANCE);
  const foodTypesQuery = useSystemTypes(SAVE_PATIENT_SYSTEM_TYPE_NAMES.FOOD);
  const [selectedAnimalTypeForRace, setSelectedAnimalTypeForRace] =
    useState<string>(SAVE_PATIENT_DEFAULTS.EMPTY_VALUE);
  const raceTypesQuery = useRaceTypesByAnimal(selectedAnimalTypeForRace);

  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<NewPatientData>({
    patientName: "",
    ownerName: "",
    ownerPhoneNumber: "",
    referringDoctor: null,
    comments: "",
    hospitalizationReason: "",
    allergicComments: null,
    weightKg: undefined,
    caseId: undefined,
    ageYears: undefined,
    ageMonths: undefined,
    catheterDate: null,
    procedureDate: null,
    bloodTestLink: null,
  });
  const [isArchived, setIsArchived] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | Blob | null>(null);
  const [genderTypes, setGenderTypes] = useState<SelectOptionObj[]>([]);
  const [selectedGenderType, setSelectedGenderType] = useState<string>(SAVE_PATIENT_DEFAULTS.EMPTY_VALUE);
  const [animalTypes, setAnimalTypes] = useState<SelectOptionObj[]>([]);
  const [selectedAnimalType, setSelectedAnimalType] = useState<string>(SAVE_PATIENT_DEFAULTS.EMPTY_VALUE);
  const [animalColors, setAnimalColors] = useState<SelectOptionObj[]>([]);
  const [selectedAnimalColor, setSelectedAnimalColor] = useState<string>(SAVE_PATIENT_DEFAULTS.EMPTY_VALUE);
  const [insuranceList, setInsuranceList] = useState<SelectOptionObj[]>([]);
  const [selectedInsurance, setSelectedInsurance] = useState<string>(SAVE_PATIENT_DEFAULTS.EMPTY_VALUE);
  const [foodTypes, setFoodTypes] = useState<SelectOptionObj[]>([]);
  const [selectedFoodType, setSelectedFoodType] = useState<string>(SAVE_PATIENT_DEFAULTS.EMPTY_VALUE);
  const [raceTypes, setRaceTypes] = useState<SelectOptionObj[]>([]);
  const [selectedRaceType, setSelectedRaceType] = useState<string>(SAVE_PATIENT_DEFAULTS.EMPTY_VALUE);
  const [doctors, setDoctors] = useState<SelectOptionObj[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string>(SAVE_PATIENT_DEFAULTS.EMPTY_VALUE);
  const [nurses, setNurses] = useState<SelectOptionObj[]>([]);
  const [selectedNurse, setSelectedNurse] = useState<string>(SAVE_PATIENT_DEFAULTS.EMPTY_VALUE);
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
    getFormattedDate(new Date()),
  );
  const [showCaseDetailsDaysOptions, setShowCaseDetailsDaysOptions] =
    useState(false);
  const [caseDetailsList, setCaseDetailsList] = useState<caseDetailsData[][]>([
    defaultCaseDailyDataTemplate,
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
  const [paintingMode, setPaintingMode] = useState(false);
  const [editableFieldsMode, setEditableFieldsMode] = useState(false);
  const [photoName, setPhotoName] = useState<string | undefined>();
  const [patientId, setPatientId] = useState<number>(SAVE_PATIENT_DEFAULTS.INITIAL_PATIENT_ID);
  const [disableAddCaseDetailsTable, setDisableAddCaseDetailsTable] =
    useState(false);
  const [childCases, setChildCases] = useState<ChildCaseData[]>([]);
  const [reloadCase, setReloadCase] = useState(false);
  const [showCatheterReplacementModal, setShowCatheterReplacementModal] =
    useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const disableSaveBtns = (isDisable: boolean) => {
    if (isDisable) {
      if (saveBtnRef.current) saveBtnRef.current.disabled = true;
      if (saveDailyDetailsBtnRef.current)
        saveDailyDetailsBtnRef.current.disabled = true;
    } else {
      if (saveBtnRef.current) saveBtnRef.current.removeAttribute("disabled");
      if (saveDailyDetailsBtnRef.current)
        saveDailyDetailsBtnRef.current.removeAttribute("disabled");
    }
  };

  const savePatient = async (e: React.FormEvent) => {
    e.preventDefault();

    const tableHourSelect = document.getElementById(
      SAVE_PATIENT_ELEMENT_IDS.TABLE_HOUR_SELECT,
    ) as HTMLSelectElement;
    if (tableHourSelect) {
      const selectedValue =
        tableHourSelect.options[tableHourSelect.selectedIndex].value;
      if (selectedValue === SAVE_PATIENT_DEFAULTS.EMPTY_VALUE) {
        toast.error("אנא בחר/י שעה לתחילת הטבלה");
        return;
      }
    }

    if (
      (formData.ageYears === undefined ||
        formData.ageYears === null ||
        formData.ageYears.toString() === "") &&
      (formData.ageMonths === undefined ||
        formData.ageMonths === null ||
        formData.ageMonths.toString() === "")
    ) {
      toast.error("אנא בחר/י גיל בשנים או בחודשים");
      return;
    }

    disableSaveBtns(true);

    const body = {
      name: formData.patientName,
      owner: {
        name: formData.ownerName,
        phone: formData.ownerPhoneNumber,
      },
      admission: {
        hospitalizationReason: formData.hospitalizationReason || undefined,
        referringDoctor: formData.referringDoctor || undefined,
        allergicComments: formData.allergicComments || undefined,
        bloodTestLink: formData.bloodTestLink || undefined,
      },
      patientSnapshot: {
        ageYears: formData.ageYears,
        ageMonths: formData.ageMonths,
        weightKg: formData.weightKg,
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
        catheterDate: formData.catheterDate
          ? new Date(formData.catheterDate)
          : undefined,
        procedureDate: formData.procedureDate
          ? new Date(formData.procedureDate)
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
      const editBody = {
        ...body,
        patientId: patientId.toString(),
        caseId: caseId,
        caseDetails: caseDetailsList,
      };

      updatePatient.mutate(
        editBody as unknown as Parameters<typeof updatePatient.mutate>[0],
        {
          onSuccess: () => {
            disableSaveBtns(false);
            exportCaseDetails();
            setDisableAddCaseDetailsTable(false);
          },
          onError: () => {
            disableSaveBtns(false);
            setDisableAddCaseDetailsTable(false);
          },
        },
      );
    } else {
      createPatient.mutate(
        body as unknown as Parameters<typeof createPatient.mutate>[0],
        {
          onSuccess: () => {
              navigate(SAVE_PATIENT_ROUTES.PATIENTS_LIST);
          },
        },
      );
    }
  };

  const toSelectOptions = (items: SimpleSystemTypeDTO[]): SelectOptionObj[] =>
    items.map((item) => ({ value: item.id, text: item.name }));

  const toStaffOptions = (items: StaffMemberDTO[]): SelectOptionObj[] =>
    items.map((item) => ({ value: item.id, text: item.username }));

  const getRaceTypes = (animalId: number | string) => {
    setSelectedAnimalTypeForRace(String(animalId));
  };

  const getCaseDetailsData = async () => {
    try {
      if (!caseIdString) return;
      const res = await patientsApi.getCaseDetails(caseIdString);
      if (!isMounted.current) return;
      const caseDetails = res as unknown as Record<string, unknown>;
      const cd = caseDetails.caseDetails as Record<
        string,
        string | number | boolean | null
      >;
      const catheterDateForInput = cd.catheter_date_for_input as string | null;
      setFormData({
        patientName: cd.name as string,
        ownerName: cd.owner_name as string,
        ownerPhoneNumber: cd.owner_phone_number as string,
        referringDoctor: cd.referring_doctor as string | null,
        comments: cd.comments as string,
        hospitalizationReason: cd.hospitalization_reason as string,
        allergicComments: cd.allergic_comments as string | null,
        weightKg: cd.weight_kg as number | undefined,
        caseId: caseIdString,
        ageYears: cd.age_years as number | undefined,
        ageMonths: cd.age_months as number | undefined,
        catheterDate: catheterDateForInput,
        procedureDate: cd.procedure_date_for_input as string | null,
        bloodTestLink: cd.blood_test_link as string | null,
      });

      if (catheterDateForInput) {
        const catheterDate = new Date(catheterDateForInput);
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - SAVE_PATIENT_DEFAULTS.CATHETER_REPLACEMENT_DAYS_THRESHOLD);

        if (catheterDate.getDate() === threeDaysAgo.getDate())
          setShowCatheterReplacementModal(true);
      }

      setIsArchived(cd.is_archived as boolean);
      setSelectedGenderType(cd.gender_type_id as string);
      setSelectedAnimalType(cd.animal_type_id as string);
      setSelectedAnimalColor(cd.animal_color_id as string);
      setSelectedInsurance(cd.insurance_id as string);
      setSelectedFoodType(cd.food_type_id as string);
      setSelectedRaceType(cd.race_id as string);
      setSelectedDoctor(cd.doctor_id as string);
      setSelectedNurse(cd.nurse_id as string);
      setIsConvenia(cd.is_convenia as boolean);
      setIsAllergic(cd.is_allergic as boolean);
      setIsEscapePotential(cd.is_escape_potential as boolean);
      setIsNPO(cd.is_npo as boolean);
      setIsRiskAnesthesia(cd.is_risk_anesthesia as boolean);
      setIsHeartMurmur(cd.is_heart_murmur as boolean);
      setIsAMB(cd.is_amb as boolean);
      setIsAggressive(cd.is_aggressive as boolean);
      setIsCerenia(cd.is_cerenia as boolean);
      setIsProcedure(cd.is_procedure as boolean);
      setIsReleased(cd.is_released as boolean);
      setPhotoName(cd.photo_name as string | undefined);
      setPatientId(cd.patient_id as number);
      if (cd.animal_type_id) getRaceTypes(cd.animal_type_id as string);

      const caseDailyDetails = caseDetails.caseDailyDetails as
        | caseDetailsData[][]
        | null;
      setDisableAddCaseDetailsTable(caseDailyDetails === null);
      if (caseDailyDetails === null)
        setCaseDetailsList([
          JSON.parse(JSON.stringify(defaultCaseDailyDataTemplate)),
        ]);

      if (caseDailyDetails) {
        setShowCaseDetailsDaysOptions(true);
        setCaseDetailsList(caseDailyDetails.reverse());
            setSelectedCaseDate(caseDailyDetails[0][1].id?.toString() ?? SAVE_PATIENT_DEFAULTS.CASE_DATE_FALLBACK);
      }

      setChildCases((caseDetails.masterCaseDetails as ChildCaseData[]) ?? []);
      setLoading(false);
      return caseDailyDetails;
    } catch {
      setLoading(false);
    }
  };

  const addNewCaseDailyDetails = (
    e: React.MouseEvent | React.ChangeEvent<HTMLInputElement>,
  ) => {
    e.preventDefault();

    type DailyDataDetail = { value: string };
    type DailyDataCategory = {
      fluids: DailyDataDetail[];
      medicines: DailyDataDetail[];
      foodExtras: DailyDataDetail[];
      procedures: DailyDataDetail[];
      examinations: DailyDataDetail[];
    };
    const data = caseDetailsList[0] as DailyDataCategory[];

    let defaultCaseDailyData = JSON.parse(
      JSON.stringify(defaultCaseDailyDataTemplate),
    );
    defaultCaseDailyData[0].fluids = data[0].fluids;
    defaultCaseDailyData[0].medicines = data[0].medicines;
    defaultCaseDailyData[0].foodExtras = data[0].foodExtras;
    defaultCaseDailyData[0].procedures = data[0].procedures;
    defaultCaseDailyData[0].examinations = data[0].examinations;

    type DailyItemOptions = {
      isGiven?: boolean;
      isRequired?: boolean;
      isEditable?: boolean;
      comment?: string | null;
      value?: string | null;
    };
    const defaultFluids: Record<string, DailyItemOptions> = {};
    const defaultMedicines: Record<string, DailyItemOptions> = {};
    const defaultFoodExtras: Record<string, DailyItemOptions> = {};
    const defaultProcedures: Record<string, DailyItemOptions> = {};
    const defaultExaminations: Record<string, DailyItemOptions> = {};

    for (let i = 0; i < data[0].fluids.length; i++) {
      defaultFluids[data[0].fluids[i].value] = {
        isGiven: false,
        isRequired: false,
        isEditable: true,
        comment: null,
      };
    }

    for (let i = 0; i < data[0].medicines.length; i++) {
      defaultMedicines[data[0].medicines[i].value] = {
        isGiven: false,
        isRequired: false,
        isEditable: true,
        comment: null,
      };
    }

    for (let i = 0; i < data[0].foodExtras.length; i++) {
      defaultFoodExtras[data[0].foodExtras[i].value] = {
        isGiven: false,
        isRequired: false,
        isEditable: true,
      };
    }

    for (let i = 0; i < data[0].procedures.length; i++) {
      defaultProcedures[data[0].procedures[i].value] = {
        isGiven: false,
        isRequired: false,
        isEditable: true,
      };
    }

    for (let i = 0; i < data[0].examinations.length; i++) {
      defaultExaminations[data[0].examinations[i].value] = {
        value: null,
        isRequired: false,
        isEditable: true,
      };
    }

    for (let i = 1; i < defaultCaseDailyData.length; i++) {
      defaultCaseDailyData[i].fluids = JSON.parse(
        JSON.stringify(defaultFluids),
      );
      defaultCaseDailyData[i].medicines = JSON.parse(
        JSON.stringify(defaultMedicines),
      );
      defaultCaseDailyData[i].foodExtras = JSON.parse(
        JSON.stringify(defaultFoodExtras),
      );
      defaultCaseDailyData[i].procedures = JSON.parse(
        JSON.stringify(defaultProcedures),
      );
      defaultCaseDailyData[i].examinations = JSON.parse(
        JSON.stringify(defaultExaminations),
      );
    }

    setCaseDetailsList([defaultCaseDailyData, ...caseDetailsList]);
    setShowCaseDetailsDaysOptions(true);
    setDisableAddCaseDetailsTable(true);
    setTimeSelectionValue(SAVE_PATIENT_DEFAULTS.EMPTY_VALUE);
    setSelectedCaseDate(SAVE_PATIENT_DEFAULTS.CASE_DATE_FALLBACK);
  };

  const exportCaseDetails = () => {
    if (caseId) {
      exportCase.mutate(caseId, {
        onSuccess: (blob: Blob) => {
          if (blob) {
            downloadFileFromBlob(
              { data: blob, headers: {} },
              SAVE_PATIENT_DEFAULTS.PDF_MIME_TYPE,
              SAVE_PATIENT_DEFAULTS.PDF_FILE_NAME,
            );
          }
        },
      });
    }
  };

  const handleCellClick = async (
    e: React.MouseEvent<HTMLElement>,
    currentIsEditableVal: boolean,
  ) => {
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
    } else if (editableFieldsMode) {
      return !currentIsEditableVal;
    } else {
      return null;
    }
  };

  const handlePaintingModeButtonClick = (
    e: React.MouseEvent | React.ChangeEvent<HTMLInputElement>,
  ) => {
    e.preventDefault();
    setPaintingMode(!paintingMode);
    setEditableFieldsMode(false);
  };

  const handleSetEditableFieldsButtonClick = (
    e: React.MouseEvent | React.ChangeEvent<HTMLInputElement>,
  ) => {
    e.preventDefault();
    setEditableFieldsMode(!editableFieldsMode);
    setPaintingMode(false);
  };

  const handlePaintingModeDocumentClick = (e: MouseEvent) => {
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

  const handleSetEditableFieldsModeDocumentClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      editableFieldsMode &&
      target &&
      !target.closest(".case-details-table-body") &&
      !target.closest(".un-editable-cell") &&
      !target.closest(`#${SAVE_PATIENT_ELEMENT_IDS.SET_EDITABLE_FIELDS_BUTTON}`)
    ) {
      setEditableFieldsMode(false);
    }
  };

  const archivePatient = () => {
    if (caseId) {
      archivePatientMutation.mutate(
        { caseId },
        {
          onSuccess: () => {
            setShowArchiveConfirmationModal(false);
            setIsArchived(!isArchived);
          },
        },
      );
    }
  };

  const setTimeSelectionValue = (value: string) => {
    const tableHourSelect = document.getElementById(
      SAVE_PATIENT_ELEMENT_IDS.TABLE_HOUR_SELECT,
    ) as HTMLSelectElement;
    if (tableHourSelect)
      tableHourSelect.value =
        value.startsWith("0") && value !== "0"
          ? value.substring(SAVE_PATIENT_DEFAULTS.HOUR_PADDING_LENGTH)
          : value;
  };

  useEffect(() => {
    if (genderTypesQuery.data)
      setGenderTypes(toSelectOptions(genderTypesQuery.data));
  }, [genderTypesQuery.data]);
  useEffect(() => {
    if (animalTypesQuery.data)
      setAnimalTypes(toSelectOptions(animalTypesQuery.data));
  }, [animalTypesQuery.data]);
  useEffect(() => {
    if (animalColorsQuery.data)
      setAnimalColors(toSelectOptions(animalColorsQuery.data));
  }, [animalColorsQuery.data]);
  useEffect(() => {
    if (insuranceTypesQuery.data)
      setInsuranceList(toSelectOptions(insuranceTypesQuery.data));
  }, [insuranceTypesQuery.data]);
  useEffect(() => {
    if (foodTypesQuery.data) setFoodTypes(toSelectOptions(foodTypesQuery.data));
  }, [foodTypesQuery.data]);
  useEffect(() => {
    if (doctorsQuery.data) setDoctors(toStaffOptions(doctorsQuery.data));
  }, [doctorsQuery.data]);
  useEffect(() => {
    if (nursesQuery.data) setNurses(toStaffOptions(nursesQuery.data));
  }, [nursesQuery.data]);
  useEffect(() => {
    if (raceTypesQuery.data)
      setRaceTypes(
        raceTypesQuery.data.map((r) => ({ value: r.id, text: r.name })),
      );
  }, [raceTypesQuery.data]);

  useEffect(() => {
    setLoading(true);
    if (isEdit)
      getCaseDetailsData().then((caseDailyDetails) => {
        if (!isMounted.current) return;
        if (caseDailyDetails && caseDailyDetails[0] && caseDailyDetails[0][1])
          setTimeSelectionValue(caseDailyDetails[0][1].time.split(":")[0]);
      });
    else setLoading(false);
  }, [reloadCase]);

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
  }, [paintingMode, editableFieldsMode]);

  return {
    navigate,
    saveBtnRef,
    saveDailyDetailsBtnRef,
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
