import type { SelectOptionObj } from "../../../../utils/FormSelect/FormSelect.types";
import type {
  DynamicSelectField,
  FieldDescriptor,
  StaticSelectField,
} from "../SystemTypeForm.types";
import { mapSystemTypesToSelectOptions } from "../../shared/systemTypeSelect.utils";
import type { SimpleSystemTypeDTO } from "@petec/shared";

type DisableAwareField = StaticSelectField | DynamicSelectField;

export const isDisableAwareField = (
  field: FieldDescriptor,
): field is DisableAwareField =>
  field.kind === "static-select" || field.kind === "dynamic-select";

export const resolveSystemTypeFieldDisabled = (
  field: FieldDescriptor,
  isEdit: boolean,
  isPending: boolean,
): boolean =>
  isPending || (isEdit && isDisableAwareField(field) && !!field.disabledOnEdit);

export const buildDynamicSelectElements = (
  options: ReadonlyArray<SimpleSystemTypeDTO>,
  isLoading: boolean,
): SelectOptionObj[] =>
  isLoading
    ? [{ value: "", text: "טוען..." }]
    : mapSystemTypesToSelectOptions(options);
