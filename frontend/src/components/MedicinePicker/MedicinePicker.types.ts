import type { Dispatch, ReactNode, SetStateAction } from "react";
import type {
  CaseDetailsResponseMedicineItemDTO,
  MedicineDTO,
  ReleaseMedicineDisplayDTO,
  CaseSuggestionReference,
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
    suggestionReference?: CaseSuggestionReference;
  };

export interface MedicinePickerDraftSelection {
  medicineValue: string;
  routeOfAdministrationId: string;
  dosageFrequencyId: string;
  doseAmountInput: string;
  comments: string;
}

export type MedicinePickerSelectableOption = MedicineSelectOptionObj & {
  isDisabled?: boolean;
};

export interface MedicinePickerProps {
  medicineList: MedicineSelectOptionObj[];
  afterConfirmation?: (selectedMedicines: MedicineSelectOptionObj[]) => void;
  selectedMedicinesList?: MedicineSelectOptionObj[];
  confirmationBaselineMedicines?: MedicineSelectOptionObj[];
  setStateSelectedMedicines?: Dispatch<
    SetStateAction<MedicineSelectOptionObj[]>
  >;
  isEdit?: boolean;
  animalWeight?: number;
  requireSelectionChangeForConfirmation?: boolean;
  confirmationPreamble?: ReactNode;
}
