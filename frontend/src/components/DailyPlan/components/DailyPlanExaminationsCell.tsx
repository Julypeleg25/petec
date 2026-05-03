import { DAILY_PLAN_EMPTY_VALUE } from "../DailyPlan.constants";
import type { ExaminationItem } from "../DailyPlan.types";

type DailyPlanExaminationsCellProps = {
  examinations: ExaminationItem[];
};

export function DailyPlanExaminationsCell({
  examinations,
}: DailyPlanExaminationsCellProps) {
  return (
    <div className="daily-plan-table-body-cell daily-plan-table-body-cell-large">
      {examinations.map((caseExamination, index) => (
        <div
          key={index}
          className="daily-plan-table-body-cell-examinations"
        >
          <span className="daily-plan-table-body-cell-number">
            <span>{index + 1}.</span>
            <b>{caseExamination.name}</b>
          </span>
          <span>
            {caseExamination.value === "" ? (
              <b>{DAILY_PLAN_EMPTY_VALUE}</b>
            ) : (
              caseExamination.value
            )}
          </span>
          <span>{caseExamination.date}</span>
        </div>
      ))}
    </div>
  );
}

