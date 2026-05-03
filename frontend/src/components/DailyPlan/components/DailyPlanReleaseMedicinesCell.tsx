import FormCheckbox from "../../../utils/FormCheckbox/FormCheckbox";
import type { ReleaseMedicineItem } from "../DailyPlan.types";

type DailyPlanReleaseMedicinesCellProps = {
  releaseMedicines: ReleaseMedicineItem[];
};

export function DailyPlanReleaseMedicinesCell({
  releaseMedicines,
}: DailyPlanReleaseMedicinesCellProps) {
  return (
    <div className="daily-plan-table-body-cell daily-plan-table-body-cell-large">
      {releaseMedicines.map((releaseMedicine, index) => (
        <div key={index} className="daily-plan-table-body-cell-medicines">
          <span className="daily-plan-table-body-cell-number">
            <FormCheckbox
              checked={releaseMedicine.value}
              disabled={true}
              setChecked={() => {}}
            />
          </span>
          <span>{releaseMedicine.date}</span>
        </div>
      ))}
    </div>
  );
}

