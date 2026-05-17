import type { CalendarPatientItemDTO } from "@petec/shared";
import type { CalendarDayView } from "../types/calendar.types";
import CalendarPatientCard from "./CalendarPatientCard";

type CalendarAgendaDayProps = {
  day: CalendarDayView;
  onOpenDetails: (date: Date, patient: CalendarPatientItemDTO) => void;
};

function CalendarAgendaDay({ day, onOpenDetails }: CalendarAgendaDayProps) {
  return (
    <article
      data-calendar-today={day.meta.isToday ? "true" : undefined}
      data-calendar-date-key={day.dateKey}
      className={`calendar-agenda-day${
        day.meta.isToday ? " calendar-agenda-day-today" : ""
      }`}
    >
      <div className="calendar-agenda-day-head">
        <div className="calendar-agenda-title">
          <strong>{day.date.getDate()}</strong>
          <div className="calendar-day-head-left">
            <span>{day.meta.hebrewDateLabel}</span>
            {(day.meta.holidayLabels.length > 0 ||
              day.meta.specialLabels.length > 0) && (
              <div className="calendar-day-events">
                {day.meta.holidayLabels.map((label) => (
                  <span
                    key={`${day.dateKey}-agenda-holiday-${label}`}
                    className="calendar-day-event calendar-day-event-holiday"
                  >
                    {label}
                  </span>
                ))}
                {day.meta.specialLabels.map((label) => (
                  <span
                    key={`${day.dateKey}-agenda-special-${label}`}
                    className="calendar-day-event calendar-day-event-special"
                  >
                    {label}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <span className="calendar-agenda-count">{day.patients.length} מטופלים</span>
      </div>

      <div className="calendar-agenda-patients">
        {day.patients.length > 0 ? (
          day.patients.map((patient) => (
            <CalendarPatientCard
              key={`agenda-patient-${day.dateKey}-${patient.caseId}`}
              badgeKeyPrefix={`agenda-${day.dateKey}`}
              date={day.date}
              patient={patient}
              onOpenDetails={onOpenDetails}
            />
          ))
        ) : (
          <div className="calendar-day-empty-note">אין מקרים ליום זה</div>
        )}
      </div>
    </article>
  );
}

export default CalendarAgendaDay;
