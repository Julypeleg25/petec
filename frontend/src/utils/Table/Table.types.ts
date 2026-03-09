export interface TableProps<T> {
    tableContainerRef: React.RefObject<HTMLDivElement>;
    tableSectionContainerRef: React.RefObject<HTMLDivElement>;
    columns: { name: React.ReactNode; selector?: (row: T) => React.ReactNode | object; cell?: (row: T) => React.ReactNode; minWidth?: string; center?: boolean; hide?: boolean }[];
    data: T[];
    onRowClicked?: (row: T, e: React.MouseEvent) => void;
    onRowDoubleClicked?: (row: T) => void;
    btns?: { title?: string; btnClassName?: string; btnText?: React.ReactNode; btnId?: string; onClick: (row: T) => void; hide?: boolean; customBtn?: React.ReactNode; activate?: (row: T) => boolean; extraBtnStyle?: React.CSSProperties }[];
    isLoading: boolean;
    extraTableStyling?: React.CSSProperties;
}
