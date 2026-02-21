export interface MedicineSelectOptionObj {
    id?: string | number;
    value: string;
    text: string;
    measureUnitId: string | number;
    measureUnitText: string;
    frequencyId: string | number;
    frequencyText: string;
    doseAmount: number;
    medicineRouteId: string | number;
    medicineRouteText: string;
    rangeMax: number;
    rangeMin: number;
    totalDose: number;
    comments: string;
    defaultMedicineRouteId: string | number | null;
    defaultFrequencyId: string | number | null;
}

export interface IMedicinePickerProps {
    medicineList: MedicineSelectOptionObj[];
    afterConfirmation?: (selectedMedicines: MedicineSelectOptionObj[]) => void;
    selectedMedicinesList?: MedicineSelectOptionObj[];
    setStateSelectedMedicines?: React.Dispatch<
        React.SetStateAction<MedicineSelectOptionObj[]>
    >;
    isEdit?: boolean;
    animalWeight?: number;
}
