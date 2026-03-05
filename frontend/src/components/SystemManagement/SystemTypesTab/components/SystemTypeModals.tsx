import Modal from "../../../../utils/Modal/Modal";
import UploadFile from "../../../../utils/UploadFile/UploadFile";
import type { SystemTypeKey } from "../SystemTypesTab.constants";
import { systemTypesData } from "../../SystemTypesData";
import { Dispatch, SetStateAction } from "react";

interface SystemTypeModalsProps {
  systemType: SystemTypeKey;
  showDeleteModal: boolean;
  setShowDeleteModal: Dispatch<SetStateAction<boolean>>;
  deleteSystemType: () => void;
  isDeleting: boolean;
  showUploadFileModal: boolean;
  setShowUploadFileModal: Dispatch<SetStateAction<boolean>>;
  triggerReload: () => void;
  uploadBulkTemplate: (file: File) => Promise<void>;
}

export function SystemTypeModals({
  systemType,
  showDeleteModal,
  setShowDeleteModal,
  deleteSystemType,
  isDeleting,
  showUploadFileModal,
  setShowUploadFileModal,
  triggerReload,
  uploadBulkTemplate,
}: SystemTypeModalsProps) {
  return (
    <>
      {showDeleteModal && (
        <Modal
          setIsOpen={setShowDeleteModal}
          component={
            <div className="delete-modal">
              <p>{systemTypesData[systemType]?.deleteMessage}</p>
              <button
                className="btn btn-large"
                onClick={deleteSystemType}
                disabled={isDeleting}
              >
                {isDeleting ? "...מוחק" : "מחק"}
              </button>
            </div>
          }
        />
      )}

      {showUploadFileModal && (
        <UploadFile
          setIsOpen={setShowUploadFileModal}
          message="אנא העלה/י את קובץ התבנית המתאים"
          uploadHandler={uploadBulkTemplate}
          afterUpload={triggerReload}
        />
      )}
    </>
  );
}
