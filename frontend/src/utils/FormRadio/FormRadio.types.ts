export interface FormRadioProps {
    labelText?: string;
    className?: string;
    optionValue: boolean | null;
    setOptionValue: React.Dispatch<React.SetStateAction<boolean | null>>;
}
