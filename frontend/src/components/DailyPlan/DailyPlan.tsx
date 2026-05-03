import MyLoader from "../../utils/MyLoader/MyLoader";
import { DailyPlanPrintHeader } from "./components/DailyPlanPrintHeader";
import { DailyPlanTable } from "./components/DailyPlanTable";
import { DailyPlanToolbar } from "./components/DailyPlanToolbar";
import "./DailyPlan.css";
import { useDailyPlan } from "./hooks/useDailyPlan";

function DailyPlan() {
  const {
    dailyPlanDetails,
    dailyPlanFormData,
    hasDailyPlanChanges,
    isLoading,
    printedAt,
    updateDailyPlan,
    updateDailyPlanComment,
  } = useDailyPlan();

  return (
    <div className="DailyPlan">
      {isLoading ? (
        <MyLoader />
      ) : (
        <>
          <DailyPlanToolbar
            hasDailyPlanChanges={hasDailyPlanChanges}
            onSave={updateDailyPlan}
          />
          <DailyPlanPrintHeader
            patientCount={dailyPlanDetails.length}
            printedAt={printedAt}
          />
          <DailyPlanTable
            dailyPlanDetails={dailyPlanDetails}
            formData={dailyPlanFormData}
            onCommentChange={updateDailyPlanComment}
          />
        </>
      )}
    </div>
  );
}

export default DailyPlan;

