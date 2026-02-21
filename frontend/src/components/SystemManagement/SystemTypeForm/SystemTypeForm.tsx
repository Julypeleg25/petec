import type { SimpleSystemTypeDTO } from "@petec/shared";
import { useEffect, useState } from "react";
import { FaArrowRight } from "react-icons/fa";
import {
  useCreateSystemType,
  useUpdateSystemType,
} from "../../../features/system-management/system-types.hooks";
import { useSystemTypes } from "../../../features/system-management/system-types.hooks";
import type { CreatePayload } from "../../../features/system-management/system-types.hooks";
import "./SystemTypeForm.css";

import { SYSTEM_TYPE_CONFIG } from "./SystemTypeForm.config";
import type {
  DynamicSelectField,
  StaticSelectField,
  SystemTypeFormProps,
} from "./SystemTypeForm.types";

// ─── DynamicSelect sub-component ─────────────────────────────────────────────

function DynamicSelectInput({
  field,
  value,
  onChange,
  disabled,
}: {
  field: DynamicSelectField;
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}) {
  const { data: options = [] } = useSystemTypes(field.sourceTypeName);

  return (
    <div className="form-group" dir="rtl">
      <label>{field.label}</label>
      <select
        value={value}
        required={field.required}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">בחר...</option>
        {(options as SimpleSystemTypeDTO[]).map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function SystemTypeForm({
  systemTypeKey,
  systemTypeObj,
  onClose,
}: SystemTypeFormProps) {
  const config = SYSTEM_TYPE_CONFIG[systemTypeKey]!;
  const isEdit = systemTypeObj !== undefined;

  const createMutation = useCreateSystemType(config.typeName);
  const updateMutation = useUpdateSystemType(config.typeName);
  const isPending = createMutation.isPending || updateMutation.isPending;

  // Initialise form values from all field descriptors
  const initialValues = () => {
    const vals: Record<string, string | number> = {};
    for (const field of config.fields) {
      const rowKey = field.sourceKey ?? field.name;
      const existingVal = systemTypeObj?.[rowKey];
      vals[field.name] =
        existingVal !== undefined && existingVal !== null
          ? (existingVal as string | number)
          : "";
    }
    return vals;
  };

  const [values, setValues] =
    useState<Record<string, string | number>>(initialValues);

  // Reset when the systemTypeObj changes (switching between edit targets)
  useEffect(() => {
    setValues(initialValues());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [systemTypeObj]);

  const handleChange = (name: string, val: string | number) => {
    setValues((prev) => ({ ...prev, [name]: val }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Strip empty string values for optional numeric fields
    const payload: Record<string, string | number | boolean> = {};
    for (const [k, v] of Object.entries(values)) {
      if (v !== "" && v !== null && v !== undefined) {
        payload[k] = v;
      }
    }

    if (isEdit) {
      updateMutation.mutate(
        { id: systemTypeObj!.id as string, payload },
        { onSuccess: onClose },
      );
    } else {
      createMutation.mutate(payload as CreatePayload, {
        onSuccess: onClose,
      });
    }
  };

  return (
    <div className="save-system-type-form">
      <button
        type="button"
        className="btn btn-active btn-round back-btn"
        onClick={onClose}
      >
        <FaArrowRight />
      </button>
      <div className="save-entity-form-container">
        <h2 className="save-entity-form-title">
          {isEdit ? config.editTitle : config.createTitle}
        </h2>
        <form className="save-entity-form" onSubmit={handleSubmit} noValidate>
          {config.fields.map((field) => {
            const val = values[field.name] ?? "";
            const disabled =
              isEdit &&
              (field as StaticSelectField | DynamicSelectField).disabledOnEdit;

            if (field.kind === "text") {
              return (
                <div key={field.name} className="form-group" dir="rtl">
                  <label htmlFor={field.name}>{field.label}</label>
                  <input
                    id={field.name}
                    name={field.name}
                    type="text"
                    value={val as string}
                    required={field.required}
                    minLength={1}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                  />
                </div>
              );
            }

            if (field.kind === "number") {
              return (
                <div key={field.name} className="form-group" dir="rtl">
                  <label htmlFor={field.name}>{field.label}</label>
                  <input
                    id={field.name}
                    name={field.name}
                    type="number"
                    value={val as number}
                    min={field.min}
                    required={field.required}
                    onChange={(e) =>
                      handleChange(field.name, e.target.valueAsNumber)
                    }
                  />
                </div>
              );
            }

            if (field.kind === "static-select") {
              return (
                <div key={field.name} className="form-group" dir="rtl">
                  <label htmlFor={field.name}>{field.label}</label>
                  <select
                    id={field.name}
                    value={val as string}
                    required={field.required}
                    disabled={!!disabled}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                  >
                    <option value="">בחר...</option>
                    {field.options.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.text}
                      </option>
                    ))}
                  </select>
                </div>
              );
            }

            if (field.kind === "dynamic-select") {
              return (
                <DynamicSelectInput
                  key={field.name}
                  field={field}
                  value={val as string}
                  onChange={(v) => handleChange(field.name, v)}
                  disabled={!!disabled}
                />
              );
            }

            return null;
          })}

          <button
            type="submit"
            className="btn btn-large save-entity-form-btn"
            disabled={isPending}
            aria-busy={isPending}
          >
            {isPending ? "...שומר" : "שמור"}
          </button>
        </form>
      </div>
    </div>
  );
}
