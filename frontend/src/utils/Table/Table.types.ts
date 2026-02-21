export interface TableProps<T> {
    tableContainerRef: React.RefObject<HTMLDivElement>;
    tableSectionContainerRef: React.RefObject<HTMLDivElement>;
    columns: any[];
    data: T[];
    onRowClicked?: (row: T, e: React.MouseEvent) => void;
    onRowDoubleClicked?: (row: T) => void;
    btns?: any[];
    isLoading: boolean;
    extraTableStyling?: React.CSSProperties;
}
