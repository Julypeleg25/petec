import { useState } from "react";
import { FaBars, FaInfoCircle, FaPlus, FaTimes, FaTrash } from "react-icons/fa";
import { Button } from "../../../../utils/Button/Button";
import FormSelect from "../../../../utils/FormSelect/FormSelect";
import FormTextarea from "../../../../utils/FormTextarea/FormTextarea";
import { getFormattedDateFromDBdate } from "../../../../utils/DateFormattingUtil";
import type { SelectOptionObj } from "../../../../utils/FormSelect/FormSelect.types";
import type { NewPatientData } from "../types/savePatient.types";
import type { CaseDetailsData } from "../../CaseDetailsTable/CaseDetailsTable.types";
import type {
  SavePatientActionEvent,
  SavePatientInputChangeHandler,
} from "./types/savePatientSections.types";
import { buildCaseDetailsDateOptions } from "./utils/savePatientSections.utils";

interface SavePatientDailyDetailsSectionProps {
  formData: NewPatientData;
  animalTypes: SelectOptionObj[];
  selectedAnimalType: string;
  caseDetailsList: CaseDetailsData[][];
  selectedCaseDate: string;
  setSelectedCaseDate: React.Dispatch<React.SetStateAction<string>>;
  onCaseDateChange: (value: string) => void;
  handleInputChange: SavePatientInputChangeHandler;
  isSaveButtonsDisabled: boolean;
  hasChanges: boolean;
  isArchived: boolean;
  paintingMode: boolean;
  editableFieldsMode: boolean;

  handlePaintingModeButtonClick: (e: SavePatientActionEvent) => void;
  handleSetEditableFieldsButtonClick: (e: SavePatientActionEvent) => void;
  addNewCaseDailyDetails: (e: SavePatientActionEvent) => void;
  deleteSelectedCaseDailyDetails: (e: SavePatientActionEvent) => void;
  onSavePatientChanges: () => Promise<boolean>;
}

function SavePatientDailyDetailsSection({
  formData,
  animalTypes,
  selectedAnimalType,
  caseDetailsList,
  selectedCaseDate,
  setSelectedCaseDate,
  onCaseDateChange,
  handleInputChange,
  isSaveButtonsDisabled,
  hasChanges,
  isArchived,
  paintingMode,
  editableFieldsMode,

  handlePaintingModeButtonClick,
  handleSetEditableFieldsButtonClick,
  addNewCaseDailyDetails,
  deleteSelectedCaseDailyDetails,
  onSavePatientChanges,
}: SavePatientDailyDetailsSectionProps) {
  const [isMobileActionsOpen, setIsMobileActionsOpen] = useState(false);
  const caseDateOptions = buildCaseDetailsDateOptions(caseDetailsList);
  const shouldShowCaseDatePicker =
    caseDateOptions.length > 1 ||
    caseDateOptions.some((option) => !option.value.startsWith("new-day-"));
  const canDeleteSelectedCaseDay = caseDetailsList.length > 0;
  const isSaveDisabled = isSaveButtonsDisabled || !hasChanges || isArchived;

  const runMobileAction = (action: (e: SavePatientActionEvent) => void) =>
    (event: SavePatientActionEvent) => {
      action(event);
      setIsMobileActionsOpen(false);
    };
  const saveFromMobileMenu = (event: SavePatientActionEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsMobileActionsOpen(false);
    void onSavePatientChanges();
  };

  return (
    <div className="above-daily-details-table-section">
      <div className="daily-details-table-fields-info">
        <FaInfoCircle color="var(--color-main)" size={20} />
        <div>
          <div>
            <div className="daily-details-table-fields-info-field">
              <span>
                {animalTypes.find((type) => type.value === selectedAnimalType)
                  ?.text || "-"}
              </span>
              <label>:סוג חיה</label>
            </div>
            <div className="daily-details-table-fields-info-field">
              <span>
                {getFormattedDateFromDBdate(
                  formData.dates?.catheterDate instanceof Date
                    ? formData.dates.catheterDate
                    : null,
                ) || "-"}
              </span>
              <label>:תאריך הכנסת קטטר</label>
            </div>
          </div>
          <div>
            <div className="daily-details-table-fields-info-field">
              <span style={{ marginRight: "0.3em" }}>ק"ג</span>
              <span>{formData.patientSnapshot?.weightKg}</span>
              <label>:משקל</label>
            </div>
            <div className="daily-details-table-fields-info-field">
              <span>{formData.name}</span>
              <label>:שם</label>
            </div>
          </div>
        </div>
      </div>
      <FormTextarea
        labelText=":הערות"
        name="comments"
        state={formData.comments ?? ""}
        setState={handleInputChange}
        height="70px"
        width="300px"
        maxWidth="300px"
        maxLength={2000}
      />
      <div className="daily-details-btns-container">
        <div className="case-daily-details-date-controls">
          {shouldShowCaseDatePicker && (
            <div className="case-daily-details-date-picker">
              <FormSelect
                elements={caseDateOptions}
                selectId="select-daily-case-details-date-picker"
                optionState={selectedCaseDate}
                setOptionState={setSelectedCaseDate}
                width="220px"
                afterSelect={onCaseDateChange}
                isOrdered={false}
              />
            </div>
          )}
          <div className="case-daily-details-date-actions">
            <Button
              type="button"
              onClick={deleteSelectedCaseDailyDetails}
              className="delete-case-daily-details-btn"
              disabled={isArchived || !canDeleteSelectedCaseDay}
              title="מחיקת יום אשפוז"
            >
              <FaTrash />
            </Button>
            <Button
              type="button"
              onClick={addNewCaseDailyDetails}
              className="add-new-case-daily-details-btn"
            >
              <FaPlus />
            </Button>
          </div>
        </div>
        <div className="daily-details-btns daily-details-btns-desktop">
          <Button
            type="submit"
            className="daily-details-save-btn"
            form="save-patient-form"
            disabled={isSaveDisabled}
          >
            שמור
          </Button>
          <Button
            id="paintButton"
            type="button"
            onClick={handlePaintingModeButtonClick}
            className="paint-button"
            sx={{ width: "auto", whiteSpace: "nowrap" }}
          >
            {paintingMode ? "עצור סימון" : "סימון שדות חובה"}
          </Button>
          <Button
            id="setEditableFieldsButton"
            type="button"
            onClick={handleSetEditableFieldsButtonClick}
            className="paint-button"
            sx={{ width: "auto", whiteSpace: "nowrap" }}
          >
            {editableFieldsMode ? "עצור סימון" : "סימון ביטול שדות"}
          </Button>
        </div>
        <div className="daily-details-mobile-actions">
          <Button
            type="submit"
            className="daily-details-save-btn"
            form="save-patient-form"
            disabled={isSaveDisabled}
          >
            שמור
          </Button>
          <Button
            type="button"
            className="daily-details-mobile-actions__trigger"
            onClick={() => setIsMobileActionsOpen((prev) => !prev)}
            aria-expanded={isMobileActionsOpen}
            aria-controls="daily-details-mobile-actions-panel"
          >
            {isMobileActionsOpen ? <FaTimes /> : <FaBars />}
            פעולות טבלה
          </Button>
          {isMobileActionsOpen && (
            <div
              id="daily-details-mobile-actions-panel"
              className="daily-details-mobile-actions__panel"
            >
              <button
                type="button"
                className={paintingMode ? "daily-details-mobile-actions__mode-active" : ""}
                aria-pressed={paintingMode}
                onClick={runMobileAction(handlePaintingModeButtonClick)}
              >
                {paintingMode ? "עצור סימון" : "סימון שדות חובה"}
              </button>
              <button
                type="button"
                className={editableFieldsMode ? "daily-details-mobile-actions__mode-active" : ""}
                aria-pressed={editableFieldsMode}
                onClick={runMobileAction(handleSetEditableFieldsButtonClick)}
              >
                {editableFieldsMode ? "עצור סימון" : "סימון ביטול שדות"}
              </button>
              <button type="button" onClick={runMobileAction(addNewCaseDailyDetails)}>
                הוספת יום אשפוז
              </button>
              <button
                type="button"
                className="daily-details-mobile-actions__danger"
                onClick={runMobileAction(deleteSelectedCaseDailyDetails)}
                disabled={isArchived || !canDeleteSelectedCaseDay}
              >
                מחיקת יום אשפוז
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SavePatientDailyDetailsSection;
