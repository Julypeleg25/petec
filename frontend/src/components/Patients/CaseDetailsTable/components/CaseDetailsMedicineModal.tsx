import React from "react";
import Modal from "../../../../utils/Modal/Modal";
import MedicinePicker from "../../../MedicinePicker/MedicinePicker";
import type { MedicineSelectOptionObj } from "../../../MedicinePicker/MedicinePicker.types";

interface CaseDetailsMedicineModalProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  title: string;
  medicineList: MedicineSelectOptionObj[];
  selectedMedicinesList: MedicineSelectOptionObj[];
  animalWeight?: number;
  onConfirm: (selectedMedicines: MedicineSelectOptionObj[]) => void;
}

export const CaseDetailsMedicineModal = ({
  isOpen,
  setIsOpen,
  title,
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
      size="lg"
      className="case-details-medicine-picker-modal"
      component={
        <div className="case-details-medicine-modal" dir="rtl" lang="he">
          <h2 className="case-details-modal-title modal-dialog-title">{title}</h2>
          <MedicinePicker
            medicineList={medicineList}
            animalWeight={animalWeight}
            afterConfirmation={onConfirm}
            selectedMedicinesList={selectedMedicinesList}
            requireSelectionChangeForConfirmation={true}
          />
        </div>
      }
    />
  );
};
