import { randomUUID } from "node:crypto";
import {
  ForbiddenError,
  type CaseItemSuggestion,
  type CaseSuggestionCategory,
  type CaseSuggestionRequest,
  type CaseSuggestionsResponse,
  type Role,
} from "@petec/shared";
import { ENV } from "../../config/config.js";
import { logger } from "../../config/logger.js";
import { caseSuggestionCandidateDataRepository } from "../../repositories/caseSuggestion/index.js";
import { caseSuggestionContextService } from "./caseSuggestionContext.service.js";
import { caseSuggestionAiRankingService } from "./caseSuggestionAiRanking.service.js";
import { caseSuggestionHistoryService } from "./caseSuggestionHistory.service.js";
import { caseSuggestionRateLimitService } from "./caseSuggestionRateLimit.service.js";
import { getSuggestionHandler } from "./handlers/index.js";
import { getSuggestionCategoryDefinition } from "./caseSuggestion.registry.js";
import type {
  PatientSuggestionContext,
  RankedSuggestionCandidate,
} from "./caseSuggestion.types.js";

const MODULE = "case-suggestions";
const SAFE_USE_WARNING = "הערכים הוזנו כהצעה בלבד. יש לבדוק אותם לפני שמירה.";

const getMissingCandidateWarning = (
  categoryDisplayName: string,
): string =>
  `לא נמצאו פריטי ${categoryDisplayName} פעילים ומתאימים ברשימות המרפאה.`;

const toSuggestion = (
  ranked: RankedSuggestionCandidate,
  patientDataVersion: string,
  candidateDataVersion: string,
  generatedAt: string,
): CaseItemSuggestion => ({
  id: ranked.id,
  category: ranked.candidate.category,
  itemId: ranked.candidate.itemId,
  displayName: ranked.candidate.displayName,
  patientDataVersion,
  candidateDataVersion,
  generatedAt,
  authoritativeValues: ranked.values,
  warnings: ranked.validation.warnings,
});

export class CaseSuggestionService {
  async generate(
    patientId: string,
    category: CaseSuggestionCategory,
    _request: CaseSuggestionRequest,
    user: { userId: string; role: Role },
  ): Promise<CaseSuggestionsResponse> {
    return caseSuggestionRateLimitService.run(
      user.userId,
      patientId,
      category,
      async () => this.generateWithoutRateLimit(patientId, category, user),
    );
  }

  private async generateWithoutRateLimit(
    patientId: string,
    category: CaseSuggestionCategory,
    user: { userId: string; role: Role },
  ): Promise<CaseSuggestionsResponse> {
    const definition = getSuggestionCategoryDefinition(category);
    if (!definition.allowedRoles.includes(user.role)) {
      throw new ForbiddenError("אין הרשאה לצפות בהצעות עבור קטגוריה זו");
    }

    const [context, candidateDataVersion] = await Promise.all([
      caseSuggestionContextService.build(patientId),
      caseSuggestionCandidateDataRepository.getVersion(category),
    ]);
    const generatedAt = new Date().toISOString();
    if (!ENV.aiCaseSuggestionsEnabled || !definition.enabled) {
      return {
        status: "disabled",
        category,
        patientDataVersion: context.patientDataVersion,
        candidateDataVersion,
        generatedAt,
        missingInformation: [],
        suggestions: [],
        warning:
          "מערכת ההצעות אינה פעילה עבור קטגוריה זו. ניתן להמשיך בהזנה ידנית.",
      };
    }

    const handler = getSuggestionHandler(category);
    if (!handler) {
      return {
        status: "disabled",
        category,
        patientDataVersion: context.patientDataVersion,
        candidateDataVersion,
        generatedAt,
        missingInformation: [],
        suggestions: [],
        warning:
          "לא הוגדר מנגנון הצעות עבור קטגוריה זו. ניתן להמשיך בהזנה ידנית.",
      };
    }

    const loadedCandidates = await handler.loadCandidates();
    if (loadedCandidates.length === 0) {
      logger.warn("No eligible case suggestion candidates were found", {
        module: MODULE,
        event: "case_suggestion_candidate_pool_empty",
        category,
        patient_id: patientId,
      });
      return {
        status: "insufficient_information",
        category,
        patientDataVersion: context.patientDataVersion,
        candidateDataVersion,
        generatedAt,
        missingInformation: [],
        suggestions: [],
        warning: getMissingCandidateWarning(definition.displayName),
      };
    }
    const historicalSupport = await caseSuggestionHistoryService.getSupport(
      category,
      context,
      loadedCandidates.map((candidate) => candidate.itemId),
    );
    const rankedCandidates: RankedSuggestionCandidate[] = [];
    const missingInformation = new Set<string>();

    for (const candidate of loadedCandidates) {
      try {
        const validation = await handler.validateCandidate(candidate, context);
        validation.missingInformation.forEach((field) =>
          missingInformation.add(field),
        );
        if (validation.blockingIssues.length > 0) continue;

        const values = await handler.calculateDetails(candidate, context);
        const support = historicalSupport.get(candidate.itemId) ?? {
          similarCaseCount: 0,
        };
        if (support.similarCaseCount === 0) {
          continue;
        }
        rankedCandidates.push({
          id: randomUUID(),
          candidate,
          validation,
          values,
          score: handler.rankCandidate(candidate, context, validation, support),
          historicalSupport: support,
        });
      } catch (error) {
        logger.error("Case suggestion candidate was rejected", {
          module: MODULE,
          event: "case_suggestion_candidate_rejected",
          category,
          candidate_item_id: candidate.itemId,
          error,
        });
      }
    }

    const aiRankings = await caseSuggestionAiRankingService.rank(
      context,
      rankedCandidates.map((rankedCandidate) => ({
        candidate: rankedCandidate.candidate,
        similarCaseCount: rankedCandidate.historicalSupport.similarCaseCount,
        deterministicScore: rankedCandidate.score.finalScore,
      })),
    );
    const selectedCandidates = rankedCandidates
      .sort((left, right) => {
        if (aiRankings) {
          const aiScoreDifference =
            (aiRankings.get(right.candidate.itemId) ?? -1) -
            (aiRankings.get(left.candidate.itemId) ?? -1);
          if (aiScoreDifference !== 0) return aiScoreDifference;
        }
        return right.score.finalScore - left.score.finalScore;
      })
      .slice(0, definition.maximumSuggestions);
    const suggestions = selectedCandidates.map((candidate) =>
      toSuggestion(
        candidate,
        context.patientDataVersion,
        candidateDataVersion,
        generatedAt,
      ),
    );
    logger.info("Case suggestions generated", {
      module: MODULE,
      event: "case_suggestions_generated",
      user_id: user.userId,
      patient_id: patientId,
      category,
      eligible_candidate_count: loadedCandidates.length,
      suggestion_count: suggestions.length,
    });

    return {
      status: suggestions.length > 0 ? "success" : "insufficient_information",
      category,
      patientDataVersion: context.patientDataVersion,
      candidateDataVersion,
      generatedAt,
      missingInformation: [...missingInformation],
      suggestions,
      warning:
        suggestions.length > 0
          ? SAFE_USE_WARNING
          : "לא ניתן להציג הצעות על סמך המידע הקיים.",
    };
  }
}

export const caseSuggestionService = new CaseSuggestionService();
