import { FaExclamationTriangle, FaPlus } from "react-icons/fa";
import type { CaseItemSuggestion } from "@petec/shared";
import { getSuggestionDetails } from "./caseSuggestion.config";

interface CaseSuggestionCardProps {
  readonly suggestion: CaseItemSuggestion;
  readonly isStale: boolean;
  readonly isSelected: boolean;
  readonly requiresDetailedReview: boolean;
  readonly onSelect: (suggestion: CaseItemSuggestion) => void;
}

const DETAILED_REVIEW_MESSAGE =
  "ההצעה הוזנה לטופס בלבד. יש לבדוק את החומר, הכמות, דרך המתן, התדירות, הקצב ומשך הטיפול לפני שמירה.";
const REVIEW_MESSAGE =
  "הערכים הוזנו כהצעה בלבד. יש לבדוק אותם לפני שמירה.";

export function CaseSuggestionCard({
  suggestion,
  isStale,
  isSelected,
  requiresDetailedReview,
  onSelect,
}: CaseSuggestionCardProps) {
  const details = isStale
    ? []
    : getSuggestionDetails(suggestion.authoritativeValues);

  return (
    <article className="case-item-suggestions__card">
      <div className="case-item-suggestions__card-header">
        <strong>{suggestion.displayName}</strong>
        <div className="case-item-suggestions__actions">
          <button
            type="button"
            className="case-item-suggestions__add-button"
            aria-label={
              isSelected ? "ההצעה כבר נוספה לטופס" : "הוספת ההצעה לטופס"
            }
            onClick={() => onSelect(suggestion)}
            disabled={isStale || isSelected}
          >
            <FaPlus aria-hidden="true" />
          </button>
        </div>
      </div>

      {details.length > 0 && (
        <dl className="case-item-suggestions__details">
          {details.map((detail) => (
            <div key={`${detail.label}-${detail.value}`}>
              <dt>{detail.label}</dt>
              <dd>{detail.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {suggestion.warnings.map((warning) => (
        <p key={warning} className="case-item-suggestions__card-warning">
          <FaExclamationTriangle aria-hidden="true" />
          {warning}
        </p>
      ))}

      {isSelected && (
        <p className="case-item-suggestions__selected-message" role="status">
          {requiresDetailedReview ? DETAILED_REVIEW_MESSAGE : REVIEW_MESSAGE}
        </p>
      )}
    </article>
  );
}
