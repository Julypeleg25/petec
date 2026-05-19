import React, { memo } from "react";
import FormSelect from "../../../../utils/FormSelect/FormSelect";
import FormTextarea from "../../../../utils/FormTextarea/FormTextarea";
import TableUnEditableCellElement from "../TableUnEditableCellElement";
import { SelectCellComponent } from "../CaseDetailsTableCells";
import { getSelectValueText } from "../utils/caseDetailsText.utils";
import { DAILY_CASE_TABLE_COLUMN_COUNT } from "../CaseDetailsTable.constants";
import type {
  CaseDetailsInteractiveStateProps,
  CaseDetailsInputChangeHandler,
} from "../CaseDetailsTable.types";
import type { SelectOptionObj } from "../../../../utils/FormSelect/FormSelect.types";
import {
  areSimpleRowCellsEqual,
  getSelectCommentKeys,
  getSimpleCellToggleState,
  getToggleKeys,
  handleSimpleCellToggle,
  haveInteractiveStatePropsChanged,
} from "./CaseDetailsRows.common";

interface CaseDetailsSelectCommentRowProps extends CaseDetailsInteractiveStateProps {
  title: string;
  dataKeyPrefix: "urine" | "feces";
  selectOptions: SelectOptionObj[];
  handleInputChange: CaseDetailsInputChangeHandler;
  handleProgrammaticInputChange: (
    setStateParams: { index: number },
    value: string | number | undefined,
    fieldName: string,
  ) => void;
}

export const CaseDetailsSelectCommentRow = memo(
  ({
    title,
    dataKeyPrefix,
    selectOptions,
    caseDetailsList,
    caseDetailsDataIndex,
    paintingMode,
    setCaseDetailsList,
    handleCellClick,
    handleInputChange,
    handleProgrammaticInputChange,
  }: CaseDetailsSelectCommentRowProps) => {
    const resolveOptionTextById = (value: string | null | undefined): string | null => {
      if (!value) {
        return null;
      }

      const matchedOption = selectOptions.find((option) => option.value === value);
      return matchedOption?.text ?? null;
    };

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
          const { typeIdKey, commentsKey } = getSelectCommentKeys(dataKeyPrefix);

          const cellData = caseDetailsList[caseDetailsDataIndex][i];
          const { isCellRequired, isCellEditable } = getSimpleCellToggleState(
            cellData,
            dataKeyPrefix,
          );

          return (
            <div
              key={i}
              className={`case-details-table-body-row-cell ${isCellEditable ? "case-details-pop-up-parent" : ""
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
              <SelectCellComponent
                index={i}
                isComment={true}
                selectElement={
                  <FormSelect
                    elements={selectOptions}
                    optionState={cellData[typeIdKey]?.toString() || ""}
                    afterSelect={(value) => {
                      handleProgrammaticInputChange(
                        { index: i },
                        value,
                        typeIdKey,
                      );
                    }}
                    selectId={`new-patient-select-${dataKeyPrefix}-type-${i}`}
                    width="100%"
                  />
                }
                commentValName={commentsKey}
                formTextareaElementId={`${dataKeyPrefix}-textarea-${i}`}
                caseDetailsList={caseDetailsList}
                caseDetailsDataIndex={caseDetailsDataIndex}
                handleInputChange={handleInputChange}
              />
              {!isCellEditable && <TableUnEditableCellElement />}
              <FormTextarea
                id={`${dataKeyPrefix}-textarea-${i}`}
                state={
                  getSelectValueText(
                    resolveOptionTextById(
                      cellData[typeIdKey] ? String(cellData[typeIdKey]) : null,
                    ),
                    cellData[commentsKey] as string | null,
                  ) || ""
                }
                name={commentsKey}
                height="40px"
                minHeight="40px"
                width="100%"
                minWidth="60%"
                maxLength={150}
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
    if (prevProps.dataKeyPrefix !== nextProps.dataKeyPrefix) return false;
    if (prevProps.selectOptions !== nextProps.selectOptions) return false;
    const toggleKeys = getToggleKeys(prevProps.dataKeyPrefix);
    const { typeIdKey, commentsKey } = getSelectCommentKeys(
      prevProps.dataKeyPrefix,
    );

    return areSimpleRowCellsEqual(
      prevProps.caseDetailsList,
      nextProps.caseDetailsList,
      prevProps.caseDetailsDataIndex,
      DAILY_CASE_TABLE_COLUMN_COUNT,
      [toggleKeys.isRequiredKey, toggleKeys.isEditableKey, typeIdKey, commentsKey],
    );
  },
);

CaseDetailsSelectCommentRow.displayName = "CaseDetailsSelectCommentRow";
