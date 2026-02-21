import { Dispatch, RefObject, SetStateAction } from "react";
import {
    QueryObj,
    RowData,
    SearchObj,
    PaginationBtns,
} from "../TableGenerator/TableGenerator.types";

export interface IPaginationProps<T extends RowData = RowData> {
    tableRef?: RefObject<HTMLDivElement | null>;
    tableSectionContainerRef: RefObject<HTMLDivElement | null>;
    getDataByQuery: (
        queryObj: QueryObj,
        pageNumber: number,
        filters: Record<string, string | number | boolean>,
        setDataSize: Dispatch<SetStateAction<number>>,
        setTableData: Dispatch<SetStateAction<T[]>>,
        setCurrentPage: Dispatch<SetStateAction<number>> | undefined,
        disablePaginationBtns: PaginationBtns,
        setDisablePaginationBtns: Dispatch<SetStateAction<PaginationBtns>>,
        tableSectionContainerRef: RefObject<HTMLDivElement | null>,
        setSearch: Dispatch<SetStateAction<T[]>> | undefined,
        setLoading: Dispatch<SetStateAction<boolean>>
    ) => Promise<void>;
    dataSize: number;
    rowsPerPage: number;
    queryObj: QueryObj;
    filters: Record<string, string | number | boolean>;
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
