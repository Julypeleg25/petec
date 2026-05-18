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
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
  const isSaveDisabled = isSaveButtonsDisabled || !hasChanges || isSaving || isArchived;
  const handleMenuAction = (action: () => void) => {
    setIsActionsMenuOpen(false);
    action();
  };

  return (
    <div className="edit-patient-actions-container">
      <div className="edit-patient-actions-desktop edit-patient-actions-menu-bar">
        <button
          type="button"
          className="btn btn-active btn-round edit-patient-back-btn"
          onClick={onBack}
          aria-label="חזרה"
        >
          <FaArrowRight />
        </button>
        <div className="edit-patient-actions-menu">
          <button
            type="button"
            className="btn save-entity-form-btn edit-patient-actions-menu__trigger"
            onClick={() => setIsActionsMenuOpen((prev) => !prev)}
            aria-expanded={isActionsMenuOpen}
            aria-controls="edit-patient-actions-menu-panel"
          >
            {isActionsMenuOpen ? <FaTimes /> : <FaBars />}
            <span>פעולות</span>
          </button>
          {isActionsMenuOpen && (
            <div
              id="edit-patient-actions-menu-panel"
              className="edit-patient-actions-menu__panel"
            >
              <button
                type="submit"
                form="save-patient-form"
                disabled={isSaveDisabled}
                onClick={() => setIsActionsMenuOpen(false)}
              >
                {isSaving ? "...שומר" : "שמור"}
              </button>
              <button
                type="button"
                onClick={() => handleMenuAction(onShowReleasePatientModal)}
              >
                שחרור
              </button>
              <button
                type="button"
                onClick={() => handleMenuAction(onExportCaseDetails)}
                disabled={isExporting}
              >
                {isExporting ? "...מייצא" : "PDF - ייצא ל"}
              </button>
              <button
                type="button"
                onClick={() => handleMenuAction(onShowPatientDocumentsModal)}
              >
                מסמכים
              </button>
              <button
                type="button"
                onClick={() => handleMenuAction(onShowPatientChartsModal)}
              >
                מידע גרפי
              </button>
              <button
                type="button"
                onClick={() => handleMenuAction(onShowArchiveConfirmationModal)}
                disabled={isArchiving}
              >
                {isArchiving ? "...מעבד" : isArchived ? "הוצא מהארכיון" : "העבר לארכיון"}
              </button>
              <button
                type="button"
                className="edit-patient-actions-menu__danger"
                onClick={() => handleMenuAction(onShowDeletePatientCaseModal)}
              >
                <FaTrash aria-hidden="true" />
                <span>מחיקה</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SavePatientEditActionsSection;
