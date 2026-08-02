import type {
  AuthoritativeSuggestionValues,
  CaseSuggestionCategory,
} from "@petec/shared";

export interface PatientSuggestionContext {
  readonly patientId: string;
  readonly caseId: string;
  readonly patientDataVersion: string;
  readonly animalTypeId?: string;
  readonly breedId?: string;
  readonly genderId?: string;
  readonly ageMonths?: number;
  readonly weightKg?: number;
  readonly hospitalizationReason?: string;
  readonly comments?: string;
  readonly allergyStatus: "present" | "absent" | "unknown";
  readonly allergyDetails?: string;
  readonly flags: Readonly<Record<string, boolean | undefined>>;
  readonly activeMedicationIds: ReadonlySet<string>;
  readonly activeFluidIds: ReadonlySet<string>;
  readonly activeProcedureIds: ReadonlySet<string>;
  readonly pendingDiagnosticTestIds: ReadonlySet<string>;
  readonly activeNutritionIds: ReadonlySet<string>;
  readonly latestVitals: {
    readonly temperature?: number;
    readonly pulse?: number;
    readonly respiration?: number;
  };
}

export interface HistoricalSupport {
  readonly similarCaseCount: number;
}

export interface CandidateValidationResult {
  readonly warnings: string[];
  readonly blockingIssues: string[];
  readonly missingInformation: string[];
}

export interface CaseSuggestionScore {
  readonly finalScore: number;
}

export interface LoadedSuggestionCandidate {
  readonly category: CaseSuggestionCategory;
  readonly itemId: string;
  readonly displayName: string;
  readonly authoritativeValues: AuthoritativeSuggestionValues;
  readonly sourceData: Readonly<Record<string, unknown>>;
}

export interface RankedSuggestionCandidate {
  readonly id: string;
  readonly candidate: LoadedSuggestionCandidate;
  readonly validation: CandidateValidationResult;
  readonly values: AuthoritativeSuggestionValues;
  readonly score: CaseSuggestionScore;
  readonly historicalSupport: HistoricalSupport;
}

export interface CategorySuggestionHandler {
  readonly category: CaseSuggestionCategory;
  loadCandidates(): Promise<LoadedSuggestionCandidate[]>;
  validateCandidate(
    candidate: LoadedSuggestionCandidate,
    context: PatientSuggestionContext,
  ): Promise<CandidateValidationResult>;
  calculateDetails(
    candidate: LoadedSuggestionCandidate,
    context: PatientSuggestionContext,
  ): Promise<AuthoritativeSuggestionValues>;
  rankCandidate(
    candidate: LoadedSuggestionCandidate,
    context: PatientSuggestionContext,
    validation: CandidateValidationResult,
    historicalSupport: HistoricalSupport,
  ): CaseSuggestionScore;
}
