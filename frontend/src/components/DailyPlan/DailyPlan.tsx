import { useEffect, useState } from "react";
import { patientsApi } from "../../features/patients/patients.api";
import "./DailyPlan.css";
import FormCheckbox from "../../utils/FormCheckbox/FormCheckbox";
import MyLoader from "../../utils/MyLoader/MyLoader";
import FormTextarea from "../../utils/FormTextarea/FormTextarea";
import toast from "react-hot-toast";
import type { DailyPlanDetailDTO } from "@petec/shared";

import { DailyPlanFormData, ExaminationItem, ProcedureItem, OwnerUpdateItem, ReleaseMedicineItem } from "./DailyPlan.types";

const normalizeDailyPlanComments = (comments?: string | null): string =>
  comments ?? "";

const toDailyPlanFormData = (
  details: DailyPlanDetailDTO[],
): DailyPlanFormData => {
  const formData: DailyPlanFormData = {};

  for (const item of details) {
    formData[item.case_id] = {
      comment: normalizeDailyPlanComments(item.daily_plan_comments),
    };
  }

  return formData;
};

function DailyPlan() {
  const [isLoading, setIsLoading] = useState(true);
  const [dailyPlanDetails, setDailyPlanDetails] = useState<DailyPlanDetailDTO[]>([]);
  const [dailyPlanFormData, setDailyPlanFormData] = useState<DailyPlanFormData>({});
  const [initialDailyPlanFormData, setInitialDailyPlanFormData] = useState<DailyPlanFormData>({});

  const hasDailyPlanChanges = dailyPlanDetails.some(
    (item) =>
      (dailyPlanFormData[item.case_id]?.comment ?? "") !==
      (initialDailyPlanFormData[item.case_id]?.comment ?? ""),
  );

  const getDailyPlanDetails = async () => {
    try {
      const data = await patientsApi.getDailyPlan();
      const details = toDailyPlanFormData(data);
      setDailyPlanFormData(details);
      setInitialDailyPlanFormData(toDailyPlanFormData(data));
      setDailyPlanDetails(data);
    } catch {
      toast.error("שגיאה בטעינת פרטי התכנון");
    } finally {
      setIsLoading(false);
    }
  };

  const updateDailyPlan = async () => {
    if (!hasDailyPlanChanges) {
      return;
    }

    try {
      await patientsApi.updateDailyPlan(dailyPlanFormData);
      setInitialDailyPlanFormData({
        ...dailyPlanFormData,
      });
      toast.success("הפרטים נשמרו בהצלחה");
    } catch {
      toast.error("שגיאה בשמירת הפרטים");
    }
  };

  useEffect(() => {
    getDailyPlanDetails();
  }, []);

  return (
    <div className="DailyPlan">
      {isLoading ? (
        <MyLoader />
      ) : (
        <>
          <button
            className="btn btn-small save-daily-plan-btn"
            onClick={updateDailyPlan}
            disabled={!hasDailyPlanChanges}
          >
            שמור
          </button>
          <div className="daily-plan-table">
            <div className="daily-plan-grid">
              <div className="daily-plan-table-header">
                <div className="daily-plan-table-header-cell">מספר תיק</div>
                <div className="daily-plan-table-header-cell">שם</div>
                <div className="daily-plan-table-header-cell">שם בעלים</div>
                <div className="daily-plan-table-header-cell">מס' טלפון בעלים</div>
                <div className="daily-plan-table-header-cell">סיבת אישפוז</div>
                <div className="daily-plan-table-header-cell">בדיקות</div>
                <div className="daily-plan-table-header-cell">פרוצדורות</div>
                <div className="daily-plan-table-header-cell">עדכון בעלים</div>
                <div className="daily-plan-table-header-cell">תרופות שחרור</div>
                <div className="daily-plan-table-header-cell">הערות</div>
              </div>
              <div className="daily-plan-table-body">
                {dailyPlanDetails.map((dailyPlanDetail: DailyPlanDetailDTO, index: number) => (
                  <div key={index} className="daily-plan-table-body-row">
                    <div className="daily-plan-table-body-cell">
                      {dailyPlanDetail.master_case_id}
                    </div>
                    <div className="daily-plan-table-body-cell">
                      {dailyPlanDetail.name}
                    </div>
                    <div className="daily-plan-table-body-cell">
                      {dailyPlanDetail.owner_name}
                    </div>
                    <div className="daily-plan-table-body-cell">
                      {dailyPlanDetail.owner_phone_number?.length > 3
                        ? dailyPlanDetail.owner_phone_number.replace(
                            /(\d{3})(\d{3})(\d{4})/,
                            "$1-$2-$3"
                          )
                        : dailyPlanDetail.owner_phone_number}
                    </div>
                    <div className="daily-plan-table-body-cell">
                      {dailyPlanDetail.hospitalization_reason}
                    </div>
                    <div className="daily-plan-table-body-cell daily-plan-table-body-cell-large">
                      {dailyPlanDetail.caseExaminations.map(
                        (caseExamination: ExaminationItem, exIdx: number) => (
                          <div key={exIdx} className="daily-plan-table-body-cell-examinations">
                            <span className="daily-plan-table-body-cell-number">
                              <span>{exIdx + 1}.</span>
                              <b>{caseExamination.name}</b>
                            </span>
                            <span>
                              {caseExamination.value === "" ? <b>-</b> : caseExamination.value}
                            </span>
                            <span>{caseExamination.date}</span>
                          </div>
                        )
                      )}
                    </div>
                    <div className="daily-plan-table-body-cell daily-plan-table-body-cell-large">
                      {dailyPlanDetail.caseProcedures.map(
                        (caseProcedure: ProcedureItem, procIdx: number) => (
                          <div key={procIdx} className="daily-plan-table-body-cell-examinations">
                            <span className="daily-plan-table-body-cell-number">
                              <span>{procIdx + 1}.</span>
                              <b>{caseProcedure.name}</b>
                              <FormCheckbox
                                checked={caseProcedure.value}
                                disabled={true}
                                setChecked={() => {}}
                              />
                            </span>
                            <span></span>
                            <span>{caseProcedure.date}</span>
                          </div>
                        )
                      )}
                    </div>
                    <div className="daily-plan-table-body-cell daily-plan-table-body-cell-large">
                      {dailyPlanDetail.ownerUpdate.map(
                        (ownerUpdate: OwnerUpdateItem, ownerIdx: number) => (
                          <div key={ownerIdx} className="daily-plan-table-body-cell-owner-update">
                            <span className="daily-plan-table-body-cell-number">
                              <span>{ownerIdx + 1}.</span>
                              <span>
                                {ownerUpdate.value === "" ? <b>-</b> : ownerUpdate.value}
                              </span>
                            </span>
                            <span>{ownerUpdate.date}</span>
                          </div>
                        )
                      )}
                    </div>
                    <div className="daily-plan-table-body-cell daily-plan-table-body-cell-large">
                      {dailyPlanDetail.releaseMedicines.map(
                        (releaseMedicine: ReleaseMedicineItem, medIdx: number) => (
                          <div key={medIdx} className="daily-plan-table-body-cell-medicines">
                            <span className="daily-plan-table-body-cell-number">
                              <FormCheckbox
                                checked={releaseMedicine.value}
                                disabled={true}
                                setChecked={() => {}}
                              />
                            </span>
                            <span>{releaseMedicine.date}</span>
                          </div>
                        )
                      )}
                    </div>
                    <div className="daily-plan-table-body-cell daily-plan-table-body-cell-large">
                      <FormTextarea
                        state={dailyPlanFormData[dailyPlanDetail.case_id]?.comment ?? ""}
                        setState={(val: string) => {
                          setDailyPlanFormData((prevState) => ({
                            ...prevState,
                            [dailyPlanDetail.case_id]: {
                              ...prevState[dailyPlanDetail.case_id],
                              comment: val,
                            },
                          }));
                        }}
                        maxLength={300}
                        isGrowHeightOnInput={true}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default DailyPlan;
