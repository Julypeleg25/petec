import React, { memo } from "react";
import FormCheckbox from "../../../../utils/FormCheckbox/FormCheckbox";
import FormTextarea from "../../../../utils/FormTextarea/FormTextarea";
import { MedicineCommentCellComponent } from "../CaseDetailsTableCells";
import TableUnEditableCellElement from "../TableUnEditableCellElement";
import { getRequiredIndexesByFrequency } from "../utils/caseDetailsFrequency.utils";
import { DAILY_CASE_TABLE_COLUMN_COUNT } from "../CaseDetailsTable.constants";
import type { CaseDetailsData } from "../CaseDetailsTable.types";
import {
  findCellByValue,
  resolveBooleanSetterValue,
} from "./CaseDetailsRows.common";

interface CaseDetailsMedicineRowProps {
  type: "fluids" | "medicines";
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

export const CaseDetailsMedicineRow = memo(
  ({
    type,
    rowIndex,
    caseDetailsList,
    caseDetailsDataIndex,
    paintingMode,
    setCaseDetailsList,
    handleCellClick,
  }: CaseDetailsMedicineRowProps) => {
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
                  <span className="selected-medicine-name table-selected-medicine-name">
                    {item.text}
                  </span>
                  {` ${item.doseAmount}${item.measureUnitText} ${item.frequencyText} ${item.medicineRouteText}`}
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
                className={`case-details-table-body-row-cell ${
                  currentItem?.isEditable &&
                  "case-details-pop-up-on-double-click-parent"
                } ${currentItem?.isRequired || false ? "required-cell" : ""}`}
                onClick={(e) =>
                  handleCellClick(e, currentItem?.isEditable ?? false).then(
                    (val: boolean | null) => {
                      if (val !== null) {
                        setCaseDetailsList((prevState) => {
                          const newState = [...prevState];
                          const frequencyText = newState[
                            caseDetailsDataIndex
                          ][0][type].filter((med) => med.value === itemKey)[0]
                            ?.frequencyText;

                          const requiredIndexes = val
                            ? getRequiredIndexesByFrequency(
                                frequencyText,
                                columnIndex,
                              )
                            : [columnIndex];

                          if (type === "fluids") {
                            if (paintingMode) {
                              for (const targetColIndex of requiredIndexes) {
                                const items =
                                  newState[caseDetailsDataIndex][
                                    targetColIndex
                                  ][type];
                                for (let k = 0; k < items.length; k++) {
                                  items[k].isRequired = val;
                                }
                              }
                            } else {
                              const items =
                                newState[caseDetailsDataIndex][columnIndex][
                                  type
                                ];
                              for (let k = 0; k < items.length; k++) {
                                items[k].isEditable = val;
                              }
                            }
                          } else if (type === "medicines") {
                            if (paintingMode) {
                              for (const targetColIndex of requiredIndexes) {
                                const med = findCellByValue(
                                  newState[caseDetailsDataIndex][
                                    targetColIndex
                                  ][type],
                                  itemKey,
                                );
                                if (med) med.isRequired = val;
                              }
                            } else {
                              const med = findCellByValue(
                                newState[caseDetailsDataIndex][columnIndex][
                                  type
                                ],
                                itemKey,
                              );
                              if (med) med.isEditable = val;
                            }
                          }
                          return newState;
                        });
                      }
                    },
                  )
                }
                onDoubleClick={() => {
                  if (currentItem?.isEditable) {
                    const popupElement = document.getElementById(
                      `pop-up-${type}-comment-textarea-${rowIndex}-${columnIndex}`,
                    );
                    if (popupElement) {
                      popupElement.style.display = "flex";
                      popupElement.style.opacity = "1";

                      const handleOutsideClick = (event: MouseEvent) => {
                        if (!popupElement.contains(event.target as Node)) {
                          popupElement.style.display = "none";
                          document.removeEventListener(
                            "click",
                            handleOutsideClick,
                          );
                        }
                      };
                      document.addEventListener("click", handleOutsideClick);
                    }
                  }
                }}
              >
                <MedicineCommentCellComponent
                  isComment={true}
                  caseDetailsDataIndex={caseDetailsDataIndex}
                  index={columnIndex}
                  medicineId={itemKey}
                  type={type}
                  caseDetailsPopUpId={`pop-up-${type}-comment-textarea-${rowIndex}-${columnIndex}`}
                  formTextareaElementId={`${type}-comment-textarea-${rowIndex}`}
                  caseDetailsList={caseDetailsList}
                  setCaseDetailsList={setCaseDetailsList}
                />
                {!currentItem?.isEditable && <TableUnEditableCellElement />}
                <FormCheckbox
                  checked={currentItem?.isGiven || false}
                  setChecked={(isCheckedAction) => {
                    setCaseDetailsList((prevState) => {
                      const newState = [...prevState];
                      const isChecked =
                        resolveBooleanSetterValue(isCheckedAction);

                      if (type === "fluids") {
                        if (isChecked) {
                          const items =
                            newState[caseDetailsDataIndex][columnIndex][type];
                          for (let k = 0; k < items.length; k++)
                            items[k].isGiven = isChecked;
                        } else {
                          const fluidItem = findCellByValue(
                            newState[caseDetailsDataIndex][columnIndex][type],
                            itemKey,
                          );
                          if (fluidItem) fluidItem.isGiven = isChecked;
                        }
                      } else if (type === "medicines") {
                        const medItem = findCellByValue(
                          newState[caseDetailsDataIndex][columnIndex][type],
                          itemKey,
                        );
                        if (medItem) medItem.isGiven = isChecked;
                      }

                      return newState;
                    });
                  }}
                />
                {currentItem?.comment && (
                  <FormTextarea
                    id={`${type}-comment-textarea-${rowIndex}`}
                    state={currentItem.comment || ""}
                    name={`${type}Comment`}
                    height={"20px"}
                    minHeight="20px"
                    width="100%"
                    minWidth="60%"
                    maxLength={150}
                    readOnly={true}
                    className="medicine-comment-textarea"
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

    // Evaluate depth mapping for fluids and medicines mapped list correctly underneath memo threshold.
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
      if (prevCell.isGiven !== nextCell.isGiven) return false;
      if (prevCell.isRequired !== nextCell.isRequired) return false;
      if (prevCell.isEditable !== nextCell.isEditable) return false;
      if (prevCell.comment !== nextCell.comment) return false;
    }
    return true;
  },
);

CaseDetailsMedicineRow.displayName = "CaseDetailsMedicineRow";
