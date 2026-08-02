import type { IconType } from "react-icons";
import {
  FaFlask,
  FaPills,
  FaStethoscope,
  FaTint,
  FaUtensils,
} from "react-icons/fa";
import type {
  AuthoritativeSuggestionValues,
  CaseSuggestionCategory,
} from "@petec/shared";

interface CaseSuggestionCategoryUiDefinition {
  readonly displayName: string;
  readonly Icon: IconType;
  readonly requiresDetailedReview: boolean;
}

export const CASE_SUGGESTION_CATEGORY_UI: Readonly<
  Record<
    "medication" | "fluid" | "procedure" | "diagnostic_test" | "nutrition",
    CaseSuggestionCategoryUiDefinition
  >
> = {
  medication: {
    displayName: "תרופות",
    Icon: FaPills,
    requiresDetailedReview: true,
  },
  fluid: {
    displayName: "נוזלים",
    Icon: FaTint,
    requiresDetailedReview: true,
  },
  procedure: {
    displayName: "פרוצדורות",
    Icon: FaStethoscope,
    requiresDetailedReview: false,
  },
  diagnostic_test: {
    displayName: "בדיקות",
    Icon: FaFlask,
    requiresDetailedReview: false,
  },
  nutrition: {
    displayName: "תזונה",
    Icon: FaUtensils,
    requiresDetailedReview: false,
  },
};

export type EnabledCaseSuggestionCategory =
  keyof typeof CASE_SUGGESTION_CATEGORY_UI;

export interface SuggestionDetail {
  readonly label: string;
  readonly value: string;
}

const optionalDetail = (
  label: string,
  value: string | number | undefined,
): SuggestionDetail[] =>
  value === undefined || value === "" ? [] : [{ label, value: String(value) }];

export const getSuggestionDetails = (
  values: AuthoritativeSuggestionValues,
): SuggestionDetail[] => {
  switch (values.category) {
    case "medication":
      return [
        ...optionalDetail("כמות מוצעת", values.doseAmount),
        ...optionalDetail("פירוט מינון", values.dosageText),
        ...optionalDetail("יחידת מידה", values.measureUnitText),
        ...optionalDetail("דרך מתן", values.route),
        ...optionalDetail("תדירות", values.frequency),
        ...optionalDetail("משך", values.duration),
      ];
    case "fluid":
      return [
        ...optionalDetail("כמות מוצעת", values.doseAmount),
        ...optionalDetail("יחידת מידה", values.measureUnitText),
        ...optionalDetail("דרך מתן", values.route),
        ...optionalDetail("תדירות", values.frequency),
        ...optionalDetail("קצב מוצע", values.rate),
        ...optionalDetail("נפח כולל", values.totalVolume),
        ...optionalDetail("משך", values.duration),
      ];
    case "procedure":
      return [
        ...optionalDetail("מועד", values.timing),
        ...optionalDetail("הכנה", values.preparationInstructions),
      ];
    case "diagnostic_test":
      return [
        ...optionalDetail("מועד", values.timing),
        ...optionalDetail("הכנה", values.preparationInstructions),
        ...optionalDetail(
          "עדיפות",
          values.priority === "urgent"
            ? "דחוף"
            : values.priority === "routine"
              ? "שגרתי"
              : undefined,
        ),
      ];
    case "nutrition":
      return [
        ...optionalDetail("דרך", values.route),
        ...optionalDetail("תדירות", values.frequency),
        ...optionalDetail("משך", values.duration),
        ...optionalDetail("הנחיות", values.instructions),
      ];
    default:
      return [];
  }
};

export const isEnabledSuggestionCategory = (
  category: CaseSuggestionCategory,
): category is EnabledCaseSuggestionCategory =>
  category in CASE_SUGGESTION_CATEGORY_UI;

export const MISSING_INFORMATION_LABELS: Readonly<Record<string, string>> = {
  animalTypeId: "סוג בעל חיים",
  breedId: "גזע",
  age: "גיל",
  ageMonths: "גיל",
  lifeStage: "שלב חיים",
  weightKg: "משקל עדכני",
  weightDate: "תאריך שקילה",
  hospitalizationReason: "סיבת אשפוז",
  allergies: "מצב אלרגיות",
  allergyDetails: "פירוט אלרגיות",
  renalStatus: "הערכת תפקוד כלייתי",
  hepaticStatus: "הערכת תפקוד כבדי",
  hydrationStatus: "הערכת מצב נוזלים",
  vitalSigns: "מדדים חיוניים",
  pregnancyStatus: "מצב הריון",
  lactationStatus: "מצב הנקה",
  activeIngredients: "חומרים פעילים בתרופות קיימות",
  diagnoses: "אבחנות",
};
