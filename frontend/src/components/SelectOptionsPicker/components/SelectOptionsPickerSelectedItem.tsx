import { useCallback } from "react";
import type { MouseEvent } from "react";
import { FaTrash } from "react-icons/fa";
import type { SelectOptionsPickerOptionObj } from "../SelectOptionsPicker.types";

interface SelectOptionsPickerSelectedItemProps {
  option: SelectOptionsPickerOptionObj;
  index: number;
  isEdit: boolean;
  onDelete: (index: number) => void;
}

export function SelectOptionsPickerSelectedItem({
  option,
  index,
  isEdit,
  onDelete,
}: SelectOptionsPickerSelectedItemProps) {
  const handleDeleteClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      onDelete(index);
    },
    [index, onDelete],
  );

  return (
    <div className="option-picker-selected-options-cell">
      <div className="option-picker-selected-options-text">
        {option.text}
        {!isEdit && " -"}
      </div>
      {isEdit && (
        <button className="delete-option-btn" onClick={handleDeleteClick}>
          <FaTrash />
        </button>
      )}
    </div>
  );
}
