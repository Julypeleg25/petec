export interface FormInputProps {
    placeholder?: string;
    type?: "text" | "number" | "password" | "email" | "tel" | "date";
    icon?: JSX.Element;
    name?: string;
    labelText?: string;
    isRequired?: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    state?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setState?: React.SetStateAction<any>;
    width?: string;
    minLength?: number;
    maxLength?: number;
    min?: number | string;
    max?: number | string;
    id?: string;
    disabled?: boolean;
    setStateParams?: any;
    className?: string;
    isLink?: boolean;
}
