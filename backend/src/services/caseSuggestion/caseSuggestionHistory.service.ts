import type { CaseSuggestionCategory } from "@petec/shared";
import { CaseModel } from "../../models/case/index.js";
import type {
  HistoricalSupport,
  PatientSuggestionContext,
} from "./caseSuggestion.types.js";

const CATEGORY_ITEM_PATHS: Readonly<
  Partial<Record<CaseSuggestionCategory, string>>
> = {
  medication: "caseDetailsGrid.medicines.medicineId",
  fluid: "caseDetailsGrid.fluids.medicineId",
  procedure: "caseDetailsGrid.procedures.typeId",
  diagnostic_test: "caseDetailsGrid.examinations.typeId",
  nutrition: "caseDetailsGrid.foodExtras.typeId",
};

const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getReasonSearchToken = (reason?: string): string | undefined =>
  reason
    ?.trim()
    .split(/\s+/)
    .find((token) => token.length >= 3);

export class CaseSuggestionHistoryService {
  async getSupport(
    category: CaseSuggestionCategory,
    context: PatientSuggestionContext,
    candidateIds: readonly string[],
  ): Promise<ReadonlyMap<string, HistoricalSupport>> {
    const itemPath = CATEGORY_ITEM_PATHS[category];
    if (!itemPath || candidateIds.length === 0) return new Map();

    const reasonToken = getReasonSearchToken(context.hospitalizationReason);
    const filter: Record<string, unknown> = {
      _id: { $ne: context.caseId },
      isDeleted: false,
      createdByUserId: { $exists: true },
      $or: [{ releaseDate: { $exists: true } }, { isArchived: true }],
      [itemPath]: { $in: candidateIds },
      ...(context.animalTypeId
        ? { "refs.animalTypeId": context.animalTypeId }
        : {}),
      ...(reasonToken
        ? {
            "admission.hospitalizationReason": new RegExp(
              escapeRegex(reasonToken),
              "i",
            ),
          }
        : {}),
    };
    const cases = await CaseModel.find(filter)
      .select(itemPath)
      .limit(250)
      .lean()
      .exec();

    const candidateIdSet = new Set(candidateIds);
    const counts = new Map<string, number>();
    for (const historicalCase of cases) {
      const rows = historicalCase.caseDetailsGrid ?? [];
      const caseItemIds = new Set<string>();
      for (const row of rows) {
        const items =
          category === "medication"
            ? row.medicines.map((item) => item.medicineId)
            : category === "fluid"
              ? row.fluids.map((item) => item.medicineId)
              : category === "procedure"
                ? row.procedures.map((item) => item.typeId)
                : category === "diagnostic_test"
                  ? row.examinations.map((item) => item.typeId)
                  : row.foodExtras.map((item) => item.typeId);
        for (const item of items) {
          const itemId = String(item);
          if (candidateIdSet.has(itemId)) caseItemIds.add(itemId);
        }
      }
      for (const itemId of caseItemIds) {
        counts.set(itemId, (counts.get(itemId) ?? 0) + 1);
      }
    }

    return new Map(
      candidateIds.map((candidateId) => {
        const similarCaseCount = counts.get(candidateId) ?? 0;
        return [
          candidateId,
          { similarCaseCount },
        ];
      }),
    );
  }
}

export const caseSuggestionHistoryService = new CaseSuggestionHistoryService();
