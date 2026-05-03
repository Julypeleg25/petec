import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import type { DailyPlanDetailDTO } from "@petec/shared";

import { patientsApi } from "../../../features/patients/patients.api";
import type { DailyPlanFormData } from "../DailyPlan.types";
import {
  formatDailyPlanPrintedAt,
  toDailyPlanFormData,
} from "../DailyPlan.utils";

export const useDailyPlan = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [dailyPlanDetails, setDailyPlanDetails] = useState<
    DailyPlanDetailDTO[]
  >([]);
  const [dailyPlanFormData, setDailyPlanFormData] =
    useState<DailyPlanFormData>({});
  const [initialDailyPlanFormData, setInitialDailyPlanFormData] =
    useState<DailyPlanFormData>({});
  const printedAt = formatDailyPlanPrintedAt();

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
      setInitialDailyPlanFormData(details);
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

  const updateDailyPlanComment = (caseId: string, comment: string) => {
    setDailyPlanFormData((prevState) => ({
      ...prevState,
      [caseId]: {
        ...prevState[caseId],
        comment,
      },
    }));
  };

  useEffect(() => {
    getDailyPlanDetails();
  }, []);

  return {
    dailyPlanDetails,
    dailyPlanFormData,
    hasDailyPlanChanges,
    isLoading,
    printedAt,
    updateDailyPlanComment,
    updateDailyPlan,
  };
};
