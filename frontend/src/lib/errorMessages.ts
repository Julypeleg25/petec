import { isAxiosError, type AxiosError } from "axios";
import {
  HttpStatus,
  type ApiErrorDetails,
  type ApiErrorPayload,
} from "@petec/shared";

const DEFAULT_FRONTEND_ERROR_MESSAGE = "הפעולה נכשלה";
const DEFAULT_VALIDATION_ERROR_MESSAGE = "הנתונים שהוזנו אינם תקינים";
const DEFAULT_RESPONSE_ERROR_MESSAGE = "התקבלה תגובה לא תקינה מהשרת";

const HEBREW_TEXT_REGEX = /[\u0590-\u05FF]/;

interface ZodIssueLike {
  message?: string;
}

interface ZodErrorLike {
  name?: string;
  issues?: ZodIssueLike[];
}

const HTTP_STATUS_ERROR_MESSAGES: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: "הבקשה אינה תקינה",
  [HttpStatus.UNAUTHORIZED]: "המשתמש אינו מחובר או שההתחברות פגה",
  [HttpStatus.FORBIDDEN]: "אין הרשאה לבצע את הפעולה",
  [HttpStatus.NOT_FOUND]: "הפריט המבוקש לא נמצא",
  [HttpStatus.CONFLICT]: "הפעולה מתנגשת עם נתונים קיימים",
  [HttpStatus.UNPROCESSABLE_ENTITY]: "הנתונים שנשלחו אינם תקינים",
  [HttpStatus.INTERNAL_SERVER_ERROR]: "אירעה שגיאה בשרת",
};

const EXACT_ERROR_MESSAGE_TRANSLATIONS: Record<string, string> = {
  "Validation failed": "אימות הנתונים נכשל",
  "Bad request": "הבקשה אינה תקינה",
  "Resource not found": "הפריט המבוקש לא נמצא",
  "Authentication failed": "ההתחברות נכשלה",
  "Access denied": "אין הרשאה לבצע את הפעולה",
  Conflict: "קיימת התנגשות בנתונים",
  "Internal Server Error": "אירעה שגיאה פנימית בשרת",
  "Params validation failed": "פרמטרי הבקשה אינם תקינים",
  "Query validation failed": "פרמטרי החיפוש אינם תקינים",
  "Body validation failed": "גוף הבקשה אינו תקין",
  "Response validation failed": "התקבלה תגובה לא תקינה מהשרת",
  "Case not found": "התיק לא נמצא",
  "Case not found for export": "לא נמצא תיק לייצוא",
  "Patient not found": "המטופל לא נמצא",
  "Document not found": "המסמך לא נמצא",
  "Patient photo not found": "תמונת המטופל לא נמצאה",
  "Grid row not found": "שורת הטבלה לא נמצאה",
  "Patient is already released": "המטופל כבר שוחרר",
  "Cannot edit an archived case": "לא ניתן לערוך תיק בארכיון",
  "Case details validation failed": "פרטי הטבלה אינם תקינים",
  "Invalid photo storage key": "מזהה התמונה אינו תקין",
  "Invalid time format, expected HH:mm": "פורמט השעה אינו תקין",
  "Invalid date format, expected YYYY-MM-DD": "פורמט התאריך אינו תקין",
  "Cannot compute dateTime from date+time": "לא ניתן לחשב תאריך ושעה מהנתונים שנשלחו",
  "Row date is required": "חובה להזין תאריך לשורה",
  "Row time is required": "חובה להזין שעה לשורה",
  "Refresh response contained no access token": "לא התקבל אסימון גישה חדש מהשרת",
  "Email service is not configured": "שירות שליחת המייל אינו מוגדר",
  "Failed to send email": "שליחת המייל נכשלה",
};

const toTrimmedText = (value: string): string => value.trim();

const containsHebrewText = (value: string): boolean =>
  HEBREW_TEXT_REGEX.test(value);

const translateKnownErrorMessage = (message: string): string | null => {
  const normalizedMessage = toTrimmedText(message);

  if (normalizedMessage.length === 0) {
    return null;
  }

  if (containsHebrewText(normalizedMessage)) {
    return normalizedMessage;
  }

  return EXACT_ERROR_MESSAGE_TRANSLATIONS[normalizedMessage] ?? null;
};

const flattenErrorDetails = (details?: ApiErrorDetails): string[] => {
  if (!details) {
    return [];
  }

  return Object.values(details)
    .flat()
    .map((message) => toTrimmedText(message))
    .filter((message) => message.length > 0);
};

const getHebrewDetailMessage = (details?: ApiErrorDetails): string | null => {
  const uniqueMessages = Array.from(new Set(flattenErrorDetails(details)));
  const translatedMessages = uniqueMessages
    .map((message) => translateKnownErrorMessage(message))
    .filter((message): message is string => Boolean(message));

  if (translatedMessages.length === 0) {
    return null;
  }

  return translatedMessages.join(", ");
};

const getPayloadMessage = (payload?: ApiErrorPayload): string | null => {
  const errorPayload = payload?.error;

  if (typeof errorPayload === "string") {
    return translateKnownErrorMessage(errorPayload);
  }

  if (!errorPayload) {
    return null;
  }

  const translatedMessage = translateKnownErrorMessage(errorPayload.message ?? "");
  if (translatedMessage) {
    return translatedMessage;
  }

  return getHebrewDetailMessage(errorPayload.details);
};

const getHttpStatusMessage = (status?: number): string | null => {
  if (!status) {
    return null;
  }

  return HTTP_STATUS_ERROR_MESSAGES[status] ?? null;
};

const isZodErrorLike = (
  error: Error | AxiosError<ApiErrorPayload> | null | undefined,
): error is Error & ZodErrorLike =>
  Boolean(
    error &&
      error.name === "ZodError" &&
      "issues" in error &&
      Array.isArray((error as ZodErrorLike).issues),
  );

export const toHebrewErrorMessage = (
  error: Error | AxiosError<ApiErrorPayload> | null | undefined,
): string => {
  if (!error) {
    return DEFAULT_FRONTEND_ERROR_MESSAGE;
  }

  if (isZodErrorLike(error)) {
    const issuesMessage = (error.issues ?? [])
      .map((issue) => translateKnownErrorMessage(issue.message ?? ""))
      .filter((message): message is string => Boolean(message))
      .join(", ");

    return issuesMessage || DEFAULT_VALIDATION_ERROR_MESSAGE;
  }

  if (isAxiosError<ApiErrorPayload>(error)) {
    const payloadMessage = getPayloadMessage(error.response?.data);
    if (payloadMessage) {
      return payloadMessage;
    }

    const statusMessage = getHttpStatusMessage(error.response?.status);
    if (statusMessage) {
      return statusMessage;
    }

    const translatedAxiosMessage = translateKnownErrorMessage(error.message);
    if (translatedAxiosMessage) {
      return translatedAxiosMessage;
    }

    return DEFAULT_FRONTEND_ERROR_MESSAGE;
  }

  const translatedMessage = translateKnownErrorMessage(error.message);
  if (translatedMessage) {
    return translatedMessage;
  }

  return DEFAULT_RESPONSE_ERROR_MESSAGE;
};
