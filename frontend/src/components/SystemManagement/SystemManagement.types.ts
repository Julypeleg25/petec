import type { RowData } from "../../utils/TableGenerator/TableGenerator.types";

export interface ISaveSystemProps {
    systemTypeObj: RowData | null;
    setShowSaveSystemType: (show: boolean) => void;
}

export interface ISystemManagementProps {
    type?: string;
}
