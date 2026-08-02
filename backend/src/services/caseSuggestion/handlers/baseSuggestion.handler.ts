import {
  AuthoritativeSuggestionValuesSchema,
  type AuthoritativeSuggestionValues,
  type CaseSuggestionCategory,
} from "@petec/shared";
import { getSuggestionCategoryDefinition } from "../caseSuggestion.registry.js";
import type {
  CandidateValidationResult,
  CaseSuggestionScore,
  CategorySuggestionHandler,
  HistoricalSupport,
  LoadedSuggestionCandidate,
  PatientSuggestionContext,
} from "../caseSuggestion.types.js";

const getContextField = (
  context: PatientSuggestionContext,
  field: string,
): unknown => {
  const knownFields: Readonly<Record<string, unknown>> = {
    animalTypeId: context.animalTypeId,
    breedId: context.breedId,
    genderId: context.genderId,
    ageMonths: context.ageMonths,
    weightKg: context.weightKg,
    hospitalizationReason: context.hospitalizationReason,
    allergies:
      context.allergyStatus === "unknown" ? undefined : context.allergyStatus,
    allergyDetails: context.allergyDetails,
    vitalSigns:
      Object.keys(context.latestVitals).length > 0
        ? context.latestVitals
        : undefined,
  };
  return knownFields[field];
};

const isMissing = (value: unknown): boolean =>
  value === undefined || value === null || value === "";

export abstract class BaseSuggestionHandler implements CategorySuggestionHandler {
  abstract readonly category: CaseSuggestionCategory;

  abstract loadCandidates(): Promise<LoadedSuggestionCandidate[]>;

  async validateCandidate(
    _candidate: LoadedSuggestionCandidate,
    context: PatientSuggestionContext,
  ): Promise<CandidateValidationResult> {
    const missingInformation: string[] = [];
    for (const field of getSuggestionCategoryDefinition(this.category)
      .requiredPatientFields) {
      if (isMissing(getContextField(context, field))) {
        missingInformation.push(field);
      }
    }

    return {
      warnings: [],
      blockingIssues: missingInformation.map(
        (field) => `חסר מידע נדרש: ${field}`,
      ),
      missingInformation,
    };
  }

  async calculateDetails(
    candidate: LoadedSuggestionCandidate,
    _context: PatientSuggestionContext,
  ): Promise<AuthoritativeSuggestionValues> {
    const values = AuthoritativeSuggestionValuesSchema.parse(
      candidate.authoritativeValues,
    );
    if (values.category !== this.category) {
      throw new Error("Suggestion candidate category mismatch");
    }
    return values;
  }

  rankCandidate(
    _candidate: LoadedSuggestionCandidate,
    _context: PatientSuggestionContext,
    validation: CandidateValidationResult,
    historicalSupport: HistoricalSupport,
  ): CaseSuggestionScore {
    const historicalScore = Math.min(
      historicalSupport.similarCaseCount * 2,
      20,
    );
    const safetyPenalty = validation.warnings.length * 5;
    const missingInformationPenalty = validation.missingInformation.length * 10;

    return {
      finalScore:
        historicalScore - safetyPenalty - missingInformationPenalty,
    };
  }
}

export const mergeValidationResults = (
  base: CandidateValidationResult,
  additional: Partial<CandidateValidationResult>,
): CandidateValidationResult => ({
  warnings: [...base.warnings, ...(additional.warnings ?? [])],
  blockingIssues: [
    ...base.blockingIssues,
    ...(additional.blockingIssues ?? []),
  ],
  missingInformation: [
    ...base.missingInformation,
    ...(additional.missingInformation ?? []),
  ],
});
