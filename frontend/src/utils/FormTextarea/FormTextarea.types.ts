export interface FormTextareaProps {
    placeholder?: string;
    name?: string;
    labelText?: string;
    isRequired?: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    state?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setState?: React.SetStateAction<any>;
    width?: string;
    minWidth?: string;
    maxWidth?: string;
    minLength?: number;
    maxLength?: number;
    height?: string;
    minHeight?: string;
    maxHeight?: string;
    id?: string;
    disabled?: boolean;
    isGrowHeightOnInput?: boolean;
    setStateParams?: any;
    readOnly?: boolean;
    defaultValue?: string;
    afterChange?: () => void;
    className?: string;
}
