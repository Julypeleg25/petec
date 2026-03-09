import { useCallback } from "react";
import type { MouseEvent } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import type { MedicineSelectOptionObj } from "../MedicinePicker.types";

interface MedicinePickerSelectedItemProps {
  medicine: MedicineSelectOptionObj;
  index: number;
  isEdit: boolean;
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
}

export function MedicinePickerSelectedItem({
  medicine,
  index,
  isEdit,
  onEdit,
  onDelete,
}: MedicinePickerSelectedItemProps) {
  const detailsText = [
    medicine.doseAmount !== null &&
    medicine.doseAmount !== undefined &&
    `${medicine.doseAmount}` !== ""
      ? String(medicine.doseAmount)
      : null,
    medicine.measureUnitText || null,
    medicine.frequencyText || null,
    medicine.medicineRouteText || null,
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ");

  const handleEditClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      onEdit(index);
    },
    [index, onEdit],
  );

  const handleDeleteClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      onDelete(index);
    },
    [index, onDelete],
  );

  return (
    <div className="medicine-picker-selected-medicines-cell">
      <div className="medicine-picker-selected-medicines-text">
        <span className="selected-medicine-name">{medicine.text}</span>
        {detailsText ? ` ${detailsText}` : ""}
        {!detailsText && medicine.dosageText ? ` ${medicine.dosageText}` : ""}
        {!isEdit && " -"}
      </div>
      {isEdit && (
        <div className="medicine-picker-selected-medicines-actions">
          <button className="edit-medicine-btn" onClick={handleEditClick}>
            <FaEdit />
          </button>
          <button className="delete-medicine-btn" onClick={handleDeleteClick}>
            <FaTrash />
          </button>
        </div>
      )}
    </div>
  );
}
