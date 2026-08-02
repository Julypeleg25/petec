import type { CaseSuggestionCategory } from "@petec/shared";
import type { CategorySuggestionHandler } from "../caseSuggestion.types.js";
import {
  FluidSuggestionHandler,
  MedicationSuggestionHandler,
} from "./medicineSuggestion.handlers.js";
import {
  DiagnosticTestSuggestionHandler,
  NutritionSuggestionHandler,
  ProcedureSuggestionHandler,
} from "./optionSuggestion.handlers.js";

const handlers: readonly CategorySuggestionHandler[] = [
  new MedicationSuggestionHandler(),
  new FluidSuggestionHandler(),
  new ProcedureSuggestionHandler(),
  new DiagnosticTestSuggestionHandler(),
  new NutritionSuggestionHandler(),
];

export const suggestionHandlers: ReadonlyMap<
  CaseSuggestionCategory,
  CategorySuggestionHandler
> = new Map(handlers.map((handler) => [handler.category, handler]));

export const getSuggestionHandler = (
  category: CaseSuggestionCategory,
): CategorySuggestionHandler | undefined => suggestionHandlers.get(category);

export {
  DiagnosticTestSuggestionHandler,
  FluidSuggestionHandler,
  MedicationSuggestionHandler,
  NutritionSuggestionHandler,
  ProcedureSuggestionHandler,
};
