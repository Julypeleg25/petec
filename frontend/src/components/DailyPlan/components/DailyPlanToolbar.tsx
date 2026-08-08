import { FaPrint } from "react-icons/fa";

import { Button } from "../../../utils/Button/Button";
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
      <Button
        className="daily-plan-print-btn"
        onClick={printDailyPlan}
        title={DAILY_PLAN_PRINT_BUTTON}
        type="button"
        sx={{ width: "auto", px: 2.5, py: 0.5, fontSize: "0.9rem" }}
      >
        <FaPrint aria-hidden="true" />
        <span>{DAILY_PLAN_PRINT_BUTTON}</span>
      </Button>
      <Button
        className="save-daily-plan-btn"
        onClick={onSave}
        disabled={!hasDailyPlanChanges}
        type="button"
        sx={{ width: "auto", px: 2.5, py: 0.5, fontSize: "0.9rem" }}
      >
        {DAILY_PLAN_SAVE_BUTTON}
      </Button>
    </div>
  );
}

