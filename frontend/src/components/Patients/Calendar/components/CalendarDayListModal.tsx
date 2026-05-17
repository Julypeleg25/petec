import type { Dispatch, SetStateAction } from "react";
import type { CalendarPatientItemDTO } from "@petec/shared";
import Modal from "../../../../utils/Modal/Modal";
import type { SelectedCalendarDay } from "../types/calendar.types";
import CalendarPatientCard from "./CalendarPatientCard";

type CalendarDayListModalProps = {
  selectedDay: SelectedCalendarDay;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  onOpenDetails: (date: Date, patient: CalendarPatientItemDTO) => void;
};

function CalendarDayListModal({
  selectedDay,
  setIsOpen,
  onOpenDetails,
}: CalendarDayListModalProps) {
  return (
    <Modal
      setIsOpen={setIsOpen}
      size="lg"
      className="calendar-day-list-modal"
      component={
        <div className="calendar-day-list-modal-content">
          <div className="calendar-day-list-head">
            <div>
              <h3 className="modal-dialog-title">כל המטופלים ליום זה</h3>
              <p className="calendar-details-date">{selectedDay.dateLabel}</p>
            </div>
            <span className="calendar-day-list-count">
              {selectedDay.patients.length} מטופלים
            </span>
          </div>

          <div className="calendar-day-list-patients">
            {selectedDay.patients.map((patient) => (
              <CalendarPatientCard
                key={`day-list-${selectedDay.date.getTime()}-${patient.caseId}`}
                badgeKeyPrefix={`day-list-${selectedDay.date.getTime()}`}
                date={selectedDay.date}
                patient={patient}
                onOpenDetails={onOpenDetails}
              />
            ))}
          </div>
        </div>
      }
    />
  );
}

export default CalendarDayListModal;
