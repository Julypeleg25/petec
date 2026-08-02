import {
  MEDICINE_CATEGORY_TYPES,
  type CaseSuggestionCategory,
} from "@petec/shared";
import {
  ExaminationTypeModel,
  FoodExtraTypeModel,
  MedicineCategoryModel,
  MedicineModel,
  ProcedureTypeModel,
} from "../../models/lookups/index.js";

type MedicineSuggestionCategory = "medication" | "fluid";

const MEDICINE_SUGGESTION_CATEGORIES = new Set<MedicineSuggestionCategory>([
  "medication",
  "fluid",
]);

const OPTION_MODELS = {
  procedure: ProcedureTypeModel,
  diagnostic_test: ExaminationTypeModel,
  nutrition: FoodExtraTypeModel,
} as const;

type OptionSuggestionCategory = keyof typeof OPTION_MODELS;

const isMedicineCategory = (
  category: CaseSuggestionCategory,
): category is MedicineSuggestionCategory =>
  MEDICINE_SUGGESTION_CATEGORIES.has(
    category as MedicineSuggestionCategory,
  );

const isOptionCategory = (
  category: CaseSuggestionCategory,
): category is OptionSuggestionCategory => category in OPTION_MODELS;

const getMedicineCategoryTypes = (
  category: MedicineSuggestionCategory,
): readonly string[] =>
  category === "medication"
    ? [MEDICINE_CATEGORY_TYPES.MEDICINE]
    : [MEDICINE_CATEGORY_TYPES.FLUID, MEDICINE_CATEGORY_TYPES.FLUID_EXTRA];

const toVersion = (dates: readonly (Date | undefined)[]): string => {
  const latestTimestamp = Math.max(
    0,
    ...dates.map((date) => date?.getTime() ?? 0),
  );
  return new Date(latestTimestamp).toISOString();
};

const getLatestOptionUpdate = async (
  category: OptionSuggestionCategory,
): Promise<Date | undefined> => {
  const latestItem = await OPTION_MODELS[category]
    .findOne()
    .sort({ updatedAt: -1 })
    .select("updatedAt")
    .lean()
    .exec();
  return latestItem?.updatedAt;
};

export class CaseSuggestionCandidateDataRepository {
  async getVersion(category: CaseSuggestionCategory): Promise<string> {
    if (isOptionCategory(category)) {
      return toVersion([await getLatestOptionUpdate(category)]);
    }
    if (!isMedicineCategory(category)) {
      return toVersion([]);
    }

    const categoryFilter = {
      type: { $in: getMedicineCategoryTypes(category) },
    };
    const categoryIds = await MedicineCategoryModel.find({
      ...categoryFilter,
      isDeleted: { $ne: true },
    }).distinct("_id");
    const [latestMedicine, latestCategory] = await Promise.all([
      MedicineModel.findOne({ categoryId: { $in: categoryIds } })
        .sort({ updatedAt: -1 })
        .select("updatedAt")
        .lean()
        .exec(),
      MedicineCategoryModel.findOne(categoryFilter)
        .sort({ updatedAt: -1 })
        .select("updatedAt")
        .lean()
        .exec(),
    ]);

    return toVersion([latestMedicine?.updatedAt, latestCategory?.updatedAt]);
  }
}

export const caseSuggestionCandidateDataRepository =
  new CaseSuggestionCandidateDataRepository();
