import type { CalendarPatientItemDTO } from "@petec/shared";
import { isPastCalendarDay } from "../utils/calendar.helpers";
import type { CalendarDayView } from "../types/calendar.types";
import CalendarCompactPatientCard from "./CalendarCompactPatientCard";

type CalendarMonthDayProps = {
  day: CalendarDayView;
  onOpenDetails: (date: Date, patient: CalendarPatientItemDTO) => void;
  onOpenDayList: (date: Date, patients: CalendarPatientItemDTO[]) => void;
};

function CalendarMonthDay({
  day,
  onOpenDetails,
  onOpenDayList,
}: CalendarMonthDayProps) {
  const visiblePatients = day.patients.slice(0, 3);
  const hiddenPatientsCount = Math.max(day.patients.length - visiblePatients.length, 0);
  const isPast = isPastCalendarDay(day.date);

  return (
    <article
      className={`calendar-day${day.meta.isToday ? " calendar-day-today" : ""}${
        isPast && !day.meta.isToday ? " calendar-day-past" : ""
      }`}
    >
      <div className="calendar-day-head">
        <div className="calendar-day-head-main">
          <div
            className={`calendar-day-number${
              day.meta.isToday ? " calendar-day-number-today" : ""
            }`}
          >
            {day.date.getDate()}
          </div>
          <div className="calendar-day-meta">
            <span className="calendar-hebrew-date">{day.meta.hebrewDateLabel}</span>
            {day.patients.length > 0 ? (
              <span className="calendar-day-count">{day.patients.length} מטופלים</span>
            ) : (
              <span className="calendar-day-count calendar-day-count-empty">
                אין מטופלים
              </span>
            )}
          </div>
        </div>

        {(day.meta.holidayLabels.length > 0 || day.meta.specialLabels.length > 0) && (
          <div className="calendar-day-events">
            {day.meta.holidayLabels.map((label) => (
              <span
                key={`${day.dateKey}-holiday-${label}`}
                className="calendar-day-event calendar-day-event-holiday"
              >
                {label}
              </span>
            ))}
            {day.meta.specialLabels.map((label) => (
              <span
                key={`${day.dateKey}-special-${label}`}
                className="calendar-day-event calendar-day-event-special"
              >
                {label}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="calendar-day-body">
        <div className="calendar-patient-list">
          {visiblePatients.length > 0 ? (
            visiblePatients.map((patient) => (
              <CalendarCompactPatientCard
                key={`${day.dateKey}-${patient.caseId}`}
                date={day.date}
                patient={patient}
                onOpenDetails={onOpenDetails}
              />
            ))
          ) : (
            <div className="calendar-day-empty-note">אין מקרים ליום זה</div>
          )}
        </div>
        {hiddenPatientsCount > 0 ? (
          <button
            type="button"
            className="calendar-view-all-btn"
            onClick={() => onOpenDayList(day.date, day.patients)}
          >
            <span>+{hiddenPatientsCount} נוספים</span>
            <strong>לכל המטופלים</strong>
          </button>
        ) : null}
      </div>
    </article>
  );
}

export default CalendarMonthDay;
