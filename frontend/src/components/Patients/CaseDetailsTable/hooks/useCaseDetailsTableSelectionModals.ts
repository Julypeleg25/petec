import { useCallback, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { API_ROUTES } from "../../../../config/apiRoutes";
import type { MedicineSelectOptionObj } from "../../../MedicinePicker/MedicinePicker.types";
import type { SelectOptionsPickerOptionObj } from "../../../SelectOptionsPicker/SelectOptionsPicker.types";
import type {
  CaseDetailsData,
  CaseDetailsStateSetter,
} from "../CaseDetailsTable.types";
import type {
  MedicineSectionDefinition,
  MedicineSectionType,
  OptionSectionType,
  OptionSystemTypeName,
} from "../CaseDetailsTable.constants";
import { MEDICINE_SECTIONS } from "../CaseDetailsTable.constants";
import {
  applyMedicineSelectionToDay,
  applyOptionSelectionToDay,
} from "../utils/caseDetailsTableState.utils";
import {
  hydrateCaseDetailsMedicineCell,
  toMedicineSelectOption,
} from "../utils/CaseDetailsTable.utils";

interface UseCaseDetailsTableSelectionModalsParams {
  caseDetailsList: CaseDetailsData[][];
  caseDetailsDataIndex: number;
  setCaseDetailsList: CaseDetailsStateSetter;
  medicines: MedicineSelectOptionObj[];
  fluids: MedicineSelectOptionObj[];
  fluidsExtras: MedicineSelectOptionObj[];
}

const EMPTY_OPTIONS_LIST: SelectOptionsPickerOptionObj[] = [];
const DEFAULT_MEDICINE_SECTION: MedicineSectionDefinition =
  MEDICINE_SECTIONS[0];

export function useCaseDetailsTableSelectionModals({
  caseDetailsList,
  caseDetailsDataIndex,
  setCaseDetailsList,
  medicines,
  fluids,
  fluidsExtras,
}: UseCaseDetailsTableSelectionModalsParams) {
  const [showMedicineModal, setShowMedicineModal] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [optionsUrl, setOptionsUrl] = useState("");
  const [optionCellType, setOptionCellType] =
    useState<OptionSectionType>("examinations");
  const [selectedOptionsList, setSelectedOptionsList] = useState<
    SelectOptionsPickerOptionObj[]
  >([]);
  const [initialOptionsList, setInitialOptionsList] = useState<
    SelectOptionsPickerOptionObj[]
  >([]);
  const [medicineCellType, setMedicineCellType] =
    useState<MedicineSectionType>("fluids");
  const [selectedMedicinesList, setSelectedMedicinesList] = useState<
    MedicineSelectOptionObj[]
  >([]);
  const [initialMedicinesList, setInitialMedicinesList] = useState<
    MedicineSelectOptionObj[]
  >([]);

  const medicineList = useMemo(() => {
    if (medicineCellType === "fluids") {
      return [...fluids, ...fluidsExtras];
    }

    return medicines;
  }, [fluids, fluidsExtras, medicineCellType, medicines]);

  const medicineModalTitle = useMemo(() => {
    const selectedSection =
      MEDICINE_SECTIONS.find((section) => section.type === medicineCellType) ??
      DEFAULT_MEDICINE_SECTION;

    return `בחירת ${selectedSection.title}`;
  }, [medicineCellType]);

  const openMedicineSectionModal = useCallback(
    (sectionType: MedicineSectionType): void => {
      const sectionMedicineList =
        sectionType === "fluids" ? [...fluids, ...fluidsExtras] : medicines;

      setMedicineCellType(sectionType);
      const sectionMedicines = (
        caseDetailsList[caseDetailsDataIndex]?.[0]?.[sectionType] ?? []
      ).map((medicine) =>
        toMedicineSelectOption(
          hydrateCaseDetailsMedicineCell(medicine, sectionMedicineList),
        ),
      );
      setInitialMedicinesList(sectionMedicines);
      setSelectedMedicinesList(sectionMedicines);
      setShowMedicineModal(true);
    },
    [caseDetailsDataIndex, caseDetailsList, fluids, fluidsExtras, medicines],
  );

  const openOptionSectionModal = useCallback(
    (
      sectionType: OptionSectionType,
      systemTypeName: OptionSystemTypeName,
    ): void => {
      setOptionCellType(sectionType);
      const sectionOptions =
        caseDetailsList[caseDetailsDataIndex]?.[0]?.[sectionType] ??
        EMPTY_OPTIONS_LIST;
      setInitialOptionsList(sectionOptions);
      setSelectedOptionsList(sectionOptions);
      setOptionsUrl(API_ROUTES.admin.types.getActive(systemTypeName));
      setShowOptionsModal(true);
    },
    [caseDetailsDataIndex, caseDetailsList],
  );

  const handleMedicineModalConfirmation = useCallback(
    (selectedMedicines: MedicineSelectOptionObj[]): void => {
      setCaseDetailsList((prevState) => {
        const currentDayRows = prevState[caseDetailsDataIndex];
        if (!currentDayRows) {
          return prevState;
        }

        const nextState = [...prevState];
        nextState[caseDetailsDataIndex] = applyMedicineSelectionToDay(
          currentDayRows,
          medicineCellType,
          selectedMedicines,
        );
        return nextState;
      });
      setShowMedicineModal(false);
      toast.success("רשימת התרופות נשמרה בהצלחה");
    },
    [caseDetailsDataIndex, medicineCellType, setCaseDetailsList],
  );

  const handleOptionsModalConfirmation = useCallback(
    (selectedOptions: SelectOptionsPickerOptionObj[]): void => {
      setCaseDetailsList((prevState) => {
        const currentDayRows = prevState[caseDetailsDataIndex];
        if (!currentDayRows) {
          return prevState;
        }

        const nextState = [...prevState];
        nextState[caseDetailsDataIndex] = applyOptionSelectionToDay(
          currentDayRows,
          optionCellType,
          selectedOptions,
        );
        return nextState;
      });
      setShowOptionsModal(false);
      toast.success("רשימת האפשרויות נשמרה בהצלחה");
    },
    [caseDetailsDataIndex, optionCellType, setCaseDetailsList],
  );

  return {
    medicineList,
    medicineCellType,
    optionCellType,
    medicineModalTitle,
    optionsUrl,
    selectedOptionsList,
    selectedMedicinesList,
    initialOptionsList,
    initialMedicinesList,
    setSelectedOptionsList,
    setSelectedMedicinesList,
    showMedicineModal,
    showOptionsModal,
    setShowMedicineModal,
    setShowOptionsModal,
    openMedicineSectionModal,
    openOptionSectionModal,
    handleMedicineModalConfirmation,
    handleOptionsModalConfirmation,
  };
}
