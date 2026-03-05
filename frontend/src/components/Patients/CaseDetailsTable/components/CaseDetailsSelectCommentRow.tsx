import React, { memo } from "react";
import FormSelect from "../../../../utils/FormSelect/FormSelect";
import FormTextarea from "../../../../utils/FormTextarea/FormTextarea";
import TableUnEditableCellElement from "../TableUnEditableCellElement";
import { SelectCellComponent } from "../CaseDetailsTableCells";
import { getSelectValueText } from "../utils/caseDetailsText.utils";
import { DAILY_CASE_TABLE_COLUMN_COUNT } from "../CaseDetailsTable.constants";
import type {
  CaseDetailsData,
  CaseDetailsInputChangeHandler,
} from "../CaseDetailsTable.types";
import type { SelectOptionObj } from "../../../../utils/FormSelect/FormSelect.types";
import {
  areSimpleRowCellsEqual,
  getToggleKeys,
  handleSimpleCellToggle,
} from "./CaseDetailsRows.common";

interface CaseDetailsSelectCommentRowProps {
  title: string;
  dataKeyPrefix: "urine" | "feces";
  selectOptions: SelectOptionObj[];
  caseDetailsList: CaseDetailsData[][];
  caseDetailsDataIndex: number;
  paintingMode: boolean;
  setCaseDetailsList: React.Dispatch<React.SetStateAction<CaseDetailsData[][]>>;
  handleCellClick: (
    e: React.MouseEvent<HTMLElement>,
    isEditable: boolean,
  ) => Promise<boolean | null>;
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

          const typeIdKey = `${dataKeyPrefix}TypeId` as keyof CaseDetailsData;
          const typeTextKey =
            `${dataKeyPrefix}TypeText` as keyof CaseDetailsData;
          const commentsKey =
            `${dataKeyPrefix}Comments` as keyof CaseDetailsData;

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
              <SelectCellComponent
                index={i}
                isComment={true}
                selectElement={
                  <FormSelect
                    elements={selectOptions}
                    optionState={cellData[typeIdKey]?.toString() || ""}
                    afterSelect={(value, textValue) => {
                      handleProgrammaticInputChange(
                        { index: i },
                        value,
                        typeIdKey,
                      );
                      handleProgrammaticInputChange(
                        { index: i },
                        textValue,
                        typeTextKey,
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
                    cellData[typeTextKey] as string | null,
                    cellData[commentsKey] as string | null,
                  ) || ""
                }
                name={commentsKey}
                height="20px"
                minHeight="20px"
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
    if (prevProps.caseDetailsDataIndex !== nextProps.caseDetailsDataIndex)
      return false;
    if (prevProps.paintingMode !== nextProps.paintingMode) return false;

    const reqKey =
      `${prevProps.dataKeyPrefix}_is_required` as keyof CaseDetailsData;
    const editKey =
      `${prevProps.dataKeyPrefix}_is_editable` as keyof CaseDetailsData;
    const typeIdKey =
      `${prevProps.dataKeyPrefix}TypeId` as keyof CaseDetailsData;
    const typeTextKey =
      `${prevProps.dataKeyPrefix}TypeText` as keyof CaseDetailsData;
    const commentsKey =
      `${prevProps.dataKeyPrefix}Comments` as keyof CaseDetailsData;

    return areSimpleRowCellsEqual(
      prevProps.caseDetailsList,
      nextProps.caseDetailsList,
      prevProps.caseDetailsDataIndex,
      DAILY_CASE_TABLE_COLUMN_COUNT,
      [reqKey, editKey, typeIdKey, typeTextKey, commentsKey],
    );
  },
);

CaseDetailsSelectCommentRow.displayName = "CaseDetailsSelectCommentRow";
