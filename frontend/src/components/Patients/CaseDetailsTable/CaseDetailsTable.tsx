import React, { useRef, useState } from "react";
import "./CaseDetailsTable.css";
import { API_ROUTES } from "../../../config/api-routes";
import { useCaseDetailsData } from "./useCaseDetailsData";
import {
  BooleanCellComponent,
  SelectCellComponent,
  MedicineCommentCellComponent,
} from "./CaseDetailsTableCells";
import {
  getBooleanValueText,
  getSelectValueText,
  getCheckboxesValuesAfterOptionsSelection,
  getRequiredIndexesByFrequency,
  getLatestVitals,
  isValueInRange,
} from "./CaseDetailsTable.utils";
import FormSelect from "../../../utils/FormSelect/FormSelect";
import FormInput from "../../../utils/FormInput/FormInput";
import FormTextarea, {
  growHeightOnInput,
} from "../../../utils/FormTextarea/FormTextarea";
import Modal from "../../../utils/Modal/Modal";
import MedicinePicker from "../../MedicinePicker/MedicinePicker";
import { MedicineSelectOptionObj } from "../../MedicinePicker/MedicinePicker.types";
import { FaPlus } from "react-icons/fa";
import FormCheckbox from "../../../utils/FormCheckbox/FormCheckbox";
import TableUnEditableCellElement from "./TableUnEditableCellElement";
import SelectOptionsPicker from "../../SelectOptionsPicker/SelectOptionsPicker";
import { SelectOptionsPickerOptionObj } from "../../SelectOptionsPicker/SelectOptionsPicker.types";

import type { CaseDetailsTableProps } from "./CaseDetailsTable.types";

export const DAILY_CASE_TABLE_COL_NUM = 14;

function CaseDetailsTable({
  handleCellClick,
  caseDetailsList,
  setCaseDetailsList,
  caseDetailsDataIndex,
  paintingMode,
  animalWeight,
  animalId,
}: CaseDetailsTableProps) {
  const {
    fecesTypes,
    urineTypes,
    medicines,
    fluids,
    fluidsExtras,
    animalVitals,
  } = useCaseDetailsData(animalId);

  const [medicineList, setMedicineList] = useState<MedicineSelectOptionObj[]>(
    [],
  );
  const [optionsList, setOptionsList] = useState<
    SelectOptionsPickerOptionObj[]
  >([]);
  const [showMedicineModal, setShowMedicineModal] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [optionsUrl, setOptionsUrl] = useState("");
  const [optionCellType, setOptionCellType] = useState("");
  const [selectedOptionsList, setSelectedOptionsList] = useState<
    SelectOptionsPickerOptionObj[]
  >([]);
  const [medicineCellType, setMedicineCellType] = useState("");
  const [selectedMedicinesList, setSelectedMedicinesList] = useState<
    MedicineSelectOptionObj[]
  >([]);

  const caseDetailsTableHeaderRef = useRef<HTMLDivElement>(null);

  const booleanCellComponent = (
    index: number,
    isComment: boolean,
    valName: string,
    commentValName?: string,
    formTextareaElementId?: string,
  ) => {
    return (
      <div
        className={
          "case-details-pop-up boolean-cell-component" +
          (isComment ? " boolean-cell-component-comment" : "")
        }
      >
        {isComment && (
          <div className="case-details-boolean-pop-up-comment">
            <FormTextarea
              labelText="הערות:"
              name={commentValName}
              height={"70px"}
              minHeight="70px"
              maxHeight={"150px"}
              minWidth="70%"
              maxLength={150}
              state={
                (caseDetailsList[caseDetailsDataIndex][index] as any)[
                  commentValName!!
                ]
              }
              setState={handleInputChange}
              setStateParams={{ index: index }}
              afterChange={() => {
                growHeightOnInput(
                  document.getElementById(
                    formTextareaElementId!!,
                  ) as HTMLTextAreaElement,
                );
              }}
            />
          </div>
        )}
        <div>
          <button
            className="case-details-boolean-pop-up-btn"
            onClick={(e) => {
              e.preventDefault();
              handleInputChange(undefined, { index: index }, true, valName);
            }}
          >
            כן
          </button>
          <button
            className="case-details-boolean-pop-up-btn"
            onClick={(e) => {
              e.preventDefault();
              handleInputChange(undefined, { index: index }, false, valName);
            }}
          >
            לא
          </button>
        </div>
      </div>
    );
  };

  const selectCellComponent = (
    index: number,
    isComment: boolean,
    selectElement: any,
    commentValName?: string,
    formTextareaElementId?: string,
  ) => {
    return (
      <div
        className={
          "case-details-pop-up select-cell-component" +
          (isComment ? " select-cell-component-comment" : "")
        }
      >
        {isComment && (
          <div className="case-details-select-pop-up-comment">
            <FormTextarea
              labelText="הערות:"
              name={commentValName}
              height={"70px"}
              minHeight="70px"
              maxHeight={"150px"}
              minWidth="70%"
              maxLength={150}
              state={
                (caseDetailsList[caseDetailsDataIndex][index] as any)[
                  commentValName!!
                ]
              }
              setState={handleInputChange}
              setStateParams={{ index: index }}
              afterChange={() => {
                growHeightOnInput(
                  document.getElementById(
                    formTextareaElementId!!,
                  ) as HTMLTextAreaElement,
                );
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

  const medicineCommentCellComponent = (
    caseDetailsDataIndex: number,
    i: number,
    medicineId: number,
    type: any,
    caseDetailsPopUpId: string,
    formTextareaElementId?: string,
  ) => {
    return (
      <div
        id={caseDetailsPopUpId}
        className={"case-details-pop-up-on-double-click comment-cell-component"}
      >
        <div className="case-details-select-pop-up-comment">
          <FormTextarea
            labelText="הערות:"
            height={"70px"}
            minHeight="70px"
            maxHeight={"150px"}
            minWidth="70%"
            maxLength={150}
            state={
              (
                (caseDetailsList[caseDetailsDataIndex][i] as any)[type][
                  medicineId
                ] as any
              ).comment
            }
            setState={(e: any) =>
              setCaseDetailsList((prevState) => {
                const newState = [...prevState];
                (
                  (newState[caseDetailsDataIndex][i] as any)[type][
                    medicineId
                  ] as any
                ).comment = e.target.value;
                return newState;
              })
            }
            afterChange={() => {
              growHeightOnInput(
                document.getElementById(
                  formTextareaElementId!!,
                ) as HTMLTextAreaElement,
              );
            }}
          />
        </div>
      </div>
    );
  };

  const handleInputChange = (
    e?: React.ChangeEvent<HTMLInputElement>,
    setStateParams?: any,
    value?: any,
    valName?: string,
  ) => {
    const arrayCopy = [...caseDetailsList[caseDetailsDataIndex]];
    (arrayCopy[setStateParams.index] as any)[e ? e.target.name : valName!!] =
      value !== undefined ? value : e?.target.value;
    setCaseDetailsList((prevState) => {
      return [
        ...prevState.slice(0, caseDetailsDataIndex),
        arrayCopy,
        ...prevState.slice(caseDetailsDataIndex + 1),
      ];
    });
  };

  let latestVitals = getLatestVitals(caseDetailsList);
  let latestTempData = latestVitals.T;
  let latestPulseData = latestVitals.P;
  let latestRespirationData = latestVitals.R;

  return (
    <div className="case-details-table">
      <div
        ref={caseDetailsTableHeaderRef}
        className="case-details-table-header"
      >
        {Array.from({ length: DAILY_CASE_TABLE_COL_NUM }, (_, i) => {
          if (i === 0) {
            return (
              <div
                key={i}
                className={`case-details-table-header-cell case-details-table-header-cell-title`}
              >
                <FormSelect
                  elements={Array.from(
                    { length: DAILY_CASE_TABLE_COL_NUM - 1 },
                    (_, i) => {
                      const hour24Format = ((i + 4) * 2) % 24;
                      return {
                        value: hour24Format + "",
                        text: hour24Format + ":00",
                      };
                    },
                  )}
                  selectId={"table-hour-select"}
                  afterSelect={(value) => {
                    const tableColHeaders =
                      caseDetailsTableHeaderRef.current?.getElementsByClassName(
                        "case-details-table-header-cell",
                      );
                    if (tableColHeaders) {
                      let hourValue = parseInt(value);
                      for (let i = 1; i < tableColHeaders.length; i++) {
                        const hour12HourFormat = hourValue % 24;
                        tableColHeaders[i].textContent =
                          hour12HourFormat + ":00";
                        caseDetailsList[caseDetailsDataIndex][i].time =
                          hour12HourFormat < 10
                            ? `0${hour12HourFormat}:00:00`
                            : hour12HourFormat + ":00:00";
                        hourValue += 2;
                      }
                    }
                  }}
                  width="100%"
                  isRequired={true}
                  isOrdered={false}
                />
              </div>
            );
          } else {
            return (
              <div
                key={i}
                className="case-details-table-header-cell"
                style={{ paddingTop: "1em" }}
              >
                {caseDetailsList[caseDetailsDataIndex][1].id === -1
                  ? ""
                  : caseDetailsList[caseDetailsDataIndex][i].time.split(
                      ":",
                    )[0] +
                    ":" +
                    caseDetailsList[caseDetailsDataIndex][i].time.split(":")[1]}
              </div>
            );
          }
        })}
      </div>
      <div className="case-details-table-body">
        <div className="case-details-table-body-row">
          {Array.from({ length: DAILY_CASE_TABLE_COL_NUM }, (_, i) => {
            if (i === 0)
              return (
                <div
                  key={i}
                  className="case-details-table-body-row-cell case-details-table-body-row-cell-title"
                >
                  הערות
                </div>
              );
            else
              return (
                <div
                  key={i}
                  className={`case-details-table-body-row-cell ${
                    caseDetailsList[caseDetailsDataIndex][i]
                      .comments_is_required
                      ? "required-cell"
                      : ""
                  }`}
                  onClick={(e) =>
                    handleCellClick(
                      e,
                      caseDetailsList[caseDetailsDataIndex][i]
                        .comments_is_editable,
                    ).then((val) => {
                      if (val !== null) {
                        setCaseDetailsList((prevState) => {
                          const newState = [...prevState];
                          if (paintingMode)
                            newState[caseDetailsDataIndex][
                              i
                            ].comments_is_required = val;
                          else
                            newState[caseDetailsDataIndex][
                              i
                            ].comments_is_editable = val;
                          return newState;
                        });
                      }
                    })
                  }
                >
                  {!caseDetailsList[caseDetailsDataIndex][i]
                    .comments_is_editable && <TableUnEditableCellElement />}
                  <FormTextarea
                    id={"comments" + (i + 1)}
                    name="comments"
                    minHeight="20px"
                    maxHeight="100px"
                    width="100%"
                    minWidth="60%"
                    maxLength={250}
                    isGrowHeightOnInput={true}
                    state={
                      caseDetailsList[caseDetailsDataIndex][i].comments || ""
                    }
                    setState={handleInputChange}
                    setStateParams={{ index: i }}
                  />
                </div>
              );
          })}
        </div>
        <div className="case-details-table-body-row">
          {Array.from({ length: DAILY_CASE_TABLE_COL_NUM }, (_, i) => {
            if (i === 0)
              return (
                <div
                  key={i}
                  className="case-details-table-body-row-cell case-details-table-body-row-cell-title"
                >
                  T
                </div>
              );
            else
              return (
                <div
                  key={i}
                  className={`case-details-table-body-row-cell ${
                    caseDetailsList[caseDetailsDataIndex][i].T_is_required ||
                    (!isValueInRange(
                      latestTempData.value,
                      animalVitals.tempRangeMin,
                      animalVitals.tempRangeMax,
                    ) &&
                      latestTempData.colIndex === i &&
                      caseDetailsDataIndex === latestTempData.dataDetailsIndex)
                      ? "required-cell"
                      : ""
                  }`}
                  onClick={(e) =>
                    handleCellClick(
                      e,
                      caseDetailsList[caseDetailsDataIndex][i].T_is_editable,
                    ).then((val) => {
                      if (val !== null) {
                        setCaseDetailsList((prevState) => {
                          const newState = [...prevState];
                          if (paintingMode)
                            newState[caseDetailsDataIndex][i].T_is_required =
                              val;
                          else
                            newState[caseDetailsDataIndex][i].T_is_editable =
                              val;
                          return newState;
                        });
                      }
                    })
                  }
                >
                  {!caseDetailsList[caseDetailsDataIndex][i].T_is_editable && (
                    <TableUnEditableCellElement />
                  )}
                  <FormInput
                    name="T"
                    type="number"
                    width="100%"
                    min={0}
                    state={caseDetailsList[caseDetailsDataIndex][i].T || ""}
                    setState={handleInputChange}
                    setStateParams={{ index: i }}
                  />
                </div>
              );
          })}
        </div>
        <div className="case-details-table-body-row">
          {Array.from({ length: DAILY_CASE_TABLE_COL_NUM }, (_, i) => {
            if (i === 0)
              return (
                <div
                  key={i}
                  className="case-details-table-body-row-cell case-details-table-body-row-cell-title"
                >
                  P
                </div>
              );
            else
              return (
                <div
                  key={i}
                  className={`case-details-table-body-row-cell ${
                    caseDetailsList[caseDetailsDataIndex][i].P_is_required ||
                    (!isValueInRange(
                      latestPulseData.value,
                      animalVitals.pulseRangeMin,
                      animalVitals.pulseRangeMax,
                    ) &&
                      latestPulseData.colIndex === i &&
                      caseDetailsDataIndex === latestPulseData.dataDetailsIndex)
                      ? "required-cell"
                      : ""
                  }`}
                  onClick={(e) =>
                    handleCellClick(
                      e,
                      caseDetailsList[caseDetailsDataIndex][i].P_is_editable,
                    ).then((val) => {
                      if (val !== null) {
                        setCaseDetailsList((prevState) => {
                          const newState = [...prevState];
                          if (paintingMode)
                            newState[caseDetailsDataIndex][i].P_is_required =
                              val;
                          else
                            newState[caseDetailsDataIndex][i].P_is_editable =
                              val;
                          return newState;
                        });
                      }
                    })
                  }
                >
                  {!caseDetailsList[caseDetailsDataIndex][i].P_is_editable && (
                    <TableUnEditableCellElement />
                  )}
                  <FormInput
                    name="P"
                    type="number"
                    width="100%"
                    min={0}
                    state={caseDetailsList[caseDetailsDataIndex][i].P || ""}
                    setState={handleInputChange}
                    setStateParams={{ index: i }}
                  />
                </div>
              );
          })}
        </div>
        <div className="case-details-table-body-row">
          {Array.from({ length: DAILY_CASE_TABLE_COL_NUM }, (_, i) => {
            if (i === 0)
              return (
                <div
                  key={i}
                  className="case-details-table-body-row-cell case-details-table-body-row-cell-title"
                >
                  R
                </div>
              );
            else
              return (
                <div
                  key={i}
                  className={`case-details-table-body-row-cell ${
                    caseDetailsList[caseDetailsDataIndex][i].R_is_required ||
                    (!isValueInRange(
                      latestRespirationData.value,
                      animalVitals.respirationRangeMin,
                      animalVitals.respirationRangeMax,
                    ) &&
                      latestRespirationData.colIndex === i &&
                      caseDetailsDataIndex ===
                        latestRespirationData.dataDetailsIndex)
                      ? "required-cell"
                      : ""
                  }`}
                  onClick={(e) =>
                    handleCellClick(
                      e,
                      caseDetailsList[caseDetailsDataIndex][i].R_is_editable,
                    ).then((val) => {
                      if (val !== null) {
                        setCaseDetailsList((prevState) => {
                          const newState = [...prevState];
                          if (paintingMode)
                            newState[caseDetailsDataIndex][i].R_is_required =
                              val;
                          else
                            newState[caseDetailsDataIndex][i].R_is_editable =
                              val;
                          return newState;
                        });
                      }
                    })
                  }
                >
                  {!caseDetailsList[caseDetailsDataIndex][i].R_is_editable && (
                    <TableUnEditableCellElement />
                  )}
                  <FormInput
                    name="R"
                    type="number"
                    width="100%"
                    min={0}
                    state={caseDetailsList[caseDetailsDataIndex][i].R || ""}
                    setState={handleInputChange}
                    setStateParams={{ index: i }}
                  />
                </div>
              );
          })}
        </div>
        <div className="case-details-table-body-row">
          {Array.from({ length: DAILY_CASE_TABLE_COL_NUM }, (_, i) => {
            if (i === 0)
              return (
                <div
                  key={i}
                  className="case-details-table-body-row-cell case-details-table-body-row-cell-title case-details-table-body-row-cell-title-clickable"
                >
                  <button
                    className="btn btn-icon-only btn-active"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowMedicineModal(true);
                      setMedicineCellType("fluids");
                      setSelectedMedicinesList(
                        caseDetailsList[caseDetailsDataIndex][0]?.fluids,
                      );
                      setMedicineList([...fluids, ...fluidsExtras]);
                    }}
                  >
                    <FaPlus />
                  </button>
                  נוזלים
                </div>
              );
            else
              return (
                <div
                  key={i}
                  className="case-details-table-body-row-cell case-details-table-body-row-empty-cell"
                ></div>
              );
          })}
        </div>
        {caseDetailsList[caseDetailsDataIndex][0]?.fluids.map((_, i) => {
          return (
            <div className="case-details-table-body-row" key={i}>
              {Array.from({ length: DAILY_CASE_TABLE_COL_NUM }, (_, j) => {
                if (j === 0) {
                  const fluid =
                    caseDetailsList[caseDetailsDataIndex][0]?.fluids[i];
                  return (
                    <div
                      key={j}
                      className="case-details-table-body-row-cell case-details-table-body-row-cell-title"
                    >
                      <span className="selected-medicine-name table-selected-medicine-name">
                        {fluid.text}
                      </span>
                      {` ${fluid.doseAmount}${fluid.measureUnitText} ${fluid.frequencyText} ${fluid.medicineRouteText}`}
                    </div>
                  );
                } else {
                  const fluidId = parseInt(
                    caseDetailsList[caseDetailsDataIndex][0]?.fluids[i]?.value,
                  );
                  const fluidItem = caseDetailsList[caseDetailsDataIndex][j]
                    .fluids[fluidId] as any;

                  return (
                    <div
                      key={j}
                      className={`case-details-table-body-row-cell ${
                        fluidItem?.isEditable &&
                        "case-details-pop-up-on-double-click-parent"
                      } ${
                        fluidItem?.isRequired || false ? "required-cell" : ""
                      }`}
                      onClick={(e) =>
                        handleCellClick(e, fluidItem?.isEditable).then(
                          (val: boolean | null) => {
                            if (val !== null) {
                              setCaseDetailsList((prevState) => {
                                const newState = [...prevState];
                                const frequencyText = newState[
                                  caseDetailsDataIndex
                                ][0].fluids.filter(
                                  (med: any) => med.value === fluidId,
                                )[0]?.frequencyText;
                                const requiredIndexes = val
                                  ? getRequiredIndexesByFrequency(
                                      frequencyText,
                                      j,
                                    )
                                  : [j];

                                // For fluids we will mark the whole column together
                                if (paintingMode) {
                                  for (let colIndex of requiredIndexes) {
                                    const fluids =
                                      newState[caseDetailsDataIndex][colIndex]
                                        .fluids;
                                    for (const key in fluids) {
                                      (fluids[key as any] as any).isRequired =
                                        val;
                                    }
                                  }
                                } else {
                                  const fluids =
                                    newState[caseDetailsDataIndex][j].fluids;
                                  for (const key in fluids) {
                                    (fluids[key as any] as any).isEditable =
                                      val;
                                  }
                                }
                                return newState;
                              });
                            }
                          },
                        )
                      }
                      onDoubleClick={() => {
                        if (fluidItem?.isEditable) {
                          const popupElement = document.getElementById(
                            `pop-up-fluid-comment-textarea-${i}-${j}`,
                          );
                          if (popupElement) {
                            popupElement.style.display = "flex";
                            popupElement.style.opacity = "1";

                            document.addEventListener("click", (event: any) => {
                              if (
                                !popupElement.contains(event.target) &&
                                !popupElement.contains(event.target)
                              ) {
                                popupElement.style.display = "none"; // Hide the div if clicked outside
                              }
                            });
                          }
                        }
                      }}
                    >
                      <MedicineCommentCellComponent
                        isComment={true}
                        caseDetailsDataIndex={caseDetailsDataIndex}
                        index={j}
                        medicineId={fluidId}
                        type="fluids"
                        caseDetailsPopUpId={`pop-up-fluid-comment-textarea-${i}-${j}`}
                        formTextareaElementId={`fluid-comment-textarea-${i}`}
                        caseDetailsList={caseDetailsList}
                        setCaseDetailsList={setCaseDetailsList}
                      />
                      {!fluidItem?.isEditable && <TableUnEditableCellElement />}
                      <FormCheckbox
                        checked={fluidItem?.isGiven || false}
                        setChecked={(isChecked: any) => {
                          setCaseDetailsList((prevState) => {
                            const newState = [...prevState];

                            if (isChecked) {
                              // Marks the whole fluids column
                              const fluids =
                                newState[caseDetailsDataIndex][j].fluids;
                              for (const key in fluids) {
                                (fluids[key as any] as any).isGiven = isChecked;
                              }
                            } else {
                              // Un mark only the selected fluid
                              (
                                newState[caseDetailsDataIndex][j].fluids[
                                  fluidId
                                ] as any
                              ).isGiven = isChecked;
                            }

                            return newState;
                          });
                        }}
                      />
                      {fluidItem?.comment && (
                        <FormTextarea
                          id={`fluid-comment-textarea-${i}`}
                          state={fluidItem?.comment || ""}
                          name="fluidComment"
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
                }
              })}
            </div>
          );
        })}
        <div className="case-details-table-body-row">
          {Array.from({ length: DAILY_CASE_TABLE_COL_NUM }, (_, i) => {
            if (i === 0)
              return (
                <div
                  key={i}
                  className="case-details-table-body-row-cell case-details-table-body-row-cell-title case-details-table-body-row-cell-title-clickable"
                >
                  <button
                    className="btn btn-icon-only btn-active"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowMedicineModal(true);
                      setMedicineCellType("medicines");
                      setSelectedMedicinesList(
                        caseDetailsList[caseDetailsDataIndex][0]?.medicines,
                      );
                      setMedicineList(medicines);
                    }}
                  >
                    <FaPlus />
                  </button>
                  תרופות
                </div>
              );
            else
              return (
                <div
                  key={i}
                  className="case-details-table-body-row-cell case-details-table-body-row-empty-cell"
                ></div>
              );
          })}
        </div>
        {caseDetailsList[caseDetailsDataIndex][0]?.medicines.map((_, i) => {
          return (
            <div className="case-details-table-body-row" key={i}>
              {Array.from({ length: DAILY_CASE_TABLE_COL_NUM }, (_, j) => {
                if (j === 0) {
                  const medicine =
                    caseDetailsList[caseDetailsDataIndex][0]?.medicines[i];
                  return (
                    <div
                      key={j}
                      className="case-details-table-body-row-cell case-details-table-body-row-cell-title"
                    >
                      <span className="selected-medicine-name table-selected-medicine-name">
                        {medicine.text}
                      </span>
                      {` ${medicine.doseAmount}${medicine.measureUnitText} ${medicine.frequencyText} ${medicine.medicineRouteText}`}
                    </div>
                  );
                } else {
                  const medicineId = parseInt(
                    caseDetailsList[caseDetailsDataIndex][0]?.medicines[i]
                      ?.value,
                  );
                  const medicineItem = caseDetailsList[caseDetailsDataIndex][j]
                    .medicines[medicineId] as any;

                  return (
                    <div
                      key={j}
                      className={`case-details-table-body-row-cell ${
                        medicineItem?.isEditable &&
                        "case-details-pop-up-on-double-click-parent"
                      } ${
                        medicineItem?.isRequired || false ? "required-cell" : ""
                      }`}
                      onClick={(e) =>
                        handleCellClick(e, medicineItem?.isEditable).then(
                          (val: boolean | null) => {
                            if (val !== null) {
                              setCaseDetailsList((prevState) => {
                                const newState = [...prevState];
                                const frequencyText = newState[
                                  caseDetailsDataIndex
                                ][0].medicines.filter(
                                  (med: any) => med.value === medicineId,
                                )[0]?.frequencyText;

                                const requiredIndexes = val
                                  ? getRequiredIndexesByFrequency(
                                      frequencyText,
                                      j,
                                    )
                                  : [j];

                                if (paintingMode) {
                                  for (let colIndex of requiredIndexes) {
                                    (
                                      newState[caseDetailsDataIndex][colIndex]
                                        .medicines[medicineId] as any
                                    ).isRequired = val;
                                  }
                                } else {
                                  (
                                    newState[caseDetailsDataIndex][j].medicines[
                                      medicineId
                                    ] as any
                                  ).isEditable = val;
                                }
                                return newState;
                              });
                            }
                          },
                        )
                      }
                      onDoubleClick={() => {
                        if (medicineItem?.isEditable) {
                          const popupElement = document.getElementById(
                            `pop-up-medicine-comment-textarea-${i}-${j}`,
                          );
                          if (popupElement) {
                            popupElement.style.display = "flex";
                            popupElement.style.opacity = "1";

                            document.addEventListener("click", (event: any) => {
                              if (
                                !popupElement.contains(event.target) &&
                                !popupElement.contains(event.target)
                              ) {
                                popupElement.style.display = "none"; // Hide the div if clicked outside
                              }
                            });
                          }
                        }
                      }}
                    >
                      <MedicineCommentCellComponent
                        isComment={true}
                        caseDetailsDataIndex={caseDetailsDataIndex}
                        index={j}
                        medicineId={medicineId}
                        type="medicines"
                        caseDetailsPopUpId={`pop-up-medicine-comment-textarea-${i}-${j}`}
                        formTextareaElementId={`medicine-comment-textarea-${i}`}
                        caseDetailsList={caseDetailsList}
                        setCaseDetailsList={setCaseDetailsList}
                      />
                      {!medicineItem?.isEditable && (
                        <TableUnEditableCellElement />
                      )}
                      <FormCheckbox
                        checked={medicineItem?.isGiven || false}
                        setChecked={(isChecked: any) => {
                          setCaseDetailsList((prevState) => {
                            const newState = [...prevState];
                            (
                              newState[caseDetailsDataIndex][j].medicines[
                                medicineId
                              ] as any
                            ).isGiven = isChecked;
                            return newState;
                          });
                        }}
                      />
                      {medicineItem?.comment && (
                        <FormTextarea
                          id={`medicine-comment-textarea-${i}`}
                          state={medicineItem?.comment || ""}
                          name="fluidComment"
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
                }
              })}
            </div>
          );
        })}
        <div className="case-details-table-body-row">
          {Array.from({ length: DAILY_CASE_TABLE_COL_NUM }, (_, i) => {
            if (i === 0)
              return (
                <div
                  key={i}
                  className="case-details-table-body-row-cell case-details-table-body-row-cell-title case-details-table-body-row-cell-title-clickable"
                >
                  <button
                    className="btn btn-icon-only btn-active"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowOptionsModal(true);
                      setOptionCellType("examinations");
                      setSelectedOptionsList(
                        caseDetailsList[caseDetailsDataIndex][0]?.examinations,
                      );
                      setOptionsUrl(
                        API_ROUTES.admin.types.getActive("examination_types"),
                      );
                    }}
                  >
                    <FaPlus />
                  </button>
                  בדיקות
                </div>
              );
            else
              return (
                <div
                  key={i}
                  className="case-details-table-body-row-cell case-details-table-body-row-empty-cell"
                ></div>
              );
          })}
        </div>
        {caseDetailsList[caseDetailsDataIndex][0]?.examinations.map((_, i) => {
          return (
            <div className="case-details-table-body-row" key={i}>
              {Array.from({ length: DAILY_CASE_TABLE_COL_NUM }, (_, j) => {
                if (j === 0) {
                  const examination =
                    caseDetailsList[caseDetailsDataIndex][0]?.examinations[i];
                  return (
                    <div
                      key={j}
                      className="case-details-table-body-row-cell case-details-table-body-row-cell-title"
                    >
                      {`${examination?.text}`}
                    </div>
                  );
                } else {
                  const examinationId = parseInt(
                    caseDetailsList[caseDetailsDataIndex][0]?.examinations[i]
                      ?.value,
                  );

                  return (
                    <div
                      key={j}
                      className={`case-details-table-body-row-cell case-details-pop-up-parent ${
                        (
                          caseDetailsList[caseDetailsDataIndex][j].examinations[
                            examinationId
                          ] as any
                        )?.isRequired || false
                          ? "required-cell"
                          : ""
                      }`}
                      onClick={(e) =>
                        handleCellClick(
                          e,
                          (
                            caseDetailsList[caseDetailsDataIndex][j]
                              .examinations[examinationId] as any
                          )?.isEditable,
                        ).then((val) => {
                          if (val !== null) {
                            setCaseDetailsList((prevState) => {
                              const newState = [...prevState];
                              if (paintingMode)
                                (
                                  newState[caseDetailsDataIndex][j]
                                    .examinations[examinationId] as any
                                ).isRequired = val;
                              else
                                (
                                  newState[caseDetailsDataIndex][j]
                                    .examinations[examinationId] as any
                                ).isEditable = val;
                              return newState;
                            });
                          }
                        })
                      }
                    >
                      {!(
                        caseDetailsList[caseDetailsDataIndex][j].examinations[
                          examinationId
                        ] as any
                      )?.isEditable && <TableUnEditableCellElement />}
                      <FormTextarea
                        id={"examination_" + examinationId + "_" + (i + 1)}
                        minHeight="20px"
                        maxHeight="100px"
                        width="100%"
                        minWidth="60%"
                        maxLength={250}
                        isGrowHeightOnInput={true}
                        state={
                          (
                            caseDetailsList[caseDetailsDataIndex][j]
                              .examinations[examinationId] as any
                          )?.value || ""
                        }
                        setState={(e: any) => {
                          const val = e.target.value;
                          setCaseDetailsList((prevState) => {
                            const newState = [...prevState];
                            (
                              newState[caseDetailsDataIndex][j].examinations[
                                examinationId
                              ] as any
                            ).value = val;
                            return newState;
                          });
                        }}
                        setStateParams={{ index: i }}
                      />
                    </div>
                  );
                }
              })}
            </div>
          );
        })}
        <div className="case-details-table-body-row">
          {Array.from({ length: DAILY_CASE_TABLE_COL_NUM }, (_, i) => {
            if (i === 0)
              return (
                <div
                  key={i}
                  className="case-details-table-body-row-cell case-details-table-body-row-cell-title case-details-table-body-row-cell-title-clickable"
                >
                  <button
                    className="btn btn-icon-only btn-active"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowOptionsModal(true);
                      setOptionCellType("procedures");
                      setSelectedOptionsList(
                        caseDetailsList[caseDetailsDataIndex][0]?.procedures,
                      );
                      setOptionsUrl(
                        API_ROUTES.admin.types.getActive("procedure_types"),
                      );
                    }}
                  >
                    <FaPlus />
                  </button>
                  פרוצדורות
                </div>
              );
            else
              return (
                <div
                  key={i}
                  className="case-details-table-body-row-cell case-details-table-body-row-empty-cell"
                ></div>
              );
          })}
        </div>
        {caseDetailsList[caseDetailsDataIndex][0]?.procedures.map((_, i) => {
          return (
            <div className="case-details-table-body-row" key={i}>
              {Array.from({ length: DAILY_CASE_TABLE_COL_NUM }, (_, j) => {
                if (j === 0) {
                  const procedure =
                    caseDetailsList[caseDetailsDataIndex][0]?.procedures[i];
                  return (
                    <div
                      key={j}
                      className="case-details-table-body-row-cell case-details-table-body-row-cell-title"
                    >
                      {`${procedure?.text}`}
                    </div>
                  );
                } else {
                  const procedureId = parseInt(
                    caseDetailsList[caseDetailsDataIndex][0]?.procedures[i]
                      ?.value,
                  );

                  return (
                    <div
                      key={j}
                      className={`case-details-table-body-row-cell case-details-pop-up-parent ${
                        (
                          caseDetailsList[caseDetailsDataIndex][j].procedures[
                            procedureId
                          ] as any
                        )?.isRequired || false
                          ? "required-cell"
                          : ""
                      }`}
                      onClick={(e) =>
                        handleCellClick(
                          e,
                          (
                            caseDetailsList[caseDetailsDataIndex][j].procedures[
                              procedureId
                            ] as any
                          )?.isEditable,
                        ).then((val) => {
                          if (val !== null) {
                            setCaseDetailsList((prevState) => {
                              const newState = [...prevState];
                              if (paintingMode)
                                (
                                  newState[caseDetailsDataIndex][j].procedures[
                                    procedureId
                                  ] as any
                                ).isRequired = val;
                              else
                                (
                                  newState[caseDetailsDataIndex][j].procedures[
                                    procedureId
                                  ] as any
                                ).isEditable = val;
                              return newState;
                            });
                          }
                        })
                      }
                    >
                      {!(
                        caseDetailsList[caseDetailsDataIndex][j].procedures[
                          procedureId
                        ] as any
                      )?.isEditable && <TableUnEditableCellElement />}
                      <FormCheckbox
                        checked={
                          (
                            caseDetailsList[caseDetailsDataIndex][j].procedures[
                              procedureId
                            ] as any
                          )?.isGiven || false
                        }
                        setChecked={(isChecked: any) => {
                          setCaseDetailsList((prevState) => {
                            const newState = [...prevState];
                            (
                              newState[caseDetailsDataIndex][j].procedures[
                                procedureId
                              ] as any
                            ).isGiven = isChecked;
                            return newState;
                          });
                        }}
                      />
                    </div>
                  );
                }
              })}
            </div>
          );
        })}
        <div className="case-details-table-body-row">
          {Array.from({ length: DAILY_CASE_TABLE_COL_NUM }, (_, i) => {
            if (i === 0)
              return (
                <div
                  key={i}
                  className="case-details-table-body-row-cell case-details-table-body-row-cell-title case-details-table-body-row-cell-title-clickable"
                >
                  <button
                    className="btn btn-icon-only btn-active"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowOptionsModal(true);
                      setOptionCellType("foodExtras");
                      setSelectedOptionsList(
                        caseDetailsList[caseDetailsDataIndex][0]?.foodExtras,
                      );
                      setOptionsUrl(
                        API_ROUTES.admin.types.getActive("food_extra_types"),
                      );
                    }}
                  >
                    <FaPlus />
                  </button>
                  תוספות לאוכל
                </div>
              );
            else
              return (
                <div
                  key={i}
                  className="case-details-table-body-row-cell case-details-table-body-row-empty-cell"
                ></div>
              );
          })}
        </div>
        {caseDetailsList[caseDetailsDataIndex][0]?.foodExtras.map((_, i) => {
          return (
            <div className="case-details-table-body-row" key={i}>
              {Array.from({ length: DAILY_CASE_TABLE_COL_NUM }, (_, j) => {
                if (j === 0) {
                  const foodExtra =
                    caseDetailsList[caseDetailsDataIndex][0]?.foodExtras[i];
                  return (
                    <div
                      key={j}
                      className="case-details-table-body-row-cell case-details-table-body-row-cell-title"
                    >
                      {`${foodExtra?.text}`}
                    </div>
                  );
                } else {
                  const foodExtraId = parseInt(
                    caseDetailsList[caseDetailsDataIndex][0]?.foodExtras[i]
                      ?.value,
                  );

                  return (
                    <div
                      key={j}
                      className={`case-details-table-body-row-cell case-details-pop-up-parent ${
                        (
                          caseDetailsList[caseDetailsDataIndex][j].foodExtras[
                            foodExtraId
                          ] as any
                        )?.isRequired || false
                          ? "required-cell"
                          : ""
                      }`}
                      onClick={(e) =>
                        handleCellClick(
                          e,
                          (
                            caseDetailsList[caseDetailsDataIndex][j].foodExtras[
                              foodExtraId
                            ] as any
                          )?.isEditable,
                        ).then((val) => {
                          if (val !== null) {
                            setCaseDetailsList((prevState) => {
                              const newState = [...prevState];
                              if (paintingMode)
                                (
                                  newState[caseDetailsDataIndex][j].foodExtras[
                                    foodExtraId
                                  ] as any
                                ).isRequired = val;
                              else
                                (
                                  newState[caseDetailsDataIndex][j].foodExtras[
                                    foodExtraId
                                  ] as any
                                ).isEditable = val;
                              return newState;
                            });
                          }
                        })
                      }
                    >
                      {!(
                        caseDetailsList[caseDetailsDataIndex][j].foodExtras[
                          foodExtraId
                        ] as any
                      )?.isEditable && <TableUnEditableCellElement />}
                      <FormCheckbox
                        checked={
                          (
                            caseDetailsList[caseDetailsDataIndex][j].foodExtras[
                              foodExtraId
                            ] as any
                          )?.isGiven || false
                        }
                        setChecked={(isChecked: any) => {
                          setCaseDetailsList((prevState) => {
                            const newState = [...prevState];
                            (
                              newState[caseDetailsDataIndex][j].foodExtras[
                                foodExtraId
                              ] as any
                            ).isGiven = isChecked;
                            return newState;
                          });
                        }}
                      />
                    </div>
                  );
                }
              })}
            </div>
          );
        })}
        <div className="case-details-table-body-row">
          {Array.from({ length: DAILY_CASE_TABLE_COL_NUM }, (_, i) => {
            if (i === 0)
              return (
                <div
                  key={i}
                  className="case-details-table-body-row-cell case-details-table-body-row-cell-title"
                >
                  אוכל + מים
                </div>
              );
            else
              return (
                <div
                  key={i}
                  className={`case-details-table-body-row-cell ${
                    caseDetailsList[caseDetailsDataIndex][i]
                      .foodAndWater_is_required
                      ? "required-cell"
                      : ""
                  }`}
                  onClick={(e) =>
                    handleCellClick(
                      e,
                      caseDetailsList[caseDetailsDataIndex][i]
                        .foodAndWater_is_editable,
                    ).then((val) => {
                      if (val !== null) {
                        setCaseDetailsList((prevState) => {
                          const newState = [...prevState];
                          if (paintingMode)
                            newState[caseDetailsDataIndex][
                              i
                            ].foodAndWater_is_required = val;
                          else
                            newState[caseDetailsDataIndex][
                              i
                            ].foodAndWater_is_editable = val;
                          return newState;
                        });
                      }
                    })
                  }
                >
                  {!caseDetailsList[caseDetailsDataIndex][i]
                    .foodAndWater_is_editable && <TableUnEditableCellElement />}
                  <FormTextarea
                    id={"food-and-water" + (i + 1)}
                    name="foodAndWater"
                    minHeight="20px"
                    maxHeight="100px"
                    width="100%"
                    minWidth="60%"
                    maxLength={250}
                    isGrowHeightOnInput={true}
                    state={
                      caseDetailsList[caseDetailsDataIndex][i].foodAndWater ||
                      ""
                    }
                    setState={handleInputChange}
                    setStateParams={{ index: i }}
                  />
                </div>
              );
          })}
        </div>
        <div className="case-details-table-body-row">
          {Array.from({ length: DAILY_CASE_TABLE_COL_NUM }, (_, i) => {
            if (i === 0)
              return (
                <div
                  key={i}
                  className="case-details-table-body-row-cell case-details-table-body-row-cell-title"
                >
                  שתן
                </div>
              );
            else
              return (
                <div
                  key={i}
                  className={`case-details-table-body-row-cell ${
                    caseDetailsList[caseDetailsDataIndex][i]
                      .urine_is_editable && "case-details-pop-up-parent"
                  } ${
                    caseDetailsList[caseDetailsDataIndex][i].urine_is_required
                      ? "required-cell"
                      : ""
                  }`}
                  onClick={(e) =>
                    handleCellClick(
                      e,
                      caseDetailsList[caseDetailsDataIndex][i]
                        .urine_is_editable,
                    ).then((val) => {
                      if (val !== null) {
                        setCaseDetailsList((prevState) => {
                          const newState = [...prevState];
                          if (paintingMode)
                            newState[caseDetailsDataIndex][
                              i
                            ].urine_is_required = val;
                          else
                            newState[caseDetailsDataIndex][
                              i
                            ].urine_is_editable = val;
                          return newState;
                        });
                      }
                    })
                  }
                >
                  {!caseDetailsList[caseDetailsDataIndex][i]
                    .urine_is_editable && <TableUnEditableCellElement />}
                  <SelectCellComponent
                    index={i}
                    isComment={true}
                    selectElement={
                      <FormSelect
                        elements={urineTypes}
                        optionState={
                          caseDetailsList[caseDetailsDataIndex][
                            i
                          ].urineTypeId?.toString() || ""
                        }
                        afterSelect={(value, textValue) => {
                          handleInputChange(
                            undefined,
                            { index: i },
                            value,
                            "urineTypeId",
                          );
                          handleInputChange(
                            undefined,
                            { index: i },
                            textValue,
                            "urineTypeText",
                          );
                        }}
                        selectId={"new-patient-select-urine-type-" + i}
                        width="100%"
                      />
                    }
                    commentValName="urineComments"
                    formTextareaElementId={`urine-textarea-${i}`}
                    caseDetailsList={caseDetailsList}
                    caseDetailsDataIndex={caseDetailsDataIndex}
                    handleInputChange={handleInputChange}
                  />
                  <FormTextarea
                    id={`urine-textarea-${i}`}
                    state={
                      getSelectValueText(
                        caseDetailsList[caseDetailsDataIndex][i].urineTypeText,
                        caseDetailsList[caseDetailsDataIndex][i].urineComments,
                      ) || ""
                    }
                    name="urineComments"
                    height={"20px"}
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
        <div className="case-details-table-body-row">
          {Array.from({ length: DAILY_CASE_TABLE_COL_NUM }, (_, i) => {
            if (i === 0)
              return (
                <div
                  key={i}
                  className="case-details-table-body-row-cell case-details-table-body-row-cell-title"
                >
                  צואה
                </div>
              );
            else
              return (
                <div
                  key={i}
                  className={`case-details-table-body-row-cell ${
                    caseDetailsList[caseDetailsDataIndex][i]
                      .feces_is_editable && "case-details-pop-up-parent"
                  } ${
                    caseDetailsList[caseDetailsDataIndex][i].feces_is_required
                      ? "required-cell"
                      : ""
                  }`}
                  onClick={(e) =>
                    handleCellClick(
                      e,
                      caseDetailsList[caseDetailsDataIndex][i]
                        .feces_is_editable,
                    ).then((val) => {
                      if (val !== null) {
                        setCaseDetailsList((prevState) => {
                          const newState = [...prevState];
                          if (paintingMode)
                            newState[caseDetailsDataIndex][
                              i
                            ].feces_is_required = val;
                          else
                            newState[caseDetailsDataIndex][
                              i
                            ].feces_is_editable = val;
                          return newState;
                        });
                      }
                    })
                  }
                >
                  <SelectCellComponent
                    index={i}
                    isComment={true}
                    selectElement={
                      <FormSelect
                        elements={fecesTypes}
                        optionState={
                          caseDetailsList[caseDetailsDataIndex][
                            i
                          ].fecesTypeId?.toString() || ""
                        }
                        afterSelect={(value, textValue) => {
                          handleInputChange(
                            undefined,
                            { index: i },
                            value,
                            "fecesTypeId",
                          );
                          handleInputChange(
                            undefined,
                            { index: i },
                            textValue,
                            "fecesTypeText",
                          );
                        }}
                        selectId={"new-patient-select-feces-type-" + i}
                        width="100%"
                      />
                    }
                    commentValName="fecesComments"
                    formTextareaElementId={`feces-textarea-${i}`}
                    caseDetailsList={caseDetailsList}
                    caseDetailsDataIndex={caseDetailsDataIndex}
                    handleInputChange={handleInputChange}
                  />
                  {!caseDetailsList[caseDetailsDataIndex][i]
                    .feces_is_editable && <TableUnEditableCellElement />}
                  <FormTextarea
                    id={`feces-textarea-${i}`}
                    state={
                      getSelectValueText(
                        caseDetailsList[caseDetailsDataIndex][i].fecesTypeText,
                        caseDetailsList[caseDetailsDataIndex][i].fecesComments,
                      ) || ""
                    }
                    name="fecesComments"
                    height={"20px"}
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
        <div className="case-details-table-body-row">
          {Array.from({ length: DAILY_CASE_TABLE_COL_NUM }, (_, i) => {
            if (i === 0)
              return (
                <div
                  key={i}
                  className="case-details-table-body-row-cell case-details-table-body-row-cell-title"
                >
                  טיול
                </div>
              );
            else
              return (
                <div
                  key={i}
                  className={`case-details-table-body-row-cell case-details-pop-up-parent ${
                    caseDetailsList[caseDetailsDataIndex][i]
                      .isTravel_is_required
                      ? "required-cell"
                      : ""
                  }`}
                  onClick={(e) =>
                    handleCellClick(
                      e,
                      caseDetailsList[caseDetailsDataIndex][i]
                        .isTravel_is_editable,
                    ).then((val) => {
                      if (val !== null) {
                        setCaseDetailsList((prevState) => {
                          const newState = [...prevState];
                          if (paintingMode)
                            newState[caseDetailsDataIndex][
                              i
                            ].isTravel_is_required = val;
                          else
                            newState[caseDetailsDataIndex][
                              i
                            ].isTravel_is_editable = val;
                          return newState;
                        });
                      }
                    })
                  }
                >
                  {!caseDetailsList[caseDetailsDataIndex][i]
                    .isTravel_is_editable && <TableUnEditableCellElement />}
                  <FormCheckbox
                    checked={
                      caseDetailsList[caseDetailsDataIndex][i].isTravel || false
                    }
                    setChecked={(isChecked: any) => {
                      setCaseDetailsList((prevState) => {
                        const newState = [...prevState];
                        newState[caseDetailsDataIndex][i].isTravel = isChecked;
                        return newState;
                      });
                    }}
                  />
                </div>
              );
          })}
        </div>
        <div className="case-details-table-body-row">
          {Array.from({ length: DAILY_CASE_TABLE_COL_NUM }, (_, i) => {
            if (i === 0)
              return (
                <div
                  key={i}
                  className="case-details-table-body-row-cell case-details-table-body-row-cell-title"
                >
                  ניקוי ארגז
                </div>
              );
            else
              return (
                <div
                  key={i}
                  className={`case-details-table-body-row-cell case-details-pop-up-parent ${
                    caseDetailsList[caseDetailsDataIndex][i]
                      .isBoxClean_is_required
                      ? "required-cell"
                      : ""
                  }`}
                  onClick={(e) =>
                    handleCellClick(
                      e,
                      caseDetailsList[caseDetailsDataIndex][i]
                        .isBoxClean_is_editable,
                    ).then((val) => {
                      if (val !== null) {
                        setCaseDetailsList((prevState) => {
                          const newState = [...prevState];
                          if (paintingMode)
                            newState[caseDetailsDataIndex][
                              i
                            ].isBoxClean_is_required = val;
                          else
                            newState[caseDetailsDataIndex][
                              i
                            ].isBoxClean_is_editable = val;
                          return newState;
                        });
                      }
                    })
                  }
                >
                  {!caseDetailsList[caseDetailsDataIndex][i]
                    .isBoxClean_is_editable && <TableUnEditableCellElement />}
                  <FormCheckbox
                    checked={
                      caseDetailsList[caseDetailsDataIndex][i].isBoxClean ||
                      false
                    }
                    setChecked={(isChecked: any) => {
                      setCaseDetailsList((prevState) => {
                        const newState = [...prevState];
                        newState[caseDetailsDataIndex][i].isBoxClean =
                          isChecked;
                        return newState;
                      });
                    }}
                  />
                </div>
              );
          })}
        </div>
        <div className="case-details-table-body-row">
          {Array.from({ length: DAILY_CASE_TABLE_COL_NUM }, (_, i) => {
            if (i === 0)
              return (
                <div
                  key={i}
                  className="case-details-table-body-row-cell case-details-table-body-row-cell-title"
                >
                  תרופות לשחרור
                </div>
              );
            else
              return (
                <div
                  key={i}
                  className={`case-details-table-body-row-cell case-details-pop-up-parent ${
                    caseDetailsList[caseDetailsDataIndex][i]
                      .isRelease_is_required
                      ? "required-cell"
                      : ""
                  }`}
                  onClick={(e) =>
                    handleCellClick(
                      e,
                      caseDetailsList[caseDetailsDataIndex][i]
                        .isRelease_is_editable,
                    ).then((val) => {
                      if (val !== null) {
                        setCaseDetailsList((prevState) => {
                          const newState = [...prevState];
                          if (paintingMode)
                            newState[caseDetailsDataIndex][
                              i
                            ].isRelease_is_required = val;
                          else
                            newState[caseDetailsDataIndex][
                              i
                            ].isRelease_is_editable = val;
                          return newState;
                        });
                      }
                    })
                  }
                >
                  {!caseDetailsList[caseDetailsDataIndex][i]
                    .isRelease_is_editable && <TableUnEditableCellElement />}
                  <FormCheckbox
                    checked={
                      caseDetailsList[caseDetailsDataIndex][i].isRelease ||
                      false
                    }
                    setChecked={(isChecked: any) => {
                      setCaseDetailsList((prevState) => {
                        const newState = [...prevState];
                        newState[caseDetailsDataIndex][i].isRelease = isChecked;
                        return newState;
                      });
                    }}
                  />
                </div>
              );
          })}
        </div>
        <div className="case-details-table-body-row">
          {Array.from({ length: DAILY_CASE_TABLE_COL_NUM }, (_, i) => {
            if (i === 0)
              return (
                <div
                  key={i}
                  className="case-details-table-body-row-cell case-details-table-body-row-cell-title"
                >
                  עדכון בעלים
                </div>
              );
            else
              return (
                <div
                  key={i}
                  className={`case-details-table-body-row-cell ${
                    caseDetailsList[caseDetailsDataIndex][i]
                      .ownerUpdate_is_required
                      ? "required-cell"
                      : ""
                  }`}
                  onClick={(e) =>
                    handleCellClick(
                      e,
                      caseDetailsList[caseDetailsDataIndex][i]
                        .ownerUpdate_is_editable,
                    ).then((val) => {
                      if (val !== null) {
                        setCaseDetailsList((prevState) => {
                          const newState = [...prevState];
                          if (paintingMode)
                            newState[caseDetailsDataIndex][
                              i
                            ].ownerUpdate_is_required = val;
                          else
                            newState[caseDetailsDataIndex][
                              i
                            ].ownerUpdate_is_editable = val;
                          return newState;
                        });
                      }
                    })
                  }
                >
                  {!caseDetailsList[caseDetailsDataIndex][i]
                    .ownerUpdate_is_editable && <TableUnEditableCellElement />}
                  <FormTextarea
                    id={"ownerUpdate" + (i + 1)}
                    name="ownerUpdate"
                    minHeight="20px"
                    maxHeight="100px"
                    height="20px"
                    width="100%"
                    minWidth="60%"
                    maxLength={250}
                    isGrowHeightOnInput={true}
                    state={
                      caseDetailsList[caseDetailsDataIndex][i].ownerUpdate || ""
                    }
                    setState={handleInputChange}
                    setStateParams={{ index: i }}
                  />
                </div>
              );
          })}
        </div>
        <div className="case-details-table-body-row">
          {Array.from({ length: DAILY_CASE_TABLE_COL_NUM }, (_, i) => {
            if (i === 0)
              return (
                <div
                  key={i}
                  className="case-details-table-body-row-cell case-details-table-body-row-cell-title"
                >
                  שקילה
                </div>
              );
            else
              return (
                <div
                  key={i}
                  className={`case-details-table-body-row-cell ${
                    caseDetailsList[caseDetailsDataIndex][i].weigh_is_required
                      ? "required-cell"
                      : ""
                  }`}
                  onClick={(e) =>
                    handleCellClick(
                      e,
                      caseDetailsList[caseDetailsDataIndex][i]
                        .weigh_is_editable,
                    ).then((val) => {
                      if (val !== null) {
                        setCaseDetailsList((prevState) => {
                          const newState = [...prevState];
                          if (paintingMode)
                            newState[caseDetailsDataIndex][
                              i
                            ].weigh_is_required = val;
                          else
                            newState[caseDetailsDataIndex][
                              i
                            ].weigh_is_editable = val;
                          return newState;
                        });
                      }
                    })
                  }
                >
                  {!caseDetailsList[caseDetailsDataIndex][i]
                    .weigh_is_editable && <TableUnEditableCellElement />}
                  <FormInput
                    name="weigh"
                    type="number"
                    width="100%"
                    min={0}
                    state={caseDetailsList[caseDetailsDataIndex][i].weigh || ""}
                    setState={handleInputChange}
                    setStateParams={{ index: i }}
                  />
                </div>
              );
          })}
        </div>
        <div className="case-details-table-body-row">
          {Array.from({ length: DAILY_CASE_TABLE_COL_NUM }, (_, i) => {
            if (i === 0)
              return (
                <div
                  key={i}
                  className="case-details-table-body-row-cell case-details-table-body-row-cell-title"
                >
                  הקאות
                </div>
              );
            else
              return (
                <div
                  key={i}
                  className={`case-details-table-body-row-cell ${
                    caseDetailsList[caseDetailsDataIndex][i].puke_is_editable &&
                    "case-details-pop-up-parent"
                  } ${
                    caseDetailsList[caseDetailsDataIndex][i].puke_is_required
                      ? "required-cell"
                      : ""
                  }`}
                  onClick={(e) =>
                    handleCellClick(
                      e,
                      caseDetailsList[caseDetailsDataIndex][i].puke_is_editable,
                    ).then((val) => {
                      if (val !== null) {
                        setCaseDetailsList((prevState) => {
                          const newState = [...prevState];
                          if (paintingMode)
                            newState[caseDetailsDataIndex][i].puke_is_required =
                              val;
                          else
                            newState[caseDetailsDataIndex][i].puke_is_editable =
                              val;
                          return newState;
                        });
                      }
                    })
                  }
                >
                  {!caseDetailsList[caseDetailsDataIndex][i]
                    .puke_is_editable && <TableUnEditableCellElement />}
                  <BooleanCellComponent
                    index={i}
                    isComment={true}
                    valName="isPuke"
                    commentValName="pukeComments"
                    formTextareaElementId={`puke-textarea-${i}`}
                    caseDetailsList={caseDetailsList}
                    caseDetailsDataIndex={caseDetailsDataIndex}
                    handleInputChange={handleInputChange}
                  />
                  <FormTextarea
                    id={`puke-textarea-${i}`}
                    state={
                      getBooleanValueText(
                        caseDetailsList[caseDetailsDataIndex][i].isPuke,
                        caseDetailsList[caseDetailsDataIndex][i].pukeComments,
                      ) || ""
                    }
                    name="puke"
                    height={"20px"}
                    minHeight="20px"
                    maxHeight="100px"
                    width="100%"
                    minWidth="60%"
                    maxLength={250}
                    readOnly={true}
                  />
                </div>
              );
          })}
        </div>
      </div>
      {showMedicineModal && (
        <Modal
          setIsOpen={setShowMedicineModal}
          component={
            <div className="case-details-medicine-modal">
              <MedicinePicker
                medicineList={medicineList}
                animalWeight={animalWeight}
                afterConfirmation={(
                  selectedMedicines: MedicineSelectOptionObj[],
                ) => {
                  setCaseDetailsList((prevState) => {
                    for (let i = 0; i < caseDetailsList.length; i++) {
                      if (i === caseDetailsDataIndex) {
                        prevState[i] = caseDetailsList[i].map(
                          (details: any, i) => {
                            if (i === 0) {
                              if (medicineCellType === "fluids") {
                                details.fluids = selectedMedicines;
                              } else {
                                details.medicines = selectedMedicines;
                              }
                            } else {
                              if (medicineCellType === "fluids") {
                                details.fluids =
                                  getCheckboxesValuesAfterOptionsSelection(
                                    selectedMedicines,
                                    details.fluids,
                                  );
                              } else {
                                details.medicines =
                                  getCheckboxesValuesAfterOptionsSelection(
                                    selectedMedicines,
                                    details.medicines,
                                  );
                              }
                            }
                            return details;
                          },
                        );

                        break;
                      }
                    }

                    return prevState;
                  });
                  setShowMedicineModal(false);
                }}
                selectedMedicinesList={selectedMedicinesList}
              />
            </div>
          }
          closeWhenClickOutside={false}
        />
      )}
      {showOptionsModal && (
        <Modal
          setIsOpen={setShowOptionsModal}
          component={
            <div className="case-details-options-modal">
              <SelectOptionsPicker
                optionsList={optionsList}
                afterConfirmation={(
                  selectedOptions: SelectOptionsPickerOptionObj[],
                ) => {
                  setCaseDetailsList((prevState) => {
                    for (let i = 0; i < caseDetailsList.length; i++) {
                      if (i === caseDetailsDataIndex) {
                        prevState[i] = caseDetailsList[i].map(
                          (details: any, i) => {
                            if (i === 0) {
                              if (optionCellType === "foodExtras") {
                                details.foodExtras = selectedOptions;
                              } else if (optionCellType === "procedures") {
                                details.procedures = selectedOptions;
                              } else {
                                details.examinations = selectedOptions;
                              }
                            } else {
                              if (optionCellType === "foodExtras") {
                                details.foodExtras =
                                  getCheckboxesValuesAfterOptionsSelection(
                                    selectedOptions,
                                    details.foodExtras,
                                  );
                              } else if (optionCellType === "procedures") {
                                details.procedures =
                                  getCheckboxesValuesAfterOptionsSelection(
                                    selectedOptions,
                                    details.procedures,
                                  );
                              } else {
                                details.examinations =
                                  getCheckboxesValuesAfterOptionsSelection(
                                    selectedOptions,
                                    details.examinations,
                                  );
                              }
                            }
                            return details;
                          },
                        );
                        break;
                      }
                    }

                    return prevState;
                  });
                  setShowOptionsModal(false);
                }}
                selectedOptionsList={selectedOptionsList}
                selectOptionsUrl={optionsUrl}
              />
            </div>
          }
          closeWhenClickOutside={false}
        />
      )}
    </div>
  );
}

export default CaseDetailsTable;
