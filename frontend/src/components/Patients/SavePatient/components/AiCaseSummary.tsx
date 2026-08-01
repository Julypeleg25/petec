import {
  CLINICAL_SUMMARY_ERROR_MESSAGE,
  CLINICAL_SUMMARY_WARNING,
  HEBREW_DATE_FORMAT,
  HEBREW_WEEKDAY_FORMAT,
  SUMMARY_UPDATED_DATE_FORMAT,
} from "./clinicalSummary/clinicalSummary.constants";
import {
  cleanClinicalText,
  filterCaseDetailsByDate,
  formatSummaryDay,
} from "./clinicalSummary/clinicalSummary.utils";
import { useClinicalSummary } from "./clinicalSummary/useClinicalSummary";
import { ClinicalCaseDetailsPager } from "./clinicalSummary/ClinicalCaseDetailsPager";
import {
  ClinicalSummaryCard,
  ClinicalSummaryList,
} from "./clinicalSummary/ClinicalSummaryCard";

interface AiCaseSummaryProps {
  patientId: string;
}

export { CLINICAL_SUMMARY_ERROR_MESSAGE, cleanClinicalText };
export { requestClinicalSummary } from "./clinicalSummary/useClinicalSummary";

export function AiCaseSummary({ patientId }: AiCaseSummaryProps) {
  const {
    errorMessage,
    generateSummary,
    isLoading,
    selectedDate,
    selectSummaryDate,
    summary,
  } = useClinicalSummary(patientId);

  const selectedDayDetails = summary
    ? filterCaseDetailsByDate(summary.caseDetailItems, selectedDate)
    : [];

  return (
    <section
      className="ai-case-summary"
      aria-labelledby="ai-case-summary-title"
    >
      <header className="ai-case-summary__header">
        <div className="ai-case-summary__heading">
          <div className="ai-case-summary__icon" aria-hidden="true">
            ✚
          </div>
          <div>
            <h3 id="ai-case-summary-title">סיכום קליני מג'ונרט</h3>
            <p>תמונת מצב קלינית מרוכזת מהרשומה העדכנית</p>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-small"
          onClick={() => void generateSummary(selectedDate || undefined)}
          disabled={isLoading}
        >
          <span aria-hidden="true">
            {isLoading ? "◌" : summary ? "↻" : "+"}
          </span>
          {isLoading
            ? "מכין סיכום..."
            : summary
              ? "רענון הסיכום"
              : "יצירת סיכום"}
        </button>
      </header>

      {errorMessage && (
        <div className="ai-case-summary__error" role="alert">
          {errorMessage}
        </div>
      )}

      {summary && (
        <div className="ai-case-summary__content" aria-live="polite">
          <div className="ai-case-summary__warning" role="note">
            {CLINICAL_SUMMARY_WARNING}
          </div>
          {summary.inputWasTruncated && (
            <div className="ai-case-summary__truncated">
              הסיכום מבוסס על חלק מהמידע ברשומה בשל מגבלת אורך. יש לעיין ברשומה
              המלאה.
            </div>
          )}

          <nav className="ai-summary-days" aria-label="בחירת יום לסיכום">
            <span className="ai-summary-days__label">יום ברשומה</span>
            <div className="ai-summary-days__options">
              {summary.availableDates.map((date, index) => (
                <button
                  type="button"
                  key={date}
                  className={date === selectedDate ? "is-active" : ""}
                  disabled={isLoading}
                  aria-pressed={date === selectedDate}
                  onClick={() => void selectSummaryDate(date)}
                >
                  <strong>{formatSummaryDay(date, HEBREW_DATE_FORMAT)}</strong>
                  <span>
                    {index === 0
                      ? "האחרון"
                      : formatSummaryDay(date, HEBREW_WEEKDAY_FORMAT)}
                  </span>
                </button>
              ))}
            </div>
          </nav>

          <div className="ai-summary-grid">
            <ClinicalSummaryCard icon="🐾" title="רקע וסיבת אשפוז">
              <p>{cleanClinicalText(summary.backgroundAndAdmission)}</p>
            </ClinicalSummaryCard>
            <ClinicalSummaryCard icon="🩺" title="מצב קליני נוכחי">
              <p>{cleanClinicalText(summary.currentClinicalStatus)}</p>
            </ClinicalSummaryCard>
            <ClinicalSummaryCard
              icon="↗"
              title="שינויים ומגמות"
              className="ai-summary-card--compact"
            >
              <ClinicalSummaryList items={summary.importantChangesAndTrends} />
            </ClinicalSummaryCard>
            <ClinicalSummaryCard
              icon="💊"
              title="כל פרטי הטיפול והרישום"
              className="ai-summary-card--medicine"
            >
              <ClinicalCaseDetailsPager
                items={selectedDayDetails}
                selectedDate={selectedDate}
              />
            </ClinicalSummaryCard>
            <ClinicalSummaryCard
              icon="⚠"
              title="אלרגיות, סיכונים והתראות"
              className="ai-summary-card--alert"
            >
              <ClinicalSummaryList items={summary.alerts} tone="alert" />
            </ClinicalSummaryCard>
            <ClinicalSummaryCard icon="📋" title="מידע חסר ומעקב">
              <ClinicalSummaryList
                items={summary.missingInformationAndFollowUp}
              />
            </ClinicalSummaryCard>
          </div>

          <div className="ai-summary-updated">
            <span aria-hidden="true">🕒</span>
            <span>הרשומה מעודכנת עד</span>
            <strong>
              {new Date(summary.recordUpdatedThrough).toLocaleString(
                "he-IL",
                SUMMARY_UPDATED_DATE_FORMAT,
              )}
            </strong>
          </div>
        </div>
      )}

      <small>
        הכלי לקריאה בלבד ואינו שומר את הסיכום או משנה את רשומת המטופל.
      </small>
    </section>
  );
}
