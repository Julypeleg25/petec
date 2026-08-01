import { AppError, HttpStatus } from "@petec/shared";
import type { ClinicalSummaryFailureCategory } from "./clinicalSummary.types.js";

export const CLINICAL_SUMMARY_ERROR_MESSAGES: Readonly<
  Record<ClinicalSummaryFailureCategory, string>
> = Object.freeze({
  disabled: "שירות הסיכום הקליני אינו מופעל כרגע. יש לפנות למנהל המערכת.",
  missing_key: "שירות הסיכום הקליני אינו מוגדר בשרת. יש לפנות למנהל המערכת.",
  not_found: "לא נמצאה רשומת מטופל פעילה לסיכום.",
  empty_record: "אין מספיק מידע קליני מתועד עבור היום שנבחר כדי ליצור סיכום.",
  input_too_large:
    "לא ניתן היה להכין את נתוני הרשומה לסיכום. יש לנסות שוב, ואם הבעיה נמשכת לפנות לתמיכה.",
  timeout: "יצירת הסיכום ארכה זמן רב מהצפוי והופסקה. אפשר לנסות שוב בעוד רגע.",
  rate_limit: "שירות הסיכום עמוס כרגע. אפשר לנסות שוב בעוד מספר דקות.",
  provider: "שירות יצירת הסיכום אינו זמין כרגע. אפשר לנסות שוב מאוחר יותר.",
  invalid_output:
    "התקבל סיכום שלא עבר את בדיקות התקינות ולכן הוא לא הוצג. אפשר לנסות שוב.",
  duplicate_request:
    "כבר מתבצעת בקשה לסיכום עבור משתמש או מטופל זה. יש להמתין לסיום הבקשה.",
  internal:
    "אירעה שגיאה פנימית בעת הכנת הסיכום. יש לנסות שוב, ואם הבעיה נמשכת לפנות לתמיכה.",
});

const getClinicalSummaryStatus = (
  category: ClinicalSummaryFailureCategory,
):
  | typeof HttpStatus.SERVICE_UNAVAILABLE
  | typeof HttpStatus.TOO_MANY_REQUESTS =>
  category === "rate_limit" || category === "duplicate_request"
    ? HttpStatus.TOO_MANY_REQUESTS
    : HttpStatus.SERVICE_UNAVAILABLE;

export class ClinicalSummaryUnavailableError extends AppError {
  constructor(
    public readonly category: ClinicalSummaryFailureCategory,
    cause?: Error,
  ) {
    super({
      message: CLINICAL_SUMMARY_ERROR_MESSAGES[category],
      statusCode: getClinicalSummaryStatus(category),
      isOperational: true,
      ...(cause ? { cause } : {}),
    });
  }
}
