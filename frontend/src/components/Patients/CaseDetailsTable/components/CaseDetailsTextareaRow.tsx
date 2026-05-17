import React, { memo } from "react";
import FormTextarea from "../../../../utils/FormTextarea/FormTextarea";
import TableUnEditableCellElement from "../TableUnEditableCellElement";
import { DAILY_CASE_TABLE_COLUMN_COUNT } from "../CaseDetailsTable.constants";
import type {
  CaseDetailsData,
  CaseDetailsInteractiveStateProps,
  CaseDetailsInputChangeHandler,
} from "../CaseDetailsTable.types";
import {
  areSimpleRowCellsEqual,
  getSimpleCellToggleState,
  getToggleKeys,
  handleSimpleCellToggle,
  haveInteractiveStatePropsChanged,
  stopCaseDetailsEventPropagation,
} from "./CaseDetailsRows.common";

interface CaseDetailsTextareaRowProps extends CaseDetailsInteractiveStateProps {
  title: string;
  dataKey: keyof CaseDetailsData;
  handleInputChange: CaseDetailsInputChangeHandler;
}

export const CaseDetailsTextareaRow = memo(
  ({
    title,
    dataKey,
    caseDetailsList,
    caseDetailsDataIndex,
    paintingMode,
    setCaseDetailsList,
    handleCellClick,
    handleInputChange,
  }: CaseDetailsTextareaRowProps) => {
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
          const cellValue = cellData[dataKey] as string | null | undefined;

          return (
            <div
              key={i}
              className={`case-details-table-body-row-cell ${
                isCellRequired ? "required-cell" : ""
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
                <FormTextarea
                  id={`${String(dataKey)}${i + 1}`}
                  name={String(dataKey)}
                  minHeight="20px"
                  maxHeight="100px"
                  width="100%"
                  minWidth="60%"
                  maxLength={250}
                  isGrowHeightOnInput={true}
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

CaseDetailsTextareaRow.displayName = "CaseDetailsTextareaRow";
