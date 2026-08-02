import { SYSTEM_TYPE_NAMES } from "@petec/shared";
import type { EnabledCaseSuggestionCategory } from "../../../features/case-suggestions/caseSuggestion.config";

export const DAILY_CASE_TABLE_COLUMN_COUNT = 14;
export const START_HOUR_OPTIONS_OFFSET = 4;
export const CASE_GRID_DEFAULT_START_HOUR = 8;

export type MedicineSectionType = "fluids" | "medicines";
export type OptionSectionType = "examinations" | "procedures" | "foodExtras";

export const MEDICINE_SECTION_SUGGESTION_CATEGORIES: Readonly<
  Record<MedicineSectionType, EnabledCaseSuggestionCategory>
> = {
  fluids: "fluid",
  medicines: "medication",
};

export const OPTION_SECTION_SUGGESTION_CATEGORIES: Readonly<
  Record<OptionSectionType, EnabledCaseSuggestionCategory>
> = {
  examinations: "diagnostic_test",
  procedures: "procedure",
  foodExtras: "nutrition",
};

export const OPTION_SYSTEM_TYPE_NAMES = {
  EXAMINATIONS: SYSTEM_TYPE_NAMES.EXAMINATION_TYPES,
  PROCEDURES: SYSTEM_TYPE_NAMES.PROCEDURE_TYPES,
  FOOD_EXTRAS: SYSTEM_TYPE_NAMES.FOOD_EXTRA_TYPES,
} as const;

export type OptionSystemTypeName =
  (typeof OPTION_SYSTEM_TYPE_NAMES)[keyof typeof OPTION_SYSTEM_TYPE_NAMES];

export interface MedicineSectionDefinition {
  type: MedicineSectionType;
  title: string;
}

export interface OptionSectionDefinition {
  type: OptionSectionType;
  title: string;
  inputType: "textarea" | "checkbox";
  systemTypeName: OptionSystemTypeName;
}

export const MEDICINE_SECTIONS: ReadonlyArray<MedicineSectionDefinition> = [
  { type: "fluids", title: "נוזלים" },
  { type: "medicines", title: "תרופות" },
];

export const OPTION_SECTIONS: ReadonlyArray<OptionSectionDefinition> = [
  {
    type: "examinations",
    title: "בדיקות",
    inputType: "textarea",
    systemTypeName: OPTION_SYSTEM_TYPE_NAMES.EXAMINATIONS,
  },
  {
    type: "procedures",
    title: "פרוצדורות",
    inputType: "checkbox",
    systemTypeName: OPTION_SYSTEM_TYPE_NAMES.PROCEDURES,
  },
  {
    type: "foodExtras",
    title: "תוספות לאוכל",
    inputType: "checkbox",
    systemTypeName: OPTION_SYSTEM_TYPE_NAMES.FOOD_EXTRAS,
  },
];
