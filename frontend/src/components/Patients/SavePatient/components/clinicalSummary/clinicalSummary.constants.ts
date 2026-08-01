import type { ClinicalSummaryResultDTO } from "@petec/shared";

export type CaseDetailItem =
  ClinicalSummaryResultDTO["caseDetailItems"][number];
export type CaseDetailCategory = CaseDetailItem["category"];
export type CaseDetailStatus = CaseDetailItem["status"];

export const CASE_DETAILS_PER_PAGE = 3;
export const CLINICAL_TIME_ZONE = "Asia/Jerusalem";
export const CLINICAL_SUMMARY_ERROR_MESSAGE =
  "לא ניתן ליצור את הסיכום כעת. לא בוצע כל שינוי ברשומת המטופל.";
export const CLINICAL_SUMMARY_WARNING =
  "סיכום זה נוצר באמצעות בינה מלאכותית ויש לאמת אותו מול הרשומה הרפואית. אין להסתמך עליו כתחליף לעיון ברשומה המלאה.";

export const CASE_DETAIL_CATEGORY_LABELS: Record<CaseDetailCategory, string> = {
  medicine: "תרופה",
  fluid: "נוזלים",
  procedure: "פרוצדורה",
  examination: "בדיקה",
  food_extra: "תוספת מזון",
  care: "מעקב וטיפול",
};

export const CASE_DETAIL_STATUS_LABELS: Record<CaseDetailStatus, string> = {
  received: "קיבל/ה",
  not_received_yet: "טרם קיבל/ה",
  recorded: "תועד",
};

export const PENDING_CASE_DETAIL_LABELS: Record<CaseDetailCategory, string> = {
  medicine: "טרם קיבל/ה",
  fluid: "טרם קיבל/ה",
  procedure: "טרם בוצע",
  examination: "טרם תועד",
  food_extra: "טרם קיבל/ה",
  care: "טרם תועד",
};

export const CASE_DETAIL_STATUS_ICONS: Record<CaseDetailStatus, string> = {
  received: "✓",
  not_received_yet: "!",
  recorded: "•",
};

export const CASE_DETAIL_STATUS_CLASS_NAMES: Record<CaseDetailStatus, string> =
  {
    received: "is-received",
    not_received_yet: "is-pending",
    recorded: "is-recorded",
  };

export const HEBREW_WEEKDAY_FORMAT = { weekday: "short" } as const;
