import type { GetTableDataDTO } from "@petec/shared";
import { ColumnDef } from "../../types/table.types";

export type RowData = Record<string, string | number | boolean | null | undefined | object>;
export type SearchObj = Record<string, string | number | boolean>;
export const TABLE_SORT_DIRECTIONS = {
    ASC: "ASC",
    DESC: "DESC",
} as const;
export type TableSortDirection = (typeof TABLE_SORT_DIRECTIONS)[keyof typeof TABLE_SORT_DIRECTIONS];
export type OrderByObj = Record<string, TableSortDirection>;
export type TableFilterValue = GetTableDataDTO["filters"][string];

export type PaginationBtns = {
    disableBtnNext: boolean;
    disableBtnBack: boolean;
    disableBtnLastPage: boolean;
    disableBtnFirstPage: boolean;
};

export interface QueryObj {
    query: GetTableDataDTO["tableName"];
    orderBy?: OrderByObj;
    filters?: GetTableDataDTO["filters"];
    args?: GetTableDataDTO["args"];
    formatting?: Record<string, string>;
    variables?: Record<string, string>;
    isManagedTable?: boolean;
}

export interface TableBtnConfig<T> {
    id: number;
    title?: string;
    btnText: React.ReactNode;
    btnClassName: string;
    onClick: (rowData: T) => void;
    activate?: (rowData: T) => boolean;
    hide?: boolean;
}

export interface TableDataResponse<T> {
    items: T[];
    total: number;
}

export interface ITableGeneratorProps<T> {
    queryObj: QueryObj;
    columnsData: ColumnDef[];
    paginationPerPage?: number;
    btns?: TableBtnConfig<T>[];
    setOnRowClicked?: (row: T) => void;
    setOnDoubleRowClicked?: (row: T) => void;
    reload?: boolean;
    extraTableStyling?: React.CSSProperties;
    isCards?: boolean;
    customCard?: (row: T, index: number) => React.ReactNode;
    hiddenCardWidth?: string;
    hiddenCardMargin?: string;
}
