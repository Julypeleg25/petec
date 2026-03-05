import type { FormEventHandler, ReactNode } from "react";
import { FaArrowRight } from "react-icons/fa";

interface SystemTypeEditorShellProps {
  isEdit: boolean;
  createTitle: string;
  editTitle: string;
  currentItemName?: string;
  onClose: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  isPending: boolean;
  submitDisabled?: boolean;
  editorClassName?: string;
  children: ReactNode;
}

export function SystemTypeEditorShell({
  isEdit,
  createTitle,
  editTitle,
  currentItemName,
  onClose,
  onSubmit,
  isPending,
  submitDisabled = false,
  editorClassName,
  children,
}: SystemTypeEditorShellProps) {
  const rootClassName = [
    editorClassName,
    "save-system-type-form",
    "system-type-editor",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootClassName} dir="rtl">
      <div className="save-entity-form-container system-type-editor__container">
        <div className="system-type-editor__header">
          <button
            type="button"
            className="btn btn-active btn-round back-btn system-type-editor__back-btn"
            onClick={onClose}
          >
            <FaArrowRight />
          </button>
          <div className="system-type-editor__title-wrap">
            <p className="system-type-editor__subtitle">{isEdit ? "עריכה" : "יצירה"}</p>
            <h2 className="save-entity-form-title">
              {isEdit ? editTitle : createTitle}
            </h2>
            {isEdit && currentItemName && (
              <p className="system-type-editor__current-name">
                פריט נוכחי: <span>{currentItemName}</span>
              </p>
            )}
          </div>
        </div>

        <form
          className="save-entity-form system-type-editor__form"
          onSubmit={onSubmit}
          noValidate
        >
          {children}

          <div className="system-type-editor__actions">
            <button
              type="button"
              className="btn btn-active system-type-editor__cancel-btn"
              onClick={onClose}
              disabled={isPending}
            >
              ביטול
            </button>
            <button
              type="submit"
              className="btn save-entity-form-btn system-type-editor__submit-btn"
              disabled={isPending || submitDisabled}
              aria-busy={isPending}
            >
              {isPending ? "...שומר" : "שמור"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
