import {
  roles,
  SYSTEM_TYPE_NAMES,
  MAX_CASE_SUGGESTIONS,
  type CaseSuggestionCategory,
  type Role,
  type SystemTypeName,
} from "@petec/shared";

export interface SuggestionCategoryDefinition {
  readonly category: CaseSuggestionCategory;
  readonly enabled: boolean;
  readonly displayName: string;
  readonly sourceCollection: SystemTypeName | null;
  readonly maximumSuggestions: number;
  readonly allowedRoles: readonly Role[];
  readonly requiredPatientFields: readonly string[];
}

export const CASE_SUGGESTION_CLINICAL_ROLES = [
  roles.ADMIN,
  roles.DOCTOR,
  roles.ASSISTANT,
] as const;

const disabledDefinition = (
  category: CaseSuggestionCategory,
  displayName: string,
): SuggestionCategoryDefinition => ({
  category,
  enabled: false,
  displayName,
  sourceCollection: null,
  maximumSuggestions: MAX_CASE_SUGGESTIONS,
  allowedRoles: CASE_SUGGESTION_CLINICAL_ROLES,
  requiredPatientFields: [],
});

export const CASE_SUGGESTION_CATEGORY_REGISTRY: ReadonlyMap<
  CaseSuggestionCategory,
  SuggestionCategoryDefinition
> = new Map([
  [
    "medication",
    {
      category: "medication",
      enabled: true,
      displayName: "תרופות",
      sourceCollection: SYSTEM_TYPE_NAMES.MEDICINES,
      maximumSuggestions: MAX_CASE_SUGGESTIONS,
      allowedRoles: CASE_SUGGESTION_CLINICAL_ROLES,
      requiredPatientFields: ["animalTypeId", "allergies"],
    },
  ],
  [
    "fluid",
    {
      category: "fluid",
      enabled: true,
      displayName: "נוזלים",
      sourceCollection: SYSTEM_TYPE_NAMES.MEDICINES,
      maximumSuggestions: MAX_CASE_SUGGESTIONS,
      allowedRoles: CASE_SUGGESTION_CLINICAL_ROLES,
      requiredPatientFields: ["animalTypeId", "weightKg"],
    },
  ],
  [
    "procedure",
    {
      category: "procedure",
      enabled: true,
      displayName: "פרוצדורות",
      sourceCollection: SYSTEM_TYPE_NAMES.PROCEDURE_TYPES,
      maximumSuggestions: MAX_CASE_SUGGESTIONS,
      allowedRoles: CASE_SUGGESTION_CLINICAL_ROLES,
      requiredPatientFields: ["hospitalizationReason"],
    },
  ],
  [
    "diagnostic_test",
    {
      category: "diagnostic_test",
      enabled: true,
      displayName: "בדיקות",
      sourceCollection: SYSTEM_TYPE_NAMES.EXAMINATION_TYPES,
      maximumSuggestions: MAX_CASE_SUGGESTIONS,
      allowedRoles: CASE_SUGGESTION_CLINICAL_ROLES,
      requiredPatientFields: ["hospitalizationReason"],
    },
  ],
  [
    "nutrition",
    {
      category: "nutrition",
      enabled: true,
      displayName: "תזונה",
      sourceCollection: SYSTEM_TYPE_NAMES.FOOD_EXTRA_TYPES,
      maximumSuggestions: MAX_CASE_SUGGESTIONS,
      allowedRoles: CASE_SUGGESTION_CLINICAL_ROLES,
      requiredPatientFields: ["animalTypeId"],
    },
  ],
  ["treatment", disabledDefinition("treatment", "טיפולים")],
  ["laboratory_test", disabledDefinition("laboratory_test", "בדיקות מעבדה")],
  ["imaging", disabledDefinition("imaging", "הדמיה")],
  ["monitoring", disabledDefinition("monitoring", "ניטור")],
  ["precaution", disabledDefinition("precaution", "אמצעי זהירות")],
  ["other", disabledDefinition("other", "אחר")],
]);

export const getSuggestionCategoryDefinition = (
  category: CaseSuggestionCategory,
): SuggestionCategoryDefinition => {
  const definition = CASE_SUGGESTION_CATEGORY_REGISTRY.get(category);
  if (!definition) {
    throw new Error(`Missing case suggestion category: ${category}`);
  }
  return definition;
};
