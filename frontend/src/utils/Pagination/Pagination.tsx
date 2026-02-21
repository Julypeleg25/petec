import { IoIosArrowForward, IoIosArrowBack } from "react-icons/io";
import { MdLastPage, MdFirstPage } from "react-icons/md";
import { ImLoop2 } from "react-icons/im";
import { IPaginationProps } from "./Pagination.types";
import { usePagination } from "./usePagination";
import { RowData } from "../TableGenerator/TableGenerator.types";
import "./Pagination.css";

function Pagination<T extends RowData = RowData>({
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
}: IPaginationProps<T>) {
  const {
    pageSearch,
    setPageSearch,
    handleClickBack,
    handleClickNext,
    handleClickFirstPage,
    handleClickLastPage,
    handlePageNumberSearch,
    handleReload,
  } = usePagination<T>({
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
  });

  return (
    <div
      id="Pagination"
      className={`Pagination ${dataSize === 0 ? "pagination-disabled" : ""}`}
    >
      <div className="pagination-pages-numbers">
        {dataSize > 0 &&
          (currentPage === 1 ? 1 : (currentPage - 1) * rowsPerPage) +
            " - " +
            (currentPage * rowsPerPage > dataSize
              ? dataSize
              : currentPage * rowsPerPage) +
            " of " +
            dataSize}
      </div>
      <div className="pagination-btn-container">
        <button
          id="pagination-btn-first-page"
          className="pagination-btn"
          disabled={disablePaginationBtns.disableBtnFirstPage}
          onClick={() =>
            handleClickFirstPage().then(() => {
              setLoading(false);
            })
          }
        >
          <MdFirstPage size={25} />
        </button>
        <button
          id="pagination-btn-back"
          className="pagination-btn"
          disabled={disablePaginationBtns.disableBtnBack}
          onClick={() =>
            handleClickBack().then(() => {
              setLoading(false);
            })
          }
        >
          <IoIosArrowBack size={25} />
        </button>
        <div className="pagination-current-page">
          <span>
            <input
              value={pageSearch}
              className="search-page-input"
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (!isNaN(val)) setPageSearch(val);
              }}
              onBlur={(e) => {
                const lastPage =
                  dataSize === -1 || Math.ceil(dataSize / rowsPerPage) === 0
                    ? 1
                    : Math.ceil(dataSize / rowsPerPage);
                const value = parseInt(e.target.value);
                if (isNaN(value) || value > lastPage || value < 1) {
                  setPageSearch(currentPage);
                  return;
                }
                if (currentPage !== value) {
                  handlePageNumberSearch(value - 1).then(() => {
                    setLoading(false);
                  });
                }
              }}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter") {
                  const lastPage =
                    dataSize === -1 || Math.ceil(dataSize / rowsPerPage) === 0
                      ? 1
                      : Math.ceil(dataSize / rowsPerPage);
                  const value = parseInt(e.currentTarget.value);
                  if (isNaN(value) || value > lastPage || value < 1) {
                    setPageSearch(currentPage);
                    return;
                  }
                  handlePageNumberSearch(value - 1).then(() => {
                    setLoading(false);
                  });
                }
              }}
            />
            <span>
              of{" "}
              {dataSize === -1 || Math.ceil(dataSize / rowsPerPage) === 0
                ? 1
                : Math.ceil(dataSize / rowsPerPage)}
            </span>
          </span>
        </div>
        <button
          id="pagination-btn-next"
          className="pagination-btn"
          disabled={disablePaginationBtns.disableBtnNext}
          onClick={() =>
            handleClickNext().then(() => {
              setLoading(false);
            })
          }
        >
          <IoIosArrowForward size={25} />
        </button>
        <button
          id="pagination-btn-last-page"
          className="pagination-btn"
          disabled={disablePaginationBtns.disableBtnLastPage}
          onClick={() =>
            handleClickLastPage().then(() => {
              setLoading(false);
            })
          }
        >
          <MdLastPage size={25} />
        </button>
        <button
          id="reload-table-btn"
          className="reload-table-btn"
          onClick={() => {
            handleReload().then(() => {
              if (tableSectionContainerRef.current) {
                const searchInputs =
                  tableSectionContainerRef.current.getElementsByClassName(
                    "table-search-input"
                  ) as HTMLCollectionOf<HTMLInputElement>;
                for (let i = 0; i < searchInputs.length; i++) {
                  searchInputs[i].value = "";
                }
              }

              setSearchObj(searchObjDefault);
              setLoading(false);
            });
          }}
        >
          <ImLoop2 size={14} />
        </button>
      </div>
    </div>
  );
}

export default Pagination;
