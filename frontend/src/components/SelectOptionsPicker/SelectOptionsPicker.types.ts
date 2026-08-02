import type { Dispatch, ReactNode, SetStateAction } from "react";
import type { CaseSuggestionReference } from "@petec/shared";

export interface SelectOptionsPickerOptionObj {
  id?: number;
  value: string;
  text: string;
  suggestionReference?: CaseSuggestionReference;
}

export interface SelectOptionsPickerProps {
  optionsList: SelectOptionsPickerOptionObj[];
  afterConfirmation?: (selectedOptions: SelectOptionsPickerOptionObj[]) => void;
  selectedOptionsList?: SelectOptionsPickerOptionObj[];
  confirmationBaselineOptions?: SelectOptionsPickerOptionObj[];
  setStateSelectedOptions?: Dispatch<
    SetStateAction<SelectOptionsPickerOptionObj[]>
  >;
  selectOptionsUrl: string;
  isEdit?: boolean;
  requireSelectionChangeForConfirmation?: boolean;
  confirmationPreamble?: ReactNode;
}
