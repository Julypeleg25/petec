export interface RangeSliderProps {
    min: number;
    max: number;
    step: number;
    initialValue?: number;
    label?: string;
    onChange?: (value: number) => void;
    reload?: boolean;
}
