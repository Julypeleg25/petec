import React, { memo } from "react";
import FormInput from "../../../../utils/FormInput/FormInput";
import TableUnEditableCellElement from "../TableUnEditableCellElement";
import { DAILY_CASE_TABLE_COLUMN_COUNT } from "../CaseDetailsTable.constants";
import type {
  CaseDetailsData,
  CaseDetailsInteractiveStateProps,
  CaseDetailsInputChangeHandler,
} from "../CaseDetailsTable.types";
import {
  areSimpleRowCellsEqual,
  getToggleKeys,
  getSimpleCellToggleState,
  handleSimpleCellToggle,
  haveInteractiveStatePropsChanged,
  stopCaseDetailsEventPropagation,
} from "./CaseDetailsRows.common";

interface CaseDetailsDataRowProps extends CaseDetailsInteractiveStateProps {
  title: string;
  dataKey: keyof CaseDetailsData;
  handleInputChange: CaseDetailsInputChangeHandler;
  requiredCondition?: (index: number) => boolean;
  inputType?: "text" | "number" | "password" | "email" | "tel";
  min?: number;
}

export const CaseDetailsDataRow = memo(
  ({
    title,
    dataKey,
    caseDetailsList,
    caseDetailsDataIndex,
    paintingMode,
    setCaseDetailsList,
    handleCellClick,
    handleInputChange,
    requiredCondition,
    inputType = "text",
    min,
  }: CaseDetailsDataRowProps) => {
    return (
      <div className="case-details-table-body-row">
        {Array.from({ length: DAILY_CASE_TABLE_COLUMN_COUNT }, (_, i) => {
          if (i === 0) {
            return (
              <div
                key={i}
                className="case-details-table-body-row-cell case-details-table-body-row-cell-title"
              >
                {title}
              </div>
            );
          }

          const cellData = caseDetailsList[caseDetailsDataIndex][i];
          const { toggleKeys, isCellRequired, isCellEditable } =
            getSimpleCellToggleState(cellData, String(dataKey));
          const outOfBounds = requiredCondition ? requiredCondition(i) : false;
          const cellValue = cellData[dataKey] as
            | string
            | number
            | null
            | undefined;

          return (
            <div
              key={i}
              className={`case-details-table-body-row-cell ${
                isCellRequired || outOfBounds ? "required-cell" : ""
              }`}
              onClickCapture={(e) =>
                handleSimpleCellToggle(
                  e,
                  isCellEditable,
                  isCellRequired,
                  handleCellClick,
                  setCaseDetailsList,
                  caseDetailsDataIndex,
                  i,
                  paintingMode,
                  toggleKeys,
                )
              }
            >
              {!isCellEditable && <TableUnEditableCellElement />}
              <div
                onClick={stopCaseDetailsEventPropagation}
                onDoubleClick={stopCaseDetailsEventPropagation}
              >
                <FormInput
                  name={String(dataKey)}
                  type={inputType}
                  width="100%"
                  min={min}
                  state={cellValue ?? ""}
                  setState={handleInputChange}
                  setStateParams={{ index: i }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  },
  (prevProps, nextProps) => {
    if (haveInteractiveStatePropsChanged(prevProps, nextProps)) return false;
    const key = prevProps.dataKey as keyof CaseDetailsData;
    const toggleKeys = getToggleKeys(String(prevProps.dataKey));
    return areSimpleRowCellsEqual(
      prevProps.caseDetailsList,
      nextProps.caseDetailsList,
      prevProps.caseDetailsDataIndex,
      DAILY_CASE_TABLE_COLUMN_COUNT,
      [key, toggleKeys.isRequiredKey, toggleKeys.isEditableKey],
    );
  },
);

CaseDetailsDataRow.displayName = "CaseDetailsDataRow";
