export interface DatePickerProps {
    placeholder?: string;
    name?: string;
    labelText?: string;
    isRequired?: boolean;
    state?: string | Date | null;
    setState?: (val: string | Date | null, params?: object | string | number, fieldName?: string) => void;
    width?: string;
    min?: number | string;
    max?: number | string;
    id?: string;
    disabled?: boolean;
    setStateParams?: object | string | number;
    afterChange?: (value: string) => void; 
}
