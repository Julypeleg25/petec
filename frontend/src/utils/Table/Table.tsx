import React, { useRef, useState } from "react";
import "./Table.css";
import MyLoader from "../MyLoader/MyLoader";

import { TableProps } from "./Table.types";

function Table<T extends object>({
  tableContainerRef,
  tableSectionContainerRef,
  columns,
  data,
  onRowClicked,
  onRowDoubleClicked,
  btns,
  isLoading,
  extraTableStyling,
}: TableProps<T>) {
  const tableBodyRef = useRef<HTMLTableSectionElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const tableHeaderRef = useRef<HTMLTableSectionElement>(null);

  const [selectedRow, setSelectedRow] = useState<T>();
  const visibleBtns = btns?.filter((btn) => btn.hide !== true);

  const hasData = data.length > 0;
  const activeSelectedRow =
    selectedRow !== undefined && data.includes(selectedRow)
      ? selectedRow
      : undefined;

  const highlightRowAndActivateBtns = (_event: React.MouseEvent, row: T) => {
    setSelectedRow(row);
  };

  const getCellTitle = (cell: React.ReactNode | object): React.ReactNode => {
    let currentCell = cell;
    while (currentCell && typeof currentCell === "object" && "props" in currentCell && currentCell.props && typeof currentCell.props === "object" && "children" in currentCell.props) {
      currentCell = (currentCell.props as { children: React.ReactNode }).children;
    }

    return currentCell as React.ReactNode;
  };

  return (
    <div className="mtc-table-section-container" ref={tableSectionContainerRef}>
      {btns && (
        <div className="table-btn-container">
          {visibleBtns?.map((btn, i: number) => {
            const {
              btnClassName,
              btnText,
              btnId,
              onClick,
              customBtn,
              activate,
              extraBtnStyle,
              title,
            } = btn;
            const requiresSelection = activate !== undefined;
            const isDisabled = requiresSelection
              ? activeSelectedRow === undefined || !activate(activeSelectedRow)
              : false;
            if (customBtn) {
              return <React.Fragment key={i}>{customBtn}</React.Fragment>;
            } else {
              return (
                <button
                  key={i}
                  id={btnId || undefined}
                  className={`${btnClassName} ${
                    !isDisabled ? "btn-active" : ""
                  }`}
                  disabled={isDisabled}
                  onClick={() => {
                    if (activate && activeSelectedRow !== undefined) {
                      onClick(activeSelectedRow);
                      return;
                    }
                    if (!activate) {
                      onClick();
                    }
                  }}
                  style={extraBtnStyle === undefined ? {} : extraBtnStyle}
                  title={title || ""}
                >
                  {btnText}
                </button>
              );
            }
          })}
        </div>
      )}
      <div
        ref={tableContainerRef}
        style={{
          height: btns ? "calc(100% - 125px)" : "calc(100% - 70px)",
        }}
      >
        {isLoading && <MyLoader />}
        <table
          ref={tableRef}
          className="mtc-table"
          style={extraTableStyling !== undefined ? extraTableStyling : {}}
        >
          <thead ref={tableHeaderRef}>
            <tr>
              {columns.map((column, index: number) => {
                const { name, minWidth } = column;
                return (
                  <th
                    key={index}
                    className="mtc-table-header"
                    style={{
                      width: minWidth,
                      minWidth: minWidth,
                      maxWidth: minWidth,
                    }}
                    table-header-index={index}
                  >
                    {name}
                  </th>
                );
              })}
            </tr>
          </thead>
          {!isLoading && !hasData ? (
            <tbody>
              <tr>
                <td
                  className="mtc-no-data-container"
                  colSpan={Math.max(columns.length, 1)}
                >
                  אין מידע זמין
                </td>
              </tr>
            </tbody>
          ) : (
            <tbody ref={tableBodyRef}>
              {data?.map((row, index: number) => (
                <tr
                  key={index}
                  onClick={(e) => {
                    highlightRowAndActivateBtns(e, row);
                    if (onRowClicked) onRowClicked(row, e);
                  }}
                  onDoubleClick={() => {
                    if (onRowDoubleClicked) onRowDoubleClicked(row);
                  }}
                  className={`mtc-table-body-table-row ${activeSelectedRow === row ? 'highlighted-table-row' : ''}`}
                  role="row"
                >
                  {Object.keys(row).map((_key, index) => {
                    if (index >= columns.length) {
                      return <React.Fragment key={index} />;
                    } else {
                      const val = getCellTitle(
                        !columns[index]?.cell
                          ? columns[index]?.selector?.(row)
                          : columns[index]?.cell?.(row)
                      );
                      return (
                        <td
                          key={index}
                          className="mtc-table-cell"
                          title={typeof val === "string" ? val : ""}
                          style={{
                            textAlign: columns[index]?.center
                              ? "center"
                              : "right",
                            width: columns[index]?.minWidth,
                            minWidth: columns[index]?.minWidth,
                            maxWidth: columns[index]?.minWidth,
                          }}
                          table-cell-index={index}
                        >
                          <span>{val}</span>
                        </td>
                      );
                    }
                  })}
                </tr>
              ))}
            </tbody>
          )}
        </table>
      </div>
    </div>
  );
}

export default Table;
