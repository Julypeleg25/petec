import type { AuthoritativeSuggestionValues } from "@petec/shared";
import {
  DosageFrequencyModel,
  MedicineCategoryModel,
  MedicineModel,
  MeasureUnitTypeModel,
  RouteOfAdministrationModel,
  type IMedicine,
} from "../../../models/lookups/index.js";
import type { LoadedSuggestionCandidate } from "../caseSuggestion.types.js";

type MedicineSuggestionCategory = "medication" | "fluid";

interface ExistingMedicineSource extends IMedicine {
  readonly dosageText?: string;
  readonly measureUnitText?: string;
  readonly frequencyText?: string;
  readonly routeText?: string;
}

const optionalText = (
  value: string | undefined,
  key: string,
): Record<string, string> => (value ? { [key]: value } : {});

const getExistingDosageText = (
  medicine: ExistingMedicineSource,
): string | undefined => {
  const unit = medicine.measureUnitText ? ` ${medicine.measureUnitText}` : "";
  if (medicine.rangeMin !== undefined && medicine.rangeMax !== undefined) {
    return `${medicine.rangeMin}-${medicine.rangeMax}${unit} לק״ג`;
  }
  return medicine.totalDose !== undefined
    ? `${medicine.totalDose}${unit}`
    : undefined;
};

const getActiveMedicineCategoryIds = async (
  allowedTypes: ReadonlySet<string>,
): Promise<readonly string[]> => {
  const categories = await MedicineCategoryModel.find({
    type: { $in: [...allowedTypes] },
    isDeleted: { $ne: true },
  })
    .select("_id")
    .lean()
    .exec();
  return categories.map((category) => String(category._id));
};

const getExistingAuthoritativeValues = (
  category: MedicineSuggestionCategory,
  medicine: ExistingMedicineSource,
): AuthoritativeSuggestionValues => {
  const sharedValues = {
    ...(medicine.measureUnitTypeId
      ? { measureUnitTypeId: medicine.measureUnitTypeId.toString() }
      : {}),
    ...(medicine.routeOfAdministrationId
      ? {
          routeOfAdministrationId: medicine.routeOfAdministrationId.toString(),
        }
      : {}),
    ...(medicine.dosageFrequencyId
      ? { dosageFrequencyId: medicine.dosageFrequencyId.toString() }
      : {}),
    ...optionalText(medicine.measureUnitText, "measureUnitText"),
    ...optionalText(medicine.routeText, "route"),
    ...optionalText(medicine.frequencyText, "frequency"),
    ...optionalText(getExistingDosageText(medicine), "dosageText"),
  };

  return category === "medication"
    ? {
        category,
        medicationId: medicine._id.toString(),
        ...sharedValues,
      }
    : {
        category,
        fluidId: medicine._id.toString(),
        ...sharedValues,
      };
};

export const loadExistingMedicineCandidates = async (
  category: MedicineSuggestionCategory,
  allowedMedicineCategoryTypes: ReadonlySet<string>,
): Promise<LoadedSuggestionCandidate[]> => {
  const categoryIds = await getActiveMedicineCategoryIds(
    allowedMedicineCategoryTypes,
  );
  if (categoryIds.length === 0) return [];

  const [medicines, routes, frequencies, measureUnits] = await Promise.all([
    MedicineModel.find({
      categoryId: { $in: categoryIds },
      isDeleted: { $ne: true },
    })
      .sort({ name: 1 })
      .lean()
      .exec(),
    RouteOfAdministrationModel.find({ isDeleted: { $ne: true } })
      .select("_id name")
      .lean()
      .exec(),
    DosageFrequencyModel.find({ isDeleted: { $ne: true } })
      .select("_id name")
      .lean()
      .exec(),
    MeasureUnitTypeModel.find({ isDeleted: { $ne: true } })
      .select("_id name")
      .lean()
      .exec(),
  ]);
  const routeNames = new Map(
    routes.map((item) => [item._id.toString(), item.name]),
  );
  const frequencyNames = new Map(
    frequencies.map((item) => [item._id.toString(), item.name]),
  );
  const measureUnitNames = new Map(
    measureUnits.map((item) => [item._id.toString(), item.name]),
  );
  return medicines.map((medicine) => {
    const source: ExistingMedicineSource = {
      ...medicine,
      ...(medicine.routeOfAdministrationId
        ? {
            routeText: routeNames.get(
              medicine.routeOfAdministrationId.toString(),
            ),
          }
        : {}),
      ...(medicine.dosageFrequencyId
        ? {
            frequencyText: frequencyNames.get(
              medicine.dosageFrequencyId.toString(),
            ),
          }
        : {}),
      ...(medicine.measureUnitTypeId
        ? {
            measureUnitText: measureUnitNames.get(
              medicine.measureUnitTypeId.toString(),
            ),
          }
        : {}),
    };
    const enrichedSource: ExistingMedicineSource = {
      ...source,
      ...optionalText(getExistingDosageText(source), "dosageText"),
    };
    const itemId = medicine._id.toString();

    return {
      category,
      itemId,
      displayName: medicine.name,
      authoritativeValues: getExistingAuthoritativeValues(
        category,
        enrichedSource,
      ),
      sourceData: { ...enrichedSource },
    };
  });
};
