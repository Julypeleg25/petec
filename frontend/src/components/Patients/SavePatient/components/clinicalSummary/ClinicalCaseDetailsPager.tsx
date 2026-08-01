import { useEffect, useMemo, useState } from "react";
import {
  CASE_DETAIL_CATEGORY_LABELS,
  CASE_DETAIL_STATUS_CLASS_NAMES,
  CASE_DETAIL_STATUS_ICONS,
  CASE_DETAIL_STATUS_LABELS,
  CASE_DETAILS_PER_PAGE,
  PENDING_CASE_DETAIL_LABELS,
  type CaseDetailItem,
} from "./clinicalSummary.constants";
import {
  cleanClinicalText,
  getCaseDetailTime,
  getPageCount,
  getPageItems,
} from "./clinicalSummary.utils";

interface ClinicalCaseDetailsPagerProps {
  items: readonly CaseDetailItem[];
  selectedDate: string;
}

function OptionalDetail({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <span dir="auto">
      {label}: {cleanClinicalText(value)}
    </span>
  );
}

function ClinicalCaseDetail({ item }: { item: CaseDetailItem }) {
  const statusLabel =
    item.status === "not_received_yet"
      ? PENDING_CASE_DETAIL_LABELS[item.category]
      : CASE_DETAIL_STATUS_LABELS[item.status];

  return (
    <li className={CASE_DETAIL_STATUS_CLASS_NAMES[item.status]} dir="rtl">
      <div className="ai-medication-list__status">
        <span>{CASE_DETAIL_STATUS_ICONS[item.status]}</span>
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
  items,
  selectedDate,
}: ClinicalCaseDetailsPagerProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const pageCount = getPageCount(items.length, CASE_DETAILS_PER_PAGE);
  const visibleItems = useMemo(
    () => getPageItems(items, currentPage, CASE_DETAILS_PER_PAGE),
    [currentPage, items],
  );

  useEffect(() => setCurrentPage(0), [items.length, selectedDate]);

  if (items.length === 0) {
    return <p className="ai-summary-empty">לא תועדו פרטי טיפול ביום זה.</p>;
  }

  return (
    <div className="ai-case-detail-carousel">
      <ul className="ai-medication-list">
        {visibleItems.map((item, itemIndex) => (
          <ClinicalCaseDetail
            item={item}
            key={`${item.category}-${item.name}-${item.scheduledAt}-${currentPage}-${itemIndex}`}
          />
        ))}
      </ul>
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
          </button>
        </div>
      )}
    </div>
  );
}
