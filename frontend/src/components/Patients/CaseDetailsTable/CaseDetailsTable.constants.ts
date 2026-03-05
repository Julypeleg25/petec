export const DAILY_CASE_TABLE_COLUMN_COUNT = 14;
export const START_HOUR_OPTIONS_OFFSET = 4;

export type MedicineSectionType = "fluids" | "medicines";
export type OptionSectionType = "examinations" | "procedures" | "foodExtras";
export type OptionSystemTypeName =
  | "examination_types"
  | "procedure_types"
  | "food_extra_types";

export const MEDICINE_SECTIONS: ReadonlyArray<
  Readonly<{ type: MedicineSectionType; title: string }>
> = [
  { type: "fluids", title: "נוזלים" },
  { type: "medicines", title: "תרופות" },
];

export const OPTION_SECTIONS: ReadonlyArray<
  Readonly<{
    type: OptionSectionType;
    title: string;
    inputType: "textarea" | "checkbox";
    systemTypeName: OptionSystemTypeName;
  }>
> = [
  {
    type: "examinations",
    title: "בדיקות",
    inputType: "textarea",
    systemTypeName: "examination_types",
  },
  {
    type: "procedures",
    title: "פרוצדורות",
    inputType: "checkbox",
    systemTypeName: "procedure_types",
  },
  {
    type: "foodExtras",
    title: "תוספות לאוכל",
    inputType: "checkbox",
    systemTypeName: "food_extra_types",
  },
];
