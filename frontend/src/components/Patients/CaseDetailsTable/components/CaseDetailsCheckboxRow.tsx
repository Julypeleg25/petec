import React, { memo } from "react";
import FormCheckbox from "../../../../utils/FormCheckbox/FormCheckbox";
import TableUnEditableCellElement from "../TableUnEditableCellElement";
import { DAILY_CASE_TABLE_COLUMN_COUNT } from "../CaseDetailsTable.constants";
import type {
  CaseDetailsData,
  CaseDetailsInteractiveStateProps,
} from "../CaseDetailsTable.types";
import {
  areSimpleRowCellsEqual,
  getSimpleCellToggleState,
  getToggleKeys,
  handleSimpleCellToggle,
  haveInteractiveStatePropsChanged,
  resolveBooleanSetterValue,
  stopCaseDetailsEventPropagation,
  updateCaseDetailsRow,
} from "./CaseDetailsRows.common";

interface CaseDetailsCheckboxRowProps extends CaseDetailsInteractiveStateProps {
  title: string;
  dataKey: keyof CaseDetailsData;
}

export const CaseDetailsCheckboxRow = memo(
  ({
    title,
    dataKey,
    caseDetailsList,
    caseDetailsDataIndex,
    paintingMode,
    setCaseDetailsList,
    handleCellClick,
  }: CaseDetailsCheckboxRowProps) => {
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

          return (
            <div
              key={i}
              className={`case-details-table-body-row-cell case-details-pop-up-parent ${
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
                <FormCheckbox
                  checked={(cellData[dataKey] as boolean) || false}
                  setChecked={(isCheckedAction) => {
                    setCaseDetailsList((prevState) => {
                      const isChecked =
                        resolveBooleanSetterValue(isCheckedAction);

                      return updateCaseDetailsRow(
                        prevState,
                        caseDetailsDataIndex,
                        i,
                        (row) => ({
                          ...row,
                          [dataKey]: isChecked,
                        }),
                      );
                    });
                  }}
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

CaseDetailsCheckboxRow.displayName = "CaseDetailsCheckboxRow";
