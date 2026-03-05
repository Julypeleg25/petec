import React, { memo } from "react";
import FormTextarea from "../../../../utils/FormTextarea/FormTextarea";
import TableUnEditableCellElement from "../TableUnEditableCellElement";
import { BooleanCellComponent } from "../CaseDetailsTableCells";
import { getBooleanValueText } from "../utils/caseDetailsText.utils";
import { DAILY_CASE_TABLE_COLUMN_COUNT } from "../CaseDetailsTable.constants";
import type {
  CaseDetailsData,
  CaseDetailsInputChangeHandler,
} from "../CaseDetailsTable.types";
import {
  areSimpleRowCellsEqual,
  getToggleKeys,
  handleSimpleCellToggle,
} from "./CaseDetailsRows.common";

interface CaseDetailsBooleanCommentRowProps {
  title: string;
  dataKeyPrefix: "puke";
  caseDetailsList: CaseDetailsData[][];
  caseDetailsDataIndex: number;
  paintingMode: boolean;
  setCaseDetailsList: React.Dispatch<React.SetStateAction<CaseDetailsData[][]>>;
  handleCellClick: (
    e: React.MouseEvent<HTMLElement>,
    isEditable: boolean,
  ) => Promise<boolean | null>;
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

          const isRequiredKey =
            `${dataKeyPrefix}_is_required` as keyof CaseDetailsData;
          const isEditableKey =
            `${dataKeyPrefix}_is_editable` as keyof CaseDetailsData;
          const toggleKeys = getToggleKeys(dataKeyPrefix);

          // Puke variables strictly
          const isBoolKey =
            `is${dataKeyPrefix.charAt(0).toUpperCase()}${dataKeyPrefix.slice(1)}` as keyof CaseDetailsData; // isPuke
          const commentsKey =
            `${dataKeyPrefix}Comments` as keyof CaseDetailsData; // pukeComments

          const cellData = caseDetailsList[caseDetailsDataIndex][i];

          const isCellRequired = cellData[isRequiredKey] as boolean;
          const isCellEditable = cellData[isEditableKey] as boolean;

          return (
            <div
              key={i}
              className={`case-details-table-body-row-cell ${
                isCellEditable ? "case-details-pop-up-parent" : ""
              } ${isCellRequired ? "required-cell" : ""}`}
              onClick={(e) =>
                handleSimpleCellToggle(
                  e,
                  isCellEditable,
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
    if (prevProps.caseDetailsDataIndex !== nextProps.caseDetailsDataIndex)
      return false;
    if (prevProps.paintingMode !== nextProps.paintingMode) return false;

    const reqKey =
      `${prevProps.dataKeyPrefix}_is_required` as keyof CaseDetailsData;
    const editKey =
      `${prevProps.dataKeyPrefix}_is_editable` as keyof CaseDetailsData;
    const isBoolKey =
      `is${prevProps.dataKeyPrefix.charAt(0).toUpperCase()}${prevProps.dataKeyPrefix.slice(1)}` as keyof CaseDetailsData;
    const commentsKey =
      `${prevProps.dataKeyPrefix}Comments` as keyof CaseDetailsData;

    return areSimpleRowCellsEqual(
      prevProps.caseDetailsList,
      nextProps.caseDetailsList,
      prevProps.caseDetailsDataIndex,
      DAILY_CASE_TABLE_COLUMN_COUNT,
      [reqKey, editKey, isBoolKey, commentsKey],
    );
  },
);

CaseDetailsBooleanCommentRow.displayName = "CaseDetailsBooleanCommentRow";
