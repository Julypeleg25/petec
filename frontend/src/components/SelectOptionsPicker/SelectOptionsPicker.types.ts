import type { Dispatch, SetStateAction } from "react";

export interface SelectOptionsPickerOptionObj {
    id?: number;
    value: string;
    text: string;
}

export interface SelectOptionsPickerProps {
    optionsList: SelectOptionsPickerOptionObj[];
    afterConfirmation?: (selectedOptions: SelectOptionsPickerOptionObj[]) => void;
    selectedOptionsList?: SelectOptionsPickerOptionObj[];
    setStateSelectedOptions?: Dispatch<
        SetStateAction<SelectOptionsPickerOptionObj[]>
    >;
    selectOptionsUrl: string;
    isEdit?: boolean;
    requireSelectionChangeForConfirmation?: boolean;
}
