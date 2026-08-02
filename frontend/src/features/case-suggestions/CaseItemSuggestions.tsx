import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { isAxiosError } from "axios";
import {
  FaChevronDown,
  FaChevronUp,
  FaExclamationTriangle,
  FaSyncAlt,
} from "react-icons/fa";
import {
  MAX_CASE_SUGGESTIONS,
  type CaseItemSuggestion,
} from "@petec/shared";
import { toHebrewErrorMessage } from "../../lib/errorMessages";
import { patientsApi } from "../patients/patients.api";
import {
  CASE_SUGGESTION_CATEGORY_UI,
  MISSING_INFORMATION_LABELS,
  type EnabledCaseSuggestionCategory,
} from "./caseSuggestion.config";
import { CaseSuggestionCard } from "./CaseSuggestionCard";
import "./CaseItemSuggestions.css";

interface ExistingCaseItem {
  readonly value?: string;
  readonly medicineId?: string;
}

interface CaseItemSuggestionsProps {
  readonly patientId: string;
  readonly category: EnabledCaseSuggestionCategory;
  readonly currentItems: readonly ExistingCaseItem[];
  readonly invalidationKey: string;
  readonly disabled?: boolean;
  readonly onSuggestionSelected: (suggestion: CaseItemSuggestion) => void;
}

const LOAD_FAILURE_MESSAGE =
  "לא ניתן לטעון הצעות כעת. ניתן להמשיך בהזנה ידנית.";
const STALE_MESSAGE = "נתוני המקרה השתנו. יש לרענן את ההצעות.";

export function CaseItemSuggestions({
  patientId,
  category,
  currentItems,
  invalidationKey,
  disabled = false,
  onSuggestionSelected,
}: CaseItemSuggestionsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<CaseItemSuggestion[]>([]);
  const [missingInformation, setMissingInformation] = useState<string[]>([]);
  const [warning, setWarning] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isStale, setIsStale] = useState(false);
  const [selectedSuggestionId, setSelectedSuggestionId] = useState<
    string | null
  >(null);
  const loadedInvalidationKeyRef = useRef<string | null>(null);
  const requestSequenceRef = useRef(0);
  const categoryDefinition = CASE_SUGGESTION_CATEGORY_UI[category];
  const CategoryIcon = categoryDefinition.Icon;
  const currentItemIds = useMemo(
    () =>
      new Set(
        currentItems
          .map((item) => item.medicineId ?? item.value)
          .filter((itemId): itemId is string => Boolean(itemId))
          .map(String),
      ),
    [currentItems],
  );

  const loadSuggestions = useCallback(async () => {
    if (!patientId || disabled) return;
    const requestSequence = ++requestSequenceRef.current;
    setIsLoading(true);
    setErrorMessage("");
    setSelectedSuggestionId(null);
    try {
      const response = await patientsApi.getCaseSuggestions(
        patientId,
        category,
      );
      if (requestSequence !== requestSequenceRef.current) return;
      setSuggestions(response.suggestions.slice(0, MAX_CASE_SUGGESTIONS));
      setMissingInformation(response.missingInformation);
      setWarning(response.warning);
      loadedInvalidationKeyRef.current = invalidationKey;
      setIsStale(false);
    } catch (error) {
      if (requestSequence !== requestSequenceRef.current) return;
      setSuggestions([]);
      setMissingInformation([]);
      setWarning("");
      setErrorMessage(
        isAxiosError(error)
          ? toHebrewErrorMessage(error)
          : LOAD_FAILURE_MESSAGE,
      );
    } finally {
      if (requestSequence === requestSequenceRef.current) setIsLoading(false);
    }
  }, [category, disabled, invalidationKey, patientId]);

  useEffect(() => {
    requestSequenceRef.current += 1;
    setIsExpanded(false);
    setSuggestions([]);
    setMissingInformation([]);
    setWarning("");
    setErrorMessage("");
    setIsStale(false);
    loadedInvalidationKeyRef.current = null;

    return () => {
      requestSequenceRef.current += 1;
    };
  }, [patientId, category, disabled]);

  useEffect(() => {
    if (
      loadedInvalidationKeyRef.current !== null &&
      loadedInvalidationKeyRef.current !== invalidationKey
    ) {
      setIsStale(true);
    }
  }, [invalidationKey]);

  const toggleExpanded = () => {
    const willExpand = !isExpanded;
    setIsExpanded(willExpand);
    if (
      willExpand &&
      loadedInvalidationKeyRef.current === null &&
      !isLoading
    ) {
      void loadSuggestions();
    }
  };

  const selectSuggestion = (suggestion: CaseItemSuggestion) => {
    if (isStale || currentItemIds.has(suggestion.itemId)) return;
    onSuggestionSelected(suggestion);
    setSelectedSuggestionId(suggestion.id);
  };

  return (
    <section
      className="case-item-suggestions"
      aria-label={`הצעות מותאמות למקרה עבור ${categoryDefinition.displayName}`}
      dir="rtl"
    >
      <button
        type="button"
        className="case-item-suggestions__heading"
        onClick={toggleExpanded}
        disabled={disabled || !patientId}
        aria-expanded={isExpanded}
      >
        <span className="case-item-suggestions__heading-icon">
          <CategoryIcon aria-hidden="true" />
        </span>
        <span className="case-item-suggestions__heading-copy">
          <strong>הצעות מותאמות למקרה</strong>
          <small>מבוסס על נתוני המקרה ומקרים דומים</small>
        </span>
        {isExpanded ? (
          <FaChevronUp aria-hidden="true" />
        ) : (
          <FaChevronDown aria-hidden="true" />
        )}
      </button>

      {isExpanded && (
        <div className="case-item-suggestions__content">
          <div className="case-item-suggestions__toolbar">
            <span>{categoryDefinition.displayName}</span>
            <button
              type="button"
              className="case-item-suggestions__refresh"
              onClick={() => void loadSuggestions()}
              disabled={isLoading}
            >
              <FaSyncAlt aria-hidden="true" />
              רענון הצעות
            </button>
          </div>

          {isLoading && (
            <div className="case-item-suggestions__status" role="status">
              <span
                className="case-item-suggestions__spinner"
                aria-hidden="true"
              />
              טוען הצעות...
            </div>
          )}

          {!isLoading && isStale && (
            <div className="case-item-suggestions__notice case-item-suggestions__notice--warning">
              <FaExclamationTriangle aria-hidden="true" />
              <span>{STALE_MESSAGE}</span>
            </div>
          )}

          {!isLoading && errorMessage && (
            <div className="case-item-suggestions__notice" role="status">
              {errorMessage}
            </div>
          )}

          {!isLoading && missingInformation.length > 0 && (
            <div className="case-item-suggestions__missing">
              <strong>מידע שחסר לבדיקה בטוחה:</strong>
              <ul>
                {missingInformation.map((field) => (
                  <li key={field}>
                    {MISSING_INFORMATION_LABELS[field] ?? field}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!isLoading && !errorMessage && suggestions.length === 0 && (
            <div className="case-item-suggestions__notice">
              {warning || "אין הצעות מתאימות להצגה לפי המידע הקיים."}
            </div>
          )}

          {!isLoading && suggestions.length > 0 && (
            <div className="case-item-suggestions__list">
              {suggestions.map((suggestion) => {
                const isAlreadySelected = currentItemIds.has(suggestion.itemId);
                return (
                  <CaseSuggestionCard
                    key={suggestion.id}
                    suggestion={suggestion}
                    isStale={isStale}
                    isSelected={
                      selectedSuggestionId === suggestion.id ||
                      isAlreadySelected
                    }
                    requiresDetailedReview={
                      categoryDefinition.requiresDetailedReview
                    }
                    onSelect={selectSuggestion}
                  />
                );
              })}
            </div>
          )}

          {!isLoading && warning && suggestions.length > 0 && (
            <p className="case-item-suggestions__footer-warning">{warning}</p>
          )}
          <span className="case-item-suggestions__current-count">
            קיימים בטופס: {currentItems.length}
          </span>
        </div>
      )}
    </section>
  );
}
