import React, { memo } from "react";
import FormCheckbox from "../../../../utils/FormCheckbox/FormCheckbox";
import FormTextarea from "../../../../utils/FormTextarea/FormTextarea";
import type { MedicineSelectOptionObj } from "../../../MedicinePicker/MedicinePicker.types";
import { MedicineCommentCellComponent } from "../CaseDetailsTableCells";
import TableUnEditableCellElement from "../TableUnEditableCellElement";
import {
  DAILY_CASE_TABLE_COLUMN_COUNT,
  type MedicineSectionType,
} from "../CaseDetailsTable.constants";
import type { CaseDetailsInteractiveStateProps } from "../CaseDetailsTable.types";
import {
  findCollectionItemInCell,
  getHeaderCollectionItem,
  handleMedicineCellToggle,
  haveInteractiveStatePropsChanged,
  resolveBooleanSetterValue,
  stopCaseDetailsEventPropagation,
  updateCollectionItemByValue,
  updateMedicineCollection,
} from "./CaseDetailsRows.common";
import { hydrateCaseDetailsMedicineCell } from "../utils/CaseDetailsTable.utils";
import { getMedicineDisplayDetails } from "../../../../utils/medicineDisplay.utils";

interface CaseDetailsMedicineRowProps extends CaseDetailsInteractiveStateProps {
  type: MedicineSectionType;
  rowIndex: number;
  catalogMedicines: MedicineSelectOptionObj[];
}

export const CaseDetailsMedicineRow = memo(
  ({
    type,
    rowIndex,
    catalogMedicines,
    caseDetailsList,
    caseDetailsDataIndex,
    paintingMode,
    setCaseDetailsList,
    handleCellClick,
  }: CaseDetailsMedicineRowProps) => {
    const [selectedColumnPopup, setSelectedColumnPopup] = React.useState<number | null>(null);
    const rowRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      const handleOutsideClick = (event: MouseEvent) => {
        if (rowRef.current && !rowRef.current.contains(event.target as Node)) {
          setSelectedColumnPopup(null);
        }
      };

      if (selectedColumnPopup !== null) {
        document.addEventListener("click", handleOutsideClick);
      }

      return () => {
        document.removeEventListener("click", handleOutsideClick);
      };
    }, [selectedColumnPopup]);

    return (
      <div className="case-details-table-body-row" ref={rowRef}>
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
              const item = headerItem
                ? hydrateCaseDetailsMedicineCell(headerItem, catalogMedicines)
                : undefined;
              if (!item) return null;
              const detailsText = getMedicineDisplayDetails(
                item.doseAmount,
                item.measureUnitText ?? null,
                item.frequencyText ?? null,
                item.medicineRouteText ?? null,
              );
              return (
                <div
                  key={columnIndex}
                  className="case-details-table-body-row-cell case-details-table-body-row-cell-title"
                >
                  <span className="selected-medicine-name table-selected-medicine-name">
                    {item.text}
                  </span>
                  {detailsText ? ` ${detailsText}` : ""}
                </div>
              );
            }

            const headerItemRaw = getHeaderCollectionItem(
              caseDetailsList,
              caseDetailsDataIndex,
              type,
              rowIndex,
            );
            const headerItem = headerItemRaw
              ? hydrateCaseDetailsMedicineCell(headerItemRaw, catalogMedicines)
              : undefined;
            const itemKey = headerItem?.value ?? "";
            const currentItemRaw = findCollectionItemInCell(
              caseDetailsList,
              caseDetailsDataIndex,
              columnIndex,
              type,
              itemKey,
            );
            const currentItem = currentItemRaw
              ? hydrateCaseDetailsMedicineCell(currentItemRaw, catalogMedicines)
              : undefined;
            const currentItemComment = currentItem?.comment ?? null;

            return (
              <div
                key={columnIndex}
                className={`case-details-table-body-row-cell ${
                  currentItem?.isEditable &&
                  "case-details-pop-up-on-double-click-parent"
                } ${currentItem?.isRequired || false ? "required-cell" : ""}`}
                onClickCapture={(e) =>
                  handleMedicineCellToggle(
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
                    headerItem?.frequencyText ?? "",
                  )
                }
                onDoubleClick={() => {
                  if (currentItem?.isEditable) {
                    setSelectedColumnPopup((prev) => prev === columnIndex ? null : columnIndex);
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
                  style={selectedColumnPopup === columnIndex ? { display: "flex", opacity: 1 } : undefined}
                />
                {!currentItem?.isEditable && <TableUnEditableCellElement />}
                <div
                  onClick={stopCaseDetailsEventPropagation}
                >
                  <FormCheckbox
                    checked={currentItem?.isGiven || false}
                    setChecked={(isCheckedAction) => {
                      setCaseDetailsList((prevState) => {
                        const isChecked =
                          resolveBooleanSetterValue(isCheckedAction);

                        if (type === "fluids" && isChecked) {
                          return updateMedicineCollection(
                            prevState,
                            caseDetailsDataIndex,
                            columnIndex,
                            type,
                            (cells) =>
                              cells.map((cell) => ({
                                ...cell,
                                isGiven: isChecked,
                              })),
                          );
                        }

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
                  {currentItemComment && (
                    <FormTextarea
                      id={`${type}-comment-textarea-${rowIndex}`}
                      state={currentItemComment}
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
              </div>
            );
          },
        )}
      </div>
    );
  },
  (prevProps, nextProps) => {
    if (haveInteractiveStatePropsChanged(prevProps, nextProps)) return false;
    if (prevProps.catalogMedicines !== nextProps.catalogMedicines) return false;
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
    if (!prevHeaderItem || !nextHeaderItem) return false;
    if (prevHeaderItem.text !== nextHeaderItem.text) return false;
    if (prevHeaderItem.dosageText !== nextHeaderItem.dosageText) return false;
    if (prevHeaderItem.doseAmount !== nextHeaderItem.doseAmount) return false;
    if (prevHeaderItem.measureUnitText !== nextHeaderItem.measureUnitText)
      return false;
    if (prevHeaderItem.frequencyText !== nextHeaderItem.frequencyText)
      return false;
    if (prevHeaderItem.medicineRouteText !== nextHeaderItem.medicineRouteText)
      return false;

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
      if (prevCell.isGiven !== nextCell.isGiven) return false;
      if (prevCell.isRequired !== nextCell.isRequired) return false;
      if (prevCell.isEditable !== nextCell.isEditable) return false;
      if (prevCell.comment !== nextCell.comment) return false;
    }
    return true;
  },
);

CaseDetailsMedicineRow.displayName = "CaseDetailsMedicineRow";
