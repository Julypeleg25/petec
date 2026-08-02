import React from "react";
import Modal from "../../../../utils/Modal/Modal";
import MedicinePicker from "../../../MedicinePicker/MedicinePicker";
import type { MedicineSelectOptionObj } from "../../../MedicinePicker/MedicinePicker.types";
import type { CaseItemSuggestion } from "@petec/shared";
import { CaseItemSuggestions } from "../../../../features/case-suggestions/CaseItemSuggestions";
import type { EnabledCaseSuggestionCategory } from "../../../../features/case-suggestions/caseSuggestion.config";

interface CaseDetailsMedicineModalProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  title: string;
  medicineList: MedicineSelectOptionObj[];
  selectedMedicinesList: MedicineSelectOptionObj[];
  initialMedicinesList: MedicineSelectOptionObj[];
  animalWeight?: number;
  patientId: string;
  suggestionCategory: EnabledCaseSuggestionCategory;
  suggestionInvalidationKey: string;
  onSuggestionSelected: (suggestion: CaseItemSuggestion) => void;
  setSelectedMedicinesList: React.Dispatch<
    React.SetStateAction<MedicineSelectOptionObj[]>
  >;
  onConfirm: (selectedMedicines: MedicineSelectOptionObj[]) => void;
}

export const CaseDetailsMedicineModal = ({
  isOpen,
  setIsOpen,
  title,
  medicineList,
  selectedMedicinesList,
  initialMedicinesList,
  animalWeight,
  patientId,
  suggestionCategory,
  suggestionInvalidationKey,
  onSuggestionSelected,
  setSelectedMedicinesList,
  onConfirm,
}: CaseDetailsMedicineModalProps) => {
  if (!isOpen) {
    return null;
  }

  return (
    <Modal
      setIsOpen={setIsOpen}
      size="lg"
      className="case-details-medicine-picker-modal"
      component={
        <div className="case-details-medicine-modal" dir="rtl" lang="he">
          <h2 className="case-details-modal-title modal-dialog-title">
            {title}
          </h2>
          <MedicinePicker
            medicineList={medicineList}
            animalWeight={animalWeight}
            afterConfirmation={onConfirm}
            selectedMedicinesList={selectedMedicinesList}
            confirmationBaselineMedicines={initialMedicinesList}
            setStateSelectedMedicines={setSelectedMedicinesList}
            requireSelectionChangeForConfirmation={true}
            confirmationPreamble={
              <CaseItemSuggestions
                patientId={patientId}
                category={suggestionCategory}
                currentItems={selectedMedicinesList}
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
