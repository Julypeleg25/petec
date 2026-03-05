import { useCallback, useEffect, useMemo, useState } from "react";
import "./PatientDocuments.css";
import { patientsApi } from "../../features/patients/patients.api";
import FormUploadImage from "../../utils/FormUploadImage/FormUploadImage";
import { FaTrash } from "react-icons/fa";
import Modal from "../../utils/Modal/Modal";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import AnesthesiaProcedureForm from "../AnesthesiaProcedureForm/AnesthesiaProcedureForm";
import { getSharedResolver } from "../../utils/form";

import {
  UploadDocumentFormDTOSchema,
  type PatientDocumentResponseDTO,
  type UploadDocumentFormDTO,
} from "@petec/shared";

import {
  getCurrentPatientDocuments,
  getPatientDocumentLabel,
  getPatientDocumentTypeId,
  PatientDocumentsNavType,
} from "./PatientDocuments.utils";

interface PatientDocumentsProps {
  caseId: string;
  patientId: string;
  caseSerialId: string;
}

const PatientDocuments = ({ caseId, patientId, caseSerialId }: PatientDocumentsProps) => {
  const [images, setImages] = useState<PatientDocumentResponseDTO[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [navType, setNavType] = useState<PatientDocumentsNavType>("blood-tests");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletedDocumentId, setDeletedDocumentId] = useState<
    string | undefined
  >(undefined);
  const {
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<UploadDocumentFormDTO>({
    resolver: getSharedResolver(UploadDocumentFormDTOSchema),
    defaultValues: {
      selectedFileName: "",
    },
  });

  const getPatientDocuments = useCallback(async () => {
    try {
      const data = await patientsApi.getDocuments(patientId);
      setImages(data);
    } catch {}
  }, [patientId]);

  const uploadPatientDocument = handleSubmit(
    async () => {
      if (!(selectedFile instanceof File)) {
        toast.error("לא נבחר מסמך להעלאה");
        return;
      }
      try {
        await patientsApi.uploadDocument(
          {
            caseId,
            patientId,
            patientDocumentTypeId: getPatientDocumentTypeId(navType) || "",
          },
          selectedFile,
        );
        toast.success("התמונה נשמרה בהצלחה");
        await getPatientDocuments();
      } catch {
        toast.error("שגיאה בהעלאת התמונה");
      }
    },
    (formErrors) => {
      const firstError = Object.values(formErrors)[0];
      if (firstError?.message) {
        toast.error(firstError.message.toString());
      }
    },
  );

  const deletePatientDocument = useCallback(async () => {
    if (!deletedDocumentId) return;
    try {
      await patientsApi.deleteDocument(deletedDocumentId);
      setShowDeleteModal(false);
      setImages((prevImages) =>
        prevImages.filter((image) => image.id !== deletedDocumentId),
      );
      toast.success("התמונה נמחקה בהצלחה");
    } catch {
      toast.error("שגיאה במחיקת התמונה");
    }
  }, [deletedDocumentId]);

  const currentDocuments = useMemo(
    () => getCurrentPatientDocuments(images, navType),
    [images, navType],
  );

  useEffect(() => {
     getPatientDocuments();
  }, [getPatientDocuments]);

  useEffect(() => {
    if (selectedFile instanceof File) {
      setValue("selectedFileName", selectedFile.name, {
        shouldDirty: true,
        shouldValidate: true,
      });
      return;
    }

    setValue("selectedFileName", "", {
      shouldDirty: true,
      shouldValidate: true,
    });
  }, [selectedFile, setValue]);

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
        {getPatientDocumentLabel(navType)}
      </label>
      {navType === "anesthesia-procedure" ? (
        <AnesthesiaProcedureForm
          caseId={caseId}
          caseSerialId={caseSerialId}
        ></AnesthesiaProcedureForm>
      ) : (
        <>
          <section className="upload-patient-documents-section">
            <form onSubmit={uploadPatientDocument} noValidate>
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
            {errors.selectedFileName && (
              <p className="form-error">{errors.selectedFileName.message}</p>
            )}
          </section>
          <section className="view-patient-documents-section">
            {currentDocuments.length === 0 ? (
              <p className="patient-documents-no-images">אין תמונות זמינות</p>
            ) : (
              <div className="patient-documents">
                {currentDocuments.map((image, index: number) => (
                  <div key={image.id ?? `${index}-${image.fileUrl || image.url}`} className="patient-documents-container">
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
