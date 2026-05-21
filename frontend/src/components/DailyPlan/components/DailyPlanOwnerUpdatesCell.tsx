import { DAILY_PLAN_EMPTY_VALUE } from "../DailyPlan.constants";
import type { OwnerUpdateItem } from "../DailyPlan.types";

type DailyPlanOwnerUpdatesCellProps = {
  ownerUpdates: OwnerUpdateItem[];
};

export function DailyPlanOwnerUpdatesCell({
  ownerUpdates,
}: DailyPlanOwnerUpdatesCellProps) {
  return (
    <div className="daily-plan-table-body-cell daily-plan-table-body-cell-large">
      {ownerUpdates.map((ownerUpdate, index) => (
        <div
          key={index}
          className="daily-plan-table-body-cell-owner-update"
        >
          <span className="daily-plan-table-body-cell-number">
            <span>{index + 1}.</span>
            <span>
              {ownerUpdate.value === "" ? (
                <b>{DAILY_PLAN_EMPTY_VALUE}</b>
              ) : (
                ownerUpdate.value
              )}
            </span>
          </span>
          <span>{ownerUpdate.date}</span>
        </div>
      ))}
    </div>
  );
}

