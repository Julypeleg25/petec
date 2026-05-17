import { Dispatch, SetStateAction } from "react";
import { PaginationBtns } from "../TableGenerator/TableGenerator.types";

export const arePaginationBtnsEqual = (
    a: PaginationBtns,
    b: PaginationBtns
): boolean =>
    a.disableBtnBack === b.disableBtnBack &&
    a.disableBtnFirstPage === b.disableBtnFirstPage &&
    a.disableBtnNext === b.disableBtnNext &&
    a.disableBtnLastPage === b.disableBtnLastPage;

export const getTotalPages = (dataSize: number, rowsPerPage: number): number => {
    if (dataSize === -1 || rowsPerPage === 0) {
        return 1;
    }

    return Math.max(1, Math.ceil(dataSize / rowsPerPage));
};

export const initPaginationBtns = (
    dataSize: number,
    rowsPerPage: number,
    setDisablePaginationBtns: Dispatch<SetStateAction<PaginationBtns>>
) => {
    if (dataSize !== -1) {
        const totalPages = getTotalPages(dataSize, rowsPerPage);
        const nextState: PaginationBtns =
            totalPages <= 1
                ? {
                    disableBtnBack: true,
                    disableBtnFirstPage: true,
                    disableBtnNext: true,
                    disableBtnLastPage: true,
                }
                : {
                    disableBtnNext: false,
                    disableBtnLastPage: false,
                    disableBtnBack: true,
                    disableBtnFirstPage: true,
                };

        setDisablePaginationBtns((prevState) =>
            arePaginationBtnsEqual(prevState, nextState) ? prevState : nextState
        );
    }
};
