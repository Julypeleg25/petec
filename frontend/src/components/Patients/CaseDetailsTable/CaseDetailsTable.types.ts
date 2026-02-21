import { MedicineSelectOptionObj } from "../../MedicinePicker/MedicinePicker.types";
import { SelectOptionsPickerOptionObj } from "../../SelectOptionsPicker/SelectOptionsPicker.types";

export interface caseDetailsData {
    id?: number;
    index: number;
    time: string;
    date?: string;
    T: string | null;
    T_is_required: boolean;
    T_is_editable: boolean;
    P: string | null;
    P_is_required: boolean;
    P_is_editable: boolean;
    R: string | null;
    R_is_required: boolean;
    R_is_editable: boolean;
    fluids: MedicineSelectOptionObj[];
    medicines: MedicineSelectOptionObj[];
    foodExtras: SelectOptionsPickerOptionObj[];
    examinations: SelectOptionsPickerOptionObj[];
    procedures: SelectOptionsPickerOptionObj[];
    foodAndWater: string | null;
    foodAndWater_is_required: boolean;
    foodAndWater_is_editable: boolean;
    urineTypeId: number | null;
    urineTypeText: string | null;
    urineComments: string | null;
    urine_is_required: boolean;
    urine_is_editable: boolean;
    fecesTypeId: number | null;
    fecesTypeText: string | null;
    fecesComments: string | null;
    feces_is_required: boolean;
    feces_is_editable: boolean;
    isTravel: boolean | null;
    isTravel_is_required: boolean;
    isTravel_is_editable: boolean;
    isBoxClean: boolean | null;
    isBoxClean_is_required: boolean;
    isBoxClean_is_editable: boolean;
    isRelease: boolean | null;
    isRelease_is_required: boolean;
    isRelease_is_editable: boolean;
    weigh: string | null;
    weigh_is_required: boolean;
    weigh_is_editable: boolean;
    isPuke: boolean | null;
    pukeComments: string | null;
    puke_is_required: boolean;
    puke_is_editable: boolean;
    comments: string | null;
    comments_is_required: boolean;
    comments_is_editable: boolean;
    ownerUpdate: string | null;
    ownerUpdate_is_required: boolean;
    ownerUpdate_is_editable: boolean;
}

import type { AnimalVitalDTO } from "@petec/shared";

export interface CaseDetailsTableProps {
    handleCellClick: (
        event: React.MouseEvent<HTMLElement>,
        currentIsEditableVal: boolean
    ) => Promise<boolean | null>;
    caseDetailsList: caseDetailsData[][];
    setCaseDetailsList: React.Dispatch<React.SetStateAction<caseDetailsData[][]>>;
    caseDetailsDataIndex: number;
    paintingMode: boolean;
    animalWeight: number | undefined;
    animalId: number;
}



export interface CellComponentProps {
    index: number;
    isComment?: boolean;
    commentValName?: string;
    formTextareaElementId?: string;
    caseDetailsList: caseDetailsData[][];
    caseDetailsDataIndex: number;
    handleInputChange?: (e?: React.ChangeEvent<HTMLInputElement>, setStateParams?: any, value?: any, valName?: string) => void;
    setCaseDetailsList?: React.Dispatch<React.SetStateAction<caseDetailsData[][]>>;
}

export interface BooleanCellProps extends CellComponentProps {
    valName: string;
}

export interface SelectCellProps extends CellComponentProps {
    selectElement: React.ReactNode;
}

export interface MedicineCommentCellProps extends CellComponentProps {
    medicineId: number;
    type: string;
    caseDetailsPopUpId: string;
}

export interface AnimalVitals {
    tempRangeMax: number | undefined;
    tempRangeMin: number | undefined;
    pulseRangeMax: number | undefined;
    pulseRangeMin: number | undefined;
    respirationRangeMax: number | undefined;
    respirationRangeMin: number | undefined;
}
