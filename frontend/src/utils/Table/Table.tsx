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
  const tableBodyRef = useRef(null);
  const tableRef = useRef(null);
  const tableHeaderRef = useRef(null);

  const [selectedRow, setSelectedRow] = useState<T>();

  const isHasData =
    data && data.length !== 0 && Object.keys(data[0]).length !== 0;

  const highlightRowAndActivateBtns = (e: React.MouseEvent, row: T) => {
    if (!tableBodyRef.current || !tableSectionContainerRef.current) return;
    const rows = (tableBodyRef.current as HTMLTableSectionElement).getElementsByTagName("tr");
    const selectedRow = e.currentTarget;


    for (let i = 0; i < rows.length; i++) {
      const tableRow = rows[i];
      if (tableRow === selectedRow)
        tableRow.classList.add("highlighted-table-row");
      else tableRow.classList.remove("highlighted-table-row");
    }


    if (btns !== undefined) {
      let tableBtns = tableSectionContainerRef.current.querySelectorAll<HTMLButtonElement>(
        ".table-btn, .table-btn-no-style"
      );

      for (let i = 0; i < btns.length; i++) {
        if (btns[i].hide !== undefined && btns[i].hide) btns.splice(i, 1);
      }

      for (let i = 0; i < tableBtns.length; i++) {
        if (btns[i].activate) {
          if (btns[i].activate(row)) {
            tableBtns[i].disabled = false;
            tableBtns[i].classList.add("btn-active");
          } else {
            tableBtns[i].disabled = true;
            tableBtns[i].classList.remove("btn-active");
          }
        }
      }
    }

    setSelectedRow(row);
  };

  const getCellTitle = (cell: any) => {
    while (cell?.props?.children) {
      cell = cell.props.children;
    }

    return cell;
  };

  return (
    <div className="mtc-table-section-container" ref={tableSectionContainerRef}>
      {btns && (
        <div className="table-btn-container">
          {btns?.map((btn: any, i: number) => {
            const {
              btnClassName,
              btnText,
              btnId,
              onClick,
              hide,
              customBtn,
              activate,
              extraBtnStyle,
              title,
            } = btn;
            const isDisabled = activate !== undefined;
            if (hide !== undefined && hide) {
              return <div key={i} style={{ display: "none" }}></div>;
            } else if (customBtn !== undefined) {
              return <React.Fragment key={i}>{customBtn}</React.Fragment>;
            } else {
              return (
                <button
                  key={i}
                  id={btnId !== undefined && btnId}
                  className={btnClassName}
                  disabled={
                    isDisabled && selectedRow === undefined
                      ? isDisabled
                      : activate === undefined
                      ? false
                      : !activate(selectedRow)
                  }
                  onClick={() => onClick(selectedRow as T)}
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
              {columns.map((column: any, index: number) => {
                const { name, minWidth } = column;
                return (
                  <th
                    key={index}
                    className="mtc-table-header"
                    style={{
                      minWidth: minWidth,
                    }}
                    table-header-index={index}
                  >
                    {name}
                  </th>
                );
              })}
            </tr>
          </thead>
          {!isLoading && !isHasData ? (
            <div className="mtc-no-data-container">אין מידע זמין</div>
          ) : (
            <tbody ref={tableBodyRef}>
              {data?.map((row: any, index: number) => (
                <tr
                  key={index}
                  onClick={(e) => {
                    highlightRowAndActivateBtns(e, row);
                    if (onRowClicked) onRowClicked(row, e);
                  }}
                  onDoubleClick={() => {
                    if (onRowDoubleClicked) onRowDoubleClicked(row);
                  }}
                  className="mtc-table-body-table-row"
                  role="row"
                >
                  {Object.keys(row).map((key, index) => {
                    if (index >= columns.length) {
                      return <React.Fragment key={index} />;
                    } else {
                      const val = getCellTitle(
                        !columns[index]?.cell
                          ? columns[index]?.selector(row)
                          : columns[index]?.cell(row)
                      );
                      return (
                        <td
                          key={index}
                          className="mtc-table-cell"
                          title={val}
                          style={{
                            textAlign: columns[index]?.center
                              ? "center"
                              : "right",
                            minWidth: columns[index]?.minWidth,
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
