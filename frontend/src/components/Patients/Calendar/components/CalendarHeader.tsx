import { FaChevronLeft, FaChevronRight, FaSyncAlt } from "react-icons/fa";
import { Button } from "../../../../utils/Button/Button";
import type { CalendarMonthCursor } from "../utils/calendar.utils";
import { CALENDAR_WEEKDAY_LABELS, getMonthLabel } from "../utils/calendar.utils";
import { BADGE_LABELS, getBadgeIcon } from "../constants/calendar.constants";

type CalendarHeaderProps = {
  visibleMonth: CalendarMonthCursor;
  yearOptions: number[];
  isFetching: boolean;
  isViewingCurrentMonth: boolean;
  onMoveMonth: (delta: number) => void;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  onJumpToToday: () => void;
};

const monthOptions = Array.from({ length: 12 }, (_, index) => {
  const month = index + 1;
  return {
    value: month,
    label: new Date(2000, index, 1).toLocaleDateString("he-IL", {
      month: "long",
    }),
  };
});

function CalendarHeader({
  visibleMonth,
  yearOptions,
  isFetching,
  isViewingCurrentMonth,
  onMoveMonth,
  onMonthChange,
  onYearChange,
  onJumpToToday,
}: CalendarHeaderProps) {
  return (
    <section className="calendar-hero">
      <div className="calendar-hero-row">
        <div className="calendar-hero-nav">
          <Button
            type="button"
            className="calendar-nav-btn"
            onClick={() => onMoveMonth(1)}
            aria-label="חודש הבא"
          >
            <FaChevronLeft aria-hidden="true" />
          </Button>
          <select
            className="calendar-select calendar-select-month"
            aria-label="בחר חודש"
            value={visibleMonth.month}
            onChange={(event) => onMonthChange(parseInt(event.target.value, 10))}
          >
            {monthOptions.map((monthOption) => (
              <option key={monthOption.value} value={monthOption.value}>
                {monthOption.label}
              </option>
            ))}
          </select>
          <Button
            type="button"
            className="calendar-nav-btn"
            onClick={() => onMoveMonth(-1)}
            aria-label="חודש קודם"
          >
            <FaChevronRight aria-hidden="true" />
          </Button>
          <button
            type="button"
            className={`calendar-today-btn${isViewingCurrentMonth ? " calendar-today-btn-current" : ""}`}
            onClick={onJumpToToday}
            aria-label="היום"
          >
            היום
          </button>
        </div>

        <h2 className="calendar-hero-title">
          {getMonthLabel(visibleMonth.year, visibleMonth.month)}
        </h2>

        <div className="calendar-hero-meta">
          <select
            className="calendar-select calendar-select-year"
            aria-label="בחר שנה"
            value={visibleMonth.year}
            onChange={(event) => onYearChange(parseInt(event.target.value, 10))}
          >
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          {isFetching && (
            <span className="calendar-fetching-indicator">
              <FaSyncAlt aria-hidden="true" />
              מעדכן נתונים
            </span>
          )}
          <div className="calendar-legend" aria-label="מקרא">
            <span className="calendar-legend-item calendar-legend-item-procedure">
              {getBadgeIcon("procedure")}
              {BADGE_LABELS.procedure}
            </span>
            <span className="calendar-legend-item calendar-legend-item-hospitalization">
              {getBadgeIcon("hospitalization")}
              {BADGE_LABELS.hospitalization}
            </span>
          </div>
        </div>
      </div>

      <div className="calendar-hero-weekdays" aria-label="ימי השבוע">
        {CALENDAR_WEEKDAY_LABELS.map((weekdayLabel) => (
          <div key={weekdayLabel} className="calendar-hero-weekday">
            {weekdayLabel}
          </div>
        ))}
      </div>
    </section>
  );
}

export default CalendarHeader;
