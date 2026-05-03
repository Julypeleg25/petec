import FormCheckbox from "../../../utils/FormCheckbox/FormCheckbox";
import type { ProcedureItem } from "../DailyPlan.types";

type DailyPlanProceduresCellProps = {
  procedures: ProcedureItem[];
};

export function DailyPlanProceduresCell({
  procedures,
}: DailyPlanProceduresCellProps) {
  return (
    <div className="daily-plan-table-body-cell daily-plan-table-body-cell-large">
      {procedures.map((caseProcedure, index) => (
        <div
          key={index}
          className="daily-plan-table-body-cell-examinations"
        >
          <span className="daily-plan-table-body-cell-number">
            <span>{index + 1}.</span>
            <b>{caseProcedure.name}</b>
            <FormCheckbox
              checked={caseProcedure.value}
              disabled={true}
              setChecked={() => {}}
            />
          </span>
          <span />
          <span>{caseProcedure.date}</span>
        </div>
      ))}
    </div>
  );
}

