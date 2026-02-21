export interface SelectOptionObj {
    value: string;
    text: string;
}

export interface FormSelectProps {
    elements?: {
        value: string;
        text: string;
    }[];
    getElementsFunc?: () => Promise<[{ value: string; text: string }]>;
    icon?: JSX.Element;
    width?: string;
    optionState?: string;
    setOptionState?: React.Dispatch<React.SetStateAction<string>>;
    selectId?: string;
    isRequired?: boolean;
    afterSelect?: (selectedValue: any, setStateParams?: any) => void;
    labelText?: string;
    disabled?: boolean;
    isDescOrder?: boolean;
    isOrdered?: boolean;
}
