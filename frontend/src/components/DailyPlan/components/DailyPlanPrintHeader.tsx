import {
  DAILY_PLAN_PATIENT_COUNT_LABEL,
  DAILY_PLAN_PRINT_DATE_LABEL,
  DAILY_PLAN_PRINT_TITLE,
} from "../DailyPlan.constants";

type DailyPlanPrintHeaderProps = {
  patientCount: number;
  printedAt: string;
};

export function DailyPlanPrintHeader({
  patientCount,
  printedAt,
}: DailyPlanPrintHeaderProps) {
  return (
    <header className="daily-plan-print-header" aria-hidden="true">
      <div>
        <h1>{DAILY_PLAN_PRINT_TITLE}</h1>
        <p>PETEC</p>
      </div>
      <div className="daily-plan-print-meta">
        <span>
          <b>{DAILY_PLAN_PRINT_DATE_LABEL}:</b> {printedAt}
        </span>
        <span>
          <b>{DAILY_PLAN_PATIENT_COUNT_LABEL}:</b> {patientCount}
        </span>
      </div>
    </header>
  );
}

