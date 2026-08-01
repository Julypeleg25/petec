import { useEffect, useMemo, useState } from "react";
import type { IconType } from "react-icons";
import {
  FaCheckCircle,
  FaChevronLeft,
  FaChevronRight,
  FaCircle,
  FaCompressAlt,
  FaExclamationCircle,
  FaExpandAlt,
  FaUndoAlt,
} from "react-icons/fa";
import {
  CASE_DETAIL_CATEGORY_LABELS,
  CASE_DETAIL_CATEGORY_FILTER_OPTIONS,
  CASE_DETAIL_SORT_OPTIONS,
  CASE_DETAIL_STATUS_CLASS_NAMES,
  CASE_DETAIL_STATUS_FILTER_OPTIONS,
  CASE_DETAIL_STATUS_LABELS,
  CASE_DETAIL_TIME_FILTER_OPTIONS,
  CASE_DETAILS_PER_PAGE,
  EXPANDED_CASE_DETAILS_PER_PAGE,
  PENDING_CASE_DETAIL_LABELS,
  type CaseDetailCategoryFilter,
  type CaseDetailItem,
  type CaseDetailSortOrder,
  type CaseDetailTimeFilter,
} from "./clinicalSummary.constants";
import {
  cleanClinicalText,
  filterAndSortCaseDetails,
  getCaseDetailTime,
  getPageCount,
  getPageItems,
  type CaseDetailFilters,
} from "./clinicalSummary.utils";

interface ClinicalCaseDetailsPagerProps {
  readonly isExpanded: boolean;
  readonly items: readonly CaseDetailItem[];
  readonly onExpandedChange: (isExpanded: boolean) => void;
  readonly selectedDate: string;
}

interface OptionalDetailProps {
  readonly label: string;
  readonly value?: string;
}

interface ClinicalCaseDetailProps {
  readonly item: CaseDetailItem;
}

const DEFAULT_FILTERS: CaseDetailFilters = Object.freeze({
  category: "all",
  searchText: "",
  sortOrder: "ascending",
  status: "all",
  time: "all",
});

const CASE_DETAIL_STATUS_ICON_COMPONENTS: Readonly<
  Record<CaseDetailItem["status"], IconType>
> = {
  received: FaCheckCircle,
  not_received_yet: FaExclamationCircle,
  recorded: FaCircle,
};

function OptionalDetail({ label, value }: OptionalDetailProps) {
  if (!value) return null;
  return (
    <span dir="auto">
      {label}: {cleanClinicalText(value)}
    </span>
  );
}

function ClinicalCaseDetail({ item }: ClinicalCaseDetailProps) {
  const StatusIcon = CASE_DETAIL_STATUS_ICON_COMPONENTS[item.status];
  const statusLabel =
    item.status === "not_received_yet"
      ? PENDING_CASE_DETAIL_LABELS[item.category]
      : CASE_DETAIL_STATUS_LABELS[item.status];

  return (
    <li className={CASE_DETAIL_STATUS_CLASS_NAMES[item.status]} dir="rtl">
      <div className="ai-medication-list__status">
        <StatusIcon className="ai-case-detail-status-icon" aria-hidden="true" />
        <strong>{statusLabel}</strong>
      </div>
      <div className="ai-medication-list__details">
        <b dir="auto">{cleanClinicalText(item.name)}</b>
        <span className="ai-case-detail-category">
          {CASE_DETAIL_CATEGORY_LABELS[item.category]}
        </span>
        <span className="ai-case-detail-time" dir="ltr">
          {getCaseDetailTime(item)}
        </span>
        <OptionalDetail label="מידע שהוכנס" value={item.value} />
        <OptionalDetail label="מינון" value={item.dosage} />
        <OptionalDetail label="דרך מתן" value={item.route} />
        <OptionalDetail label="תדירות" value={item.frequency} />
        <OptionalDetail label="הערה" value={item.comment} />
      </div>
    </li>
  );
}

export function ClinicalCaseDetailsPager({
  isExpanded,
  items,
  onExpandedChange,
  selectedDate,
}: ClinicalCaseDetailsPagerProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [filters, setFilters] = useState<CaseDetailFilters>(DEFAULT_FILTERS);
  const pageSize = isExpanded
    ? EXPANDED_CASE_DETAILS_PER_PAGE
    : CASE_DETAILS_PER_PAGE;
  const filteredItems = useMemo(
    () => filterAndSortCaseDetails(items, filters),
    [filters, items],
  );
  const pageCount = getPageCount(filteredItems.length, pageSize);
  const visibleItems = useMemo(
    () => getPageItems(filteredItems, currentPage, pageSize),
    [currentPage, filteredItems, pageSize],
  );
  const filtersAreActive =
    filters.category !== DEFAULT_FILTERS.category ||
    filters.searchText !== DEFAULT_FILTERS.searchText ||
    filters.sortOrder !== DEFAULT_FILTERS.sortOrder ||
    filters.status !== DEFAULT_FILTERS.status ||
    filters.time !== DEFAULT_FILTERS.time;

  useEffect(
    () => setCurrentPage(0),
    [filters, items.length, pageSize, selectedDate],
  );

  if (items.length === 0) {
    return <p className="ai-summary-empty">לא תועדו פרטי טיפול ביום זה.</p>;
  }

  return (
    <div className="ai-case-detail-carousel">
      <div className="ai-case-detail-toolbar">
        <div className="ai-case-detail-toolbar__summary">
          <strong>
            מציג {filteredItems.length} מתוך {items.length}
          </strong>
          <button
            type="button"
            className="ai-case-detail-expand-button"
            aria-expanded={isExpanded}
            onClick={() => onExpandedChange(!isExpanded)}
          >
            {isExpanded ? (
              <FaCompressAlt aria-hidden="true" />
            ) : (
              <FaExpandAlt aria-hidden="true" />
            )}
            <span>{isExpanded ? "תצוגה מצומצמת" : "הצג יותר"}</span>
          </button>
        </div>

        <div
          className="ai-case-detail-status-filters"
          aria-label="סינון לפי מצב"
        >
          {CASE_DETAIL_STATUS_FILTER_OPTIONS.map((option) => (
            <button
              type="button"
              key={option.value}
              className={filters.status === option.value ? "is-active" : ""}
              aria-pressed={filters.status === option.value}
              onClick={() =>
                setFilters((current) => ({
                  ...current,
                  status: option.value,
                }))
              }
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="ai-case-detail-filter-grid">
          <label>
            <span>חיפוש</span>
            <input
              type="search"
              value={filters.searchText}
              placeholder="שם, מינון או הערה"
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  searchText: event.target.value,
                }))
              }
            />
          </label>
          <label>
            <span>סוג</span>
            <select
              value={filters.category}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  category: event.target.value as CaseDetailCategoryFilter,
                }))
              }
            >
              {CASE_DETAIL_CATEGORY_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>שעות</span>
            <select
              value={filters.time}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  time: event.target.value as CaseDetailTimeFilter,
                }))
              }
            >
              {CASE_DETAIL_TIME_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>סדר</span>
            <select
              value={filters.sortOrder}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  sortOrder: event.target.value as CaseDetailSortOrder,
                }))
              }
            >
              {CASE_DETAIL_SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {filtersAreActive && (
          <button
            type="button"
            className="ai-case-detail-reset-button"
            onClick={() => setFilters(DEFAULT_FILTERS)}
          >
            <FaUndoAlt aria-hidden="true" />
            ניקוי מסננים
          </button>
        )}
      </div>

      {visibleItems.length > 0 ? (
        <ul className="ai-medication-list">
          {visibleItems.map((item, itemIndex) => (
            <ClinicalCaseDetail
              item={item}
              key={`${item.category}-${item.name}-${item.scheduledAt}-${currentPage}-${itemIndex}`}
            />
          ))}
        </ul>
      ) : (
        <p className="ai-summary-empty">אין פרטי טיפול התואמים למסננים.</p>
      )}
      {pageCount > 1 && (
        <div
          className="ai-case-detail-carousel__controls"
          aria-label="מעבר בין פרטי הטיפול"
        >
          <button
            type="button"
            disabled={currentPage === 0}
            onClick={() => setCurrentPage((page) => page - 1)}
          >
            <FaChevronRight aria-hidden="true" />
            הקודם
          </button>
          <strong>
            עמוד {currentPage + 1} מתוך {pageCount}
          </strong>
          <button
            type="button"
            disabled={currentPage === pageCount - 1}
            onClick={() => setCurrentPage((page) => page + 1)}
          >
            הבא
            <FaChevronLeft aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
