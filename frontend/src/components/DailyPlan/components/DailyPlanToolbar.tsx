import { FaPrint } from "react-icons/fa";

import {
  DAILY_PLAN_PRINT_BUTTON,
  DAILY_PLAN_SAVE_BUTTON,
} from "../DailyPlan.constants";
import { printDailyPlan } from "../DailyPlan.utils";

type DailyPlanToolbarProps = {
  hasDailyPlanChanges: boolean;
  onSave: () => void;
};

export function DailyPlanToolbar({
  hasDailyPlanChanges,
  onSave,
}: DailyPlanToolbarProps) {
  return (
    <div className="daily-plan-toolbar">
      <button
        className="btn btn-small daily-plan-print-btn"
        onClick={printDailyPlan}
        title={DAILY_PLAN_PRINT_BUTTON}
        type="button"
      >
        <FaPrint aria-hidden="true" />
        <span>{DAILY_PLAN_PRINT_BUTTON}</span>
      </button>
      <button
        className="btn btn-small save-daily-plan-btn"
        onClick={onSave}
        disabled={!hasDailyPlanChanges}
        type="button"
      >
        {DAILY_PLAN_SAVE_BUTTON}
      </button>
    </div>
  );
}

