import React from "react";
import FormTextarea, {
  growHeightOnInput,
} from "../../../utils/FormTextarea/FormTextarea";
import type {
  CaseDetailsData,
  CaseDetailsInputChangeHandler,
  CaseDetailsStateSetter,
} from "./CaseDetailsTable.types";
import {
  getCaseDetailsMedicineCommentsByType,
  getCaseDetailsStringFieldValue,
} from "./CaseDetailsTableCells.utils";
import {
  stopCaseDetailsEventPropagation,
  updateCaseDetailsCollection,
} from "./components/CaseDetailsRows.common";

interface CellComponentProps {
  index: number;
  isComment?: boolean;
  commentValName?: string;
  formTextareaElementId?: string;
  caseDetailsList: CaseDetailsData[][];
  caseDetailsDataIndex: number;
  handleInputChange?: CaseDetailsInputChangeHandler;
  setCaseDetailsList?: CaseDetailsStateSetter;
}

interface BooleanCellProps extends CellComponentProps {
  valName: string;
}

interface SelectCellProps extends CellComponentProps {
  selectElement: React.ReactNode;
}

interface MedicineCommentCellProps extends CellComponentProps {
  medicineId: string;
  type: "fluids" | "medicines";
  caseDetailsPopUpId: string;
}

export const BooleanCellComponent = ({
  index,
  isComment,
  valName,
  commentValName,
  formTextareaElementId,
  caseDetailsList,
  caseDetailsDataIndex,
  handleInputChange,
}: BooleanCellProps) => {
  return (
    <div
      onClick={stopCaseDetailsEventPropagation}
      onDoubleClick={stopCaseDetailsEventPropagation}
      className={
        "case-details-pop-up boolean-cell-component" +
        (isComment ? " boolean-cell-component-comment" : "")
      }
    >
      {isComment && commentValName && handleInputChange && (
        <div className="case-details-boolean-pop-up-comment">
          <FormTextarea
            labelText="הערות:"
            name={commentValName}
            height={"70px"}
            minHeight="70px"
            maxHeight={"150px"}
            minWidth="70%"
            maxLength={150}
            state={getCaseDetailsStringFieldValue(
              caseDetailsList[caseDetailsDataIndex][index],
              commentValName,
            )}
            setState={handleInputChange}
            setStateParams={{ index: index }}
            isGrowHeightOnInput={true}
          />
        </div>
      )}
      <div>
        <button
          className="case-details-boolean-pop-up-btn"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (handleInputChange) {
              handleInputChange(true, { index: index }, valName);
            }
          }}
        >
          כן
        </button>
        <button
          className="case-details-boolean-pop-up-btn"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (handleInputChange) {
              handleInputChange(false, { index: index }, valName);
            }
          }}
        >
          לא
        </button>
      </div>
    </div>
  );
};

export const SelectCellComponent = ({
  index,
  isComment,
  selectElement,
  commentValName,
  formTextareaElementId,
  caseDetailsList,
  caseDetailsDataIndex,
  handleInputChange,
}: SelectCellProps) => {
  return (
    <div
      onClick={stopCaseDetailsEventPropagation}
      onDoubleClick={stopCaseDetailsEventPropagation}
      className={
        "case-details-pop-up select-cell-component" +
        (isComment ? " select-cell-component-comment" : "")
      }
    >
      {isComment && commentValName && handleInputChange && (
        <div className="case-details-select-pop-up-comment">
          <FormTextarea
            labelText="הערות:"
            name={commentValName}
            height={"70px"}
            minHeight="70px"
            maxHeight={"150px"}
            minWidth="70%"
            maxLength={150}
            state={getCaseDetailsStringFieldValue(
              caseDetailsList[caseDetailsDataIndex][index],
              commentValName,
            )}
            setState={handleInputChange}
            setStateParams={{ index: index }}
            isGrowHeightOnInput={true}
          />
        </div>
      )}
      <div style={{ width: "80%", marginBottom: "0.5em" }}>{selectElement}</div>
    </div>
  );
};

export const MedicineCommentCellComponent = ({
  index,
  medicineId,
  type,
  caseDetailsPopUpId,
  formTextareaElementId,
  caseDetailsList,
  caseDetailsDataIndex,
  setCaseDetailsList,
  style
}: MedicineCommentCellProps & { style?: React.CSSProperties }) => {
  const medicineCommentsByType = getCaseDetailsMedicineCommentsByType(
    caseDetailsList[caseDetailsDataIndex][index],
    type,
  );
  const currentComment = medicineCommentsByType?.[medicineId]?.comment ?? "";

  return (
    <div
      id={caseDetailsPopUpId}
      onClick={stopCaseDetailsEventPropagation}
      onDoubleClick={stopCaseDetailsEventPropagation}
      className={"case-details-pop-up-on-double-click comment-cell-component"}
      style={style}
    >
      <div className="case-details-select-pop-up-comment">
        <FormTextarea
          labelText="הערות:"
          height={"70px"}
          minHeight="70px"
          maxHeight={"150px"}
          minWidth="70%"
          maxLength={150}
          state={currentComment}
          setState={(value: string) => {
            if (setCaseDetailsList) {
              setCaseDetailsList((prevState) =>
                updateCaseDetailsCollection(
                  prevState,
                  caseDetailsDataIndex,
                  index,
                  type,
                  (cells) =>
                    cells.map((cell) =>
                      cell.value === medicineId
                        ? {
                            ...cell,
                            comment: value || undefined,
                          }
                        : cell,
                    ),
                ),
              );
            }
          }}
          isGrowHeightOnInput={true}
        />
      </div>
    </div>
  );
};
