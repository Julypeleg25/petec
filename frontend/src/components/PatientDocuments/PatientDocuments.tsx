import { useEffect, useState } from "react";
import "./PatientDocuments.css";
import { patientsApi } from "../../features/patients/patients.api";
import FormUploadImage from "../../utils/FormUploadImage/FormUploadImage";
import { FaTrash } from "react-icons/fa";
import Modal from "../../utils/Modal/Modal";
import toast from "react-hot-toast";
import AnesthesiaProcedureForm from "../AnesthesiaProcedureForm/AnesthesiaProcedureForm";

import type { PatientDocumentResponseDTO } from "@petec/shared";

import { PatientDocumentsProps } from "./PatientDocuments.types";

const PatientDocuments = ({ caseId, masterCaseId }: PatientDocumentsProps) => {
  const [images, setImages] = useState<PatientDocumentResponseDTO[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | Blob | null>(null);
  const [navType, setNavType] = useState("blood-tests");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletedDocumentId, setDeletedDocumentId] = useState<
    string | undefined
  >(undefined);

  const getPatientDocuments = async () => {
    try {
      const data = await patientsApi.getDocuments(caseId);
      setImages(data);
    } catch {}
  };

  const uploadPatientDocument = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    void (async () => {
      if (selectedFile && selectedFile instanceof File) {
        try {
          await patientsApi.uploadDocument(
            {
              caseId,
              patientId: masterCaseId,
              patientDocumentTypeId: getDocumentTypeId() || "",
            },
            selectedFile,
          );
          toast.success("התמונה נשמרה בהצלחה");
          getPatientDocuments();
        } catch {
          toast.error("שגיאה בהעלאת התמונה");
        }
      } else {
        toast.error("לא נבחר מסמך");
      }
    })();
  };

  const deletePatientDocument = async () => {
    if (!deletedDocumentId) return;
    try {
      await patientsApi.deleteDocument(deletedDocumentId);
      setShowDeleteModal(false);
      setImages(images.filter((image) => image.id !== deletedDocumentId));
      toast.success("התמונה נמחקה בהצלחה");
    } catch {
      toast.error("שגיאה במחיקת התמונה");
    }
  };

  const getLabelText = () => {
    if (navType === "blood-tests") return "בדיקות דם";
    if (navType === "xray") return "צילומי רנטגן";
    if (navType === "anesthesia-procedure")
      return "טופס הסכמה לפרוצדורה בהרדמה";
  };

  const getCurrentDocuments = () => {
    return images.filter(
      (image) => String(image.patientDocumentTypeId) === getDocumentTypeId(),
    );
  };

  const getDocumentTypeId = () => {
    if (navType === "blood-tests") return "1";
    if (navType === "xray") return "2";
  };

  useEffect(() => {
    getPatientDocuments();
  }, []);

  return (
    <div className="PatientDocuments">
      <nav className="navbar patients-navbar">
        <button
          className={`btn ${
            navType === "anesthesia-procedure" ? "" : "btn-active"
          }`}
          title="anesthesia-procedure"
          onClick={() => {
            setNavType("anesthesia-procedure");
          }}
          disabled={navType === "anesthesia-procedure"}
        >
          טופס הסכמה לפרוצדורה בהרדמה
        </button>
        <button
          className={`btn ${navType === "xray" ? "" : "btn-active"}`}
          title="xray"
          onClick={() => {
            setNavType("xray");
          }}
          disabled={navType === "xray"}
        >
          צילומי רנטגן
        </button>
        <button
          className={`btn ${navType === "blood-tests" ? "" : "btn-active"}`}
          title="blood-tests"
          onClick={() => {
            setNavType("blood-tests");
          }}
          disabled={navType === "blood-tests"}
        >
          בדיקות דם
        </button>
      </nav>
      <label className="form-label patient-documents-label">
        {getLabelText()}
      </label>
      {navType === "anesthesia-procedure" ? (
        <AnesthesiaProcedureForm
          caseId={caseId}
          masterCaseId={masterCaseId}
        ></AnesthesiaProcedureForm>
      ) : (
        <>
          <section className="upload-patient-documents-section">
            <form onSubmit={uploadPatientDocument}>
              <FormUploadImage
                uploadedImageId="patient-documents-uploaded-img"
                isLarge={false}
                setSelectedFile={setSelectedFile}
                currentImage={"#"}
              />
              <button
                type="submit"
                className="btn btn-small upload-patient-documents-image-btn"
              >
                העלה
              </button>
            </form>
          </section>
          <section className="view-patient-documents-section">
            {getCurrentDocuments().length === 0 ? (
              <p className="patient-documents-no-images">אין תמונות זמינות</p>
            ) : (
              <div className="patient-documents">
                {getCurrentDocuments().map((image, index: number) => (
                  <div key={index} className="patient-documents-container">
                    <img
                      className="patient-document"
                      src={image.fileUrl || image.url}
                      alt="patient-document"
                    />
                    <button
                      className="btn btn-small btn-round patient-document-delete-btn"
                      onClick={() => {
                        setDeletedDocumentId(image.id);
                        setShowDeleteModal(true);
                      }}
                    >
                      <FaTrash />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
      {showDeleteModal && (
        <Modal
          setIsOpen={setShowDeleteModal}
          component={
            <div className="delete-modal">
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
}

export default PatientDocuments;
