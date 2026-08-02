import { useCallback, useMemo } from "react";
import "./CaseDetailsTable.css";
import { useCaseDetailsData } from "./hooks/useCaseDetailsData";
import { useCaseDetailsTableSelectionModals } from "./hooks/useCaseDetailsTableSelectionModals";
import {
  getLatestVitals,
  isValueInRange,
} from "./utils/caseDetailsVitals.utils";
import { parseCaseGridHour } from "./caseGrid.utils";
import {
  MEDICINE_SECTION_SUGGESTION_CATEGORIES,
  MEDICINE_SECTIONS,
  OPTION_SECTION_SUGGESTION_CATEGORIES,
  OPTION_SECTIONS,
} from "./CaseDetailsTable.constants";

import type {
  CaseDetailsFieldName,
  CaseDetailsFieldValue,
  CaseDetailsInputStateParams,
  CaseDetailsStateParams,
  CaseDetailsTableProps,
} from "./CaseDetailsTable.types";
import {
  isCaseDetailsStateParams,
  parseHourOption,
} from "./utils/CaseDetailsTable.utils";
import {
  applySelectedStartHourToDay,
  updateCaseDetailsFieldValue,
} from "./utils/caseDetailsTableState.utils";
import type { CaseItemSuggestion } from "@petec/shared";
import type { MedicineSelectOptionObj } from "../../MedicinePicker/MedicinePicker.types";
import type {
  MedicineSectionType,
  OptionSectionType,
} from "./CaseDetailsTable.constants";
import {
  hydrateCaseDetailsMedicineCell,
  toMedicineSelectOption,
} from "./utils/CaseDetailsTable.utils";
import {
  toSuggestedMedicineOption,
  toSuggestedOption,
} from "./utils/caseDetailsSuggestion.utils";

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

function CaseDetailsTable({
  patientId,
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

  const {
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
  } = useCaseDetailsTableSelectionModals({
    caseDetailsList,
    caseDetailsDataIndex,
    setCaseDetailsList,
    medicines,
    fluids,
    fluidsExtras,
  });

  const handleInputChange = useCallback(
    (
      value: string | number | boolean,
      setStateParams?: CaseDetailsInputStateParams,
      fieldName?: string,
    ) => {
      if (!isCaseDetailsStateParams(setStateParams)) return;
      if (!fieldName) return;

      setCaseDetailsList((prevState) => {
        const currentDayRows = prevState[caseDetailsDataIndex];
        if (!currentDayRows) {
          return prevState;
        }

        const targetRow = currentDayRows[setStateParams.index];
        if (!targetRow) {
          return prevState;
        }

        const typedFieldName = fieldName as CaseDetailsFieldName;
        const nextDayRows = updateCaseDetailsFieldValue(
          currentDayRows,
          setStateParams.index,
          typedFieldName,
          value as CaseDetailsFieldValue,
        );
        if (!nextDayRows) {
          return prevState;
        }

        const nextState = [...prevState];
        nextState[caseDetailsDataIndex] = nextDayRows;
        return nextState;
      });
    },
    [caseDetailsDataIndex, setCaseDetailsList],
  );

  const handleProgrammaticInputChange = useCallback(
    (
      setStateParams: CaseDetailsStateParams,
      value: string | number | undefined,
      fieldName: string,
    ) => {
      if (value === undefined) return;
      handleInputChange(value, setStateParams, fieldName);
    },
    [handleInputChange],
  );

  const applySelectedStartHour = (hourValue: string): void => {
    const startHour = parseHourOption(hourValue);
    if (startHour === null) {
      return;
    }

    setCaseDetailsList((prevState) => {
      const nextState = [...prevState];
      const currentDay = prevState[caseDetailsDataIndex];
      if (!currentDay) return prevState;
      nextState[caseDetailsDataIndex] = applySelectedStartHourToDay(
        currentDay,
        startHour,
      );

      return nextState;
    });
  };

  const latestVitals = getLatestVitals(caseDetailsList);
  const latestTempData = latestVitals.temperature;
  const latestPulseData = latestVitals.pulse;
  const latestRespirationData = latestVitals.respiration;
  const currentDayRows = caseDetailsList[caseDetailsDataIndex] ?? [];
  const fluidCatalogMedicines = useMemo(
    () => [...fluids, ...fluidsExtras],
    [fluids, fluidsExtras],
  );
  const suggestionInvalidationKey = useMemo(
    () =>
      JSON.stringify({
        patientId,
        animalId,
        animalWeight,
        caseDetails: caseDetailsList,
      }),
    [animalId, animalWeight, caseDetailsList, patientId],
  );

  const handleMedicineSuggestionSelected = useCallback(
    (suggestion: CaseItemSuggestion) => {
      setSelectedMedicinesList((currentItems) => {
        if (
          currentItems.some((item) => String(item.value) === suggestion.itemId)
        ) {
          return currentItems;
        }
        return [
          ...currentItems,
          toSuggestedMedicineOption(suggestion, medicineList),
        ];
      });
    },
    [medicineList, setSelectedMedicinesList],
  );

  const handleOptionSuggestionSelected = useCallback(
    (suggestion: CaseItemSuggestion) => {
      setSelectedOptionsList((currentItems) => {
        if (
          currentItems.some((item) => String(item.value) === suggestion.itemId)
        ) {
          return currentItems;
        }
        return [...currentItems, toSuggestedOption(suggestion)];
      });
    },
    [setSelectedOptionsList],
  );

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
          dataKey="rowComments"
          caseDetailsList={caseDetailsList}
          caseDetailsDataIndex={caseDetailsDataIndex}
          paintingMode={paintingMode}
          setCaseDetailsList={setCaseDetailsList}
          handleCellClick={handleCellClick}
          handleInputChange={handleInputChange}
        />
        <CaseDetailsDataRow
          title="T"
          dataKey="temperature"
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
          dataKey="pulse"
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
          dataKey="respiration"
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
            catalogMedicines={
              section.type === "fluids" ? fluidCatalogMedicines : medicines
            }
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
        title={medicineModalTitle}
        medicineList={medicineList}
        selectedMedicinesList={selectedMedicinesList}
        initialMedicinesList={initialMedicinesList}
        animalWeight={
          animalWeight !== null && animalWeight !== undefined
            ? Number(animalWeight)
            : undefined
        }
        onConfirm={handleMedicineModalConfirmation}
        patientId={patientId}
        suggestionCategory={
          MEDICINE_SECTION_SUGGESTION_CATEGORIES[medicineCellType]
        }
        suggestionInvalidationKey={suggestionInvalidationKey}
        onSuggestionSelected={handleMedicineSuggestionSelected}
        setSelectedMedicinesList={setSelectedMedicinesList}
      />
      <CaseDetailsOptionsModal
        isOpen={showOptionsModal}
        setIsOpen={setShowOptionsModal}
        optionsList={[]}
        selectedOptionsList={selectedOptionsList}
        initialOptionsList={initialOptionsList}
        selectOptionsUrl={optionsUrl}
        onConfirm={handleOptionsModalConfirmation}
        patientId={patientId}
        suggestionCategory={
          OPTION_SECTION_SUGGESTION_CATEGORIES[optionCellType]
        }
        suggestionInvalidationKey={suggestionInvalidationKey}
        onSuggestionSelected={handleOptionSuggestionSelected}
        setSelectedOptionsList={setSelectedOptionsList}
      />
    </div>
  );
}

export default CaseDetailsTable;
