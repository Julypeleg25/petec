export interface FormTextareaProps {
    placeholder?: string;
    name?: string;
    labelText?: string;
    isRequired?: boolean;
    state?: string | null;
    setState?: (val: string, params?: object | string | number, fieldName?: string) => void;
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
    setStateParams?: object | string | number;
    readOnly?: boolean;
    defaultValue?: string;
    afterChange?: () => void;
    className?: string;
}
