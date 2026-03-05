import React from "react";
import Modal from "../../../../utils/Modal/Modal";
import ReleasePatient from "../../../ReleasePatient/ReleasePatient";
import DeletePatient from "../../../DeletePatient/DeletePatient";
import PatientDocuments from "../../../PatientDocuments/PatientDocuments";
import PatientCharts from "../../../PatientCharts/PatientCharts";
import CatheterReplacement from "../../../CatheterReplacement/CatheterReplacement";

interface SavePatientModalsProps {
  isEdit: boolean;
  caseIdString: string;
  caseSerialId: string;
  patientId: string;
  weightKg?: number;
  catheterDate: string | null;
  isReleased: boolean;
  setIsReleased: React.Dispatch<React.SetStateAction<boolean>>;
  showReleasePatientModal: boolean;
  setShowReleasePatientModal: React.Dispatch<React.SetStateAction<boolean>>;
  showDeletePatientCaseModal: boolean;
  setShowDeletePatientCaseModal: React.Dispatch<React.SetStateAction<boolean>>;
  showPatientDocumentsModal: boolean;
  setShowPatientDocumentsModal: React.Dispatch<React.SetStateAction<boolean>>;
  showPatientChartsModal: boolean;
  setShowPatientChartsModal: React.Dispatch<React.SetStateAction<boolean>>;
  showArchiveConfirmationModal: boolean;
  setShowArchiveConfirmationModal: React.Dispatch<React.SetStateAction<boolean>>;
  isArchived: boolean;
  archivePatient: () => void;
  showCatheterReplacementModal: boolean;
  setShowCatheterReplacementModal: React.Dispatch<React.SetStateAction<boolean>>;
}

export function SavePatientModals({
  isEdit,
  caseIdString,
  caseSerialId,
  patientId,
  weightKg,
  catheterDate,
  isReleased,
  setIsReleased,
  showReleasePatientModal,
  setShowReleasePatientModal,
  showDeletePatientCaseModal,
  setShowDeletePatientCaseModal,
  showPatientDocumentsModal,
  setShowPatientDocumentsModal,
  showPatientChartsModal,
  setShowPatientChartsModal,
  showArchiveConfirmationModal,
  setShowArchiveConfirmationModal,
  isArchived,
  archivePatient,
  showCatheterReplacementModal,
  setShowCatheterReplacementModal,
}: SavePatientModalsProps) {
  if (!isEdit) return null;

  return (
    <>
      {showReleasePatientModal && (
        <Modal
          setIsOpen={setShowReleasePatientModal}
          component={
            <ReleasePatient
              caseId={caseIdString}
              caseSerialId={caseSerialId}
              setShowReleasePatientModal={setShowReleasePatientModal}
              isReleased={isReleased}
              setIsReleased={setIsReleased}
              animalWeight={weightKg}
            />
          }
          closeWhenClickOutside={false}
        />
      )}
      {showDeletePatientCaseModal && (
        <Modal
          setIsOpen={setShowDeletePatientCaseModal}
          component={
            <DeletePatient
              caseId={caseSerialId}
              setShowDeletePatientCaseModal={setShowDeletePatientCaseModal}
            />
          }
        />
      )}
      {showPatientDocumentsModal && (
        <Modal
          setIsOpen={setShowPatientDocumentsModal}
          component={
            <PatientDocuments caseId={caseIdString} patientId={patientId} caseSerialId={caseSerialId} />
          }
          style={{
            width: "90%",
            height: "90%",
            maxHeight: "90%",
            maxWidth: "900px",
          }}
        />
      )}
      {showPatientChartsModal && (
        <Modal
          setIsOpen={setShowPatientChartsModal}
          component={<PatientCharts caseId={caseIdString} />}
          style={{
            width: "90%",
            height: "90%",
            maxHeight: "90%",
          }}
        />
      )}
      {showArchiveConfirmationModal && (
        <Modal
          setIsOpen={setShowArchiveConfirmationModal}
          component={
            <div className="archive-confirmation-modal">
              <div>
                {isArchived
                  ? "?האם אתה בטוח שאת/ה רוצה להוציא את המטופל מהארכיון"
                  : "?האם אתה בטוח שאת/ה רוצה להעביר את המטופל לארכיון"}
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  archivePatient();
                }}
                className="btn btn-small save-entity-form-btn"
              >
                אישור
              </button>
            </div>
          }
        />
      )}
      {showCatheterReplacementModal && catheterDate && (
        <Modal
          setIsOpen={setShowCatheterReplacementModal}
          component={
            <CatheterReplacement catheterDate={catheterDate} />
          }
        />
      )}
    </>
  );
}
