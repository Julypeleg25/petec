import type { SimpleSystemTypeDTO } from "@petec/shared";
import type { SelectOptionObj } from "../../../utils/FormSelect/FormSelect.types";

export const mapSystemTypeToSelectOption = (
    type: SimpleSystemTypeDTO,
): SelectOptionObj => ({
    value: type.id,
    text: type.name,
});
