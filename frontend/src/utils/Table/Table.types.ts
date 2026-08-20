type TableButtonBase = {
    title?: string;
    btnClassName?: string;
    btnText?: React.ReactNode;
    btnId?: string;
    hide?: boolean;
    customBtn?: React.ReactNode;
    extraBtnStyle?: React.CSSProperties;
};

export type TableButtonConfig<T> = TableButtonBase & (
    | {
        activate: (row: T) => boolean;
        onClick: (row: T) => void;
    }
    | {
        activate?: undefined;
        onClick: () => void;
    }
);

export interface TableProps<T> {
    tableContainerRef: React.RefObject<HTMLDivElement>;
    tableSectionContainerRef: React.RefObject<HTMLDivElement>;
    columns: { name: React.ReactNode; selector?: (row: T) => React.ReactNode | object; cell?: (row: T) => React.ReactNode; minWidth?: string; center?: boolean; hide?: boolean }[];
    data: T[];
    onRowClicked?: (row: T, e: React.MouseEvent) => void;
    onRowDoubleClicked?: (row: T) => void;
    btns?: TableButtonConfig<T>[];
    isLoading: boolean;
    extraTableStyling?: React.CSSProperties;
}
