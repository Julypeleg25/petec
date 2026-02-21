import { useEffect, useState } from "react";
import { IPaginationProps } from "./Pagination.types";
import { initPaginationBtns } from "./Pagination.utils";
import { RowData } from "../TableGenerator/TableGenerator.types";

export function usePagination<T extends RowData = RowData>({
  tableSectionContainerRef,
  getDataByQuery,
  dataSize,
  rowsPerPage,
  queryObj,
  filters,
  setDataSize,
  setTableData,
  currentPage,
  setCurrentPage,
  disablePaginationBtns,
  setDisablePaginationBtns,
  searchObjDefault,
  setSearchObj,
  setLoading,
}: Omit<IPaginationProps<T>, "tableRef">) {
  const [pageSearch, setPageSearch] = useState(currentPage);

  const handleClickBack = async () => {
    setLoading(true);
    setCurrentPage(currentPage - 1);
    setPageSearch(currentPage - 1);
    await getDataByQuery(
      queryObj,
      currentPage - 2,
      filters,
      setDataSize,
      setTableData,
      undefined,
      disablePaginationBtns,
      setDisablePaginationBtns,
      tableSectionContainerRef,
      undefined,
      setLoading
    );
    handlePageChange(currentPage - 1);
  };

  const handleClickNext = async () => {
    setLoading(true);
    setCurrentPage(currentPage + 1);
    setPageSearch(currentPage + 1);
    await getDataByQuery(
      queryObj,
      currentPage,
      filters,
      setDataSize,
      setTableData,
      undefined,
      disablePaginationBtns,
      setDisablePaginationBtns,
      tableSectionContainerRef,
      undefined,
      setLoading
    );
    handlePageChange(currentPage + 1);
  };

  const handleClickFirstPage = async () => {
    setLoading(true);
    setCurrentPage(1);
    setPageSearch(1);
    await getDataByQuery(
      queryObj,
      0,
      filters,
      setDataSize,
      setTableData,
      undefined,
      disablePaginationBtns,
      setDisablePaginationBtns,
      tableSectionContainerRef,
      undefined,
      setLoading
    );
    handlePageChange(0);
  };

  const handleClickLastPage = async () => {
    setLoading(true);
    const lastPage = Math.ceil(dataSize / rowsPerPage);
    setCurrentPage(lastPage);
    setPageSearch(lastPage);
    await getDataByQuery(
      queryObj,
      lastPage - 1,
      filters,
      setDataSize,
      setTableData,
      undefined,
      disablePaginationBtns,
      setDisablePaginationBtns,
      tableSectionContainerRef,
      undefined,
      setLoading
    );

    handlePageChange(lastPage);
  };

  const handlePageNumberSearch = async (pageNumber: number) => {
    setLoading(true);
    setCurrentPage(pageNumber + 1);
    setPageSearch(pageNumber + 1);
    await getDataByQuery(
      queryObj,
      pageNumber,
      filters,
      setDataSize,
      setTableData,
      undefined,
      disablePaginationBtns,
      setDisablePaginationBtns,
      tableSectionContainerRef,
      undefined,
      setLoading
    );
    handlePageChange(pageNumber + 1);
  };

  const handleReload = async () => {
    setLoading(true);
    setCurrentPage(1);
    setPageSearch(1);
    await getDataByQuery(
      queryObj,
      0,
      {},
      setDataSize,
      setTableData,
      undefined,
      disablePaginationBtns,
      setDisablePaginationBtns,
      tableSectionContainerRef,
      undefined,
      setLoading
    );
    handlePageChange(0);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage <= 1) {
      setDisablePaginationBtns({
        ...disablePaginationBtns,
        disableBtnBack: true,
        disableBtnFirstPage: true,
        disableBtnNext: false,
        disableBtnLastPage: false,
      });
    } else if (newPage === Math.ceil(dataSize / rowsPerPage)) {
      setDisablePaginationBtns({
        ...disablePaginationBtns,
        disableBtnBack: false,
        disableBtnFirstPage: false,
        disableBtnNext: true,
        disableBtnLastPage: true,
      });
    } else {
      setDisablePaginationBtns({
        ...disablePaginationBtns,
        disableBtnBack: false,
        disableBtnFirstPage: false,
        disableBtnNext: false,
        disableBtnLastPage: false,
      });
    }
  };

  useEffect(() => {
    initPaginationBtns(
      dataSize,
      rowsPerPage,
      disablePaginationBtns,
      setDisablePaginationBtns
    );
    setPageSearch(currentPage);
  }, [dataSize, currentPage, rowsPerPage, disablePaginationBtns, setDisablePaginationBtns]);

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
