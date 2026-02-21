export interface SelectOptionsPickerOptionObj {
    id?: number;
    value: string;
    text: string;
}

export interface SystemTypeItem {
    id: string;
    name: string;
}

export interface SelectOptionsPickerProps {
    optionsList: SelectOptionsPickerOptionObj[];
    afterConfirmation?: (selectedOptions: SelectOptionsPickerOptionObj[]) => void;
    selectedOptionsList?: SelectOptionsPickerOptionObj[];
    setStateSelectedOptions?: React.Dispatch<
        React.SetStateAction<SelectOptionsPickerOptionObj[]>
    >;
    selectOptionsUrl: string;
    isEdit?: boolean;
}
