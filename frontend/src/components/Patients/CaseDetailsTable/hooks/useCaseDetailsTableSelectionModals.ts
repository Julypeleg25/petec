import { useCallback, useMemo, useState } from "react";
import { API_ROUTES } from "../../../../config/apiRoutes";
import type { MedicineSelectOptionObj } from "../../../MedicinePicker/MedicinePicker.types";
import type { SelectOptionsPickerOptionObj } from "../../../SelectOptionsPicker/SelectOptionsPicker.types";
import type { CaseDetailsData, CaseDetailsStateSetter } from "../CaseDetailsTable.types";
import type {
  MedicineSectionType,
  OptionSectionType,
  OptionSystemTypeName,
} from "../CaseDetailsTable.constants";
import { applyMedicineSelectionToDay, applyOptionSelectionToDay } from "../utils/caseDetailsTableState.utils";
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
  const [medicineCellType, setMedicineCellType] =
    useState<MedicineSectionType>("fluids");
  const [selectedMedicinesList, setSelectedMedicinesList] = useState<
    MedicineSelectOptionObj[]
  >([]);

  const medicineList = useMemo(() => {
    if (medicineCellType === "fluids") {
      return [...fluids, ...fluidsExtras];
    }

    return medicines;
  }, [fluids, fluidsExtras, medicineCellType, medicines]);

  const openMedicineSectionModal = useCallback((sectionType: MedicineSectionType): void => {
    const sectionMedicineList =
      sectionType === "fluids" ? [...fluids, ...fluidsExtras] : medicines;

    setShowMedicineModal(true);
    setMedicineCellType(sectionType);
    setSelectedMedicinesList(
      (caseDetailsList[caseDetailsDataIndex]?.[0]?.[sectionType] ?? []).map(
        (medicine) =>
          toMedicineSelectOption(
            hydrateCaseDetailsMedicineCell(medicine, sectionMedicineList),
          ),
      ),
    );
  }, [caseDetailsDataIndex, caseDetailsList, fluids, fluidsExtras, medicines]);

  const openOptionSectionModal = useCallback((
    sectionType: OptionSectionType,
    systemTypeName: OptionSystemTypeName,
  ): void => {
    setShowOptionsModal(true);
    setOptionCellType(sectionType);
    setSelectedOptionsList(
      caseDetailsList[caseDetailsDataIndex][0]?.[sectionType] ?? EMPTY_OPTIONS_LIST,
    );
    setOptionsUrl(API_ROUTES.admin.types.getActive(systemTypeName));
  }, [caseDetailsDataIndex, caseDetailsList]);

  const handleMedicineModalConfirmation = useCallback((
    selectedMedicines: MedicineSelectOptionObj[],
  ): void => {
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
  }, [caseDetailsDataIndex, medicineCellType, setCaseDetailsList]);

  const handleOptionsModalConfirmation = useCallback((
    selectedOptions: SelectOptionsPickerOptionObj[],
  ): void => {
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
  }, [caseDetailsDataIndex, optionCellType, setCaseDetailsList]);

  return {
    medicineList,
    optionsUrl,
    selectedOptionsList,
    selectedMedicinesList,
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
