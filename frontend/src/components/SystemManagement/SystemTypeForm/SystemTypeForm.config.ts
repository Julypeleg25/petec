import { TypeConfig } from "./SystemTypeForm.types";

export const VITALS_TYPE_OPTIONS = [
    { value: "T", text: "טמפרטורה" },
    { value: "P", text: "דופק" },
    { value: "R", text: "נשימה" },
];

export const SYSTEM_TYPE_CONFIG = {
    animalColors: {
        typeName: "animal_colors",
        createTitle: "הוספת צבע חיה",
        editTitle: "עריכת צבע חיה",
        fields: [{ kind: "text", name: "name", label: ":שם", required: true }],
    },
    animalTypes: {
        typeName: "animal_types",
        createTitle: "הוספת סוג חיה",
        editTitle: "עריכת סוג חיה",
        fields: [{ kind: "text", name: "name", label: ":שם", required: true }],
    },
    fecesTypes: {
        typeName: "feces_types",
        createTitle: "הוספת סוג צואה",
        editTitle: "עריכת סוג צואה",
        fields: [{ kind: "text", name: "name", label: ":שם", required: true }],
    },
    urineTypes: {
        typeName: "urine_types",
        createTitle: "הוספת סוג שתן",
        editTitle: "עריכת סוג שתן",
        fields: [{ kind: "text", name: "name", label: ":שם", required: true }],
    },
    foodTypes: {
        typeName: "food_types",
        createTitle: "הוספת סוג אוכל",
        editTitle: "עריכת סוג אוכל",
        fields: [{ kind: "text", name: "name", label: ":שם", required: true }],
    },
    genderTypes: {
        typeName: "gender_types",
        createTitle: "הוספת מין חיה",
        editTitle: "עריכת מין חיה",
        fields: [{ kind: "text", name: "name", label: ":שם", required: true }],
    },
    measureUnitTypes: {
        typeName: "measure_unit_types",
        createTitle: "הוספת יחידת מידה",
        editTitle: "עריכת יחידת מידה",
        fields: [{ kind: "text", name: "name", label: ":שם", required: true }],
    },
    dosageFrequencyTypes: {
        typeName: "dosage_frequencies",
        createTitle: "הוספת תדירות מינון",
        editTitle: "עריכת תדירות מינון",
        fields: [{ kind: "text", name: "name", label: ":שם", required: true }],
    },
    insuranceTypes: {
        typeName: "insurance_types",
        createTitle: "הוספת סוג ביטוח",
        editTitle: "עריכת סוג ביטוח",
        fields: [{ kind: "text", name: "name", label: ":שם", required: true }],
    },
    foodExtrasTypes: {
        typeName: "food_extra_types",
        createTitle: "הוספת תוסף אוכל",
        editTitle: "עריכת תוסף אוכל",
        fields: [{ kind: "text", name: "name", label: ":שם", required: true }],
    },
    procedureTypes: {
        typeName: "procedure_types",
        createTitle: "הוספת סוג פרוצדורה",
        editTitle: "עריכת סוג פרוצדורה",
        fields: [{ kind: "text", name: "name", label: ":שם", required: true }],
    },
    examinationTypes: {
        typeName: "examination_types",
        createTitle: "הוספת סוג בדיקה",
        editTitle: "עריכת סוג בדיקה",
        fields: [{ kind: "text", name: "name", label: ":שם", required: true }],
    },
    routeOfAdministration: {
        typeName: "routes_of_administration",
        createTitle: "הוספת אופן מתן",
        editTitle: "עריכת אופן מתן",
        fields: [{ kind: "text", name: "name", label: ":שם", required: true }],
    },
    raceTypes: {
        typeName: "race_types",
        createTitle: "הוספת גזע",
        editTitle: "עריכת גזע",
        fields: [
            { kind: "text", name: "name", label: ":שם גזע", required: true },
            {
                kind: "dynamic-select",
                name: "animalTypeId",
                label: ":סוג חיה",
                sourceTypeName: "animal_types",
                required: true,
                sourceKey: "animal_type_id",
            },
        ],
    },
    animalVitals: {
        typeName: "animal_vitals",
        createTitle: "הוספת סוג התראה",
        editTitle: "עריכת סוג התראה",
        fields: [
            {
                kind: "dynamic-select",
                name: "animalTypeId",
                label: ":סוג חיה",
                sourceTypeName: "animal_types",
                required: true,
                disabledOnEdit: true,
                sourceKey: "animal_type_id",
            },
            {
                kind: "static-select",
                name: "name",
                label: ":סוג התראה",
                options: VITALS_TYPE_OPTIONS,
                required: true,
                disabledOnEdit: true,
                sourceKey: "vitals_type",
            },
            {
                kind: "number",
                name: "minValue",
                label: ":טווח - מינימום",
                min: 0,
                sourceKey: "range_min",
            },
            {
                kind: "number",
                name: "maxValue",
                label: ":טווח - מקסימום",
                min: 0,
                sourceKey: "range_max",
            },
        ],
    },
} satisfies Record<string, TypeConfig>;

export type SystemTypeFormKey = keyof typeof SYSTEM_TYPE_CONFIG;

export const isSystemTypeFormKey = (value: string): value is SystemTypeFormKey =>
  value in SYSTEM_TYPE_CONFIG;
