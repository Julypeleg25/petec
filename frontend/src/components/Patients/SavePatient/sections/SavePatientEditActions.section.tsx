import { FaArrowRight, FaTrash } from "react-icons/fa";

interface SavePatientEditActionsSectionProps {
  isArchived: boolean;
  isSaveButtonsDisabled: boolean;
  onBack: () => void;
  onShowReleasePatientModal: () => void;
  onExportCaseDetails: () => void;
  onShowPatientDocumentsModal: () => void;
  onShowPatientChartsModal: () => void;
  onShowArchiveConfirmationModal: () => void;
  onShowDeletePatientCaseModal: () => void;
}

function SavePatientEditActionsSection({
  isArchived,
  isSaveButtonsDisabled,
  onBack,
  onShowReleasePatientModal,
  onExportCaseDetails,
  onShowPatientDocumentsModal,
  onShowPatientChartsModal,
  onShowArchiveConfirmationModal,
  onShowDeletePatientCaseModal,
}: SavePatientEditActionsSectionProps) {
  return (
    <div className="edit-patient-btns-container">
      <button
        className="btn btn-active btn-round edit-patient-back-btn"
        onClick={onBack}
      >
        <FaArrowRight />
      </button>
      <div
        className="edit-patient-btns-container"
        style={{ flexWrap: "wrap" }}
      >
        <button
          type="submit"
          className="btn btn-small save-entity-form-btn"
          form="save-patient-form"
          disabled={isSaveButtonsDisabled}
        >
          שמור
        </button>
        <button
          className="btn btn-small save-entity-form-btn"
          onClick={onShowReleasePatientModal}
        >
          שחרור
        </button>
        <button
          className="btn btn-small save-entity-form-btn export-case-details-btn"
          onClick={onExportCaseDetails}
        >
          PDF - ייצא ל
        </button>
        <button
          className="btn btn-small save-entity-form-btn patient-documents-case-details-btn"
          onClick={onShowPatientDocumentsModal}
        >
          מסמכים
        </button>
        <button
          className="btn btn-small save-entity-form-btn patient-charts-case-details-btn"
          onClick={onShowPatientChartsModal}
        >
          מידע גרפי
        </button>
        <button
          className="btn btn-small save-entity-form-btn patient-archive-case-details-btn"
          onClick={onShowArchiveConfirmationModal}
        >
          {isArchived ? "הוצא מהארכיון" : "העבר לארכיון"}
        </button>
      </div>
      <button
        className="btn btn-small save-entity-form-btn delete-patient-btn"
        onClick={onShowDeletePatientCaseModal}
      >
        <FaTrash />
      </button>
    </div>
  );
}

export default SavePatientEditActionsSection;
