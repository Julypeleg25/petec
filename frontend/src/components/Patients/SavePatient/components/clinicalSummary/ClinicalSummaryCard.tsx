import type { ReactNode } from "react";
import { FaCircle, FaExclamationTriangle } from "react-icons/fa";
import { CLINICAL_SUMMARY_EMPTY_TEXT } from "./clinicalSummary.constants";
import { cleanClinicalText } from "./clinicalSummary.utils";

interface ClinicalSummaryCardProps {
  readonly children: ReactNode;
  readonly className?: string;
  readonly icon: ReactNode;
  readonly title: string;
}

export function ClinicalSummaryCard({
  children,
  className = "",
  icon,
  title,
}: ClinicalSummaryCardProps) {
  return (
    <section className={`ai-summary-card ${className}`.trim()}>
      <h4>
        <span aria-hidden="true">{icon}</span>
        {title}
      </h4>
      <div className="ai-summary-card__body">{children}</div>
    </section>
  );
}

interface ClinicalSummaryListProps {
  readonly items: readonly string[];
  readonly tone?: "alert" | "default";
}

interface ClinicalSummaryTextProps {
  readonly value: string;
}

export function ClinicalSummaryList({
  items,
  tone = "default",
}: ClinicalSummaryListProps) {
  if (items.length === 0) {
    return <p className="ai-summary-empty">{CLINICAL_SUMMARY_EMPTY_TEXT}</p>;
  }

  return (
    <ul className={`ai-summary-list ai-summary-list--${tone}`}>
      {items.map((item, index) => {
        const MarkerIcon = tone === "alert" ? FaExclamationTriangle : FaCircle;
        return (
          <li key={`${index}-${item}`}>
            <MarkerIcon className="ai-summary-list__icon" aria-hidden="true" />
            <span>{cleanClinicalText(item)}</span>
          </li>
        );
      })}
    </ul>
  );
}

export function ClinicalSummaryText({ value }: ClinicalSummaryTextProps) {
  const text = cleanClinicalText(value);
  return (
    <p className={text ? undefined : "ai-summary-empty"}>
      {text || CLINICAL_SUMMARY_EMPTY_TEXT}
    </p>
  );
}
