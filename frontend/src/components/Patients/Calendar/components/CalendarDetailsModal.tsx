import type { Dispatch, SetStateAction } from "react";
import { formatOwnerPhone, getPatientImageSrc, handlePatientImageLoadError } from "../../../../features/patients";
import { Button } from "../../../../utils/Button/Button";
import Modal from "../../../../utils/Modal/Modal";
import {
  BADGE_LABELS,
  FLAG_LABELS,
  hasAnyFlags,
} from "../constants/calendar.constants";
import type { SelectedCalendarEntry } from "../types/calendar.types";

type CalendarDetailsModalProps = {
  selectedEntry: SelectedCalendarEntry;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  onNavigateToCase: (caseId: string, masterCaseId?: string) => void;
};

function CalendarDetailsModal({
  selectedEntry,
  setIsOpen,
  onNavigateToCase,
}: CalendarDetailsModalProps) {
  return (
    <Modal
      setIsOpen={setIsOpen}
      size="md"
      className="calendar-details-modal"
      component={
        <div className="calendar-details-modal-content">
          <div className="calendar-details-top">
            <img
              src={getPatientImageSrc(selectedEntry.patient.photoName ?? undefined)}
              onError={handlePatientImageLoadError}
              alt={selectedEntry.patient.patientName}
              className="calendar-details-image"
            />
            <div className="calendar-details-top-text">
              <h3 className="modal-dialog-title">
                {selectedEntry.patient.patientName}
              </h3>
              <p className="calendar-details-date">{selectedEntry.dateLabel}</p>
            </div>
          </div>

          <div className="calendar-details-grid">
            <div className="calendar-details-field">
              <span>מספר תיק</span>
              <strong>{selectedEntry.patient.serialId}</strong>
            </div>
            <div className="calendar-details-field">
              <span>בעלים</span>
              <strong>{selectedEntry.patient.ownerName || "-"}</strong>
            </div>
            <div className="calendar-details-field">
              <span>טלפון</span>
              <strong>
                {formatOwnerPhone(selectedEntry.patient.ownerPhoneNumber) || "-"}
              </strong>
            </div>
            <div className="calendar-details-field">
              <span>סטטוס</span>
              <div className="calendar-details-badges">
                {selectedEntry.patient.badges.map((badge) => (
                  <span
                    key={`modal-grid-${selectedEntry.patient.caseId}-${badge}`}
                    className={`calendar-patient-badge calendar-patient-badge-${badge}`}
                  >
                    {BADGE_LABELS[badge]}
                  </span>
                ))}
              </div>
            </div>
            {selectedEntry.patient.hospitalizationReason ? (
              <div className="calendar-details-field calendar-details-field-full">
                <span>סיבת אשפוז</span>
                <strong>{selectedEntry.patient.hospitalizationReason}</strong>
              </div>
            ) : null}
          </div>

          {hasAnyFlags(selectedEntry.patient) ? (
            <div className="calendar-details-section">
              <span className="calendar-details-section-label">דגלים מיוחדים</span>
              <div className="calendar-details-flags">
                {(
                  Object.entries(selectedEntry.patient.flags) as Array<
                    [keyof typeof FLAG_LABELS, boolean]
                  >
                )
                  .filter(([, isActive]) => isActive)
                  .map(([flagKey]) => (
                    <span
                      key={`flag-${flagKey}`}
                      className={`calendar-details-flag calendar-details-flag-${flagKey}`}
                    >
                      {FLAG_LABELS[flagKey]}
                    </span>
                  ))}
              </div>
            </div>
          ) : null}

          <div className="calendar-details-actions">
            <Button
              type="button"
              onClick={() => {
                onNavigateToCase(
                  selectedEntry.patient.caseId,
                  selectedEntry.patient.masterCaseId ?? undefined,
                );
                setIsOpen(false);
              }}
            >
              פתח תיק מלא
            </Button>
          </div>
        </div>
      }
    />
  );
}

export default CalendarDetailsModal;
