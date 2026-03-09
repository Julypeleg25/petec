export interface SelectOptionObj {
    value: string;
    text: string;
    isDisabled?: boolean;
}

export interface FormSelectProps {
    elements?: {
        value: string;
        text: string;
    isDisabled?: boolean;
    }[];
    getElementsFunc?: () => Promise<SelectOptionObj[]>;
    icon?: JSX.Element;
    width?: string;
    optionState?: string;
    setOptionState?: (value: string) => void;
    selectId?: string;
    isRequired?: boolean;
    afterSelect?: (selectedValue: string, selectedText?: string) => void;
    labelText?: string;
    disabled?: boolean;
    isDescOrder?: boolean;
    isOrdered?: boolean;
}
