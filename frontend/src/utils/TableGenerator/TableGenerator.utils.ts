import React from "react";
import { requestWithRequestAndResponseSchema } from "../../lib/api-client";
import { API_ROUTES } from "../../config/api-routes";
import { initPaginationBtns } from "../Pagination/Pagination.utils";
import type { ColumnDef } from "../../types";
import {
  GetTableDataDTO,
  GetTableDataDTOSchema,
  TableDataResponseDTOSchema,
  PatientCardTableDataResponseDTOSchema,
} from "@petec/shared";
import type {
  RowData,
  SearchObj,
  OrderByObj,
  PaginationBtns,
  QueryObj,
} from "./TableGenerator.types";

export let ROWS_PER_PAGE = 20;
export const setRowsPerPage = (num: number) => {
  ROWS_PER_PAGE = num;
};

export const columnsGeneratorWithSearch = <T extends RowData = RowData>(
  columnsData: ColumnDef[],
  searchObj: SearchObj,
  setSearchObj: React.Dispatch<React.SetStateAction<SearchObj>>,
  tableData: T[],
  setTableData: React.Dispatch<React.SetStateAction<T[]>>,
  searchData: T[],
  sortDirection: boolean,
  setSortDirection: React.Dispatch<React.SetStateAction<boolean>>,
  tableSectionContainerRef: React.RefObject<HTMLDivElement | null>,
  queryObj: QueryObj,
  setDataSize: React.Dispatch<React.SetStateAction<number>>,
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>,
  disablePaginationBtns: PaginationBtns,
  setDisablePaginationBtns: React.Dispatch<React.SetStateAction<PaginationBtns>>,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setOrderBy: React.Dispatch<React.SetStateAction<OrderByObj>>
) => {
  let columnsArray = columnsData?.map((column: ColumnDef, i: number) => {
    const {
      colName,
      searchObjField,
      minWidth,
      defaultValue,
      formatter,
      isDateSearch,
      searchDefaultVal,
      isDisabled,
      hideSearch,
      center,
      placeholder,
    } = column;
    if (!column?.hide) {
      return {
        name: React.createElement(
          React.Fragment,
          null,
          (hideSearch === undefined || !hideSearch) &&
          React.createElement(
            "span",
            {
              className: "table-sort-arrow",
              onClick: () => {
                const sortObj: OrderByObj = {};
                sortObj[searchObjField] = sortDirection ? "DESC" : "ASC";
                setOrderBy(sortObj);
                setSortDirection((prevValue: boolean) => !prevValue);
              },
            },
            sortDirection ? "▲" : "▼"
          ),
          React.createElement(
            "div",
            { key: i, className: "table-search-input-container" },
            React.createElement("div", null, String(colName)),
            (hideSearch === undefined || !hideSearch) &&
            React.createElement("input", {
              className: "table-search-input",
              type: isDateSearch ? "date" : "search",
              defaultValue: searchDefaultVal !== undefined ? searchDefaultVal : "",
              style: searchDefaultVal !== undefined ? { color: "black" } : {},
              disabled: isDisabled === undefined ? false : isDisabled,
              placeholder: placeholder ? placeholder : "",
              onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) =>
                handleSearch(
                  e,
                  searchObj,
                  tableSectionContainerRef,
                  queryObj,
                  setDataSize,
                  setTableData,
                  setCurrentPage,
                  disablePaginationBtns,
                  setDisablePaginationBtns,
                  tableData.length,
                  searchData,
                  columnsData,
                  setLoading
                ),
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                if (isDateSearch) {
                  e.target.style.color = "black";
                }
                searchObj[searchObjField] = e.target.value;
                setSearchObj(searchObj);
              },
            })
          )
        ),
        selector: (row: T) => {
          if (tableData.length === 0) return "";

          if (formatter !== undefined) {
            const val = row[searchObjField];
            return formatter(val as string | number | boolean | null | undefined | object, row);
          } else if (
            defaultValue !== undefined &&
            (row[searchObjField] === null || row[searchObjField] === undefined)
          ) {
            return defaultValue;
          } else {
            return row[searchObjField] !== null &&
              row[searchObjField] !== undefined
              ? row[searchObjField]
              : "";
          }
        },
        minWidth: minWidth,
        center: center !== undefined && center,
      };
    }
    return undefined;
  });

  return columnsArray.filter((element) => element !== undefined);
};

const handleSearch = <T extends RowData = RowData>(
  e: React.KeyboardEvent<HTMLInputElement> | React.MouseEvent,
  searchObj: SearchObj,
  tableSectionContainerRef: React.RefObject<HTMLDivElement | null>,
  queryObj: QueryObj,
  setDataSize: React.Dispatch<React.SetStateAction<number>>,
  setTableData: React.Dispatch<React.SetStateAction<T[]>>,
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>,
  disablePaginationBtns: PaginationBtns,
  setDisablePaginationBtns: React.Dispatch<React.SetStateAction<PaginationBtns>>,
  _tableDataSize: number,
  _searchData: T[],
  columnsData: ColumnDef[],
  setLoading: React.Dispatch<React.SetStateAction<boolean>>
) => {
  const isEnter = "key" in e && e.key === "Enter";
  const isClick = e.type === "click";

  if (isEnter || isClick) {
    getDataByQuery(
      queryObj,
      0,
      getFilters(searchObj, columnsData),
      setDataSize,
      setTableData,
      setCurrentPage,
      disablePaginationBtns,
      setDisablePaginationBtns,
      tableSectionContainerRef,
      undefined,
      setLoading
    );
  }
};

export const getFilters = (searchObj: SearchObj, columnsData: ColumnDef[]) => {
  const filters: Record<string, string | number | boolean> = JSON.parse(JSON.stringify(searchObj));
  for (const key in filters) {
    if (filters[key] == null || filters[key] === "") {
      delete filters[key];
    }
  }

  for (let i = 0; i < columnsData.length; i++) {
    if (columnsData[i].customFilter !== undefined && columnsData[i].customFilter)
      filters["customFilter"] = columnsData[i].customFilterVal ?? "";
  }

  if (filters["customFilter"] === "") delete filters["customFilter"];

  return filters;
};

export const getDataByQuery = async <T extends RowData = RowData>(
  queryObj: QueryObj,
  pageNumber: number,
  filters: Record<string, string | number | boolean>,
  setDataSize: React.Dispatch<React.SetStateAction<number>>,
  setTableData: React.Dispatch<React.SetStateAction<T[]>>,
  setCurrentPage: React.Dispatch<React.SetStateAction<number>> | undefined,
  disablePaginationBtns: PaginationBtns,
  setDisablePaginationBtns: React.Dispatch<React.SetStateAction<PaginationBtns>>,
  tableSectionContainerRef: React.RefObject<HTMLDivElement | null>,
  setSearch: React.Dispatch<React.SetStateAction<T[]>> | undefined,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>
) => {
  if (setCurrentPage !== undefined) setLoading(true);

  const orderByEntries = Object.entries(queryObj?.orderBy || {});
  const sortBy = orderByEntries.length > 0 ? orderByEntries[0][0] : undefined;
  const sortOrder = orderByEntries.length > 0 ? (orderByEntries[0][1]).toLowerCase() : undefined;

  try {
    const requestBody = {
      tableName: queryObj.query,
      limit: ROWS_PER_PAGE,
      page: (pageNumber || 0) + 1,
      filters,
      sortBy,
      sortOrder,
      args: queryObj.args,
    };

    const parsedRequestBody: GetTableDataDTO = GetTableDataDTOSchema.parse(requestBody);
    const response =
      parsedRequestBody.tableName === "patients" || parsedRequestBody.tableName === "cases"
        ? await requestWithRequestAndResponseSchema(
            { method: "post", url: API_ROUTES.tableGenerator.getTableData },
            parsedRequestBody,
            GetTableDataDTOSchema,
            PatientCardTableDataResponseDTOSchema,
          )
        : await requestWithRequestAndResponseSchema(
            { method: "post", url: API_ROUTES.tableGenerator.getTableData },
            parsedRequestBody,
            GetTableDataDTOSchema,
            TableDataResponseDTOSchema,
          );

    const rows = response.items as T[];
    setDataSize(response.total);
    setTableData(rows);
    setLoading(false);

    if (setSearch !== undefined) setSearch(rows);
    if (setCurrentPage !== undefined) {
      setCurrentPage(1);
      initPaginationBtns(
        response.total,
        queryObj.isManagedTable ? response.total : ROWS_PER_PAGE,
        disablePaginationBtns,
        setDisablePaginationBtns
      );
    }
  } catch { /* handled by interceptor */ }
};

export const getSearchObjDefault = (columnsData: ColumnDef[]): SearchObj => {
  const searchObjDefault: SearchObj = {};
  for (let i = 0; i < columnsData.length; i++) {
    if (columnsData[i].hide === undefined || !columnsData[i].hide) {
      if (columnsData[i].searchDefaultVal !== undefined)
        searchObjDefault[columnsData[i].searchObjField] = columnsData[i].searchDefaultVal!;
      else if (
        columnsData[i].customFilter !== undefined &&
        columnsData[i].customFilter
      ) {
        searchObjDefault["customFilter"] = columnsData[i].customFilterVal ?? "";
      } else searchObjDefault[columnsData[i].searchObjField] = "";
    }
  }
  return searchObjDefault;
};
