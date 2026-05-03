import type { DailyPlanDetailDTO } from "@petec/shared";

import type { DailyPlanFormData } from "./DailyPlan.types";

const dailyPlanPrintDateFormatter = new Intl.DateTimeFormat("he-IL", {
  dateStyle: "full",
  timeStyle: "short",
});

export const normalizeDailyPlanComments = (comments?: string | null): string =>
  comments ?? "";

export const toDailyPlanFormData = (
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

export const formatDailyPlanPrintedAt = (date = new Date()): string =>
  dailyPlanPrintDateFormatter.format(date);

export const formatOwnerPhoneNumber = (phoneNumber?: string | null): string =>
  phoneNumber && phoneNumber.length > 3
    ? phoneNumber.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3")
    : (phoneNumber ?? "");

export const printDailyPlan = () => {
  window.print();
};
