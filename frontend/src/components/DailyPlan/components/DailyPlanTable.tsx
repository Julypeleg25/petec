import type { DailyPlanDetailDTO } from "@petec/shared";

import type {
  DailyPlanCommentChangeHandler,
  DailyPlanFormData,
} from "../DailyPlan.types";
import { DailyPlanTableHeader } from "./DailyPlanTableHeader";
import { DailyPlanTableRow } from "./DailyPlanTableRow";

type DailyPlanTableProps = {
  dailyPlanDetails: DailyPlanDetailDTO[];
  formData: DailyPlanFormData;
  onCommentChange: DailyPlanCommentChangeHandler;
};

export function DailyPlanTable({
  dailyPlanDetails,
  formData,
  onCommentChange,
}: DailyPlanTableProps) {
  return (
    <div className="daily-plan-table">
      <DailyPlanTableHeader />
      <div className="daily-plan-table-body">
        {dailyPlanDetails.map((dailyPlanDetail) => (
          <DailyPlanTableRow
            key={dailyPlanDetail.case_id}
            dailyPlanDetail={dailyPlanDetail}
            formData={formData}
            onCommentChange={onCommentChange}
          />
        ))}
      </div>
    </div>
  );
}

