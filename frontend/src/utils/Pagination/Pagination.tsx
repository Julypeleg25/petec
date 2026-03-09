import { IoIosArrowForward, IoIosArrowBack } from "react-icons/io";
import { MdLastPage, MdFirstPage } from "react-icons/md";
import { ImLoop2 } from "react-icons/im";
import { IPaginationProps } from "./Pagination.types";
import { usePagination } from "./hooks/usePagination";
import { getTotalPages } from "./Pagination.utils";
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

  const totalPages = getTotalPages(dataSize, rowsPerPage);
  const hasRows = dataSize > 0;
  const rangeStart = hasRows ? (currentPage - 1) * rowsPerPage + 1 : 0;
  const rangeEnd = hasRows ? Math.min(currentPage * rowsPerPage, dataSize) : 0;

  const handlePageInputSubmit = (rawValue: string) => {
    const value = Number.parseInt(rawValue, 10);
    if (isNaN(value) || value > totalPages || value < 1) {
      setPageSearch(currentPage);
      return;
    }

    if (currentPage !== value) {
      handlePageNumberSearch(value - 1).then(() => {
        setLoading(false);
      });
    }
  };

  return (
    <div
      id="Pagination"
      className={`Pagination ${dataSize === 0 ? "pagination-disabled" : ""}`}
    >
      <div className="pagination-pages-numbers">
        {`${rangeStart} - ${rangeEnd} מתוך ${dataSize < 0 ? 0 : dataSize}`}
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
          <MdLastPage size={25} />
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
          <IoIosArrowForward size={25} />
        </button>
        <div className="pagination-current-page">
          <span className="pagination-current-page-content">
            <input
              type="number"
              min={1}
              max={totalPages}
              aria-label="מספר עמוד"
              value={pageSearch}
              className="search-page-input"
              onChange={(e) => {
                const val = Number.parseInt(e.target.value, 10);
                if (!isNaN(val)) setPageSearch(val);
              }}
              onBlur={(e) => {
                handlePageInputSubmit(e.target.value);
              }}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter") {
                  handlePageInputSubmit(e.currentTarget.value);
                }
              }}
            />
            <span>
              מתוך {totalPages}
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
          <IoIosArrowBack size={25} />
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
          <MdFirstPage size={25} />
        </button>
        <button
          id="reload-table-btn"
          className="reload-table-btn"
          onClick={() => {
            handleReload().then(() => {
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
