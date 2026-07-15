import FormTextarea from "../../../utils/FormTextarea/FormTextarea";
import { DAILY_PLAN_EMPTY_VALUE } from "../DailyPlan.constants";

type DailyPlanCommentCellProps = {
  caseId: string;
  comment?: string;
  onCommentChange: (caseId: string, comment: string) => void;
};

export function DailyPlanCommentCell({
  caseId,
  comment = "",
  onCommentChange,
}: DailyPlanCommentCellProps) {
  return (
    <div className="daily-plan-table-body-cell daily-plan-table-body-cell-large">
      <div className="daily-plan-print-comment">
        {comment || DAILY_PLAN_EMPTY_VALUE}
      </div>
      <FormTextarea
        state={comment}
        setState={(val: string) => {
          onCommentChange(caseId, val);
        }}
        maxLength={300}
        isGrowHeightOnInput={true}
      />
    </div>
  );
}

