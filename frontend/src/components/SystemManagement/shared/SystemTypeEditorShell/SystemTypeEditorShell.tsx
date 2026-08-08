import type { FormEventHandler, ReactNode } from "react";
import { Button } from "../../../../utils/Button/Button";
import Modal from "../../../../utils/Modal/Modal";

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
  modalClassName?: string;
  overlayClassName?: string;
  size?: "sm" | "md" | "lg" | "fullscreen";
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
  modalClassName = "system-management-modal",
  overlayClassName,
  size = "lg",
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
    <Modal
      setIsOpen={(open: boolean | ((prevState: boolean) => boolean)) => {
         if (!open) onClose();
      }}
      size={size}
      className={modalClassName}
      overlayClassName={overlayClassName}
      component={
        <div className={rootClassName} dir="rtl">
          <div className="save-entity-form-container system-type-editor__container">
            <div className="system-type-editor__header">
              <div className="system-type-editor__title-wrap">
                <h2 className="save-entity-form-title system-management-modal-title modal-dialog-title">
                  {isEdit ? editTitle : createTitle}
                </h2>
              </div>
            </div>

            <form
              className="save-entity-form system-type-editor__form"
              onSubmit={onSubmit}
              noValidate
            >
              {children}

              <div className="system-type-editor__actions">
                <Button
                  type="button"
                  active
                  className="system-type-editor__cancel-btn"
                  onClick={onClose}
                  disabled={isPending}
                >
                  ביטול
                </Button>
                <Button
                  type="submit"
                  className="save-entity-form-btn system-type-editor__submit-btn"
                  disabled={isPending || submitDisabled}
                  aria-busy={isPending}
                >
                  {isPending ? "...שומר" : "שמור"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      }
    />
  );
}
