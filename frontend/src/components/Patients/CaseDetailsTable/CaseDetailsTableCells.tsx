import React from "react";
import FormTextarea, { growHeightOnInput } from "../../../utils/FormTextarea/FormTextarea";
import { BooleanCellProps, MedicineCommentCellProps, SelectCellProps } from "./CaseDetailsTable.types";
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
    <div className={"case-details-pop-up boolean-cell-component" + (isComment ? " boolean-cell-component-comment" : "")}>
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
            state={(caseDetailsList[caseDetailsDataIndex][index] as any)[commentValName]}
            setState={handleInputChange}
            setStateParams={{ index: index }}
            afterChange={() => {
              if (formTextareaElementId) {
                const el = document.getElementById(formTextareaElementId);
                if (el) growHeightOnInput(el as HTMLTextAreaElement);
              }
            }}
          />
        </div>
      )}
      <div>
        <button
          className="case-details-boolean-pop-up-btn"
          onClick={(e) => {
            e.preventDefault();
            if (handleInputChange) handleInputChange(undefined, { index: index }, true, valName);
          }}
        >
          כן
        </button>
        <button
          className="case-details-boolean-pop-up-btn"
          onClick={(e) => {
            e.preventDefault();
            if (handleInputChange) handleInputChange(undefined, { index: index }, false, valName);
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
    <div className={"case-details-pop-up select-cell-component" + (isComment ? " select-cell-component-comment" : "")}>
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
            state={(caseDetailsList[caseDetailsDataIndex][index] as any)[commentValName]}
            setState={handleInputChange}
            setStateParams={{ index: index }}
            afterChange={() => {
              if (formTextareaElementId) {
                const el = document.getElementById(formTextareaElementId);
                if (el) growHeightOnInput(el as HTMLTextAreaElement);
              }
            }}
          />
        </div>
      )}
      <div style={{ width: "80%", marginBottom: "0.5em" }}>
        {selectElement}
      </div>
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
}: MedicineCommentCellProps) => {
  return (
    <div id={caseDetailsPopUpId} className={"case-details-pop-up-on-double-click comment-cell-component"}>
      <div className="case-details-select-pop-up-comment">
        <FormTextarea
          labelText="הערות:"
          height={"70px"}
          minHeight="70px"
          maxHeight={"150px"}
          minWidth="70%"
          maxLength={150}
          state={((caseDetailsList[caseDetailsDataIndex][index] as any)[type][medicineId] as any).comment}
          setState={(e: any) => {
            if (setCaseDetailsList) {
              setCaseDetailsList((prevState) => {
                const newState = [...prevState];
                ((newState[caseDetailsDataIndex][index] as any)[type][medicineId] as any).comment = e.target.value;
                return newState;
              });
            }
          }}
          afterChange={() => {
            if (formTextareaElementId) {
              const el = document.getElementById(formTextareaElementId);
              if (el) growHeightOnInput(el as HTMLTextAreaElement);
            }
          }}
        />
      </div>
    </div>
  );
};
