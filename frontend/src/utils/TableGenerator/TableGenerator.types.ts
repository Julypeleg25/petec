export type RowData = Record<string, string | number | boolean | null | undefined | object>;
export type SearchObj = Record<string, string | number | boolean>;
export type OrderByObj = Record<string, "ASC" | "DESC">;

export type PaginationBtns = {
    disableBtnNext: boolean;
    disableBtnBack: boolean;
    disableBtnLastPage: boolean;
    disableBtnFirstPage: boolean;
};

export interface QueryObj {
    query: string;
    orderBy?: OrderByObj;
    filters?: Record<string, string>;
    args?: string[];
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
    columnsData: import("../../types").ColumnDef[];
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
