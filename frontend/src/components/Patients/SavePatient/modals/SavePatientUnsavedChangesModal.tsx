import React from "react";
import { Button } from "../../../../utils/Button/Button";
import Modal from "../../../../utils/Modal/Modal";

interface SavePatientUnsavedChangesModalProps {
  isOpen: boolean;
  isSaving: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onSaveAndExit: () => void;
  onDiscardAndExit: () => void;
  onClose: () => void;
}

export function SavePatientUnsavedChangesModal({
  isOpen,
  isSaving,
  setIsOpen,
  onSaveAndExit,
  onDiscardAndExit,
  onClose,
}: SavePatientUnsavedChangesModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <Modal
      setIsOpen={setIsOpen}
      size="md"
      className={`unsaved-changes-modal-wrapper${isSaving ? " is-saving" : ""}`}
      component={
        <div className="unsaved-changes-modal" dir="rtl" lang="he">
          <h3 className="unsaved-changes-modal-title modal-dialog-title">יש שינויים שלא נשמרו</h3>
          <p className="unsaved-changes-modal-text">
            האם לשמור את פרטי המטופל לפני היציאה?
          </p>
          <p className="unsaved-changes-modal-help">
            בחירה ביציאה ללא שמירה תמחק את השינויים שלא נשמרו.
          </p>
          <div className="unsaved-changes-modal-actions">
            <Button
              type="button"
              appSize="small"
              className="save-entity-form-btn unsaved-changes-save-btn"
              onClick={onSaveAndExit}
              disabled={isSaving}
            >
              {isSaving ? "שומר..." : "שמור וצא"}
            </Button>
            <Button
              type="button"
              appSize="small"
              active
              className="unsaved-changes-continue-btn"
              onClick={onClose}
              disabled={isSaving}
            >
              המשך עריכה
            </Button>
            <Button
              type="button"
              appSize="small"
              active
              className="unsaved-changes-discard-btn"
              onClick={onDiscardAndExit}
              disabled={isSaving}
            >
              צא ללא שמירה
            </Button>
          </div>
        </div>
      }
    />
  );
}
