import React, { memo } from "react";
import FormCheckbox from "../../../../utils/FormCheckbox/FormCheckbox";
import TableUnEditableCellElement from "../TableUnEditableCellElement";
import { DAILY_CASE_TABLE_COLUMN_COUNT } from "../CaseDetailsTable.constants";
import type { CaseDetailsData } from "../CaseDetailsTable.types";
import {
  areSimpleRowCellsEqual,
  getToggleKeys,
  handleSimpleCellToggle,
  resolveBooleanSetterValue,
} from "./CaseDetailsRows.common";

interface CaseDetailsCheckboxRowProps {
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

          const isRequiredKey =
            `${dataKey}_is_required` as keyof CaseDetailsData;
          const isEditableKey =
            `${dataKey}_is_editable` as keyof CaseDetailsData;
          const toggleKeys = getToggleKeys(String(dataKey));
          const cellData = caseDetailsList[caseDetailsDataIndex][i];

          const isCellRequired = cellData[isRequiredKey] as boolean;
          const isCellEditable = cellData[isEditableKey] as boolean;

          return (
            <div
              key={i}
              className={`case-details-table-body-row-cell case-details-pop-up-parent ${
                isCellRequired ? "required-cell" : ""
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
              <FormCheckbox
                checked={(cellData[dataKey] as boolean) || false}
                setChecked={(isCheckedAction) => {
                  setCaseDetailsList((prevState) => {
                    const newState = [...prevState];
                    const isChecked =
                      resolveBooleanSetterValue(isCheckedAction);
                    (newState[caseDetailsDataIndex][i][dataKey] as boolean) =
                      isChecked;
                    return newState;
                  });
                }}
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

CaseDetailsCheckboxRow.displayName = "CaseDetailsCheckboxRow";
