import React from "react";
import { FaPlus } from "react-icons/fa";
import { DAILY_CASE_TABLE_COLUMN_COUNT } from "../CaseDetailsTable.constants";

interface CaseDetailsAddSectionRowProps {
  title: string;
  onAddClick: () => void;
}

export const CaseDetailsAddSectionRow = ({
  title,
  onAddClick,
}: CaseDetailsAddSectionRowProps) => (
  <div className="case-details-table-body-row">
    {Array.from({ length: DAILY_CASE_TABLE_COLUMN_COUNT }, (_, index) =>
      index === 0 ? (
        <div
          key={index}
          className="case-details-table-body-row-cell case-details-table-body-row-cell-title case-details-table-body-row-cell-title-clickable"
        >
          <button
            className="btn btn-icon-only btn-active"
            onClick={(e) => {
              e.preventDefault();
              onAddClick();
            }}
          >
            <FaPlus />
          </button>
          {title}
        </div>
      ) : (
        <div
          key={index}
          className="case-details-table-body-row-cell case-details-table-body-row-empty-cell"
        />
      ),
    )}
  </div>
);
