import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { FaTrash } from "react-icons/fa";
import toast from "react-hot-toast";
import {
  SYSTEM_TYPE_NAMES,
  type PatientDocumentResponseDTO,
} from "@petec/shared";
import { patientsApi } from "../../features/patients/patients.api";
import { useActiveSystemTypes } from "../../features/system-management";
import { Button } from "../../utils/Button/Button";
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
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
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

  const uploadPatientDocument = useCallback(
    async (file: File) => {
      if (!selectedDocumentType?.id) {
        toast.error("סוג המסמך לא זמין כרגע");
        return;
      }

      try {
        setIsUploadingDocument(true);
        await patientsApi.uploadDocument(
          {
            caseId,
            patientId,
            patientDocumentTypeId: selectedDocumentType.id,
          },
          file,
        );
        setSelectedFile(null);
        toast.success("המסמך נשמר בהצלחה");
        await getCaseDocuments();
      } catch {
        toast.error("שגיאה בהעלאת המסמך");
      } finally {
        setIsUploadingDocument(false);
      }
    },
    [caseId, getCaseDocuments, patientId, selectedDocumentType?.id, setSelectedFile],
  );

  const handleSubmitUpload = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!(selectedFile instanceof File)) {
        toast.error("יש לבחור קובץ להעלאה");
        return;
      }

      await uploadPatientDocument(selectedFile);
    },
    [selectedFile, uploadPatientDocument],
  );

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
    <div
      className={`PatientDocuments ${
        isAnesthesiaTab
          ? "patient-documents-anesthesia-layout"
          : "patient-documents-scroll-layout"
      }`}
    >
      <div
        className={`patient-documents-header ${
          isAnesthesiaTab ? "patient-documents-header-sticky" : ""
        }`}
      >
        <nav className="navbar patients-navbar">
          <Button
            active={navType !== PATIENT_DOCUMENT_NAV_TYPES.ANESTHESIA_PROCEDURE}
            selected={navType === PATIENT_DOCUMENT_NAV_TYPES.ANESTHESIA_PROCEDURE}
            title="anesthesia-procedure"
            onClick={() => {
              setNavType(PATIENT_DOCUMENT_NAV_TYPES.ANESTHESIA_PROCEDURE);
            }}
            disabled={
              navType === PATIENT_DOCUMENT_NAV_TYPES.ANESTHESIA_PROCEDURE
            }
          >
            טופס הסכמה לפרוצדורה בהרדמה
          </Button>
          <Button
            active={navType !== PATIENT_DOCUMENT_NAV_TYPES.XRAY}
            selected={navType === PATIENT_DOCUMENT_NAV_TYPES.XRAY}
            title="xray"
            onClick={() => {
              setNavType(PATIENT_DOCUMENT_NAV_TYPES.XRAY);
            }}
            disabled={navType === PATIENT_DOCUMENT_NAV_TYPES.XRAY}
          >
            צילומי רנטגן
          </Button>
          <Button
            active={navType !== PATIENT_DOCUMENT_NAV_TYPES.BLOOD_TESTS}
            selected={navType === PATIENT_DOCUMENT_NAV_TYPES.BLOOD_TESTS}
            title="blood-tests"
            onClick={() => {
              setNavType(PATIENT_DOCUMENT_NAV_TYPES.BLOOD_TESTS);
            }}
            disabled={navType === PATIENT_DOCUMENT_NAV_TYPES.BLOOD_TESTS}
          >
            בדיקות דם
          </Button>
        </nav>
        <label className="form-label patient-documents-label">
          {getPatientDocumentLabel(navType)}
        </label>
        {!isAnesthesiaTab && (
          <section className="upload-patient-documents-section">
            <form onSubmit={handleSubmitUpload} noValidate>
              <FormUploadImage
                uploadedImageId="patient-documents-uploaded-img"
                isLarge={false}
                selectedFile={selectedFile}
                setSelectedFile={setSelectedFile}
                currentImage={"#"}
                disabled={isDocumentUploadDisabled || isUploadingDocument}
              />
              <Button
                type="submit"
                appSize="small"
                className="upload-patient-documents-image-btn"
                disabled={
                  isDocumentUploadDisabled ||
                  isUploadingDocument ||
                  !(selectedFile instanceof File)
                }
              >
                {isUploadingDocument ? "...מעלה" : "העלה"}
              </Button>
            </form>
          </section>
        )}
      </div>
      {isAnesthesiaTab ? (
        <div className="patient-documents-tab-panel patient-documents-anesthesia-tab-panel">
          <AnesthesiaProcedureForm
            caseId={caseId}
            caseSerialId={caseSerialId}
          />
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
                  <div
                    key={document.id}
                    className="patient-documents-container"
                  >
                    <img
                      className="patient-document"
                      src={assetUrl}
                      alt="patient-document"
                    />
                    <Button
                      round
                      className="patient-document-delete-btn"
                      onClick={() => {
                        setDeletedDocumentId(document.id);
                        setShowDeleteModal(true);
                      }}
                    >
                      <FaTrash />
                    </Button>
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
            <div className="patient-documents-delete-modal" dir="rtl">
              <h3 className="modal-dialog-title">מחיקת מסמך</h3>
              <p className="patient-documents-delete-modal__text">
                האם את/ה בטוח שאת/ה רוצה למחוק את המסמך?
              </p>
              <div className="patient-documents-delete-modal__actions">
                <Button
                  appSize="large"
                  className="patient-documents-delete-modal__confirm-btn"
                  onClick={deletePatientDocument}
                >
                  מחק
                </Button>
              </div>
            </div>
          }
        />
      )}
    </div>
  );
};

export default PatientDocuments;
