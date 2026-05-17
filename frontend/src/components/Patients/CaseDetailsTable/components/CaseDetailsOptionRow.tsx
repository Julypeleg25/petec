import React, { memo } from "react";
import FormCheckbox from "../../../../utils/FormCheckbox/FormCheckbox";
import FormTextarea from "../../../../utils/FormTextarea/FormTextarea";
import TableUnEditableCellElement from "../TableUnEditableCellElement";
import {
  DAILY_CASE_TABLE_COLUMN_COUNT,
  type OptionSectionType,
} from "../CaseDetailsTable.constants";
import type { CaseDetailsInteractiveStateProps } from "../CaseDetailsTable.types";
import {
  findCollectionItemInCell,
  getHeaderCollectionItem,
  handleOptionCellToggle,
  haveInteractiveStatePropsChanged,
  resolveBooleanSetterValue,
  stopCaseDetailsEventPropagation,
  updateCollectionItemByValue,
} from "./CaseDetailsRows.common";

interface CaseDetailsOptionRowProps extends CaseDetailsInteractiveStateProps {
  type: OptionSectionType;
  inputType: "textarea" | "checkbox";
  rowIndex: number;
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
              const headerItem = getHeaderCollectionItem(
                caseDetailsList,
                caseDetailsDataIndex,
                type,
                rowIndex,
              );
              if (!headerItem) return null;
              return (
                <div
                  key={columnIndex}
                  className="case-details-table-body-row-cell case-details-table-body-row-cell-title"
                >
                  {headerItem.text}
                </div>
              );
            }

            const headerItem = getHeaderCollectionItem(
              caseDetailsList,
              caseDetailsDataIndex,
              type,
              rowIndex,
            );
            const itemKey = headerItem?.value ?? "";
            const currentItem = findCollectionItemInCell(
              caseDetailsList,
              caseDetailsDataIndex,
              columnIndex,
              type,
              itemKey,
            );

            return (
              <div
                key={columnIndex}
                className={`case-details-table-body-row-cell case-details-pop-up-parent ${
                  currentItem?.isRequired ? "required-cell" : ""
                }`}
                onClickCapture={(e) =>
                  handleOptionCellToggle(
                    e,
                    currentItem?.isEditable ?? false,
                    currentItem?.isRequired ?? false,
                    handleCellClick,
                    setCaseDetailsList,
                    caseDetailsDataIndex,
                    columnIndex,
                    type,
                    itemKey,
                    paintingMode,
                  )
                }
              >
                {!currentItem?.isEditable && <TableUnEditableCellElement />}
                <div
                  onClick={stopCaseDetailsEventPropagation}
                  onDoubleClick={stopCaseDetailsEventPropagation}
                >
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
                        setCaseDetailsList((prevState) =>
                          updateCollectionItemByValue(
                            prevState,
                            caseDetailsDataIndex,
                            columnIndex,
                            type,
                            itemKey,
                            (cell) =>
                              type === "examinations"
                                ? { ...cell, exam_value: val }
                                : { ...cell, value: val },
                          ),
                        );
                      }}
                    />
                  ) : (
                    <FormCheckbox
                      checked={currentItem?.isGiven || false}
                      setChecked={(isCheckedAction) => {
                        setCaseDetailsList((prevState) => {
                      const isChecked =
                            resolveBooleanSetterValue(isCheckedAction);

                          return updateCollectionItemByValue(
                            prevState,
                            caseDetailsDataIndex,
                            columnIndex,
                            type,
                            itemKey,
                            (cell) => ({ ...cell, isGiven: isChecked }),
                          );
                        });
                      }}
                    />
                  )}
                </div>
              </div>
            );
          },
        )}
      </div>
    );
  },
  (prevProps, nextProps) => {
    if (haveInteractiveStatePropsChanged(prevProps, nextProps)) return false;

    const type = prevProps.type;
    const rowIndex = prevProps.rowIndex;
    const prevHeaderItem = getHeaderCollectionItem(
      prevProps.caseDetailsList,
      prevProps.caseDetailsDataIndex,
      type,
      rowIndex,
    );
    const nextHeaderItem = getHeaderCollectionItem(
      nextProps.caseDetailsList,
      nextProps.caseDetailsDataIndex,
      type,
      rowIndex,
    );
    const prevItemKey = prevHeaderItem?.value;
    const nextItemKey = nextHeaderItem?.value;

    if (prevItemKey !== nextItemKey) return false;
    if (!prevItemKey) return true;

    for (let i = 1; i < DAILY_CASE_TABLE_COLUMN_COUNT; i++) {
      const prevCell = findCollectionItemInCell(
        prevProps.caseDetailsList,
        prevProps.caseDetailsDataIndex,
        i,
        type,
        prevItemKey,
      );
      const nextCell = findCollectionItemInCell(
        nextProps.caseDetailsList,
        nextProps.caseDetailsDataIndex,
        i,
        type,
        prevItemKey,
      );

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
