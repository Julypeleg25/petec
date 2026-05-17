import { useState } from "react";
import TableGenerator from "../../../utils/TableGenerator/TableGenerator";
import type { RowData } from "../../../utils/TableGenerator/TableGenerator";
import { FaEye, FaHistory } from "react-icons/fa";
import HistoryItemDetails from "../HistoryItemDetails/HistoryItemDetails";
import type { HistoryItem } from "../HistoryItemDetails/HistoryItemDetails";
import { getFormattedDateTimeFromDBdate } from "../../../utils/DateFormattingUtil";

import "./HistoryTab.css";

const isHistoryItem = (row: RowData): row is HistoryItem =>
  typeof row.subject === "string" &&
  typeof row.description === "string" &&
  typeof row.created_at === "string" &&
  typeof row.created_by_name === "string";

const toHistoryItemOrNull = (row: RowData): HistoryItem | null =>
  isHistoryItem(row) ? row : null;

export default function HistoryTab() {
  const [historyObj, setHistoryObj] = useState<HistoryItem | null>(null);
  const [showHistoryDetails, setShowHistoryDetails] = useState(false);

  const historyColumnsData = [
    { colName: "נושא", searchObjField: "subject", minWidth: "200px" },
    { colName: "תיאור", searchObjField: "description", minWidth: "250px" },
    {
      colName: "תאריך",
      searchObjField: "created_at",
      minWidth: "200px",
      formatter: (cellValue?: string | number | boolean | object | null) =>
        typeof cellValue === "string" || cellValue instanceof Date
          ? getFormattedDateTimeFromDBdate(cellValue)
          : "",
    },
    { colName: "משתמש", searchObjField: "created_by_name", minWidth: "200px" },
    {
      colName: "מספר תיק",
      searchObjField: "case_serial_id",
      minWidth: "200px",
      formatter: (cellValue?: string | number | boolean | object | null) =>
        typeof cellValue === "string" ? cellValue : "",
    },
    { colName: "שם מטופל", searchObjField: "patient_name", minWidth: "200px" },
  ];

  const tableBtns = [
    {
      id: 1,
      btnText: <FaEye />,
      btnClassName: "btn btn-round table-btn",
      onClick: (rowData: RowData) => {
        const item = toHistoryItemOrNull(rowData);
        if (!item) return;
        setHistoryObj(item);
        setShowHistoryDetails(true);
      },
      activate: () => true,
    },
  ];

  if (showHistoryDetails && historyObj) {
    return (
      <HistoryItemDetails
        historyObj={historyObj}
        setShowHistoryDetails={setShowHistoryDetails}
      />
    );
  }

  return (
    <div className="history-tab" dir="rtl">
      <div className="history-tab__header">
        <div className="history-tab__title-wrap">
          <div className="history-tab__title-icon">
            <FaHistory />
          </div>

          <div>
            <h2 className="history-tab__title">היסטוריית מערכת</h2>
            <p className="history-tab__subtitle">
              צפייה בפעולות שבוצעו במערכת ובשינויים בנתונים
            </p>
          </div>
        </div>
      </div>

      <div className="history-tab__table-card">
        <TableGenerator
          queryObj={{
            query: "auditLogs",
            orderBy: { id: "DESC" },
            filters: {},
            args: [],
          }}
          columnsData={historyColumnsData}
          btns={tableBtns}
          setOnRowClicked={(row: RowData) => {
            const item = toHistoryItemOrNull(row);
            if (!item) return;
            setHistoryObj(item);
          }}
          setOnDoubleRowClicked={(row: RowData) => {
            const item = toHistoryItemOrNull(row);
            if (!item) return;
            setHistoryObj(item);
            setShowHistoryDetails(true);
          }}
          paginationPerPage={20}
        />
      </div>
    </div>
  );
}
