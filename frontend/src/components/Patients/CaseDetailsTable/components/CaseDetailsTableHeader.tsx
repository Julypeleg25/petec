import React from "react";
import FormSelect from "../../../../utils/FormSelect/FormSelect";
import {
  DAILY_CASE_TABLE_COLUMN_COUNT,
  START_HOUR_OPTIONS_OFFSET,
} from "../CaseDetailsTable.constants";
import {
  CASE_GRID_HOUR_STEP,
  getCaseDayRowByIndex,
} from "../caseGrid.utils";
import type { CaseDetailsData } from "../CaseDetailsTable.types";

interface CaseDetailsTableHeaderProps {
  currentDayRows: CaseDetailsData[];
  selectedStartHour: string;
  setSelectedStartHour: (value: string) => void;
  onStartHourSelect: (value: string) => void;
}

export const CaseDetailsTableHeader = ({
  currentDayRows,
  selectedStartHour,
  setSelectedStartHour,
  onStartHourSelect,
}: CaseDetailsTableHeaderProps) => (
  <div className="case-details-table-header">
    {Array.from({ length: DAILY_CASE_TABLE_COLUMN_COUNT }, (_, columnIndex) => {
      if (columnIndex === 0) {
        return (
          <div
            key={columnIndex}
            className="case-details-table-header-cell case-details-table-header-cell-title"
          />
        );
      }

      const timeValue = getCaseDayRowByIndex(currentDayRows, columnIndex)?.time;
      const displayTime = (() => {
        if (!timeValue) return "";
        const [hours, minutes] = timeValue.split(":");
        return `${hours}:${minutes ?? "00"}`;
      })();

      return (
        <div
          key={columnIndex}
          className="case-details-table-header-cell"
          style={{ paddingTop: "1em" }}
        >
          {displayTime}
        </div>
      );
    })}
  </div>
);
