import { useState } from "react";
import { FaBars, FaTimes, FaTrash } from "react-icons/fa";

export interface SavePatientActions {
  readonly isArchived: boolean;
  readonly isSaveButtonsDisabled: boolean;
  readonly hasChanges: boolean;
  readonly isSaving: boolean;
  readonly isExporting: boolean;
  readonly isArchiving: boolean;
  readonly onBack: () => void;
  readonly onShowReleasePatientModal: () => void;
  readonly onExportCaseDetails: () => void;
  readonly onShowPatientDocumentsModal: () => void;
  readonly onShowPatientChartsModal: () => void;
  readonly onShowClinicalSummary: () => void;
  readonly onShowArchiveConfirmationModal: () => void;
  readonly onShowDeletePatientCaseModal: () => void;
  readonly onSavePatientChanges: () => Promise<boolean>;
}

interface SavePatientActionsMenuProps {
  readonly actions: SavePatientActions;
  readonly menuId: string;
  readonly variant: "desktop" | "mobile";
  readonly showBackAction?: boolean;
}

const MENU_CLASS_NAMES = {
  desktop: "edit-patient-actions-menu",
  mobile: "edit-patient-mobile-actions",
} as const;

function SavePatientActionsMenu({
  actions,
  menuId,
  variant,
  showBackAction = false,
}: SavePatientActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const className = MENU_CLASS_NAMES[variant];
  const isSaveDisabled =
    actions.isSaveButtonsDisabled ||
    !actions.hasChanges ||
    actions.isSaving ||
    actions.isArchived;

  const runAction = (action: () => void) => {
    setIsOpen(false);
    action();
  };

  const savePatient = () => {
    setIsOpen(false);
    void actions.onSavePatientChanges();
  };

  return (
    <div className={className}>
      <button
        type="button"
        className={`btn ${
          variant === "desktop" ? "save-entity-form-btn " : ""
        }${className}__trigger`}
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        aria-expanded={isOpen}
        aria-controls={menuId}
      >
        {isOpen ? (
          <FaTimes aria-hidden="true" />
        ) : (
          <FaBars aria-hidden="true" />
        )}
        <span>פעולות</span>
      </button>
      {isOpen && (
        <div id={menuId} className={`${className}__panel`}>
          {showBackAction && (
            <button type="button" onClick={() => runAction(actions.onBack)}>
              חזרה
            </button>
          )}
          <button type="button" disabled={isSaveDisabled} onClick={savePatient}>
            {actions.isSaving ? "שומר..." : "שמור"}
          </button>
          <button
            type="button"
            onClick={() => runAction(actions.onShowReleasePatientModal)}
          >
            שחרור
          </button>
          <button
            type="button"
            onClick={() => runAction(actions.onExportCaseDetails)}
            disabled={actions.isExporting}
          >
            {actions.isExporting ? "מייצא..." : "ייצוא ל-PDF"}
          </button>
          <button
            type="button"
            onClick={() => runAction(actions.onShowPatientDocumentsModal)}
          >
            מסמכים
          </button>
          <button
            type="button"
            onClick={() => runAction(actions.onShowPatientChartsModal)}
          >
            מידע גרפי
          </button>
          <button
            type="button"
            onClick={() => runAction(actions.onShowClinicalSummary)}
          >
            סיכום קליני מג'ונרט
          </button>
          <button
            type="button"
            onClick={() => runAction(actions.onShowArchiveConfirmationModal)}
            disabled={actions.isArchiving}
          >
            {actions.isArchiving
              ? "מעבד..."
              : actions.isArchived
                ? "הוצא מהארכיון"
                : "העבר לארכיון"}
          </button>
          <button
            type="button"
            className={`${className}__danger`}
            onClick={() => runAction(actions.onShowDeletePatientCaseModal)}
          >
            <FaTrash aria-hidden="true" />
            <span>מחיקה</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default SavePatientActionsMenu;
