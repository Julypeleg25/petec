import type { SimpleSystemTypeDTO } from "@petec/shared";
import type { SelectOptionObj } from "../../../utils/FormSelect/FormSelect.types";

export const mapSystemTypesToSelectOptions = (
  items: ReadonlyArray<SimpleSystemTypeDTO> = [],
): SelectOptionObj[] => items.map((item) => ({ value: item.id, text: item.name }));
