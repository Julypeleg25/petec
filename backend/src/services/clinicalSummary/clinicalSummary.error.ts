import { AppError, HttpStatus } from "@petec/shared";

export const CLINICAL_SUMMARY_UNAVAILABLE_MESSAGE =
  "לא ניתן ליצור את הסיכום כעת. לא בוצע כל שינוי ברשומת המטופל.";

export class ClinicalSummaryUnavailableError extends AppError {
  constructor(statusCode: typeof HttpStatus.SERVICE_UNAVAILABLE | typeof HttpStatus.TOO_MANY_REQUESTS = HttpStatus.SERVICE_UNAVAILABLE) {
    super({ message: CLINICAL_SUMMARY_UNAVAILABLE_MESSAGE, statusCode, isOperational: true });
  }
}
