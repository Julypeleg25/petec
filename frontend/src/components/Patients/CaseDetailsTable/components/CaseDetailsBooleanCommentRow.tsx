import React, { memo } from "react";
import FormTextarea from "../../../../utils/FormTextarea/FormTextarea";
import TableUnEditableCellElement from "../TableUnEditableCellElement";
import { BooleanCellComponent } from "../CaseDetailsTableCells";
import { getBooleanValueText } from "../utils/caseDetailsText.utils";
import { DAILY_CASE_TABLE_COLUMN_COUNT } from "../CaseDetailsTable.constants";
import type {
  CaseDetailsData,
  CaseDetailsInteractiveStateProps,
  CaseDetailsInputChangeHandler,
} from "../CaseDetailsTable.types";
import {
  areSimpleRowCellsEqual,
  getBooleanCommentKeys,
  getSimpleCellToggleState,
  getToggleKeys,
  handleSimpleCellToggle,
  haveInteractiveStatePropsChanged,
} from "./CaseDetailsRows.common";

interface CaseDetailsBooleanCommentRowProps extends CaseDetailsInteractiveStateProps {
  title: string;
  dataKeyPrefix: "puke";
  handleInputChange: CaseDetailsInputChangeHandler;
}

export const CaseDetailsBooleanCommentRow = memo(
  ({
    title,
    dataKeyPrefix,
    caseDetailsList,
    caseDetailsDataIndex,
    paintingMode,
    setCaseDetailsList,
    handleCellClick,
    handleInputChange,
  }: CaseDetailsBooleanCommentRowProps) => {
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

          const toggleKeys = getToggleKeys(dataKeyPrefix);
          const { valueKey: isBoolKey, commentsKey } =
            getBooleanCommentKeys(dataKeyPrefix);

          const cellData = caseDetailsList[caseDetailsDataIndex][i];
          const { isCellRequired, isCellEditable } = getSimpleCellToggleState(
            cellData,
            dataKeyPrefix,
          );

          return (
            <div
              key={i}
              className={`case-details-table-body-row-cell ${
                isCellEditable ? "case-details-pop-up-parent" : ""
              } ${isCellRequired ? "required-cell" : ""}`}
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
              <BooleanCellComponent
                index={i}
                isComment={true}
                valName={isBoolKey}
                commentValName={commentsKey}
                formTextareaElementId={`${dataKeyPrefix}-textarea-${i}`}
                caseDetailsList={caseDetailsList}
                caseDetailsDataIndex={caseDetailsDataIndex}
                handleInputChange={handleInputChange}
              />
              <FormTextarea
                id={`${dataKeyPrefix}-textarea-${i}`}
                state={
                  getBooleanValueText(
                    cellData[isBoolKey] as boolean | null,
                    cellData[commentsKey] as string | null,
                  ) || ""
                }
                name={dataKeyPrefix}
                height="20px"
                minHeight="20px"
                maxHeight="100px"
                width="100%"
                minWidth="60%"
                maxLength={250}
                readOnly={true}
              />
            </div>
          );
        })}
      </div>
    );
  },
  (prevProps, nextProps) => {
    if (haveInteractiveStatePropsChanged(prevProps, nextProps)) return false;
    const toggleKeys = getToggleKeys(prevProps.dataKeyPrefix);
    const { valueKey: isBoolKey, commentsKey } = getBooleanCommentKeys(
      prevProps.dataKeyPrefix,
    );

    return areSimpleRowCellsEqual(
      prevProps.caseDetailsList,
      nextProps.caseDetailsList,
      prevProps.caseDetailsDataIndex,
      DAILY_CASE_TABLE_COLUMN_COUNT,
      [toggleKeys.isRequiredKey, toggleKeys.isEditableKey, isBoolKey, commentsKey],
    );
  },
);

CaseDetailsBooleanCommentRow.displayName = "CaseDetailsBooleanCommentRow";
