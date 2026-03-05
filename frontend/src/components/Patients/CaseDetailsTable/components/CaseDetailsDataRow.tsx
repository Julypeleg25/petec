import React, { memo } from "react";
import FormInput from "../../../../utils/FormInput/FormInput";
import TableUnEditableCellElement from "../TableUnEditableCellElement";
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

interface CaseDetailsDataRowProps {
  title: string;
  dataKey: keyof CaseDetailsData;
  caseDetailsList: CaseDetailsData[][];
  caseDetailsDataIndex: number;
  paintingMode: boolean;
  setCaseDetailsList: React.Dispatch<React.SetStateAction<CaseDetailsData[][]>>;
  handleCellClick: (
    e: React.MouseEvent<HTMLElement>,
    isEditable: boolean,
  ) => Promise<boolean | null>;
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

          const isRequiredKey =
            `${dataKey}_is_required` as keyof CaseDetailsData;
          const isEditableKey =
            `${dataKey}_is_editable` as keyof CaseDetailsData;
          const toggleKeys = getToggleKeys(String(dataKey));
          const cellData = caseDetailsList[caseDetailsDataIndex][i];

          const isCellRequired = cellData[isRequiredKey] as boolean;
          const isCellEditable = cellData[isEditableKey] as boolean;
          const outOfBounds = requiredCondition ? requiredCondition(i) : false;

          return (
            <div
              key={i}
              className={`case-details-table-body-row-cell ${
                isCellRequired || outOfBounds ? "required-cell" : ""
              }`}
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
              <FormInput
                name={dataKey}
                type={inputType}
                width="100%"
                min={min}
                state={(cellData[dataKey] as string | null) || ""}
                setState={handleInputChange}
                setStateParams={{ index: i }}
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

    const key = prevProps.dataKey as keyof CaseDetailsData;
    const reqKey = `${prevProps.dataKey}_is_required` as keyof CaseDetailsData;
    const editKey = `${prevProps.dataKey}_is_editable` as keyof CaseDetailsData;
    return areSimpleRowCellsEqual(
      prevProps.caseDetailsList,
      nextProps.caseDetailsList,
      prevProps.caseDetailsDataIndex,
      DAILY_CASE_TABLE_COLUMN_COUNT,
      [key, reqKey, editKey],
    );
  },
);

CaseDetailsDataRow.displayName = "CaseDetailsDataRow";
