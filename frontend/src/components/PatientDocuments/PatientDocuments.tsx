import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { FaTrash } from "react-icons/fa";
import toast from "react-hot-toast";
import {
  SYSTEM_TYPE_NAMES,
  type PatientDocumentResponseDTO,
} from "@petec/shared";
import { patientsApi } from "../../features/patients/patients.api";
import { useActiveSystemTypes } from "../../features/system-management";
import FormUploadImage from "../../utils/FormUploadImage/FormUploadImage";
import Modal from "../../utils/Modal/Modal";
import AnesthesiaProcedureForm from "../AnesthesiaProcedureForm/AnesthesiaProcedureForm";
import "./PatientDocuments.css";
import {
  getCurrentPatientDocuments,
  getPatientDocumentAssetUrl,
  getPatientDocumentLabel,
  getPatientDocumentType,
  PATIENT_DOCUMENT_NAV_TYPES,
  type PatientDocumentsNavType,
} from "./PatientDocuments.utils";

interface PatientDocumentsProps {
  caseId: string;
  patientId: string;
  caseSerialId: string;
}

const PatientDocuments = ({
  caseId,
  patientId,
  caseSerialId,
}: PatientDocumentsProps) => {
  const [documents, setDocuments] = useState<PatientDocumentResponseDTO[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [navType, setNavType] = useState<PatientDocumentsNavType>(
    PATIENT_DOCUMENT_NAV_TYPES.BLOOD_TESTS,
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletedDocumentId, setDeletedDocumentId] = useState<
    string | undefined
  >(undefined);
  const { data: documentTypes = [] } = useActiveSystemTypes(
    SYSTEM_TYPE_NAMES.PATIENT_DOCUMENT_TYPES,
  );

  const selectedDocumentType = useMemo(
    () => getPatientDocumentType(documentTypes, navType),
    [documentTypes, navType],
  );
  const isAnesthesiaTab =
    navType === PATIENT_DOCUMENT_NAV_TYPES.ANESTHESIA_PROCEDURE;

  const isDocumentUploadDisabled = !selectedDocumentType?.id;

  const getCaseDocuments = useCallback(async () => {
    try {
      const data = await patientsApi.getDocuments(caseId);
      setDocuments(data);
    } catch {}
  }, [caseId]);

  const uploadPatientDocument = useCallback(async (
    e: FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();

    if (!(selectedFile instanceof File)) {
      return;
    }
    if (!selectedDocumentType?.id) {
      toast.error("סוג המסמך לא זמין כרגע");
      return;
    }

    try {
      await patientsApi.uploadDocument(
        {
          caseId,
          patientId,
          patientDocumentTypeId: selectedDocumentType.id,
        },
        selectedFile,
      );
      toast.success("המסמך נשמר בהצלחה");
      await getCaseDocuments();
    } catch {
      toast.error("שגיאה בהעלאת המסמך");
    }
  }, [caseId, getCaseDocuments, patientId, selectedDocumentType?.id, selectedFile]);

  const deletePatientDocument = useCallback(async () => {
    if (!deletedDocumentId) return;
    try {
      await patientsApi.deleteDocument(deletedDocumentId);
      setShowDeleteModal(false);
      setDocuments((prevDocuments) =>
        prevDocuments.filter((document) => document.id !== deletedDocumentId),
      );
      toast.success("המסמך נמחק בהצלחה");
    } catch {
      toast.error("שגיאה במחיקת המסמך");
    }
  }, [deletedDocumentId]);

  const currentDocuments = useMemo(
    () => getCurrentPatientDocuments(documents, selectedDocumentType?.id),
    [documents, selectedDocumentType?.id],
  );

  useEffect(() => {
    void getCaseDocuments();
  }, [getCaseDocuments]);

  return (
    <div className="PatientDocuments">
      <div className="patient-documents-sticky-header">
        <nav className="navbar patients-navbar">
          <button
            className={`btn ${
              navType === PATIENT_DOCUMENT_NAV_TYPES.ANESTHESIA_PROCEDURE
                ? "btn-selected"
                : "btn-active"
            }`}
            title="anesthesia-procedure"
            onClick={() => {
              setNavType(PATIENT_DOCUMENT_NAV_TYPES.ANESTHESIA_PROCEDURE);
            }}
            disabled={navType === PATIENT_DOCUMENT_NAV_TYPES.ANESTHESIA_PROCEDURE}
          >
            טופס הסכמה לפרוצדורה בהרדמה
          </button>
          <button
            className={`btn ${
              navType === PATIENT_DOCUMENT_NAV_TYPES.XRAY
                ? "btn-selected"
                : "btn-active"
            }`}
            title="xray"
            onClick={() => {
              setNavType(PATIENT_DOCUMENT_NAV_TYPES.XRAY);
            }}
            disabled={navType === PATIENT_DOCUMENT_NAV_TYPES.XRAY}
          >
            צילומי רנטגן
          </button>
          <button
            className={`btn ${
              navType === PATIENT_DOCUMENT_NAV_TYPES.BLOOD_TESTS
                ? "btn-selected"
                : "btn-active"
            }`}
            title="blood-tests"
            onClick={() => {
              setNavType(PATIENT_DOCUMENT_NAV_TYPES.BLOOD_TESTS);
            }}
            disabled={navType === PATIENT_DOCUMENT_NAV_TYPES.BLOOD_TESTS}
          >
            בדיקות דם
          </button>
        </nav>
        <label className="form-label patient-documents-label">
          {getPatientDocumentLabel(navType)}
        </label>
        {!isAnesthesiaTab && (
          <section className="upload-patient-documents-section">
            <form onSubmit={uploadPatientDocument} noValidate>
              <FormUploadImage
                uploadedImageId="patient-documents-uploaded-img"
                isLarge={false}
                setSelectedFile={setSelectedFile}
                currentImage={"#"}
                disabled={isDocumentUploadDisabled}
              />
              <button
                type="submit"
                className="btn btn-small upload-patient-documents-image-btn"
                disabled={isDocumentUploadDisabled}
              >
                העלה
              </button>
            </form>
          </section>
        )}
      </div>
      {isAnesthesiaTab ? (
        <div className="patient-documents-tab-panel patient-documents-anesthesia-tab-panel">
          <AnesthesiaProcedureForm caseId={caseId} caseSerialId={caseSerialId} />
        </div>
      ) : (
        <section className="view-patient-documents-section patient-documents-tab-panel">
          {currentDocuments.length === 0 ? (
            <p className="patient-documents-no-images">אין תמונות זמינות</p>
          ) : (
            <div className="patient-documents">
              {currentDocuments.map((document) => {
                const assetUrl = getPatientDocumentAssetUrl(document);
                if (!assetUrl) {
                  return null;
                }

                return (
                  <div key={document.id} className="patient-documents-container">
                    <img
                      className="patient-document"
                      src={assetUrl}
                      alt="patient-document"
                    />
                    <button
                      className="btn btn-small btn-round patient-document-delete-btn"
                      onClick={() => {
                        setDeletedDocumentId(document.id);
                        setShowDeleteModal(true);
                      }}
                    >
                      <FaTrash />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
      {showDeleteModal && (
        <Modal
          setIsOpen={setShowDeleteModal}
          component={
            <div className="delete-modal">
              <h3 className="modal-dialog-title">מחיקת מסמך</h3>
              <p>?האם את/ה בטוח שאת/ה רוצה למחוק את המסמך</p>
              <button className="btn btn-large" onClick={deletePatientDocument}>
                מחק
              </button>
            </div>
          }
        />
      )}
    </div>
  );
};

export default PatientDocuments;
