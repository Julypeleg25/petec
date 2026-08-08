import { useState } from "react";
import {
  FaChartLine,
  FaClock,
  FaExclamationTriangle,
  FaNotesMedical,
  FaPaw,
  FaPills,
  FaPlus,
  FaSpinner,
  FaStethoscope,
  FaSyncAlt,
} from "react-icons/fa";
import { Button } from "../../../../utils/Button/Button";
import {
  CLINICAL_SUMMARY_ERROR_MESSAGE,
  CLINICAL_SUMMARY_WARNING,
} from "./clinicalSummary/clinicalSummary.constants";
import {
  cleanClinicalText,
  filterCaseDetailsByDate,
  formatClinicalDate,
  formatClinicalDateTime,
} from "./clinicalSummary/clinicalSummary.utils";
import { useClinicalSummary } from "./clinicalSummary/useClinicalSummary";
import { ClinicalCaseDetailsPager } from "./clinicalSummary/ClinicalCaseDetailsPager";
import {
  ClinicalSummaryCard,
  ClinicalSummaryList,
  ClinicalSummaryText,
} from "./clinicalSummary/ClinicalSummaryCard";
import "./clinicalSummary/AiCaseSummary.css";

interface AiCaseSummaryProps {
  readonly patientId: string;
}

const getCaseDetailsCardClassName = (isExpanded: boolean): string =>
  [
    "ai-summary-card--medicine",
    "ai-summary-card--details-wide",
    isExpanded ? "ai-summary-card--details-expanded" : "",
  ]
    .filter(Boolean)
    .join(" ");

export { CLINICAL_SUMMARY_ERROR_MESSAGE, cleanClinicalText };
export { requestClinicalSummary } from "./clinicalSummary/useClinicalSummary";

export function AiCaseSummary({ patientId }: AiCaseSummaryProps) {
  const [caseDetailsExpanded, setCaseDetailsExpanded] = useState(false);
  const {
    errorMessage,
    generateSummary,
    isLoading,
    loadingDate,
    selectedDate,
    selectSummaryDate,
    summary,
  } = useClinicalSummary(patientId);

  const selectedDayDetails = summary
    ? filterCaseDetailsByDate(summary.caseDetailItems, selectedDate)
    : [];
  const SummaryActionIcon = isLoading
    ? FaSpinner
    : summary
      ? FaSyncAlt
      : FaPlus;

  return (
    <section
      className="ai-case-summary"
      aria-labelledby="ai-case-summary-title"
    >
      <header className="ai-case-summary__header">
        <div className="ai-case-summary__heading">
          <div className="ai-case-summary__icon" aria-hidden="true">
            <FaNotesMedical />
          </div>
          <div>
            <h3 id="ai-case-summary-title">סיכום קליני מג'ונרט</h3>
            <p>תמונת מצב מרוכזת מהרשומה העדכנית</p>
          </div>
        </div>
        <Button
          type="button"
          appSize="small"
          onClick={() => void generateSummary(selectedDate || undefined)}
          disabled={isLoading}
        >
          <SummaryActionIcon
            className={isLoading ? "ai-summary-icon--spin" : undefined}
            aria-hidden="true"
          />
          {isLoading
            ? "מכין סיכום..."
            : summary
              ? "רענון הסיכום"
              : "יצירת סיכום"}
        </Button>
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
              {summary.availableDates.map((date) => (
                <button
                  type="button"
                  key={date}
                  className={
                    date === loadingDate
                      ? "is-loading"
                      : date === selectedDate
                        ? "is-active"
                        : ""
                  }
                  disabled={isLoading}
                  aria-busy={date === loadingDate}
                  aria-pressed={date === selectedDate}
                  onClick={() => void selectSummaryDate(date)}
                >
                  {date === loadingDate && (
                    <FaSpinner
                      className="ai-summary-days__spinner"
                      aria-hidden="true"
                    />
                  )}
                  <strong>{formatClinicalDate(date)}</strong>
                </button>
              ))}
            </div>
          </nav>

          <div className="ai-summary-grid">
            <ClinicalSummaryCard icon={<FaPaw />} title="רקע וסיבת אשפוז">
              <ClinicalSummaryText value={summary.backgroundAndAdmission} />
            </ClinicalSummaryCard>
            <ClinicalSummaryCard
              icon={<FaStethoscope />}
              title="מצב קליני נוכחי"
            >
              <ClinicalSummaryText value={summary.currentClinicalStatus} />
            </ClinicalSummaryCard>
            <ClinicalSummaryCard
              icon={<FaChartLine />}
              title="שינויים ומגמות"
              className="ai-summary-card--compact"
            >
              <ClinicalSummaryList items={summary.importantChangesAndTrends} />
            </ClinicalSummaryCard>
            <ClinicalSummaryCard
              icon={<FaExclamationTriangle />}
              title="אלרגיות, סיכונים והתראות"
              className="ai-summary-card--alert"
            >
              <ClinicalSummaryList items={summary.alerts} tone="alert" />
            </ClinicalSummaryCard>
            <ClinicalSummaryCard
              icon={<FaPills />}
              title="פרטי הטיפול והתרופות"
              className={getCaseDetailsCardClassName(caseDetailsExpanded)}
            >
              <ClinicalCaseDetailsPager
                isExpanded={caseDetailsExpanded}
                items={selectedDayDetails}
                onExpandedChange={setCaseDetailsExpanded}
                selectedDate={selectedDate}
              />
            </ClinicalSummaryCard>
          </div>

          <div className="ai-summary-updated">
            <FaClock aria-hidden="true" />
            <span>הרשומה מעודכנת עד</span>
            <strong>
              {formatClinicalDateTime(summary.recordUpdatedThrough)}
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
