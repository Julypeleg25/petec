import { useState } from "react";
import TableGenerator from "../../../utils/TableGenerator/TableGenerator";
import type { RowData } from "../../../utils/TableGenerator/TableGenerator";
import { FaEye } from "react-icons/fa";
import { TableFormattingOptionsEnum } from "../../../utils/TableGenerator/TableFormattingOptionsEnum";
import HistoryItemDetails from "../HistoryItemDetails/HistoryItemDetails";

export default function HistoryTab() {
  const [historyObj, setHistoryObj] = useState<RowData | null>(null);
  const [showHistoryDetails, setShowHistoryDetails] = useState(false);

  const historyColumnsData = [
    { colName: "נושא", searchObjField: "subject", minWidth: "200px" },
    { colName: "תיאור", searchObjField: "description", minWidth: "250px" },
    { colName: "תאריך", searchObjField: "created_at", minWidth: "200px" },
    { colName: "משתמש", searchObjField: "created_by_name", minWidth: "200px" },
    {
      colName: "מספר תיק",
      searchObjField: "case_id",
      minWidth: "200px",
      formatter: (cellValue: unknown) => {
        if (cellValue === undefined || cellValue === null) return "";
        return String(cellValue).split("-")[0];
      },
    },
    { colName: "שם מטופל", searchObjField: "patient_name", minWidth: "200px" },
  ];

  const tableBtns = [
    {
      id: 1,
      btnText: <FaEye />,
      btnClassName: "btn btn-round table-btn",
      onClick: (rowData: RowData) => {
        setHistoryObj(rowData);
        setShowHistoryDetails(true);
      },
      activate: () => true,
    },
  ];

  if (showHistoryDetails) {
    // Note: This disables strict equality validation on the prop by casting to any 
    // because HistoryItemDetails interface defines a very specific prop structure.
    return (
      <HistoryItemDetails
        historyObj={historyObj as any}
        setShowHistoryDetails={setShowHistoryDetails}
      />
    );
  }

  return (
    <div className="system-management-history-table">
      <TableGenerator
        queryObj={{
          query: "audit_logs",
          orderBy: { id: "DESC" },
          filters: {},
          args: [],
          formatting: {
            created_at: TableFormattingOptionsEnum.TimestampWithTime,
          },
        }}
        columnsData={historyColumnsData}
        btns={tableBtns}
        setOnRowClicked={(row: RowData) => setHistoryObj(row)}
        setOnDoubleRowClicked={(row: RowData) => {
          setHistoryObj(row);
          setShowHistoryDetails(true);
        }}
        paginationPerPage={20}
      />
    </div>
  );
}
