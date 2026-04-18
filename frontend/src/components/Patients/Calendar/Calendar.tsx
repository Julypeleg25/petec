import { startTransition, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import type { CalendarPatientItemDTO } from "@petec/shared";
import { AppRoutes } from "../../../config/appRoutes";
import { patientsApi } from "../../../features/patients/patients.api";
import { patientKeys } from "../../../features/patients/hooks/patient.keys";
import MyLoader from "../../../utils/MyLoader/MyLoader";
import CalendarAgendaDay from "./components/CalendarAgendaDay";
import CalendarDayListModal from "./components/CalendarDayListModal";
import CalendarDetailsModal from "./components/CalendarDetailsModal";
import CalendarHeader from "./components/CalendarHeader";
import CalendarMonthDay from "./components/CalendarMonthDay";
import { calendarKeys } from "./hooks/calendar.keys";
import { formatCalendarDateLabel } from "./constants/calendar.constants";
import {
  buildCalendarDays,
  buildDayLookup,
  createYearOptions,
} from "./utils/calendar.helpers";
import { buildHolidayLookup, fetchHebcalMonth } from "./api/calendar.hebcal";
import type {
  CalendarMonthDataDay,
  SelectedCalendarDay,
  SelectedCalendarEntry,
} from "./types/calendar.types";
import {
  buildMonthGrid,
  CALENDAR_WEEKDAY_LABELS,
  createCurrentMonthCursor,
  getDateKey,
  shiftMonthCursor,
} from "./utils/calendar.utils";
import "./Calendar.css";

function Calendar() {
  const navigate = useNavigate();
  const [visibleMonth, setVisibleMonth] = useState(createCurrentMonthCursor);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<SelectedCalendarEntry | null>(
    null,
  );
  const [isDayListOpen, setIsDayListOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<SelectedCalendarDay | null>(null);

  const currentMonthCursor = createCurrentMonthCursor();
  const isViewingCurrentMonth =
    visibleMonth.year === currentMonthCursor.year &&
    visibleMonth.month === currentMonthCursor.month;
  const yearOptions = createYearOptions(currentMonthCursor.year);

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: patientKeys.calendar(visibleMonth.year, visibleMonth.month),
    queryFn: () =>
      patientsApi.getCalendarMonth(visibleMonth.year, visibleMonth.month),
    staleTime: 1000 * 60 * 5,
    placeholderData: (previousData) => previousData,
  });

  const { data: hebcalItems } = useQuery({
    queryKey: calendarKeys.hebcal(visibleMonth.year, visibleMonth.month),
    queryFn: () => fetchHebcalMonth(visibleMonth.year, visibleMonth.month),
    staleTime: 1000 * 60 * 60,
  });

  useEffect(() => {
    if (!isDetailsOpen) {
      setSelectedEntry(null);
    }
  }, [isDetailsOpen]);

  useEffect(() => {
    if (!isDayListOpen) {
      setSelectedDay(null);
    }
  }, [isDayListOpen]);

  const holidayLookup = hebcalItems ? buildHolidayLookup(hebcalItems) : undefined;
  const calendarDataDays = (data?.days ?? []) as CalendarMonthDataDay[];
  const dayLookup = buildDayLookup(calendarDataDays);
  const monthGrid = buildMonthGrid(visibleMonth.year, visibleMonth.month);
  const calendarDays = buildCalendarDays(monthGrid, dayLookup, holidayLookup);
  const calendarDaysByKey = new Map(
    calendarDays.map((day) => [day.dateKey, day] as const),
  );

  const navigateToCase = (caseId: string, masterCaseId?: string): void => {
    navigate(AppRoutes.Patients.Details.build(masterCaseId ?? caseId, caseId));
  };

  const moveVisibleMonth = (delta: number): void => {
    startTransition(() => {
      setVisibleMonth((current) => shiftMonthCursor(current, delta));
    });
  };

  const handleMonthChange = (month: number): void => {
    startTransition(() => {
      setVisibleMonth((current) => ({ ...current, month }));
    });
  };

  const handleYearChange = (year: number): void => {
    startTransition(() => {
      setVisibleMonth((current) => ({ ...current, year }));
    });
  };

  const jumpToToday = (): void => {
    startTransition(() => {
      setVisibleMonth(createCurrentMonthCursor());
    });
  };

  const openDetails = (
    date: Date,
    patient: CalendarPatientItemDTO,
  ): void => {
    setIsDayListOpen(false);
    setSelectedEntry({
      dateLabel: formatCalendarDateLabel(date),
      patient,
    });
    setIsDetailsOpen(true);
  };

  const openDayList = (
    date: Date,
    patients: CalendarPatientItemDTO[],
  ): void => {
    setSelectedDay({
      date,
      dateLabel: formatCalendarDateLabel(date),
      patients,
    });
    setIsDayListOpen(true);
  };

  if (isLoading && !data) {
    return (
      <div className="Calendar calendar-state">
        <MyLoader />
      </div>
    );
  }

  if (isError && !data) {
    return (
      <div className="Calendar calendar-state">
        <div className="calendar-empty-state">
          <h3>לא הצלחנו לטעון את היומן</h3>
          <p>אפשר לנסות שוב. הנתונים לא נפגעו.</p>
          <button
            type="button"
            className="btn calendar-retry-btn"
            onClick={() => {
              void refetch();
            }}
          >
            טען מחדש
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="Calendar">
        <CalendarHeader
          visibleMonth={visibleMonth}
          yearOptions={yearOptions}
          isFetching={isFetching}
          isViewingCurrentMonth={isViewingCurrentMonth}
          onMoveMonth={moveVisibleMonth}
          onMonthChange={handleMonthChange}
          onYearChange={handleYearChange}
          onJumpToToday={jumpToToday}
        />

        <section className="calendar-content">
          <div className="calendar-grid-shell">
            <div className="calendar-weekdays-row">
              {CALENDAR_WEEKDAY_LABELS.map((weekdayLabel) => (
                <div key={weekdayLabel} className="calendar-weekday">
                  {weekdayLabel}
                </div>
              ))}
            </div>

            <div className="calendar-grid-scroll">
              <div className="calendar-grid">
                {monthGrid.map((date, index) => {
                  if (!date) {
                    return (
                      <div
                        key={`empty-${index}`}
                        className="calendar-day calendar-day-empty"
                      />
                    );
                  }

                  const day = calendarDaysByKey.get(getDateKey(date));

                  if (!day) {
                    return null;
                  }

                  return (
                    <CalendarMonthDay
                      key={day.dateKey}
                      day={day}
                      onOpenDetails={openDetails}
                      onOpenDayList={openDayList}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          <div className="calendar-agenda">
            {calendarDays.map((day) => (
              <CalendarAgendaDay
                key={`agenda-${day.dateKey}`}
                day={day}
                onOpenDetails={openDetails}
              />
            ))}
          </div>
        </section>
      </div>

      {isDayListOpen && selectedDay ? (
        <CalendarDayListModal
          selectedDay={selectedDay}
          setIsOpen={setIsDayListOpen}
          onOpenDetails={openDetails}
        />
      ) : null}

      {isDetailsOpen && selectedEntry ? (
        <CalendarDetailsModal
          selectedEntry={selectedEntry}
          setIsOpen={setIsDetailsOpen}
          onNavigateToCase={navigateToCase}
        />
      ) : null}
    </>
  );
}

export default Calendar;
