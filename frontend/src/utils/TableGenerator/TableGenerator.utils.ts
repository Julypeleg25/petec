import React from "react";
import { requestWithRequestAndResponseSchema } from "../../lib/apiClient";
import { API_ROUTES } from "../../config/apiRoutes";
import { HTTP_METHODS } from "../../lib/http.constants";
import { logger } from "../../lib/logger";
import { initPaginationBtns } from "../Pagination/Pagination.utils";
import type { ColumnDef } from "../../types";
import {
  GetTableDataDTO,
  GetTableDataDTOSchema,
  PATIENT_CARD_TABLE_NAMES,
  TableDataResponseDTOSchema,
  PatientCardTableDataResponseDTOSchema,
} from "@petec/shared";
import type {
  RowData,
  SearchObj,
  OrderByObj,
  PaginationBtns,
  QueryObj,
  TableFilterValue,
} from "./TableGenerator.types";
import { TABLE_SORT_DIRECTIONS } from "./TableGenerator.types";

export let ROWS_PER_PAGE = 20;

export const setRowsPerPage = (num: number) => {
  ROWS_PER_PAGE = num;
};

const isSearchVisible = (hideSearch?: boolean): boolean => hideSearch !== true;

const isSearchTriggerEvent = (
  event: React.KeyboardEvent<HTMLInputElement> | React.MouseEvent,
): boolean => ("key" in event ? event.key === "Enter" : event.type === "click");

const getSortParams = (
  orderBy?: OrderByObj,
): { sortBy?: string; sortOrder?: string } => {
  const orderByEntries = Object.entries(orderBy || {});
  if (orderByEntries.length === 0) {
    return {};
  }

  const [sortBy, direction] = orderByEntries[0];
  return { sortBy, sortOrder: direction.toLowerCase() };
};

const isPatientCardsTable = (tableName: string): boolean =>
  PATIENT_CARD_TABLE_NAMES.includes(
    tableName as (typeof PATIENT_CARD_TABLE_NAMES)[number],
  );

const getCellDisplayValue = <T extends RowData>(
  row: T,
  column: ColumnDef,
) => {
  const rawValue = row[column.searchObjField];
  if (column.formatter) {
    return column.formatter(
      rawValue as string | number | boolean | null | undefined | object,
      row,
    );
  }

  if (
    column.defaultValue !== undefined &&
    (rawValue === null || rawValue === undefined)
  ) {
    return column.defaultValue;
  }

  return rawValue !== null && rawValue !== undefined ? rawValue : "";
};

export const columnsGeneratorWithSearch = <T extends RowData = RowData>(
  columnsData: ColumnDef[],
  searchObj: SearchObj,
  setSearchObj: React.Dispatch<React.SetStateAction<SearchObj>>,
  tableData: T[],
  setTableData: React.Dispatch<React.SetStateAction<T[]>>,
  sortDirection: boolean,
  setSortDirection: React.Dispatch<React.SetStateAction<boolean>>,
  queryObj: QueryObj,
  setDataSize: React.Dispatch<React.SetStateAction<number>>,
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>,
  setDisablePaginationBtns: React.Dispatch<React.SetStateAction<PaginationBtns>>,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setOrderBy: React.Dispatch<React.SetStateAction<OrderByObj>>
) => {
  let columnsArray = columnsData?.map((column: ColumnDef, i: number) => {
    const {
      colName,
      searchObjField,
      minWidth,
      isDateSearch,
      searchDefaultVal,
      isDisabled,
      hideSearch,
      center,
      placeholder,
    } = column;
    if (!column?.hide) {
      const showSearch = isSearchVisible(hideSearch);
      return {
        name: React.createElement(
          React.Fragment,
          null,
          showSearch &&
          React.createElement(
            "span",
            {
              className: "table-sort-arrow",
              onClick: () => {
                const sortObj: OrderByObj = {};
                sortObj[searchObjField] = sortDirection
                  ? TABLE_SORT_DIRECTIONS.DESC
                  : TABLE_SORT_DIRECTIONS.ASC;
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
            showSearch &&
            React.createElement("input", {
              className: "table-search-input",
              type: isDateSearch ? "date" : "search",
              value: searchObj[searchObjField] ?? "",
              style: (searchObj[searchObjField] ?? searchDefaultVal) !== undefined && (searchObj[searchObjField] ?? searchDefaultVal) !== "" ? { color: "black" } : {},
              disabled: isDisabled === undefined ? false : isDisabled,
              placeholder: placeholder ? placeholder : "",
              onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) =>
                handleSearch(
                  e,
                  searchObj,
                  queryObj,
                  setDataSize,
                  setTableData,
                  setCurrentPage,
                  setDisablePaginationBtns,
                  columnsData,
                  setLoading
                ),
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                setSearchObj((prevState) => ({
                  ...prevState,
                  [searchObjField]: e.target.value,
                }));
              },
            })
          )
        ),
        selector: (row: T) => {
          if (tableData.length === 0) return "";
          return getCellDisplayValue(row, column);
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
  queryObj: QueryObj,
  setDataSize: React.Dispatch<React.SetStateAction<number>>,
  setTableData: React.Dispatch<React.SetStateAction<T[]>>,
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>,
  setDisablePaginationBtns: React.Dispatch<React.SetStateAction<PaginationBtns>>,
  columnsData: ColumnDef[],
  setLoading: React.Dispatch<React.SetStateAction<boolean>>
) => {
  if (isSearchTriggerEvent(e)) {
    getDataByQuery(
      queryObj,
      0,
      getFilters(searchObj, columnsData),
      setDataSize,
      setTableData,
      setCurrentPage,
      setDisablePaginationBtns,
      setLoading
    );
  }
};

export const getFilters = (searchObj: SearchObj, columnsData: ColumnDef[]) => {
  const filters = Object.entries(searchObj).reduce<
    Record<string, TableFilterValue>
  >((accumulator, [key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      accumulator[key] = value;
    }
    return accumulator;
  }, {});

  columnsData.forEach((column) => {
    if (column.customFilter) {
      const customFilterValue = column.customFilterVal ?? "";
      if (customFilterValue !== "") {
        filters.customFilter = customFilterValue;
      } else {
        delete filters.customFilter;
      }
    }
  });

  return filters;
};

const sanitizeFilters = (
  rawFilters: Record<string, TableFilterValue | undefined>,
): Record<string, TableFilterValue> =>
  Object.entries(rawFilters).reduce<Record<string, TableFilterValue>>(
    (accumulator, [key, value]) => {
      if (value !== null && value !== undefined && value !== "") {
        accumulator[key] = value;
      }
      return accumulator;
    },
    {},
  );

const mergeQueryFilters = (
  queryFilters: QueryObj["filters"],
  tableFilters: Record<string, TableFilterValue>,
): Record<string, TableFilterValue> =>
  sanitizeFilters({
    ...(queryFilters ?? {}),
    ...tableFilters,
  });

export const getDataByQuery = async <T extends RowData = RowData>(
  queryObj: QueryObj,
  pageNumber: number,
  filters: Record<string, TableFilterValue>,
  setDataSize: React.Dispatch<React.SetStateAction<number>>,
  setTableData: React.Dispatch<React.SetStateAction<T[]>>,
  setCurrentPage: React.Dispatch<React.SetStateAction<number>> | undefined,
  setDisablePaginationBtns: React.Dispatch<React.SetStateAction<PaginationBtns>>,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>
) => {
  if (setCurrentPage !== undefined) setLoading(true);

  const { sortBy, sortOrder } = getSortParams(queryObj?.orderBy);

  try {
    const mergedFilters = mergeQueryFilters(queryObj.filters, filters);
    const requestBody = {
      tableName: queryObj.query,
      limit: ROWS_PER_PAGE,
      page: (pageNumber || 0) + 1,
      filters: mergedFilters,
      sortBy,
      sortOrder,
      args: queryObj.args,
    };

    const parsedRequestBody: GetTableDataDTO = GetTableDataDTOSchema.parse(requestBody);
    const response = isPatientCardsTable(parsedRequestBody.tableName)
      ? await requestWithRequestAndResponseSchema(
        { method: HTTP_METHODS.POST, url: API_ROUTES.tableGenerator.getTableData },
        parsedRequestBody,
        GetTableDataDTOSchema,
        PatientCardTableDataResponseDTOSchema,
      )
      : await requestWithRequestAndResponseSchema(
        { method: HTTP_METHODS.POST, url: API_ROUTES.tableGenerator.getTableData },
        parsedRequestBody,
        GetTableDataDTOSchema,
        TableDataResponseDTOSchema,
      );

    const rows = response.items as T[];
    setDataSize(response.total);
    setTableData(rows);
    setLoading(false);

    if (setCurrentPage !== undefined) {
      setCurrentPage(1);
      initPaginationBtns(
        response.total,
        queryObj.isManagedTable ? response.total : ROWS_PER_PAGE,
        setDisablePaginationBtns,
      );
    }
  } catch (error) {
    const logError =
      error instanceof Error
        ? { name: error.name, message: error.message, stack: error.stack }
        : String(error);
    setLoading(false);
    logger.error("Failed to fetch table data", logError, {
      tableName: queryObj.query,
      pageNumber,
      filters,
    });
  }
};

export const getSearchObjDefault = (columnsData: ColumnDef[]): SearchObj => {
  const searchObjDefault: SearchObj = {};
  for (const column of columnsData) {
    if (column.hide === undefined || !column.hide) {
      if (column.searchDefaultVal !== undefined) {
        searchObjDefault[column.searchObjField] = column.searchDefaultVal;
      } else if (column.customFilter !== undefined && column.customFilter) {
        searchObjDefault.customFilter = column.customFilterVal ?? "";
      } else searchObjDefault[column.searchObjField] = "";
    }
  }
  return searchObjDefault;
};
