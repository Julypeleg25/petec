import { FaInfoCircle, FaPlus, FaTrash } from "react-icons/fa";
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
}: SavePatientDailyDetailsSectionProps) {
  const caseDateOptions = buildCaseDetailsDateOptions(caseDetailsList);
  const shouldShowCaseDatePicker =
    caseDateOptions.length > 1 ||
    caseDateOptions.some((option) => !option.value.startsWith("new-day-"));
  const canDeleteSelectedCaseDay = caseDetailsList.length > 0;

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
                labelText=":תאריך"
                width="220px"
                afterSelect={onCaseDateChange}
                isOrdered={false}
              />
            </div>
          )}
          <div className="case-daily-details-date-actions">
            <button
              type="button"
              onClick={deleteSelectedCaseDailyDetails}
              className="btn btn-small delete-case-daily-details-btn"
              disabled={isArchived || !canDeleteSelectedCaseDay}
              title="מחיקת יום אשפוז"
            >
              <FaTrash />
            </button>
            <button
              type="button"
              onClick={addNewCaseDailyDetails}
              className="btn btn-small add-new-case-daily-details-btn"
            >
              <FaPlus />
            </button>
          </div>
        </div>
        <div className="daily-details-btns">
          <button
            type="submit"
            className="btn btn-small daily-details-save-btn"
            form="save-patient-form"
            disabled={isSaveButtonsDisabled || !hasChanges || isArchived}
          >
            שמור
          </button>
          <button
            id="paintButton"
            type="button"
            onClick={handlePaintingModeButtonClick}
            className="btn btn-small paint-button"
          >
            {paintingMode ? "עצור סימון" : "סימון שדות חובה"}
          </button>
          <button
            id="setEditableFieldsButton"
            type="button"
            onClick={handleSetEditableFieldsButtonClick}
            className="btn btn-small paint-button"
          >
            {editableFieldsMode ? "עצור סימון" : "סימון ביטול שדות"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SavePatientDailyDetailsSection;
