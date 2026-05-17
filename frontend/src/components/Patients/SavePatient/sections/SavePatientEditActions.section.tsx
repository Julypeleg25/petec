import { useState } from "react";
import { FaArrowRight, FaBars, FaTimes, FaTrash } from "react-icons/fa";

interface SavePatientEditActionsSectionProps {
  isArchived: boolean;
  isSaveButtonsDisabled: boolean;
  hasChanges: boolean;
  isSaving: boolean;
  isExporting: boolean;
  isArchiving: boolean;
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
  hasChanges,
  isSaving,
  isExporting,
  isArchiving,
  onBack,
  onShowReleasePatientModal,
  onExportCaseDetails,
  onShowPatientDocumentsModal,
  onShowPatientChartsModal,
  onShowArchiveConfirmationModal,
  onShowDeletePatientCaseModal,
}: SavePatientEditActionsSectionProps) {
  const isSaveDisabled = isSaveButtonsDisabled || !hasChanges || isSaving || isArchived;

  return (
    <div className="edit-patient-actions-container">
      <div className="edit-patient-btns-container edit-patient-actions-desktop">
      <button
        type="button"
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
          disabled={isSaveDisabled}
        >
          {isSaving ? "...שומר" : "שמור"}
        </button>
        <button
          type="button"
          className="btn btn-small save-entity-form-btn"
          onClick={onShowReleasePatientModal}
        >
          שחרור
        </button>
        <button
          type="button"
          className="btn btn-small save-entity-form-btn export-case-details-btn"
          onClick={onExportCaseDetails}
          disabled={isExporting}
        >
          {isExporting ? "...מייצא" : "PDF - ייצא ל"}
        </button>
        <button
          type="button"
          className="btn btn-small save-entity-form-btn patient-documents-case-details-btn"
          onClick={onShowPatientDocumentsModal}
        >
          מסמכים
        </button>
        <button
          type="button"
          className="btn btn-small save-entity-form-btn patient-charts-case-details-btn"
          onClick={onShowPatientChartsModal}
        >
          מידע גרפי
        </button>
        <button
          type="button"
          className="btn btn-small save-entity-form-btn patient-archive-case-details-btn"
          onClick={onShowArchiveConfirmationModal}
          disabled={isArchiving}
        >
          {isArchiving ? "...מעבד" : isArchived ? "הוצא מהארכיון" : "העבר לארכיון"}
        </button>
      </div>
      <button
        type="button"
        className="btn btn-small save-entity-form-btn delete-patient-btn"
        onClick={onShowDeletePatientCaseModal}
      >
        <FaTrash />
      </button>
      </div>
    </div>
  );
}

export default SavePatientEditActionsSection;
