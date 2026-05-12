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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isSaveDisabled = isSaveButtonsDisabled || !hasChanges || isSaving || isArchived;

  const runMobileAction = (action: () => void) => {
    setIsMobileMenuOpen(false);
    action();
  };

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
      <div className="edit-patient-mobile-actions">
        <button
          type="button"
          className="btn edit-patient-mobile-actions__trigger"
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          aria-expanded={isMobileMenuOpen}
          aria-controls="edit-patient-mobile-actions-panel"
        >
          {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
          <span>פעולות</span>
        </button>
        {isMobileMenuOpen && (
          <div
            id="edit-patient-mobile-actions-panel"
            className="edit-patient-mobile-actions__panel"
          >
            <button type="button" onClick={() => runMobileAction(onBack)}>
              חזרה
            </button>
            <button
              type="submit"
              form="save-patient-form"
              disabled={isSaveDisabled}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {isSaving ? "...שומר" : "שמור"}
            </button>
            <button
              type="button"
              onClick={() => runMobileAction(onShowReleasePatientModal)}
            >
              שחרור
            </button>
            <button
              type="button"
              onClick={() => runMobileAction(onExportCaseDetails)}
              disabled={isExporting}
            >
              {isExporting ? "...מייצא" : "PDF - ייצא ל"}
            </button>
            <button
              type="button"
              onClick={() => runMobileAction(onShowPatientDocumentsModal)}
            >
              מסמכים
            </button>
            <button
              type="button"
              onClick={() => runMobileAction(onShowPatientChartsModal)}
            >
              מידע גרפי
            </button>
            <button
              type="button"
              onClick={() => runMobileAction(onShowArchiveConfirmationModal)}
              disabled={isArchiving}
            >
              {isArchiving ? "...מעבד" : isArchived ? "הוצא מהארכיון" : "העבר לארכיון"}
            </button>
            <button
              type="button"
              className="edit-patient-mobile-actions__danger"
              onClick={() => runMobileAction(onShowDeletePatientCaseModal)}
            >
              מחיקה
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default SavePatientEditActionsSection;
