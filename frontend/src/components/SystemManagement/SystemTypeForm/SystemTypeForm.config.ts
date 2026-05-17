import { SYSTEM_TYPE_NAMES } from "@petec/shared";
import type { SystemTypeKey } from "../config";
import { TypeConfig } from "./SystemTypeForm.types";

export const VITALS_TYPE_OPTIONS = [
    { value: "T", text: "טמפרטורה" },
    { value: "P", text: "דופק" },
    { value: "R", text: "נשימה" },
];

export type SystemTypeFormKey = Exclude<SystemTypeKey, "medicines">;

export const SYSTEM_TYPE_CONFIG = {
    animalColors: {
        typeName: SYSTEM_TYPE_NAMES.ANIMAL_COLORS,
        createTitle: "הוספת צבע חיה",
        editTitle: "עריכת צבע חיה",
        fields: [{ kind: "text", name: "name", label: "שם", required: true }],
    },
    animalTypes: {
        typeName: SYSTEM_TYPE_NAMES.ANIMAL_TYPES,
        createTitle: "הוספת סוג חיה",
        editTitle: "עריכת סוג חיה",
        fields: [{ kind: "text", name: "name", label: "שם", required: true }],
    },
    fecesTypes: {
        typeName: SYSTEM_TYPE_NAMES.FECES_TYPES,
        createTitle: "הוספת סוג צואה",
        editTitle: "עריכת סוג צואה",
        fields: [{ kind: "text", name: "name", label: "שם", required: true }],
    },
    urineTypes: {
        typeName: SYSTEM_TYPE_NAMES.URINE_TYPES,
        createTitle: "הוספת סוג שתן",
        editTitle: "עריכת סוג שתן",
        fields: [{ kind: "text", name: "name", label: "שם", required: true }],
    },
    foodTypes: {
        typeName: SYSTEM_TYPE_NAMES.FOOD_TYPES,
        createTitle: "הוספת סוג אוכל",
        editTitle: "עריכת סוג אוכל",
        fields: [{ kind: "text", name: "name", label: "שם", required: true }],
    },
    genderTypes: {
        typeName: SYSTEM_TYPE_NAMES.GENDER_TYPES,
        createTitle: "הוספת מין חיה",
        editTitle: "עריכת מין חיה",
        fields: [{ kind: "text", name: "name", label: "שם", required: true }],
    },
    measureUnitTypes: {
        typeName: SYSTEM_TYPE_NAMES.MEASURE_UNIT_TYPES,
        createTitle: "הוספת יחידת מידה",
        editTitle: "עריכת יחידת מידה",
        fields: [{ kind: "text", name: "name", label: "שם", required: true }],
    },
    dosageFrequencyTypes: {
        typeName: SYSTEM_TYPE_NAMES.DOSAGE_FREQUENCIES,
        createTitle: "הוספת תדירות מינון",
        editTitle: "עריכת תדירות מינון",
        fields: [{ kind: "text", name: "name", label: "שם", required: true }],
    },
    insuranceTypes: {
        typeName: SYSTEM_TYPE_NAMES.INSURANCE_TYPES,
        createTitle: "הוספת סוג ביטוח",
        editTitle: "עריכת סוג ביטוח",
        fields: [{ kind: "text", name: "name", label: "שם", required: true }],
    },
    foodExtrasTypes: {
        typeName: SYSTEM_TYPE_NAMES.FOOD_EXTRA_TYPES,
        createTitle: "הוספת תוסף אוכל",
        editTitle: "עריכת תוסף אוכל",
        fields: [{ kind: "text", name: "name", label: "שם", required: true }],
    },
    procedureTypes: {
        typeName: SYSTEM_TYPE_NAMES.PROCEDURE_TYPES,
        createTitle: "הוספת סוג פרוצדורה",
        editTitle: "עריכת סוג פרוצדורה",
        fields: [{ kind: "text", name: "name", label: "שם", required: true }],
    },
    examinationTypes: {
        typeName: SYSTEM_TYPE_NAMES.EXAMINATION_TYPES,
        createTitle: "הוספת סוג בדיקה",
        editTitle: "עריכת סוג בדיקה",
        fields: [{ kind: "text", name: "name", label: "שם", required: true }],
    },
    routeOfAdministration: {
        typeName: SYSTEM_TYPE_NAMES.ROUTES_OF_ADMINISTRATION,
        createTitle: "הוספת אופן מתן",
        editTitle: "עריכת אופן מתן",
        fields: [{ kind: "text", name: "name", label: "שם", required: true }],
    },
    anesthesiaFormTexts: {
        typeName: SYSTEM_TYPE_NAMES.ANESTHESIA_FORM_TEXTS,
        createTitle: "הוספת טקסט טופס הרדמה",
        editTitle: "עריכת טקסט טופס הרדמה",
        fields: [{ kind: "text", name: "name", label: "טקסט", required: true }],
    },
    raceTypes: {
        typeName: SYSTEM_TYPE_NAMES.RACE_TYPES,
        createTitle: "הוספת גזע",
        editTitle: "עריכת גזע",
        fields: [
            { kind: "text", name: "name", label: "שם גזע", required: true },
            {
                kind: "dynamic-select",
                name: "animalTypeId",
                label: "סוג חיה",
                sourceTypeName: SYSTEM_TYPE_NAMES.ANIMAL_TYPES,
                required: true,
                sourceKey: "animal_type_id",
            },
        ],
    },
    animalVitals: {
        typeName: SYSTEM_TYPE_NAMES.ANIMAL_VITALS,
        createTitle: "הוספת סוג התראה",
        editTitle: "עריכת סוג התראה",
        fields: [
            {
                kind: "dynamic-select",
                name: "animalTypeId",
                label: "סוג חיה",
                sourceTypeName: SYSTEM_TYPE_NAMES.ANIMAL_TYPES,
                required: true,
                disabledOnEdit: true,
                sourceKey: "animal_type_id",
            },
            {
                kind: "static-select",
                name: "name",
                label: "סוג התראה",
                options: VITALS_TYPE_OPTIONS,
                required: true,
                disabledOnEdit: true,
                sourceKey: "vitals_type",
            },
            {
                kind: "number",
                name: "minValue",
                label: "טווח - מינימום",
                min: 0,
                sourceKey: "range_min",
            },
            {
                kind: "number",
                name: "maxValue",
                label: "טווח - מקסימום",
                min: 0,
                sourceKey: "range_max",
            },
        ],
    },
} satisfies Record<SystemTypeFormKey, TypeConfig>;

export const isSystemTypeFormKey = (value: string): value is SystemTypeFormKey =>
    value in SYSTEM_TYPE_CONFIG;
