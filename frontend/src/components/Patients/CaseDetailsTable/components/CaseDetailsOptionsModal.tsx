import React from "react";
import Modal from "../../../../utils/Modal/Modal";
import SelectOptionsPicker from "../../../SelectOptionsPicker/SelectOptionsPicker";
import type { SelectOptionsPickerOptionObj } from "../../../SelectOptionsPicker/SelectOptionsPicker.types";

interface CaseDetailsOptionsModalProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  optionsList: SelectOptionsPickerOptionObj[];
  selectedOptionsList: SelectOptionsPickerOptionObj[];
  selectOptionsUrl: string;
  onConfirm: (selectedOptions: SelectOptionsPickerOptionObj[]) => void;
}

export const CaseDetailsOptionsModal = ({
  isOpen,
  setIsOpen,
  optionsList,
  selectedOptionsList,
  selectOptionsUrl,
  onConfirm,
}: CaseDetailsOptionsModalProps) => {
  if (!isOpen) {
    return null;
  }

  return (
    <Modal
      setIsOpen={setIsOpen}
      component={
        <div className="case-details-options-modal">
          <SelectOptionsPicker
            optionsList={optionsList}
            afterConfirmation={onConfirm}
            selectedOptionsList={selectedOptionsList}
            selectOptionsUrl={selectOptionsUrl}
            requireSelectionChangeForConfirmation={true}
          />
        </div>
      }
      closeWhenClickOutside={false}
    />
  );
};
