export interface FormCheckboxProps {
    checked: boolean;
    setChecked: React.Dispatch<React.SetStateAction<boolean>>;
    labelText?: string;
    disabled?: boolean;
    afterChange?: (isChecked: any) => void;
}
