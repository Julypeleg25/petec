import { DAILY_PLAN_TABLE_HEADERS } from "../DailyPlan.constants";

const LARGE_HEADER_START_INDEX = 5;

export function DailyPlanTableHeader() {
  return (
    <div className="daily-plan-table-header">
      {DAILY_PLAN_TABLE_HEADERS.map((header, index) => (
        <div
          key={header}
          className={`daily-plan-table-header-cell${
            index >= LARGE_HEADER_START_INDEX
              ? " daily-plan-table-header-cell-large"
              : ""
          }`}
        >
          {header}
        </div>
      ))}
    </div>
  );
}

