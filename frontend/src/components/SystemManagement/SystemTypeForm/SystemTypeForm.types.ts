import type { SystemTypeName } from "@petec/shared";

export interface TextField {
    kind: "text";
    name: string;
    label: string;
    required?: boolean;
    /** Row field key if different from `name` (e.g. snake_case from backend) */
    sourceKey?: string;
}

export interface NumberField {
    kind: "number";
    name: string;
    label: string;
    min?: number;
    required?: boolean;
    sourceKey?: string;
}

export interface StaticSelectField {
    kind: "static-select";
    name: string;
    label: string;
    options: { value: string; text: string }[];
    required?: boolean;
    disabledOnEdit?: boolean;
    sourceKey?: string;
}

export interface DynamicSelectField {
    kind: "dynamic-select";
    name: string;
    label: string;
    sourceTypeName: SystemTypeName;
    required?: boolean;
    disabledOnEdit?: boolean;
    sourceKey?: string;
}

export type FieldDescriptor = TextField | NumberField | StaticSelectField | DynamicSelectField;

export interface TypeConfig {
    typeName: SystemTypeName;
    createTitle: string;
    editTitle: string;
    fields: FieldDescriptor[];
}
