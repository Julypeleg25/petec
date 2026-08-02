import {
  MEDICINE_CATEGORY_TYPES,
  type AuthoritativeSuggestionValues,
} from "@petec/shared";
import type {
  CandidateValidationResult,
  LoadedSuggestionCandidate,
  PatientSuggestionContext,
} from "../caseSuggestion.types.js";
import {
  BaseSuggestionHandler,
  mergeValidationResults,
} from "./baseSuggestion.handler.js";
import { loadExistingMedicineCandidates } from "./medicineSuggestion.candidates.js";

const toId = (value: unknown): string | undefined => {
  if (!value) return undefined;
  if (typeof value === "object" && "_id" in value) {
    return String((value as { _id: unknown })._id);
  }
  return String(value);
};

const toNumber = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

const toText = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() !== "" ? value : undefined;

const isNonNegative = (value: number | undefined): boolean =>
  value === undefined || value >= 0;

interface SharedMedicineSuggestionValues {
  readonly dosageText?: string;
  readonly measureUnitTypeId?: string;
  readonly measureUnitText?: string;
  readonly routeOfAdministrationId?: string;
  readonly route?: string;
  readonly dosageFrequencyId?: string;
  readonly frequency?: string;
}

const resolveSharedMedicineValues = (
  values: SharedMedicineSuggestionValues,
  sourceData: Readonly<Record<string, unknown>>,
): SharedMedicineSuggestionValues => {
  const resolved = {
    dosageText: values.dosageText ?? toText(sourceData.dosageText),
    measureUnitTypeId:
      values.measureUnitTypeId ?? toId(sourceData.measureUnitTypeId),
    measureUnitText:
      values.measureUnitText ?? toText(sourceData.measureUnitText),
    routeOfAdministrationId:
      values.routeOfAdministrationId ??
      toId(sourceData.routeOfAdministrationId),
    route: values.route ?? toText(sourceData.routeText),
    dosageFrequencyId:
      values.dosageFrequencyId ?? toId(sourceData.dosageFrequencyId),
    frequency: values.frequency ?? toText(sourceData.frequencyText),
  };

  return Object.fromEntries(
    Object.entries(resolved).filter(([, value]) => value !== undefined),
  );
};

const hasValidRange = (
  minimum: number | undefined,
  maximum: number | undefined,
): boolean =>
  minimum !== undefined &&
  maximum !== undefined &&
  minimum >= 0 &&
  maximum >= minimum;

const getRangeMidpoint = (
  minimum: number | undefined,
  maximum: number | undefined,
): number | undefined => {
  if (
    minimum === undefined ||
    maximum === undefined ||
    !hasValidRange(minimum, maximum)
  ) {
    return undefined;
  }
  return (minimum + maximum) / 2;
};

abstract class MedicineLikeSuggestionHandler extends BaseSuggestionHandler {
  abstract override readonly category: "medication" | "fluid";

  protected abstract readonly allowedMedicineCategoryTypes: ReadonlySet<string>;

  override loadCandidates(): Promise<LoadedSuggestionCandidate[]> {
    return loadExistingMedicineCandidates(
      this.category,
      this.allowedMedicineCategoryTypes,
    );
  }

  override async validateCandidate(
    candidate: LoadedSuggestionCandidate,
    context: PatientSuggestionContext,
  ): Promise<CandidateValidationResult> {
    const base = await super.validateCandidate(candidate, context);
    const blockingIssues: string[] = [];
    const missingInformation: string[] = [];
    const warnings: string[] = [];
    const activeItems =
      this.category === "medication"
        ? context.activeMedicationIds
        : context.activeFluidIds;

    if (activeItems.has(candidate.itemId)) {
      blockingIssues.push("הפריט כבר קיים בתוכנית הפעילה");
    }

    if (context.allergyStatus === "present") {
      if (!context.allergyDetails?.trim()) {
        missingInformation.push("allergyDetails");
        blockingIssues.push("סומנה אלרגיה ללא פירוט שמאפשר בדיקת התאמה");
      } else {
        warnings.push("מתועדת אלרגיה. יש לאמת התאמה לפני שמירה");
      }
    }

    const values = candidate.authoritativeValues;
    if (values.category === this.category) {
      if (!values.routeOfAdministrationId) {
        blockingIssues.push("לא הוגדרה דרך מתן");
      }
      if (this.category === "medication" && !values.dosageFrequencyId) {
        blockingIssues.push("לא הוגדרה תדירות מתן");
      }
    }

    const minimum = toNumber(candidate.sourceData.rangeMin);
    const maximum = toNumber(candidate.sourceData.rangeMax);
    const fixedAmount = toNumber(candidate.sourceData.totalDose);
    const rangeIsPresent = minimum !== undefined || maximum !== undefined;
    const rangeIsValid = hasValidRange(minimum, maximum);

    if (
      (rangeIsPresent && !rangeIsValid) ||
      !isNonNegative(fixedAmount)
    ) {
      blockingIssues.push("נתוני החישוב של הפריט אינם תקינים");
    } else if (!rangeIsValid && fixedAmount === undefined) {
      blockingIssues.push(
        this.category === "medication"
          ? "לא הוגדרו נתונים לחישוב כמות התרופה"
          : "לא הוגדרו נתונים לחישוב כמות הנוזלים",
      );
    }

    if (rangeIsValid && context.weightKg === undefined) {
      missingInformation.push("weightKg");
      blockingIssues.push("נדרש משקל עדכני לצורך החישוב");
    }

    if (this.category === "fluid" && context.flags.isHeartMurmur === true) {
      warnings.push("מתועד רשרוש לב. יש לבדוק את תוכנית הנוזלים לפני שמירה");
    }

    return mergeValidationResults(base, {
      blockingIssues,
      missingInformation,
      warnings,
    });
  }

  protected calculateDoseAmount(
    candidate: LoadedSuggestionCandidate,
    context: PatientSuggestionContext,
  ): number | undefined {
    const fixedAmount = toNumber(candidate.sourceData.totalDose);
    const minimum = toNumber(candidate.sourceData.rangeMin);
    const maximum = toNumber(candidate.sourceData.rangeMax);
    const midpoint = getRangeMidpoint(minimum, maximum);
    const calculatedAmount =
      context.weightKg !== undefined && midpoint !== undefined
        ? midpoint * context.weightKg
        : fixedAmount;

    return calculatedAmount === undefined
      ? undefined
      : Number(calculatedAmount.toFixed(2));
  }
}

export class MedicationSuggestionHandler extends MedicineLikeSuggestionHandler {
  readonly category = "medication" as const;
  protected readonly allowedMedicineCategoryTypes = new Set([
    MEDICINE_CATEGORY_TYPES.MEDICINE,
  ]);

  override async calculateDetails(
    candidate: LoadedSuggestionCandidate,
    context: PatientSuggestionContext,
  ): Promise<AuthoritativeSuggestionValues> {
    const base = await super.calculateDetails(candidate, context);
    if (base.category !== "medication" || base.medicationId !== candidate.itemId) {
      throw new Error("Medication candidate values are invalid");
    }
    const doseAmount = this.calculateDoseAmount(candidate, context);

    return {
      ...base,
      ...(doseAmount !== undefined ? { doseAmount } : {}),
      ...resolveSharedMedicineValues(base, candidate.sourceData),
    };
  }
}

export class FluidSuggestionHandler extends MedicineLikeSuggestionHandler {
  readonly category = "fluid" as const;
  protected readonly allowedMedicineCategoryTypes = new Set([
    MEDICINE_CATEGORY_TYPES.FLUID,
    MEDICINE_CATEGORY_TYPES.FLUID_EXTRA,
  ]);

  override async calculateDetails(
    candidate: LoadedSuggestionCandidate,
    context: PatientSuggestionContext,
  ): Promise<AuthoritativeSuggestionValues> {
    const base = await super.calculateDetails(candidate, context);
    if (base.category !== "fluid" || base.fluidId !== candidate.itemId) {
      throw new Error("Fluid candidate values are invalid");
    }
    const doseAmount = this.calculateDoseAmount(candidate, context);

    return {
      ...base,
      ...(doseAmount !== undefined ? { doseAmount } : {}),
      ...resolveSharedMedicineValues(base, candidate.sourceData),
    };
  }
}
