export interface FormInputProps {
    placeholder?: string;
    type?: "text" | "number" | "password" | "email" | "tel" | "date";
    icon?: JSX.Element;
    name?: string;
    labelText?: string;
    isRequired?: boolean;
    state?: string | number | null;
    setState?: (val: string, params?: object | string | number, fieldName?: string) => void;
    width?: string;
    minLength?: number;
    maxLength?: number;
    min?: number | string;
    max?: number | string;
    id?: string;
    disabled?: boolean;
    setStateParams?: object | string | number;
    className?: string;
    isLink?: boolean;
}
