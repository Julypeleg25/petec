import { Controller, useFormContext } from "react-hook-form";
import { useSystemTypes } from "../../../../features/system-management";
import type {
  DynamicSelectField,
  FieldDescriptor as SystemTypeFieldType,
} from "../SystemTypeForm.types";
import FormInput from "../../../../utils/FormInput/FormInput";
import FormSelect from "../../../../utils/FormSelect/FormSelect";
import {
  buildDynamicSelectElements,
  resolveSystemTypeFieldDisabled,
} from "./SystemTypeField.utils";

export interface SystemTypeFieldProps {
  field: SystemTypeFieldType;
  isEdit: boolean;
  isPending: boolean;
}

function DynamicSelectInputWithQuery({
  field,
  optionState,
  setOptionState,
  disabled,
}: {
  field: DynamicSelectField;
  optionState: string;
  setOptionState: (val: string | ((prevState: string) => string)) => void;
  disabled: boolean;
}) {
  const { data: options = [], isLoading } = useSystemTypes(field.sourceTypeName);
  const elements = buildDynamicSelectElements(options, isLoading);

  return (
    <FormSelect
      labelText={field.label}
      elements={elements}
      optionState={optionState}
      setOptionState={setOptionState}
      isRequired={field.required}
      disabled={disabled || isLoading}
      selectId={`system-type-dynamic-select-${field.name}`}
    />
  );
}

export function SystemTypeField({ field, isEdit, isPending }: SystemTypeFieldProps) {
  const { control, formState: { errors } } = useFormContext();
  const fieldError = errors[field.name];

  const disabled = resolveSystemTypeFieldDisabled(field, isEdit, isPending);

  return (
    <Controller
      name={field.name}
      control={control}
      render={({ field: controllerField }) => {
        let inputContent = null;

        if (field.kind === "text") {
          inputContent = (
            <FormInput
              labelText={field.label}
              name={field.name}
              state={controllerField.value || ""}
              setState={controllerField.onChange}
              isRequired={field.required}
              disabled={disabled}
              minLength={1}
            />
          );
        } else if (field.kind === "number") {
          inputContent = (
            <FormInput
              labelText={field.label}
              name={field.name}
              state={controllerField.value ?? ""}
              setState={(val) => controllerField.onChange(val === "" ? null : Number(val))}
              isRequired={field.required}
              disabled={disabled}
              type="number"
              min={field.min}
            />
          );
        } else if (field.kind === "static-select") {
          inputContent = (
            <FormSelect
              labelText={field.label}
              elements={field.options}
              optionState={controllerField.value}
              setOptionState={controllerField.onChange}
              isRequired={field.required}
              disabled={disabled}
              selectId={`system-type-field-${field.name}`}
            />
          );
        } else if (field.kind === "dynamic-select") {
          inputContent = (
            <DynamicSelectInputWithQuery
              field={field}
              optionState={controllerField.value}
              setOptionState={controllerField.onChange}
              disabled={!!disabled}
            />
          );
        }

        return (
          <div className="form-group">
            {inputContent}
            {fieldError && (
              <p className="form-error">
                {fieldError.message?.toString()}
              </p>
            )}
          </div>
        );
      }}
    />
  );
}
