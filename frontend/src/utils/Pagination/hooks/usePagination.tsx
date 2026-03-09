import { useEffect, useState } from "react";
import { IPaginationProps } from "../Pagination.types";
import {
  arePaginationBtnsEqual,
  getTotalPages,
  initPaginationBtns,
} from "../Pagination.utils";
import {
  PaginationBtns,
  RowData,
  TableFilterValue,
} from "../../TableGenerator/TableGenerator.types";

export function usePagination<T extends RowData = RowData>({
  getDataByQuery,
  dataSize,
  rowsPerPage,
  queryObj,
  filters,
  setDataSize,
  setTableData,
  currentPage,
  setCurrentPage,
  setDisablePaginationBtns,
  setLoading,
}: Omit<IPaginationProps<T>, "tableRef">) {
  const [pageSearch, setPageSearch] = useState(currentPage);

  const loadPage = async (
    nextPage: number,
    pageNumber: number,
    nextFilters: Record<string, TableFilterValue>,
  ) => {
    setLoading(true);
    setCurrentPage(nextPage);
    setPageSearch(nextPage);
    await getDataByQuery(
      queryObj,
      pageNumber,
      nextFilters,
      setDataSize,
      setTableData,
      undefined,
      setDisablePaginationBtns,
      setLoading,
    );
    handlePageChange(nextPage);
  };

  const handleClickBack = async () => {
    await loadPage(currentPage - 1, currentPage - 2, filters);
  };

  const handleClickNext = async () => {
    await loadPage(currentPage + 1, currentPage, filters);
  };

  const handleClickFirstPage = async () => {
    await loadPage(1, 0, filters);
  };

  const handleClickLastPage = async () => {
    const lastPage = getTotalPages(dataSize, rowsPerPage);
    await loadPage(lastPage, lastPage - 1, filters);
  };

  const handlePageNumberSearch = async (pageNumber: number) => {
    await loadPage(pageNumber + 1, pageNumber, filters);
  };

  const handleReload = async () => {
    await loadPage(1, 0, {});
  };

  const handlePageChange = (newPage: number) => {
    const totalPages = getTotalPages(dataSize, rowsPerPage);

    const nextState: PaginationBtns =
      newPage <= 1
        ? {
            disableBtnBack: true,
            disableBtnFirstPage: true,
            disableBtnNext: totalPages <= 1,
            disableBtnLastPage: totalPages <= 1,
          }
        : newPage >= totalPages
        ? {
            disableBtnBack: false,
            disableBtnFirstPage: false,
            disableBtnNext: true,
            disableBtnLastPage: true,
          }
        : {
            disableBtnBack: false,
            disableBtnFirstPage: false,
            disableBtnNext: false,
            disableBtnLastPage: false,
          };

    setDisablePaginationBtns((prevState) =>
      arePaginationBtnsEqual(prevState, nextState) ? prevState : nextState
    );
  };

  useEffect(() => {
    initPaginationBtns(dataSize, rowsPerPage, setDisablePaginationBtns);
    setPageSearch(currentPage);
  }, [dataSize, currentPage, rowsPerPage, setDisablePaginationBtns]);

  return {
    pageSearch,
    setPageSearch,
    handleClickBack,
    handleClickNext,
    handleClickFirstPage,
    handleClickLastPage,
    handlePageNumberSearch,
    handleReload,
  };
}
