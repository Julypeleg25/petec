import type { ReactNode } from "react";
import { cleanClinicalText } from "./clinicalSummary.utils";

interface ClinicalSummaryCardProps {
  children: ReactNode;
  className?: string;
  icon: string;
  title: string;
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
  items: readonly string[];
  tone?: "alert" | "default";
}

export function ClinicalSummaryList({
  items,
  tone = "default",
}: ClinicalSummaryListProps) {
  if (items.length === 0) {
    return <p className="ai-summary-empty">לא תועד מידע בסעיף זה.</p>;
  }

  return (
    <ul className={`ai-summary-list ai-summary-list--${tone}`}>
      {items.map((item, index) => (
        <li key={`${index}-${item}`}>{cleanClinicalText(item)}</li>
      ))}
    </ul>
  );
}
