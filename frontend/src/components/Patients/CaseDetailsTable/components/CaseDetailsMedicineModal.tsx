import React from "react";
import Modal from "../../../../utils/Modal/Modal";
import MedicinePicker from "../../../MedicinePicker/MedicinePicker";
import type { MedicineSelectOptionObj } from "../../../MedicinePicker/MedicinePicker.types";

interface CaseDetailsMedicineModalProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  medicineList: MedicineSelectOptionObj[];
  selectedMedicinesList: MedicineSelectOptionObj[];
  animalWeight?: number;
  onConfirm: (selectedMedicines: MedicineSelectOptionObj[]) => void;
}

export const CaseDetailsMedicineModal = ({
  isOpen,
  setIsOpen,
  medicineList,
  selectedMedicinesList,
  animalWeight,
  onConfirm,
}: CaseDetailsMedicineModalProps) => {
  if (!isOpen) {
    return null;
  }

  return (
    <Modal
      setIsOpen={setIsOpen}
      component={
        <div className="case-details-medicine-modal">
          <MedicinePicker
            medicineList={medicineList}
            animalWeight={animalWeight}
            afterConfirmation={onConfirm}
            selectedMedicinesList={selectedMedicinesList}
            requireSelectionChangeForConfirmation={true}
          />
        </div>
      }
      closeWhenClickOutside={false}
    />
  );
};
