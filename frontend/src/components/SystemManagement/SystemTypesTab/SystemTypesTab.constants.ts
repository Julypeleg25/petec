import { systemTypesData } from "../SystemTypesData";

export type SystemTypeKey = keyof typeof systemTypesData;

export const isSystemTypeKey = (value: string): value is SystemTypeKey =>
    value in systemTypesData;

export const SYSTEM_TYPE_OPTIONS: ReadonlyArray<{ value: SystemTypeKey; text: string }> = [
    { value: "medicines", text: "תרופות" },
    { value: "animalColors", text: "צבע חיה" },
    { value: "animalTypes", text: "סוג חיה" },
    { value: "fecesTypes", text: "סוג צואה" },
    { value: "urineTypes", text: "סוג שתן" },
    { value: "foodTypes", text: "סוג אוכל" },
    { value: "foodExtrasTypes", text: "סוג תוספות לאוכל" },
    { value: "procedureTypes", text: "סוג פרוצדורה" },
    { value: "genderTypes", text: "מין חיה" },
    { value: "raceTypes", text: "גזע" },
    { value: "measureUnitTypes", text: "מידה" },
    { value: "dosageFrequencyTypes", text: "תדירות" },
    { value: "insuranceTypes", text: "ביטוח" },
    { value: "examinationTypes", text: "סוג בדיקה" },
    { value: "routeOfAdministration", text: "אופן מתן" },
    { value: "animalVitals", text: "סוג התראה" },
];
