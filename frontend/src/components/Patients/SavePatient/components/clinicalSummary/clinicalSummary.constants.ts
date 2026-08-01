import type { ClinicalSummaryResultDTO } from "@petec/shared";

export type CaseDetailItem =
  ClinicalSummaryResultDTO["caseDetailItems"][number];
export type CaseDetailCategory = CaseDetailItem["category"];
export type CaseDetailStatus = CaseDetailItem["status"];
export type CaseDetailStatusFilter = "all" | CaseDetailStatus;
export type CaseDetailCategoryFilter = "all" | CaseDetailCategory;
export type CaseDetailTimeFilter =
  "all" | "overnight" | "morning" | "afternoon" | "evening";
export type CaseDetailSortOrder = "ascending" | "descending";

export const CASE_DETAILS_PER_PAGE = 3;
export const EXPANDED_CASE_DETAILS_PER_PAGE = 9;
export const CLINICAL_TIME_ZONE = "Asia/Jerusalem";
export const CLINICAL_SUMMARY_ERROR_MESSAGE =
  "לא ניתן ליצור את הסיכום עקב שגיאת תקשורת. יש לבדוק את החיבור ולנסות שוב.";
export const CLINICAL_SUMMARY_EMPTY_TEXT = "אין מידע מתועד להצגה.";
export const CLINICAL_SUMMARY_WARNING =
  "סיכום זה נוצר באמצעות בינה מלאכותית ויש לאמת אותו מול הרשומה הרפואית. אין להסתמך עליו כתחליף לעיון ברשומה המלאה.";

export const CASE_DETAIL_CATEGORY_LABELS: Readonly<
  Record<CaseDetailCategory, string>
> = {
  medicine: "תרופה",
  fluid: "נוזלים",
  procedure: "פרוצדורה",
  examination: "בדיקה",
  food_extra: "תוספת מזון",
  care: "מעקב וטיפול",
};

export const CASE_DETAIL_STATUS_LABELS: Readonly<
  Record<CaseDetailStatus, string>
> = {
  received: "קיבל/ה",
  not_received_yet: "טרם קיבל/ה",
  recorded: "תועד",
};

export const PENDING_CASE_DETAIL_LABELS: Readonly<
  Record<CaseDetailCategory, string>
> = {
  medicine: "טרם קיבל/ה",
  fluid: "טרם קיבל/ה",
  procedure: "טרם בוצע",
  examination: "טרם תועד",
  food_extra: "טרם קיבל/ה",
  care: "טרם תועד",
};

export const CASE_DETAIL_STATUS_CLASS_NAMES: Readonly<
  Record<CaseDetailStatus, string>
> = {
  received: "is-received",
  not_received_yet: "is-pending",
  recorded: "is-recorded",
};

export const CASE_DETAIL_STATUS_FILTER_OPTIONS: ReadonlyArray<{
  readonly value: CaseDetailStatusFilter;
  readonly label: string;
}> = [
  { value: "all", label: "הכול" },
  { value: "not_received_yet", label: "טרם ניתן או בוצע" },
  { value: "received", label: "ניתן או בוצע" },
  { value: "recorded", label: "תועד" },
];

export const CASE_DETAIL_CATEGORY_FILTER_OPTIONS: ReadonlyArray<{
  readonly value: CaseDetailCategoryFilter;
  readonly label: string;
}> = [
  { value: "all", label: "כל הסוגים" },
  ...Object.entries(CASE_DETAIL_CATEGORY_LABELS).map(([value, label]) => ({
    value: value as CaseDetailCategory,
    label,
  })),
];

export const CASE_DETAIL_TIME_FILTER_OPTIONS: ReadonlyArray<{
  readonly value: CaseDetailTimeFilter;
  readonly label: string;
  readonly startHour: number;
  readonly endHour: number;
}> = [
  { value: "all", label: "כל השעות", startHour: 0, endHour: 23 },
  { value: "overnight", label: "00:00-05:59", startHour: 0, endHour: 5 },
  { value: "morning", label: "06:00-11:59", startHour: 6, endHour: 11 },
  { value: "afternoon", label: "12:00-17:59", startHour: 12, endHour: 17 },
  { value: "evening", label: "18:00-23:59", startHour: 18, endHour: 23 },
];

export const CASE_DETAIL_SORT_OPTIONS: ReadonlyArray<{
  readonly value: CaseDetailSortOrder;
  readonly label: string;
}> = [
  { value: "ascending", label: "מהמוקדם למאוחר" },
  { value: "descending", label: "מהמאוחר למוקדם" },
];
