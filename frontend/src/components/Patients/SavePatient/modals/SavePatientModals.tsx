import React from "react";
import Modal from "../../../../utils/Modal/Modal";
import ReleasePatient from "../../../ReleasePatient/ReleasePatient";
import DeletePatient from "../../../DeletePatient/DeletePatient";
import PatientDocuments from "../../../PatientDocuments/PatientDocuments";
import PatientCharts from "../../../PatientCharts/PatientCharts";
import CatheterReplacement from "../../../CatheterReplacement/CatheterReplacement";
import { AiCaseSummary } from "../components/AiCaseSummary";

interface SavePatientModalsProps {
  beforeNavigation?: () => void;
  isEdit: boolean;
  caseIdString: string;
  caseSerialId: string;
  patientId: string;
  weightKg?: number;
  catheterDate: Date | null;
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
  showClinicalSummaryModal: boolean;
  setShowClinicalSummaryModal: React.Dispatch<React.SetStateAction<boolean>>;
  showArchiveConfirmationModal: boolean;
  setShowArchiveConfirmationModal: React.Dispatch<React.SetStateAction<boolean>>;
  isArchived: boolean;
  archivePatient: () => void;
  showCatheterReplacementModal: boolean;
  setShowCatheterReplacementModal: React.Dispatch<React.SetStateAction<boolean>>;
}

export function SavePatientModals({
  beforeNavigation,
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
  showClinicalSummaryModal,
  setShowClinicalSummaryModal,
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
      {showClinicalSummaryModal && (
        <Modal
          setIsOpen={setShowClinicalSummaryModal}
          size="lg"
          className="clinical-summary-modal"
          component={<AiCaseSummary patientId={patientId} />}
        />
      )}
      {showReleasePatientModal && (
        <Modal
          setIsOpen={setShowReleasePatientModal}
          size="lg"
          className="release-patient-modal"
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
          closeWhenClickOutside={true}
        />
      )}
      {showDeletePatientCaseModal && (
        <Modal
          setIsOpen={setShowDeletePatientCaseModal}
          component={
            <DeletePatient
              caseId={caseSerialId}
              beforeNavigation={beforeNavigation}
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
          size="lg"
          className="patient-documents-modal"
        />
      )}
      {showPatientChartsModal && (
        <Modal
          setIsOpen={setShowPatientChartsModal}
          component={<PatientCharts caseId={caseIdString} />}
          size="fullscreen"
          className="patient-charts-modal"
        />
      )}
      {showArchiveConfirmationModal && (
        <Modal
          setIsOpen={setShowArchiveConfirmationModal}
          component={
            <div className="archive-confirmation-modal">
              <h3 className="modal-dialog-title">
                {isArchived ? "הוצאה מהארכיון" : "העברה לארכיון"}
              </h3>
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
      {!isArchived && showCatheterReplacementModal && catheterDate && (
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
