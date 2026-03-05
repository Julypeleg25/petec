import React, { memo } from "react";
import FormCheckbox from "../../../../utils/FormCheckbox/FormCheckbox";
import FormTextarea from "../../../../utils/FormTextarea/FormTextarea";
import TableUnEditableCellElement from "../TableUnEditableCellElement";
import { DAILY_CASE_TABLE_COLUMN_COUNT } from "../CaseDetailsTable.constants";
import type { CaseDetailsData } from "../CaseDetailsTable.types";
import {
  findCellByValue,
  resolveBooleanSetterValue,
} from "./CaseDetailsRows.common";

interface CaseDetailsOptionRowProps {
  type: "examinations" | "procedures" | "foodExtras";
  inputType: "textarea" | "checkbox";
  rowIndex: number;
  caseDetailsList: CaseDetailsData[][];
  caseDetailsDataIndex: number;
  paintingMode: boolean;
  setCaseDetailsList: React.Dispatch<React.SetStateAction<CaseDetailsData[][]>>;
  handleCellClick: (
    e: React.MouseEvent<HTMLElement>,
    isEditable: boolean,
  ) => Promise<boolean | null>;
}

export const CaseDetailsOptionRow = memo(
  ({
    type,
    inputType,
    rowIndex,
    caseDetailsList,
    caseDetailsDataIndex,
    paintingMode,
    setCaseDetailsList,
    handleCellClick,
  }: CaseDetailsOptionRowProps) => {
    return (
      <div className="case-details-table-body-row">
        {Array.from(
          { length: DAILY_CASE_TABLE_COLUMN_COUNT },
          (_, columnIndex) => {
            if (columnIndex === 0) {
              const item =
                caseDetailsList[caseDetailsDataIndex][0][type][rowIndex];
              if (!item) return null;
              return (
                <div
                  key={columnIndex}
                  className="case-details-table-body-row-cell case-details-table-body-row-cell-title"
                >
                  {item.text}
                </div>
              );
            }

            const itemKey =
              caseDetailsList[caseDetailsDataIndex][0][type][rowIndex]?.value ??
              "";
            const currentItem = findCellByValue(
              caseDetailsList[caseDetailsDataIndex][columnIndex][type],
              itemKey,
            );

            return (
              <div
                key={columnIndex}
                className={`case-details-table-body-row-cell case-details-pop-up-parent ${
                  currentItem?.isRequired ? "required-cell" : ""
                }`}
                onClick={(e) =>
                  handleCellClick(e, currentItem?.isEditable ?? false).then(
                    (val: boolean | null) => {
                      if (val !== null) {
                        setCaseDetailsList((prevState) => {
                          const newState = [...prevState];
                          const optionCell = findCellByValue(
                            newState[caseDetailsDataIndex][columnIndex][type],
                            itemKey,
                          );
                          if (optionCell) {
                            if (paintingMode) optionCell.isRequired = val;
                            else optionCell.isEditable = val;
                          }
                          return newState;
                        });
                      }
                    },
                  )
                }
              >
                {!currentItem?.isEditable && <TableUnEditableCellElement />}
                {inputType === "textarea" ? (
                  <FormTextarea
                    id={`${type}_${itemKey}_${columnIndex}`}
                    minHeight="20px"
                    maxHeight="100px"
                    width="100%"
                    minWidth="60%"
                    maxLength={250}
                    isGrowHeightOnInput={true}
                    state={
                      type === "examinations"
                        ? (currentItem?.exam_value ?? "")
                        : currentItem?.value || ""
                    }
                    setState={(val: string) => {
                      setCaseDetailsList((prevState) => {
                        const newState = [...prevState];
                        const optionCell = findCellByValue(
                          newState[caseDetailsDataIndex][columnIndex][type],
                          itemKey,
                        );
                        if (optionCell) {
                          if (type === "examinations") {
                            optionCell.exam_value = val;
                          } else {
                            optionCell.value = val;
                          }
                        }
                        return newState;
                      });
                    }}
                  />
                ) : (
                  <FormCheckbox
                    checked={currentItem?.isGiven || false}
                    setChecked={(isCheckedAction) => {
                      setCaseDetailsList((prevState) => {
                        const newState = [...prevState];
                        const isChecked =
                          resolveBooleanSetterValue(isCheckedAction);
                        const optionCell = findCellByValue(
                          newState[caseDetailsDataIndex][columnIndex][type],
                          itemKey,
                        );
                        if (optionCell) optionCell.isGiven = isChecked;
                        return newState;
                      });
                    }}
                  />
                )}
              </div>
            );
          },
        )}
      </div>
    );
  },
  (prevProps, nextProps) => {
    if (prevProps.caseDetailsDataIndex !== nextProps.caseDetailsDataIndex)
      return false;
    if (prevProps.paintingMode !== nextProps.paintingMode) return false;

    const type = prevProps.type;
    const rowIndex = prevProps.rowIndex;
    const prevItemKey =
      prevProps.caseDetailsList[prevProps.caseDetailsDataIndex]?.[0]?.[type]?.[
        rowIndex
      ]?.value;
    const nextItemKey =
      nextProps.caseDetailsList[nextProps.caseDetailsDataIndex]?.[0]?.[type]?.[
        rowIndex
      ]?.value;

    if (prevItemKey !== nextItemKey) return false;
    if (!prevItemKey) return true;

    for (let i = 1; i < DAILY_CASE_TABLE_COLUMN_COUNT; i++) {
      const prevCellsRow =
        prevProps.caseDetailsList[prevProps.caseDetailsDataIndex]?.[i]?.[type];
      const nextCellsRow =
        nextProps.caseDetailsList[nextProps.caseDetailsDataIndex]?.[i]?.[type];

      if (!prevCellsRow || !nextCellsRow) return false;

      const prevCell = findCellByValue(prevCellsRow, prevItemKey);
      const nextCell = findCellByValue(nextCellsRow, prevItemKey);

      if (!prevCell || !nextCell) return false;

      if (prevProps.inputType === "textarea") {
        const previousTextareaValue =
          prevProps.type === "examinations"
            ? prevCell.exam_value
            : prevCell.value;
        const nextTextareaValue =
          nextProps.type === "examinations"
            ? nextCell.exam_value
            : nextCell.value;
        if (previousTextareaValue !== nextTextareaValue) return false;
      } else {
        if (prevCell.isGiven !== nextCell.isGiven) return false;
      }

      if (prevCell.isRequired !== nextCell.isRequired) return false;
      if (prevCell.isEditable !== nextCell.isEditable) return false;
    }
    return true;
  },
);

CaseDetailsOptionRow.displayName = "CaseDetailsOptionRow";
