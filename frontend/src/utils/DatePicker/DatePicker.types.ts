export interface DatePickerProps {
    placeholder?: string;
    name?: string;
    labelText?: string;
    isRequired?: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    state?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setState?: React.SetStateAction<any>;
    width?: string;
    min?: number | string;
    max?: number | string;
    id?: string;
    disabled?: boolean;
    setStateParams?: any;
    afterChange?: (value: any) => void;
}
