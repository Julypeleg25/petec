import { z } from "zod";
import { objectIdSchema } from "../utils/index.js";

export const CASE_SUGGESTION_CATEGORIES = [
  "medication",
  "fluid",
  "treatment",
  "procedure",
  "diagnostic_test",
  "laboratory_test",
  "imaging",
  "monitoring",
  "nutrition",
  "precaution",
  "other",
] as const;

export const MAX_CASE_SUGGESTIONS = 5;

export const CaseSuggestionCategorySchema = z.enum(CASE_SUGGESTION_CATEGORIES);

export type CaseSuggestionCategory = z.infer<
  typeof CaseSuggestionCategorySchema
>;

export const CaseSuggestionRequestSchema = z.object({}).strict();

export type CaseSuggestionRequest = z.infer<typeof CaseSuggestionRequestSchema>;

export const CaseSuggestionParamsSchema = z
  .object({
    patientId: objectIdSchema,
    category: CaseSuggestionCategorySchema,
  })
  .strict();

export type CaseSuggestionParams = z.infer<typeof CaseSuggestionParamsSchema>;

const medicationValuesSchema = z
  .object({
    category: z.literal("medication"),
    medicationId: objectIdSchema,
    formulationId: objectIdSchema.optional(),
    doseAmount: z.number().nonnegative().optional(),
    dosageText: z.string().optional(),
    measureUnitTypeId: objectIdSchema.optional(),
    measureUnitText: z.string().optional(),
    routeOfAdministrationId: objectIdSchema.optional(),
    route: z.string().optional(),
    dosageFrequencyId: objectIdSchema.optional(),
    frequency: z.string().optional(),
    duration: z.string().optional(),
  })
  .strict();

const fluidValuesSchema = z
  .object({
    category: z.literal("fluid"),
    fluidId: objectIdSchema,
    doseAmount: z.number().nonnegative().optional(),
    dosageText: z.string().optional(),
    measureUnitTypeId: objectIdSchema.optional(),
    measureUnitText: z.string().optional(),
    routeOfAdministrationId: objectIdSchema.optional(),
    route: z.string().optional(),
    dosageFrequencyId: objectIdSchema.optional(),
    frequency: z.string().optional(),
    rate: z.string().optional(),
    totalVolume: z.string().optional(),
    duration: z.string().optional(),
    additives: z.array(z.string()).optional(),
  })
  .strict();

const treatmentValuesSchema = z
  .object({
    category: z.literal("treatment"),
    treatmentId: objectIdSchema,
    frequency: z.string().optional(),
    duration: z.string().optional(),
    instructions: z.string().optional(),
  })
  .strict();

const procedureValuesSchema = z
  .object({
    category: z.literal("procedure"),
    procedureId: objectIdSchema,
    timing: z.string().optional(),
    preparationInstructions: z.string().optional(),
  })
  .strict();

const diagnosticTestValuesSchema = z
  .object({
    category: z.literal("diagnostic_test"),
    testId: objectIdSchema,
    timing: z.string().optional(),
    preparationInstructions: z.string().optional(),
    priority: z.enum(["routine", "urgent"]).optional(),
  })
  .strict();

const laboratoryTestValuesSchema = z
  .object({
    category: z.literal("laboratory_test"),
    testId: objectIdSchema,
    timing: z.string().optional(),
    preparationInstructions: z.string().optional(),
    priority: z.enum(["routine", "urgent"]).optional(),
  })
  .strict();

const imagingValuesSchema = z
  .object({
    category: z.literal("imaging"),
    imagingItemId: objectIdSchema,
    timing: z.string().optional(),
    preparationInstructions: z.string().optional(),
  })
  .strict();

const monitoringValuesSchema = z
  .object({
    category: z.literal("monitoring"),
    monitoringItemId: objectIdSchema,
    frequency: z.string().optional(),
    duration: z.string().optional(),
    thresholdNotes: z.string().optional(),
  })
  .strict();

const nutritionValuesSchema = z
  .object({
    category: z.literal("nutrition"),
    nutritionItemId: objectIdSchema,
    route: z.string().optional(),
    frequency: z.string().optional(),
    duration: z.string().optional(),
    instructions: z.string().optional(),
  })
  .strict();

const precautionValuesSchema = z
  .object({
    category: z.literal("precaution"),
    precautionItemId: objectIdSchema,
    duration: z.string().optional(),
    instructions: z.string().optional(),
  })
  .strict();

const otherValuesSchema = z
  .object({
    category: z.literal("other"),
    itemId: objectIdSchema,
    instructions: z.string().optional(),
  })
  .strict();

export const AuthoritativeSuggestionValuesSchema = z.discriminatedUnion(
  "category",
  [
    medicationValuesSchema,
    fluidValuesSchema,
    treatmentValuesSchema,
    procedureValuesSchema,
    diagnosticTestValuesSchema,
    laboratoryTestValuesSchema,
    imagingValuesSchema,
    monitoringValuesSchema,
    nutritionValuesSchema,
    precautionValuesSchema,
    otherValuesSchema,
  ],
);

export type AuthoritativeSuggestionValues = z.infer<
  typeof AuthoritativeSuggestionValuesSchema
>;

export const CaseSuggestionReferenceSchema = z
  .object({
    suggestionId: z.uuid(),
    category: CaseSuggestionCategorySchema,
    itemId: objectIdSchema,
    patientDataVersion: z.string().datetime({ offset: true }),
    candidateDataVersion: z.string().datetime({ offset: true }),
    generatedAt: z.string().datetime({ offset: true }),
  })
  .strict();

export type CaseSuggestionReference = z.infer<
  typeof CaseSuggestionReferenceSchema
>;

export const CaseItemSuggestionSchema = z
  .object({
    id: z.uuid(),
    category: CaseSuggestionCategorySchema,
    itemId: objectIdSchema,
    displayName: z.string().min(1),
    patientDataVersion: z.string().datetime({ offset: true }),
    candidateDataVersion: z.string().datetime({ offset: true }),
    generatedAt: z.string().datetime({ offset: true }),
    authoritativeValues: AuthoritativeSuggestionValuesSchema,
    warnings: z.array(z.string()),
  })
  .strict()
  .refine(
    (suggestion) =>
      suggestion.category === suggestion.authoritativeValues.category,
    { message: "Suggestion category must match authoritative values" },
  );

export type CaseItemSuggestion = z.infer<typeof CaseItemSuggestionSchema>;

export const CaseSuggestionsResponseSchema = z
  .object({
    status: z.enum(["success", "insufficient_information", "disabled"]),
    category: CaseSuggestionCategorySchema,
    patientDataVersion: z.string().datetime({ offset: true }),
    candidateDataVersion: z.string().datetime({ offset: true }),
    generatedAt: z.string().datetime({ offset: true }),
    missingInformation: z.array(z.string()),
    suggestions: z.array(CaseItemSuggestionSchema).max(MAX_CASE_SUGGESTIONS),
    warning: z.string(),
  })
  .strict();

export type CaseSuggestionsResponse = z.infer<
  typeof CaseSuggestionsResponseSchema
>;
