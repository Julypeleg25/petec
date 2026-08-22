import { useState, useEffect, useRef } from "react";
import MyLoader from "../MyLoader/MyLoader";
import Pagination from "../Pagination/Pagination";
import Table from "../Table/Table";
import "./TableGenerator.css";

import {
  RowData,
  OrderByObj,
  PaginationBtns,
  SearchObj,
  ITableGeneratorProps,
} from "./TableGenerator.types";

import {
  ROWS_PER_PAGE,
  setRowsPerPage,
  columnsGeneratorWithSearch,
  getFilters,
  getDataByQuery,
  getSearchObjDefault,
} from "./TableGenerator.utils";

export * from "./TableGenerator.types";
export * from "./TableGenerator.utils";

const isSameOrderBy = (a: OrderByObj, b: OrderByObj): boolean => {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  for (const key of aKeys) {
    if (a[key] !== b[key]) return false;
  }
  return true;
};

const isSameSearchObj = (
  a: SearchObj,
  b: SearchObj,
): boolean => {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  for (const key of aKeys) {
    if (a[key] !== b[key]) return false;
  }
  return true;
};

function TableGenerator<T extends RowData = RowData>({
  queryObj,
  columnsData,
  paginationPerPage,
  btns,
  setOnRowClicked,
  setOnDoubleRowClicked,
  reload,
  extraTableStyling,
  isCards,
  customCard,
  hiddenCardWidth,
  hiddenCardMargin,
}: ITableGeneratorProps<T>) {
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const tableSectionContainerRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [tableData, setTableData] = useState<T[]>([]);
  const [sortDirection, setSortDirection] = useState(false);
  const [dataSize, setDataSize] = useState(-1);
  const [currentPage, setCurrentPage] = useState(1);
  const [disablePaginationBtns, setDisablePaginationBtns] =
    useState<PaginationBtns>({
      disableBtnNext: false,
      disableBtnBack: true,
      disableBtnLastPage: false,
      disableBtnFirstPage: true,
    });
  const [searchObj, setSearchObj] = useState(getSearchObjDefault(columnsData));
  const [orderBy, setOrderBy] = useState<OrderByObj>(queryObj?.orderBy || {});

  useEffect(() => {
    const nextOrderBy = queryObj?.orderBy || {};
    const nextSearchObj = getSearchObjDefault(columnsData);
    setSearchObj((prev) =>
      isSameSearchObj(prev, nextSearchObj) ? prev : nextSearchObj,
    );
    setOrderBy((prev) => (isSameOrderBy(prev, nextOrderBy) ? prev : nextOrderBy));
    setCurrentPage(1);
  }, [columnsData, queryObj?.orderBy, queryObj.query]);

  const getData = async () => {
    await getDataByQuery(
      { ...queryObj, orderBy },
      0,
      getFilters(searchObj, columnsData),
      setDataSize,
      setTableData,
      setCurrentPage,
      setDisablePaginationBtns,
      setLoading,
    );
  };

  useEffect(() => {
    if (paginationPerPage !== undefined) setRowsPerPage(paginationPerPage);
    void getData();
  }, [reload, orderBy, paginationPerPage, queryObj.query]);

  return (
    <>
      {isCards ? (
        <div
          className="table-generator-cards-content"
          ref={tableSectionContainerRef}
          style={{
            height: "calc(100% - var(--table-pagination-height))",
            position: "relative",
          }}
        >
          <div
            className="table-generator-cards-viewport"
            ref={tableContainerRef}
            style={{ height: "100%" }}
          >
            {loading && <MyLoader />}
            {!loading && tableData.length === 0 ? (
              <div className="mtc-no-data-container">אין מידע זמין</div>
            ) : (
              <div className="table-cards-section">
                <div className="table-cards-container">
                  {tableData.map((row: T, i: number) => {
                    return customCard?.(row, i);
                  })}
                  {Array.from(
                    { length: ROWS_PER_PAGE - tableData.length },
                    (_, i) => (
                      <div
                        key={i}
                        style={{
                          width: hiddenCardWidth,
                          visibility: "hidden",
                          margin: hiddenCardMargin,
                        }}
                      ></div>
                    ),
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <Table
          tableContainerRef={tableContainerRef}
          tableSectionContainerRef={tableSectionContainerRef}
          columns={columnsGeneratorWithSearch(
            columnsData,
            searchObj,
            setSearchObj,
            tableData,
            setTableData,
            sortDirection,
            setSortDirection,
            queryObj,
            setDataSize,
            setCurrentPage,
            setDisablePaginationBtns,
            setLoading,
            setOrderBy,
          )}
          data={tableData}
          btns={btns}
          onRowClicked={(row: T, event: React.MouseEvent) => {
            void event;
            setOnRowClicked?.(row);
          }}
          onRowDoubleClicked={(row: T) => {
            setOnDoubleRowClicked?.(row);
          }}
          isLoading={loading}
          extraTableStyling={extraTableStyling}
        />
      )}
      <Pagination
        tableSectionContainerRef={tableSectionContainerRef}
        tableRef={tableContainerRef}
        getDataByQuery={getDataByQuery}
        dataSize={dataSize}
        rowsPerPage={ROWS_PER_PAGE}
        queryObj={{ ...queryObj, orderBy }}
        filters={getFilters(searchObj, columnsData)}
        setDataSize={setDataSize}
        setTableData={setTableData}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        disablePaginationBtns={disablePaginationBtns}
        setDisablePaginationBtns={setDisablePaginationBtns}
        searchObjDefault={getSearchObjDefault(columnsData)}
        setSearchObj={setSearchObj}
        setLoading={setLoading}
      />
    </>
  );
}

export default TableGenerator;
