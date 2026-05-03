import type { DailyPlanDetailDTO } from "@petec/shared";

import type {
  DailyPlanCommentChangeHandler,
  DailyPlanFormData,
} from "../DailyPlan.types";
import { formatOwnerPhoneNumber } from "../DailyPlan.utils";
import { DailyPlanCommentCell } from "./DailyPlanCommentCell";
import { DailyPlanExaminationsCell } from "./DailyPlanExaminationsCell";
import { DailyPlanOwnerUpdatesCell } from "./DailyPlanOwnerUpdatesCell";
import { DailyPlanProceduresCell } from "./DailyPlanProceduresCell";
import { DailyPlanReleaseMedicinesCell } from "./DailyPlanReleaseMedicinesCell";

type DailyPlanTableRowProps = {
  dailyPlanDetail: DailyPlanDetailDTO;
  formData: DailyPlanFormData;
  onCommentChange: DailyPlanCommentChangeHandler;
};

export function DailyPlanTableRow({
  dailyPlanDetail,
  formData,
  onCommentChange,
}: DailyPlanTableRowProps) {
  return (
    <div className="daily-plan-table-body-row">
      <div className="daily-plan-table-body-cell">
        {dailyPlanDetail.master_case_id}
      </div>
      <div className="daily-plan-table-body-cell">{dailyPlanDetail.name}</div>
      <div className="daily-plan-table-body-cell">
        {dailyPlanDetail.owner_name}
      </div>
      <div className="daily-plan-table-body-cell">
        {formatOwnerPhoneNumber(dailyPlanDetail.owner_phone_number)}
      </div>
      <div className="daily-plan-table-body-cell">
        {dailyPlanDetail.hospitalization_reason}
      </div>
      <DailyPlanExaminationsCell
        examinations={dailyPlanDetail.caseExaminations}
      />
      <DailyPlanProceduresCell procedures={dailyPlanDetail.caseProcedures} />
      <DailyPlanOwnerUpdatesCell ownerUpdates={dailyPlanDetail.ownerUpdate} />
      <DailyPlanReleaseMedicinesCell
        releaseMedicines={dailyPlanDetail.releaseMedicines}
      />
      <DailyPlanCommentCell
        caseId={dailyPlanDetail.case_id}
        comment={formData[dailyPlanDetail.case_id]?.comment}
        onCommentChange={onCommentChange}
      />
    </div>
  );
}

