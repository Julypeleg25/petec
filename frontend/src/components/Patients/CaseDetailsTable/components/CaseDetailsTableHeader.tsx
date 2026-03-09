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
          >
            <FormSelect
              elements={Array.from(
                { length: DAILY_CASE_TABLE_COLUMN_COUNT - 1 },
                (_, optionIndex) => {
                  const hour24Format =
                    ((optionIndex + START_HOUR_OPTIONS_OFFSET) * CASE_GRID_HOUR_STEP) %
                    24;
                  return {
                    value: String(hour24Format),
                    text: `${hour24Format}:00`,
                  };
                },
              )}
              selectId="table-hour-select"
              optionState={selectedStartHour}
              setOptionState={setSelectedStartHour}
              afterSelect={onStartHourSelect}
              width="100%"
              isRequired={true}
              isOrdered={false}
            />
          </div>
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
