import type {
  CaseItemSuggestion,
  CaseSuggestionReference,
} from "@petec/shared";
import type { MedicineSelectOptionObj } from "../../../MedicinePicker/MedicinePicker.types";
import type { SelectOptionsPickerOptionObj } from "../../../SelectOptionsPicker/SelectOptionsPicker.types";

const toSuggestionReference = (
  suggestion: CaseItemSuggestion,
): CaseSuggestionReference => ({
  suggestionId: suggestion.id,
  category: suggestion.category,
  itemId: suggestion.itemId,
  patientDataVersion: suggestion.patientDataVersion,
  candidateDataVersion: suggestion.candidateDataVersion,
  generatedAt: suggestion.generatedAt,
});

export const toSuggestedMedicineOption = (
  suggestion: CaseItemSuggestion,
  catalogMedicines: readonly MedicineSelectOptionObj[],
): MedicineSelectOptionObj => {
  const catalogItem = catalogMedicines.find(
    (item) => String(item.value) === suggestion.itemId,
  );
  const values = suggestion.authoritativeValues;
  if (values.category !== "medication" && values.category !== "fluid") {
    throw new Error("Suggestion is not a medication or fluid");
  }

  return {
    ...(catalogItem ?? {
      value: suggestion.itemId,
      text: suggestion.displayName,
      measureUnitTypeId: "",
      measureUnitText: "",
      dosageFrequencyId: "",
      frequencyText: "",
      routeOfAdministrationId: "",
      medicineRouteText: "",
      comments: "",
    }),
    value: suggestion.itemId,
    text: suggestion.displayName,
    doseAmount: values.doseAmount,
    dosageText:
      values.category === "fluid"
        ? (values.rate ?? values.dosageText)
        : values.dosageText,
    measureUnitTypeId:
      values.measureUnitTypeId ?? catalogItem?.measureUnitTypeId ?? "",
    measureUnitText:
      values.measureUnitText ?? catalogItem?.measureUnitText ?? "",
    routeOfAdministrationId:
      values.routeOfAdministrationId ??
      catalogItem?.routeOfAdministrationId ??
      "",
    medicineRouteText: values.route ?? catalogItem?.medicineRouteText ?? "",
    dosageFrequencyId:
      values.dosageFrequencyId ?? catalogItem?.dosageFrequencyId ?? "",
    frequencyText: values.frequency ?? catalogItem?.frequencyText ?? "",
    suggestionReference: toSuggestionReference(suggestion),
  };
};

export const toSuggestedOption = (
  suggestion: CaseItemSuggestion,
): SelectOptionsPickerOptionObj => ({
  value: suggestion.itemId,
  text: suggestion.displayName,
  suggestionReference: toSuggestionReference(suggestion),
});
