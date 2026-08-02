import React from "react";
import Modal from "../../../../utils/Modal/Modal";
import SelectOptionsPicker from "../../../SelectOptionsPicker/SelectOptionsPicker";
import type { SelectOptionsPickerOptionObj } from "../../../SelectOptionsPicker/SelectOptionsPicker.types";
import type { CaseItemSuggestion } from "@petec/shared";
import { CaseItemSuggestions } from "../../../../features/case-suggestions/CaseItemSuggestions";
import type { EnabledCaseSuggestionCategory } from "../../../../features/case-suggestions/caseSuggestion.config";

interface CaseDetailsOptionsModalProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  optionsList: SelectOptionsPickerOptionObj[];
  selectedOptionsList: SelectOptionsPickerOptionObj[];
  initialOptionsList: SelectOptionsPickerOptionObj[];
  selectOptionsUrl: string;
  patientId: string;
  suggestionCategory: EnabledCaseSuggestionCategory;
  suggestionInvalidationKey: string;
  onSuggestionSelected: (suggestion: CaseItemSuggestion) => void;
  setSelectedOptionsList: React.Dispatch<
    React.SetStateAction<SelectOptionsPickerOptionObj[]>
  >;
  onConfirm: (selectedOptions: SelectOptionsPickerOptionObj[]) => void;
}

export const CaseDetailsOptionsModal = ({
  isOpen,
  setIsOpen,
  optionsList,
  selectedOptionsList,
  initialOptionsList,
  selectOptionsUrl,
  patientId,
  suggestionCategory,
  suggestionInvalidationKey,
  onSuggestionSelected,
  setSelectedOptionsList,
  onConfirm,
}: CaseDetailsOptionsModalProps) => {
  if (!isOpen) {
    return null;
  }

  return (
    <Modal
      setIsOpen={setIsOpen}
      size="md"
      className="case-details-options-picker-modal"
      component={
        <div className="case-details-options-modal" dir="rtl" lang="he">
          <SelectOptionsPicker
            optionsList={optionsList}
            afterConfirmation={onConfirm}
            selectedOptionsList={selectedOptionsList}
            confirmationBaselineOptions={initialOptionsList}
            setStateSelectedOptions={setSelectedOptionsList}
            selectOptionsUrl={selectOptionsUrl}
            requireSelectionChangeForConfirmation={true}
            confirmationPreamble={
              <CaseItemSuggestions
                patientId={patientId}
                category={suggestionCategory}
                currentItems={selectedOptionsList}
                invalidationKey={suggestionInvalidationKey}
                onSuggestionSelected={onSuggestionSelected}
              />
            }
          />
        </div>
      }
    />
  );
};
