import { Types, type ClientSession } from "mongoose";
import { MedicineModel, type IMedicine } from "../../../models/lookups/index.js";
import type {
  ICase,
  ICaseDetailsMedicineObj,
  ICaseDetailsRow,
} from "../../../models/case/index.js";

type CaseGridRowsInput = ReadonlyArray<Partial<ICaseDetailsRow>>;
type MedicineRecommendation = Pick<
  IMedicine,
  "_id" | "rangeMin" | "rangeMax" | "totalDose"
>;

const toComparableWeight = (
  value?: ICase["patientSnapshot"]["weightKg"] | null,
): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const toMedicineIdString = (
  medicineId?: ICaseDetailsMedicineObj["medicineId"],
): string | null => {
  if (!medicineId) {
    return null;
  }

  if (medicineId instanceof Types.ObjectId) {
    return medicineId.toString();
  }

  if (typeof medicineId === "object" && "_id" in medicineId) {
    const nestedId = medicineId._id;
    if (nestedId instanceof Types.ObjectId) {
      return nestedId.toString();
    }
    if (nestedId) {
      return String(nestedId);
    }
  }

  return String(medicineId);
};

const resolveDoseAmountFromRecommendation = (
  recommendation: MedicineRecommendation | undefined,
  weightKg: number | null,
  currentDoseAmount?: ICaseDetailsMedicineObj["doseAmount"],
): ICaseDetailsMedicineObj["doseAmount"] => {
  if (!recommendation) {
    return currentDoseAmount;
  }

  if (
    weightKg !== null &&
    typeof recommendation.rangeMin === "number" &&
    typeof recommendation.rangeMax === "number"
  ) {
    const dosePerKg =
      recommendation.rangeMin === recommendation.rangeMax
        ? recommendation.rangeMax
        : (recommendation.rangeMin + recommendation.rangeMax) / 2;

    return Number.parseFloat((dosePerKg * weightKg).toFixed(2));
  }

  if (typeof recommendation.totalDose === "number") {
    return recommendation.totalDose;
  }

  return currentDoseAmount;
};

const recalculateMedicineCollection = (
  collection: ReadonlyArray<ICaseDetailsMedicineObj> | undefined,
  recommendationsById: ReadonlyMap<string, MedicineRecommendation>,
  weightKg: number | null,
): ICaseDetailsMedicineObj[] =>
  (collection ?? []).map((item) => {
    const medicineId = toMedicineIdString(item.medicineId);
    const recommendation =
      medicineId === null ? undefined : recommendationsById.get(medicineId);

    return {
      ...item,
      doseAmount: resolveDoseAmountFromRecommendation(
        recommendation,
        weightKg,
        item.doseAmount,
      ),
    };
  });

export const hasCaseWeightChanged = (
  currentWeight?: ICase["patientSnapshot"]["weightKg"] | null,
  nextWeight?: ICase["patientSnapshot"]["weightKg"] | null,
): boolean => toComparableWeight(currentWeight) !== toComparableWeight(nextWeight);

export const recalculateCaseGridMedicationDoses = async (
  rows: CaseGridRowsInput,
  weightKg?: ICase["patientSnapshot"]["weightKg"] | null,
  session?: ClientSession,
): Promise<Partial<ICaseDetailsRow>[]> => {
  const weightForCalculation = toComparableWeight(weightKg);
  const medicineIds = new Set<string>();

  for (const row of rows) {
    for (const item of [...(row.fluids ?? []), ...(row.medicines ?? [])]) {
      const medicineId = toMedicineIdString(item.medicineId);
      if (medicineId && Types.ObjectId.isValid(medicineId)) {
        medicineIds.add(medicineId);
      }
    }
  }

  if (medicineIds.size === 0) {
    return rows.map((row) => ({ ...row }));
  }

  const recommendations = (await MedicineModel.find(
    {
      _id: { $in: Array.from(medicineIds, (id) => new Types.ObjectId(id)) },
      isDeleted: { $ne: true },
    },
    "_id rangeMin rangeMax totalDose",
    { session },
  )
    .lean()
    .exec()) as MedicineRecommendation[];

  const recommendationsById = new Map(
    recommendations.map((recommendation) => [
      recommendation._id.toString(),
      recommendation,
    ]),
  );

  return rows.map((row) => ({
    ...row,
    fluids: recalculateMedicineCollection(
      row.fluids,
      recommendationsById,
      weightForCalculation,
    ),
    medicines: recalculateMedicineCollection(
      row.medicines,
      recommendationsById,
      weightForCalculation,
    ),
  }));
};
