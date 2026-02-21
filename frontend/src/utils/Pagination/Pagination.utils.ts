import { Dispatch, SetStateAction } from "react";
import { PaginationBtns } from "../TableGenerator/TableGenerator.types";

export const initPaginationBtns = (
    dataSize: number,
    rowsPerPage: number,
    disablePaginationBtns: PaginationBtns,
    setDisablePaginationBtns: Dispatch<SetStateAction<PaginationBtns>>
) => {
    if (dataSize !== -1) {
        if (dataSize <= rowsPerPage || rowsPerPage === 0) {
            setDisablePaginationBtns({
                ...disablePaginationBtns,
                disableBtnBack: true,
                disableBtnFirstPage: true,
                disableBtnNext: true,
                disableBtnLastPage: true,
            });
        } else {
            setDisablePaginationBtns({
                ...disablePaginationBtns,
                disableBtnNext: false,
                disableBtnLastPage: false,
                disableBtnBack: true,
                disableBtnFirstPage: true,
            });
        }
    }
};
