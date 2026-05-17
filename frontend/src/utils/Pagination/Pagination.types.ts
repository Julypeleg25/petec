import { Dispatch, RefObject, SetStateAction } from "react";
import {
    QueryObj,
    RowData,
    SearchObj,
    PaginationBtns,
    TableFilterValue,
} from "../TableGenerator/TableGenerator.types";

export interface IPaginationProps<T extends RowData = RowData> {
    tableRef?: RefObject<HTMLDivElement | null>;
    tableSectionContainerRef: RefObject<HTMLDivElement | null>;
    getDataByQuery: (
        queryObj: QueryObj,
        pageNumber: number,
        filters: Record<string, TableFilterValue>,
        setDataSize: Dispatch<SetStateAction<number>>,
        setTableData: Dispatch<SetStateAction<T[]>>,
        setCurrentPage: Dispatch<SetStateAction<number>> | undefined,
        setDisablePaginationBtns: Dispatch<SetStateAction<PaginationBtns>>,
        setLoading: Dispatch<SetStateAction<boolean>>
    ) => Promise<void>;
    dataSize: number;
    rowsPerPage: number;
    queryObj: QueryObj;
    filters: Record<string, TableFilterValue>;
    setDataSize: Dispatch<SetStateAction<number>>;
    setTableData: Dispatch<SetStateAction<T[]>>;
    currentPage: number;
    setCurrentPage: Dispatch<SetStateAction<number>>;
    disablePaginationBtns: PaginationBtns;
    setDisablePaginationBtns: Dispatch<SetStateAction<PaginationBtns>>;
    searchObjDefault: SearchObj;
    setSearchObj: Dispatch<SetStateAction<SearchObj>>;
    setLoading: Dispatch<SetStateAction<boolean>>;
}
