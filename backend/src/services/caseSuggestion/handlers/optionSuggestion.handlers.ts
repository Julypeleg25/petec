import type { AuthoritativeSuggestionValues } from "@petec/shared";
import { systemTypesRepository } from "../../../repositories/admin/systemTypes.repository.js";
import { getSuggestionCategoryDefinition } from "../caseSuggestion.registry.js";
import type {
  CandidateValidationResult,
  LoadedSuggestionCandidate,
  PatientSuggestionContext,
} from "../caseSuggestion.types.js";
import {
  BaseSuggestionHandler,
  mergeValidationResults,
} from "./baseSuggestion.handler.js";

abstract class OptionSuggestionHandler extends BaseSuggestionHandler {
  abstract override readonly category:
    | "procedure"
    | "diagnostic_test"
    | "nutrition";

  protected abstract getExistingItems(
    context: PatientSuggestionContext,
  ): ReadonlySet<string>;

  protected abstract duplicateMessage: string;

  private getAuthoritativeValues(itemId: string): AuthoritativeSuggestionValues {
    switch (this.category) {
      case "procedure":
        return { category: this.category, procedureId: itemId };
      case "diagnostic_test":
        return { category: this.category, testId: itemId };
      case "nutrition":
        return { category: this.category, nutritionItemId: itemId };
    }
  }

  override async loadCandidates(): Promise<LoadedSuggestionCandidate[]> {
    const sourceCollection = getSuggestionCategoryDefinition(
      this.category,
    ).sourceCollection;
    if (!sourceCollection) return [];

    const sourceItems = await systemTypesRepository
      .getModel(sourceCollection)
      .find({ isDeleted: { $ne: true } })
      .sort({ name: 1 })
      .lean()
      .exec();

    return sourceItems.map((sourceItem) => {
      const itemId = sourceItem._id.toString();
      return {
        category: this.category,
        itemId,
        displayName: sourceItem.name,
        authoritativeValues: this.getAuthoritativeValues(itemId),
        sourceData: { _id: itemId, name: sourceItem.name },
      };
    });
  }

  override async validateCandidate(
    candidate: LoadedSuggestionCandidate,
    context: PatientSuggestionContext,
  ): Promise<CandidateValidationResult> {
    const base = await super.validateCandidate(candidate, context);
    return mergeValidationResults(base, {
      blockingIssues: this.getExistingItems(context).has(candidate.itemId)
        ? [this.duplicateMessage]
        : [],
    });
  }

  override async calculateDetails(
    candidate: LoadedSuggestionCandidate,
    context: PatientSuggestionContext,
  ): Promise<AuthoritativeSuggestionValues> {
    const values = await super.calculateDetails(candidate, context);
    const authoritativeItemId =
      values.category === "procedure"
        ? values.procedureId
        : values.category === "diagnostic_test"
          ? values.testId
          : values.category === "nutrition"
            ? values.nutritionItemId
            : undefined;
    if (authoritativeItemId !== candidate.itemId) {
      throw new Error("Suggestion candidate item ID mismatch");
    }
    return values;
  }
}

export class ProcedureSuggestionHandler extends OptionSuggestionHandler {
  readonly category = "procedure" as const;
  protected readonly duplicateMessage =
    "הפרוצדורה כבר קיימת בתוכנית הפעילה";

  protected getExistingItems(
    context: PatientSuggestionContext,
  ): ReadonlySet<string> {
    return context.activeProcedureIds;
  }
}

export class DiagnosticTestSuggestionHandler extends OptionSuggestionHandler {
  readonly category = "diagnostic_test" as const;
  protected readonly duplicateMessage = "הבדיקה כבר ממתינה לתוצאה";

  protected getExistingItems(
    context: PatientSuggestionContext,
  ): ReadonlySet<string> {
    return context.pendingDiagnosticTestIds;
  }
}

export class NutritionSuggestionHandler extends OptionSuggestionHandler {
  readonly category = "nutrition" as const;
  protected readonly duplicateMessage =
    "פריט התזונה כבר קיים בתוכנית הפעילה";

  protected getExistingItems(
    context: PatientSuggestionContext,
  ): ReadonlySet<string> {
    return context.activeNutritionIds;
  }
}
