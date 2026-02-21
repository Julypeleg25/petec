import React from "react";
import Modal from "../../../utils/Modal/Modal";
import ReleasePatient from "../../ReleasePatient/ReleasePatient";
import DeletePatient from "../../DeletePatient/DeletePatient";
import PatientDocuments from "../../PatientDocuments/PatientDocuments";
import PatientCharts from "../../PatientCharts/PatientCharts";
import CatheterReplacement from "../../CatheterReplacement/CatheterReplacement";

import { SavePatientModalsProps } from "./SavePatientModals.types";

export function SavePatientModals({
  isEdit,
  caseIdString,
  masterCaseId,
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
              patientId={patientId}
              setShowDeletePatientCaseModal={setShowDeletePatientCaseModal}
            />
          }
        />
      )}
      {showPatientDocumentsModal && (
        <Modal
          setIsOpen={setShowPatientDocumentsModal}
          component={
            <PatientDocuments caseId={caseIdString} masterCaseId={masterCaseId ?? ""} />
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
