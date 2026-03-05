import { useState } from "react";
import "./CaseDetailsTable.css";
import { API_ROUTES } from "../../../config/apiRoutes";
import { useCaseDetailsData } from "./hooks/useCaseDetailsData";
import {
  getCheckboxesValuesAfterOptionsSelection,
  getCheckboxesValuesAfterOptionsSelectionForOptions,
} from "./utils/caseDetailsSelection.utils";
import { getLatestVitals, isValueInRange } from "./utils/caseDetailsVitals.utils";
import {
  getCaseDayPrimaryDataRow,
  getCaseGridExpectedHourByIndex,
  parseCaseGridHour,
} from "./caseGrid.utils";
import {
  MEDICINE_SECTIONS,
  OPTION_SECTIONS,
  type MedicineSectionType,
  type OptionSectionType,
  type OptionSystemTypeName,
} from "./CaseDetailsTable.constants";
import type { MedicineSelectOptionObj } from "../../MedicinePicker/MedicinePicker.types";
import type { SelectOptionsPickerOptionObj } from "../../SelectOptionsPicker/SelectOptionsPicker.types";

import type {
  CaseDetailsData,
  CaseDetailsInputStateParams,
  CaseDetailsOptionCell,
  CaseDetailsTableProps,
} from "./CaseDetailsTable.types";

import { CaseDetailsDataRow } from "./components/CaseDetailsDataRow";
import { CaseDetailsTextareaRow } from "./components/CaseDetailsTextareaRow";
import { CaseDetailsCheckboxRow } from "./components/CaseDetailsCheckboxRow";
import { CaseDetailsSelectCommentRow } from "./components/CaseDetailsSelectCommentRow";
import { CaseDetailsBooleanCommentRow } from "./components/CaseDetailsBooleanCommentRow";
import { CaseDetailsMedicineSection } from "./components/CaseDetailsMedicineSection";
import { CaseDetailsOptionSection } from "./components/CaseDetailsOptionSection";
import { CaseDetailsTableHeader } from "./components/CaseDetailsTableHeader";
import { CaseDetailsMedicineModal } from "./components/CaseDetailsMedicineModal";
import { CaseDetailsOptionsModal } from "./components/CaseDetailsOptionsModal";

type CaseDetailsFieldName = keyof CaseDetailsData;
type CaseDetailsFieldValue = CaseDetailsData[CaseDetailsFieldName];
type CaseDetailsStateParams = { index: number };
const EMPTY_OPTIONS_LIST: SelectOptionsPickerOptionObj[] = [];

const isCaseDetailsStateParams = (
  value?: CaseDetailsInputStateParams,
): value is CaseDetailsStateParams =>
  typeof value === "object" &&
  value !== null &&
  "index" in value &&
  typeof (value as { index?: number }).index === "number";

const toTodayDate = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseHourOption = (value: string): number | null => {
  const parsed = parseCaseGridHour(value);
  if (parsed !== null) {
    return parsed;
  }

  if (!value) return null;
  const parsedHour = Number.parseInt(value, 10);
  if (!Number.isFinite(parsedHour) || parsedHour < 0 || parsedHour > 23) {
    return null;
  }
  return parsedHour;
};

function CaseDetailsTable({
  handleCellClick,
  caseDetailsList,
  setCaseDetailsList,
  caseDetailsDataIndex,
  paintingMode,
  animalWeight,
  animalId,
  selectedStartHour,
  setSelectedStartHour,
}: CaseDetailsTableProps) {
  const {
    fecesTypes,
    urineTypes,
    medicines,
    fluids,
    fluidsExtras,
    animalVitals,
  } = useCaseDetailsData(animalId != null ? String(animalId) : "");

  const [medicineList, setMedicineList] = useState<MedicineSelectOptionObj[]>(
    [],
  );
  const optionsList = EMPTY_OPTIONS_LIST;
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

  const handleInputChange = (
    value: string | number | boolean,
    setStateParams?: CaseDetailsInputStateParams,
    fieldName?: string,
  ) => {
    if (!isCaseDetailsStateParams(setStateParams)) return;
    if (!fieldName) return;
    const currentDayRows = caseDetailsList[caseDetailsDataIndex];
    if (!currentDayRows) return;

    const arrayCopy = [...currentDayRows];
    const targetRow = arrayCopy[setStateParams.index];
    if (!targetRow) return;
    if (!(fieldName in targetRow)) return;
    const typedFieldName = fieldName as CaseDetailsFieldName;

    arrayCopy[setStateParams.index] = {
      ...targetRow,
      [typedFieldName]: value as CaseDetailsFieldValue,
    };

    setCaseDetailsList((prevState) => [
      ...prevState.slice(0, caseDetailsDataIndex),
      arrayCopy,
      ...prevState.slice(caseDetailsDataIndex + 1),
    ]);
  };

  const handleProgrammaticInputChange = (
    setStateParams: CaseDetailsStateParams,
    value: string | number | undefined,
    fieldName: string,
  ) => {
    if (value === undefined) return;
    handleInputChange(value, setStateParams, fieldName);
  };

  const applySelectedStartHour = (hourValue: string): void => {
    const startHour = parseHourOption(hourValue);
    if (startHour === null) {
      return;
    }

    setCaseDetailsList((prevState) => {
      const nextState = [...prevState];
      const currentDay = prevState[caseDetailsDataIndex];
      if (!currentDay) return prevState;

      const rowForDate = getCaseDayPrimaryDataRow(currentDay);
      const resolvedDate =
        rowForDate?.date && rowForDate.date.trim().length > 0
          ? rowForDate.date
          : toTodayDate();

      nextState[caseDetailsDataIndex] = currentDay.map((row) => {
        const parsedIndex = Number(row.index);
        const normalizedColumnIndex =
          Number.isInteger(parsedIndex) && parsedIndex >= 0 ? parsedIndex : 1;

        return {
          ...row,
          date: resolvedDate,
          time: getCaseGridExpectedHourByIndex(startHour, normalizedColumnIndex),
        };
      });

      return nextState;
    });
  };

  const openMedicineSectionModal = (sectionType: MedicineSectionType): void => {
    setShowMedicineModal(true);
    setMedicineCellType(sectionType);
    setSelectedMedicinesList(
      caseDetailsList[caseDetailsDataIndex][0]?.[sectionType] ?? [],
    );
    if (sectionType === "fluids") {
      setMedicineList([...fluids, ...fluidsExtras]);
      return;
    }
    setMedicineList(medicines);
  };

  const openOptionSectionModal = (
    sectionType: OptionSectionType,
    systemTypeName: OptionSystemTypeName,
  ): void => {
    setShowOptionsModal(true);
    setOptionCellType(sectionType);
    setSelectedOptionsList(
      caseDetailsList[caseDetailsDataIndex][0]?.[sectionType] ?? [],
    );
    setOptionsUrl(API_ROUTES.admin.types.getActive(systemTypeName));
  };

  const handleMedicineModalConfirmation = (
    selectedMedicines: MedicineSelectOptionObj[],
  ): void => {
    setCaseDetailsList((prevState) => {
      const newState = [...prevState];
      newState[caseDetailsDataIndex] = newState[caseDetailsDataIndex].map(
        (details, rowIndex) => {
          const currentValues = details[medicineCellType];
          const nextValues =
            rowIndex === 0
              ? selectedMedicines
              : getCheckboxesValuesAfterOptionsSelection(
                  selectedMedicines,
                  currentValues,
                );
          return {
            ...details,
            [medicineCellType]: nextValues,
          };
        },
      );
      return newState;
    });
    setShowMedicineModal(false);
  };

  const handleOptionsModalConfirmation = (
    selectedOptions: SelectOptionsPickerOptionObj[],
  ): void => {
    setCaseDetailsList((prevState) => {
      const newState = [...prevState];
      newState[caseDetailsDataIndex] = newState[caseDetailsDataIndex].map(
        (details, rowIndex) => {
          const currentValues = details[optionCellType];
          const nextValues: CaseDetailsOptionCell[] =
            rowIndex === 0
              ? selectedOptions
              : getCheckboxesValuesAfterOptionsSelectionForOptions(
                  selectedOptions,
                  currentValues,
                );
          return {
            ...details,
            [optionCellType]: nextValues,
          };
        },
      );
      return newState;
    });
    setShowOptionsModal(false);
  };

  const latestVitals = getLatestVitals(caseDetailsList);
  const latestTempData = latestVitals.T;
  const latestPulseData = latestVitals.P;
  const latestRespirationData = latestVitals.R;
  const currentDayRows = caseDetailsList[caseDetailsDataIndex] ?? [];

  return (
    <div className="case-details-table">
      <CaseDetailsTableHeader
        currentDayRows={currentDayRows}
        selectedStartHour={selectedStartHour}
        setSelectedStartHour={setSelectedStartHour}
        onStartHourSelect={applySelectedStartHour}
      />
      <div className="case-details-table-body">
        <CaseDetailsTextareaRow
          title="הערות"
          dataKey="comments"
          caseDetailsList={caseDetailsList}
          caseDetailsDataIndex={caseDetailsDataIndex}
          paintingMode={paintingMode}
          setCaseDetailsList={setCaseDetailsList}
          handleCellClick={handleCellClick}
          handleInputChange={handleInputChange}
        />
        <CaseDetailsDataRow
          title="T"
          dataKey="T"
          caseDetailsList={caseDetailsList}
          caseDetailsDataIndex={caseDetailsDataIndex}
          paintingMode={paintingMode}
          setCaseDetailsList={setCaseDetailsList}
          handleCellClick={handleCellClick}
          handleInputChange={handleInputChange}
          inputType="number"
          requiredCondition={(i: number) =>
            !isValueInRange(
              latestTempData.value,
              animalVitals.tempRangeMin,
              animalVitals.tempRangeMax,
            ) &&
            latestTempData.colIndex === i &&
            caseDetailsDataIndex === latestTempData.dataDetailsIndex
          }
        />
        <CaseDetailsDataRow
          title="P"
          dataKey="P"
          caseDetailsList={caseDetailsList}
          caseDetailsDataIndex={caseDetailsDataIndex}
          paintingMode={paintingMode}
          setCaseDetailsList={setCaseDetailsList}
          handleCellClick={handleCellClick}
          handleInputChange={handleInputChange}
          inputType="number"
          min={0}
          requiredCondition={(i: number) =>
            !isValueInRange(
              latestPulseData.value,
              animalVitals.pulseRangeMin,
              animalVitals.pulseRangeMax,
            ) &&
            latestPulseData.colIndex === i &&
            caseDetailsDataIndex === latestPulseData.dataDetailsIndex
          }
        />
        <CaseDetailsDataRow
          title="R"
          dataKey="R"
          caseDetailsList={caseDetailsList}
          caseDetailsDataIndex={caseDetailsDataIndex}
          paintingMode={paintingMode}
          setCaseDetailsList={setCaseDetailsList}
          handleCellClick={handleCellClick}
          handleInputChange={handleInputChange}
          inputType="number"
          min={0}
          requiredCondition={(i: number) =>
            !isValueInRange(
              latestRespirationData.value,
              animalVitals.respirationRangeMin,
              animalVitals.respirationRangeMax,
            ) &&
            latestRespirationData.colIndex === i &&
            caseDetailsDataIndex === latestRespirationData.dataDetailsIndex
          }
        />
        {MEDICINE_SECTIONS.map((section) => (
          <CaseDetailsMedicineSection
            key={section.type}
            sectionType={section.type}
            sectionTitle={section.title}
            caseDetailsList={caseDetailsList}
            caseDetailsDataIndex={caseDetailsDataIndex}
            paintingMode={paintingMode}
            setCaseDetailsList={setCaseDetailsList}
            handleCellClick={handleCellClick}
            onAddClick={openMedicineSectionModal}
          />
        ))}
        {OPTION_SECTIONS.map((section) => (
          <CaseDetailsOptionSection
            key={section.type}
            sectionType={section.type}
            sectionTitle={section.title}
            inputType={section.inputType}
            systemTypeName={section.systemTypeName}
            caseDetailsList={caseDetailsList}
            caseDetailsDataIndex={caseDetailsDataIndex}
            paintingMode={paintingMode}
            setCaseDetailsList={setCaseDetailsList}
            handleCellClick={handleCellClick}
            onAddClick={openOptionSectionModal}
          />
        ))}
        <CaseDetailsTextareaRow
          title="אוכל + מים"
          dataKey="foodAndWater"
          caseDetailsList={caseDetailsList}
          caseDetailsDataIndex={caseDetailsDataIndex}
          paintingMode={paintingMode}
          setCaseDetailsList={setCaseDetailsList}
          handleCellClick={handleCellClick}
          handleInputChange={handleInputChange}
        />
        <CaseDetailsSelectCommentRow
          title="שתן"
          dataKeyPrefix="urine"
          selectOptions={urineTypes}
          caseDetailsList={caseDetailsList}
          caseDetailsDataIndex={caseDetailsDataIndex}
          paintingMode={paintingMode}
          setCaseDetailsList={setCaseDetailsList}
          handleCellClick={handleCellClick}
          handleInputChange={handleInputChange}
          handleProgrammaticInputChange={handleProgrammaticInputChange}
        />
        <CaseDetailsSelectCommentRow
          title="צואה"
          dataKeyPrefix="feces"
          selectOptions={fecesTypes}
          caseDetailsList={caseDetailsList}
          caseDetailsDataIndex={caseDetailsDataIndex}
          paintingMode={paintingMode}
          setCaseDetailsList={setCaseDetailsList}
          handleCellClick={handleCellClick}
          handleInputChange={handleInputChange}
          handleProgrammaticInputChange={handleProgrammaticInputChange}
        />
        <CaseDetailsCheckboxRow
          title="טיול"
          dataKey="isTravel"
          caseDetailsList={caseDetailsList}
          caseDetailsDataIndex={caseDetailsDataIndex}
          paintingMode={paintingMode}
          setCaseDetailsList={setCaseDetailsList}
          handleCellClick={handleCellClick}
        />
        <CaseDetailsCheckboxRow
          title="ניקוי ארגז"
          dataKey="isBoxClean"
          caseDetailsList={caseDetailsList}
          caseDetailsDataIndex={caseDetailsDataIndex}
          paintingMode={paintingMode}
          setCaseDetailsList={setCaseDetailsList}
          handleCellClick={handleCellClick}
        />
        <CaseDetailsCheckboxRow
          title="תרופות לשחרור"
          dataKey="isRelease"
          caseDetailsList={caseDetailsList}
          caseDetailsDataIndex={caseDetailsDataIndex}
          paintingMode={paintingMode}
          setCaseDetailsList={setCaseDetailsList}
          handleCellClick={handleCellClick}
        />
        <CaseDetailsTextareaRow
          title="עדכון בעלים"
          dataKey="ownerUpdate"
          caseDetailsList={caseDetailsList}
          caseDetailsDataIndex={caseDetailsDataIndex}
          paintingMode={paintingMode}
          setCaseDetailsList={setCaseDetailsList}
          handleCellClick={handleCellClick}
          handleInputChange={handleInputChange}
        />
        <CaseDetailsDataRow
          title="שקילה"
          dataKey="weigh"
          caseDetailsList={caseDetailsList}
          caseDetailsDataIndex={caseDetailsDataIndex}
          paintingMode={paintingMode}
          setCaseDetailsList={setCaseDetailsList}
          handleCellClick={handleCellClick}
          handleInputChange={handleInputChange}
          inputType="number"
          min={0}
        />
        <CaseDetailsBooleanCommentRow
          title="הקאות"
          dataKeyPrefix="puke"
          caseDetailsList={caseDetailsList}
          caseDetailsDataIndex={caseDetailsDataIndex}
          paintingMode={paintingMode}
          setCaseDetailsList={setCaseDetailsList}
          handleCellClick={handleCellClick}
          handleInputChange={handleInputChange}
        />
      </div>
      <CaseDetailsMedicineModal
        isOpen={showMedicineModal}
        setIsOpen={setShowMedicineModal}
        medicineList={medicineList}
        selectedMedicinesList={selectedMedicinesList}
        animalWeight={
          animalWeight !== null && animalWeight !== undefined
            ? Number(animalWeight)
            : undefined
        }
        onConfirm={handleMedicineModalConfirmation}
      />
      <CaseDetailsOptionsModal
        isOpen={showOptionsModal}
        setIsOpen={setShowOptionsModal}
        optionsList={optionsList}
        selectedOptionsList={selectedOptionsList}
        selectOptionsUrl={optionsUrl}
        onConfirm={handleOptionsModalConfirmation}
      />
    </div>
  );
}

export default CaseDetailsTable;
