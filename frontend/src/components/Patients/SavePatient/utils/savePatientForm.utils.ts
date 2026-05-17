import { NewPatientDTOSchema } from "@petec/shared";
import type { ChangeEvent } from "react";
import type { Resolver } from "react-hook-form";
import type { NewPatientData } from "../types/savePatient.types";
import {
    toLocalDateFromInputValue,
    toOptionalNumber,
} from "./savePatientCaseDetails.utils";
import {
    SAVE_PATIENT_CATHETER_DATE_FIELD_NAME,
    SAVE_PATIENT_PROCEDURE_DATE_FIELD_NAME,
} from "../constants/savePatient.constants";

export type FormInputValue = string | number | boolean | Date | null | undefined;

type FormPathRecord = {
    [key: string]: FormInputValue | FormPathRecord;
};

const DATE_FORM_FIELDS = [
    SAVE_PATIENT_CATHETER_DATE_FIELD_NAME,
    SAVE_PATIENT_PROCEDURE_DATE_FIELD_NAME,
] as const;

export const NUMERIC_FORM_FIELDS = [
    "patientSnapshot.weightKg",
    "patientSnapshot.ageYears",
    "patientSnapshot.ageMonths",
] as const;

export type InputChangeEvent =
    | string
    | Date
    | null
    | ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>;

export const getEmptyFormData = (): NewPatientData => ({
    caseId: "",
    name: "",
    owner: { name: "", phone: "" },
    admission: {
        hospitalizationReason: "",
        referringDoctor: "",
        allergicComments: null,
        bloodTestLink: null,
    },
    patientSnapshot: {
        ageYears: undefined,
        ageMonths: undefined,
        weightKg: undefined,
    },
    dates: { catheterDate: undefined, procedureDate: undefined },
    comments: "",
});

const toDateValue = (value: string | Date | null): Date | null | undefined => {
    if (value === null || value === "") return null;
    if (value instanceof Date) return value;
    return toLocalDateFromInputValue(value) ?? null;
};

const isFormRecord = (
    value: FormInputValue | FormPathRecord,
): value is FormPathRecord =>
    typeof value === "object" &&
    value !== null &&
    !(value instanceof Date) &&
    !Array.isArray(value);

export const setByPath = <T extends object>(
    data: T,
    path: string,
    value: FormInputValue,
): T => {
    const keys = path.split(".");
    const next: FormPathRecord = {
        ...(data as Record<string, FormInputValue | FormPathRecord>),
    };
    let cursor: FormPathRecord = next;

    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        const currentValue = cursor[key];
        cursor[key] = isFormRecord(currentValue) ? { ...currentValue } : {};
        cursor = cursor[key] as FormPathRecord;
    }

    const lastKey = keys[keys.length - 1];
    if (lastKey) {
        cursor[lastKey] = value;
    }

    return next as T;
};

export const normalizeFormValue = (
    name: string,
    value: string | Date | null,
): FormInputValue => {
    if (NUMERIC_FORM_FIELDS.includes(name as (typeof NUMERIC_FORM_FIELDS)[number])) {
        if (value instanceof Date) return undefined;
        return toOptionalNumber(value);
    }

    if (DATE_FORM_FIELDS.includes(name as (typeof DATE_FORM_FIELDS)[number])) {
        return toDateValue(value);
    }

    return value;
};

export const savePatientFormResolver: Resolver<NewPatientData> = async (
    values,
) => {
    if (!values.caseId.trim()) {
        return {
            values: {},
            errors: { caseId: { type: "required", message: "יש להזין מספר תיק" } },
        };
    }

    if (!values.admission?.hospitalizationReason?.trim()) {
        return {
            values: {},
            errors: {
                "admission.hospitalizationReason": {
                    type: "required",
                    message: "יש להזין סיבת אשפוז",
                },
            },
        };
    }

    if (
        toOptionalNumber(values.patientSnapshot?.ageYears) === undefined &&
        toOptionalNumber(values.patientSnapshot?.ageMonths) === undefined
    ) {
        return {
            values: {},
            errors: {
                "patientSnapshot.ageYears": {
                    type: "required",
                    message: "אנא בחר/י גיל בשנים או בחודשים",
                },
            },
        };
    }

    const validation = NewPatientDTOSchema.safeParse(values);
    if (!validation.success) {
        const issue = validation.error.issues[0];
        const fieldPath = issue.path.length ? issue.path.join(".") : "caseId";
        return {
            values: {},
            errors: {
                [fieldPath]: { type: issue.code, message: issue.message },
            } as Record<string, { type: string; message: string }>,
        };
    }

    return { values, errors: {} };
};
