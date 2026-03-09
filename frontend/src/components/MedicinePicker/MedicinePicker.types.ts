import type { Dispatch, SetStateAction } from "react";
import type {
    CaseDetailsResponseMedicineItemDTO,
    MedicineDTO,
    ReleaseMedicineDisplayDTO,
} from "@petec/shared";

type ReleaseMedicineDisplayBase = Omit<
    ReleaseMedicineDisplayDTO,
    "doseAmount" | "rangeMax" | "rangeMin" | "totalDose"
>;

type MedicineRecommendationFields = Pick<
    MedicineDTO,
    "rangeMax" | "rangeMin" | "totalDose"
>;

type NormalizedMedicineRecommendationFields = {
    [K in keyof MedicineRecommendationFields]?: Exclude<
        MedicineRecommendationFields[K],
        null | undefined
    >;
};

export type MedicineSelectOptionObj = ReleaseMedicineDisplayBase &
    NormalizedMedicineRecommendationFields & {
        id?: MedicineDTO["id"];
        doseAmount?: number;
        dosageText?: CaseDetailsResponseMedicineItemDTO["dosageText"];
    };

export interface MedicinePickerDraftSelection {
    medicineValue: string;
    routeOfAdministrationId: string;
    dosageFrequencyId: string;
    doseAmountInput: string;
}

export type MedicinePickerSelectableOption = MedicineSelectOptionObj & {
    isDisabled?: boolean;
};

export interface MedicinePickerProps {
    medicineList: MedicineSelectOptionObj[];
    afterConfirmation?: (selectedMedicines: MedicineSelectOptionObj[]) => void;
    selectedMedicinesList?: MedicineSelectOptionObj[];
    setStateSelectedMedicines?: Dispatch<
        SetStateAction<MedicineSelectOptionObj[]>
    >;
    isEdit?: boolean;
    animalWeight?: number;
    requireSelectionChangeForConfirmation?: boolean;
}
