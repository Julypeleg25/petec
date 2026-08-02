import type {
  CaseSuggestionCategory,
  CaseSuggestionReference,
  EditPatientDTO,
  Role,
} from "@petec/shared";
import {
  ConflictError,
  ForbiddenError,
} from "../../constants/error.constants.js";
import type { ICase } from "../../models/case/index.js";
import { caseSuggestionCandidateDataRepository } from "../../repositories/caseSuggestion/index.js";
import { userRepository } from "../../repositories/user/user.repository.js";
import { caseSuggestionContextService } from "./caseSuggestionContext.service.js";
import { getSuggestionCategoryDefinition } from "./caseSuggestion.registry.js";
import type { LoadedSuggestionCandidate } from "./caseSuggestion.types.js";
import { getSuggestionHandler } from "./handlers/index.js";

const STALE_MESSAGE =
  "נתוני המקרה או כללי המרפאה השתנו. יש לרענן את ההצעות ולבדוק מחדש את הפרטים.";

export class CaseSuggestionStaleError extends ConflictError {
  constructor() {
    super(STALE_MESSAGE);
  }
}

interface SubmittedSuggestionItem {
  readonly reference: CaseSuggestionReference;
  readonly itemId: string;
  readonly doseAmount?: number | string;
  readonly dosageText?: string;
  readonly measureUnitTypeId?: string;
  readonly dosageFrequencyId?: string;
  readonly routeOfAdministrationId?: string;
}

interface CandidateDataSnapshot {
  readonly candidateDataVersion: string;
  readonly candidates: readonly LoadedSuggestionCandidate[];
}

const areSubmittedItemsEquivalent = (
  left: SubmittedSuggestionItem,
  right: SubmittedSuggestionItem,
): boolean =>
  left.itemId === right.itemId &&
  left.reference.category === right.reference.category &&
  left.reference.itemId === right.reference.itemId &&
  left.reference.patientDataVersion === right.reference.patientDataVersion &&
  left.reference.candidateDataVersion ===
    right.reference.candidateDataVersion &&
  left.reference.generatedAt === right.reference.generatedAt &&
  left.doseAmount === right.doseAmount &&
  left.dosageText === right.dosageText &&
  left.measureUnitTypeId === right.measureUnitTypeId &&
  left.dosageFrequencyId === right.dosageFrequencyId &&
  left.routeOfAdministrationId === right.routeOfAdministrationId;

const collectSuggestionItems = (
  dto: EditPatientDTO,
): SubmittedSuggestionItem[] => {
  const uniqueItems = new Map<string, SubmittedSuggestionItem>();
  for (const row of dto.caseDetails?.flat() ?? []) {
    const collections = [
      ...row.medicines.map((item) => ({
        item,
        itemId: item.medicineId,
        expectedCategory: "medication" as const,
      })),
      ...row.fluids.map((item) => ({
        item,
        itemId: item.medicineId,
        expectedCategory: "fluid" as const,
      })),
      ...row.procedures.map((item) => ({
        item,
        itemId: item.typeId,
        expectedCategory: "procedure" as const,
      })),
      ...row.examinations.map((item) => ({
        item,
        itemId: item.typeId,
        expectedCategory: "diagnostic_test" as const,
      })),
      ...row.foodExtras.map((item) => ({
        item,
        itemId: item.typeId,
        expectedCategory: "nutrition" as const,
      })),
    ];
    for (const { item, itemId, expectedCategory } of collections) {
      const reference = item.suggestionReference;
      if (!reference) continue;
      if (
        reference.category !== expectedCategory ||
        reference.itemId !== itemId
      ) {
        throw new CaseSuggestionStaleError();
      }
      const submittedItem: SubmittedSuggestionItem = {
        reference,
        itemId,
        ...("doseAmount" in item && item.doseAmount !== undefined
          ? { doseAmount: item.doseAmount }
          : {}),
        ...("dosageText" in item && item.dosageText
          ? { dosageText: item.dosageText }
          : {}),
        ...("measureUnitTypeId" in item && item.measureUnitTypeId
          ? { measureUnitTypeId: item.measureUnitTypeId }
          : {}),
        ...("dosageFrequencyId" in item && item.dosageFrequencyId
          ? { dosageFrequencyId: item.dosageFrequencyId }
          : {}),
        ...("routeOfAdministrationId" in item && item.routeOfAdministrationId
          ? { routeOfAdministrationId: item.routeOfAdministrationId }
          : {}),
      };
      const existingItem = uniqueItems.get(reference.suggestionId);
      if (
        existingItem &&
        !areSubmittedItemsEquivalent(existingItem, submittedItem)
      ) {
        throw new CaseSuggestionStaleError();
      }
      uniqueItems.set(reference.suggestionId, submittedItem);
    }
  }
  return [...uniqueItems.values()];
};

const hasRelevantPatientChanges = (
  dto: EditPatientDTO,
  existingCase: ICase,
): boolean => {
  if (
    dto.patientSnapshot?.weightKg !== undefined &&
    dto.patientSnapshot.weightKg !== existingCase.patientSnapshot.weightKg
  ) {
    return true;
  }
  if (
    dto.refs?.animalTypeId !== undefined &&
    dto.refs.animalTypeId !== existingCase.refs.animalTypeId?.toString()
  ) {
    return true;
  }
  if (
    dto.admission?.hospitalizationReason !== undefined &&
    dto.admission.hospitalizationReason !==
      existingCase.admission.hospitalizationReason
  ) {
    return true;
  }
  if (
    dto.flags?.isAllergic !== undefined &&
    dto.flags.isAllergic !== existingCase.flags.isAllergic
  ) {
    return true;
  }
  if (
    dto.admission?.allergicComments !== undefined &&
    dto.admission.allergicComments !== existingCase.admission.allergicComments
  ) {
    return true;
  }
  return false;
};

const toComparableNumber = (
  value: number | string | undefined,
): number | undefined => {
  if (value === undefined || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const toComparableString = (value: string | undefined): string | undefined => {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
};

const hasMatchingMedicationFields = (
  submitted: SubmittedSuggestionItem,
  expected: {
    readonly doseAmount?: number;
    readonly dosageText?: string;
    readonly measureUnitTypeId?: string;
    readonly dosageFrequencyId?: string;
    readonly routeOfAdministrationId?: string;
  },
): boolean =>
  toComparableNumber(submitted.doseAmount) === expected.doseAmount &&
  toComparableString(submitted.dosageText) ===
    toComparableString(expected.dosageText) &&
  toComparableString(submitted.measureUnitTypeId) ===
    toComparableString(expected.measureUnitTypeId) &&
  toComparableString(submitted.dosageFrequencyId) ===
    toComparableString(expected.dosageFrequencyId) &&
  toComparableString(submitted.routeOfAdministrationId) ===
    toComparableString(expected.routeOfAdministrationId);

const assertSubmittedValuesMatch = (
  submitted: SubmittedSuggestionItem,
  values: Awaited<
    ReturnType<
      NonNullable<ReturnType<typeof getSuggestionHandler>>["calculateDetails"]
    >
  >,
): void => {
  if (values.category === "medication") {
    if (
      values.medicationId !== submitted.itemId ||
      !hasMatchingMedicationFields(submitted, values)
    ) {
      throw new CaseSuggestionStaleError();
    }
  } else if (values.category === "fluid") {
    if (
      values.fluidId !== submitted.itemId ||
      !hasMatchingMedicationFields(submitted, {
        ...values,
        dosageText: values.rate ?? values.dosageText,
      })
    ) {
      throw new CaseSuggestionStaleError();
    }
  } else {
    const authoritativeItemId =
      values.category === "procedure"
        ? values.procedureId
        : values.category === "diagnostic_test"
          ? values.testId
          : values.category === "nutrition"
            ? values.nutritionItemId
            : undefined;
    if (authoritativeItemId !== submitted.itemId) {
      throw new CaseSuggestionStaleError();
    }
  }
};

export class CaseSuggestionSaveValidationService {
  async validate(
    dto: EditPatientDTO,
    existingCase: ICase,
    patientId: string,
    userId: string,
  ): Promise<void> {
    const submittedItems = collectSuggestionItems(dto);
    if (submittedItems.length === 0) return;
    if (hasRelevantPatientChanges(dto, existingCase)) {
      throw new CaseSuggestionStaleError();
    }

    const user = await userRepository.findById(userId);
    if (!user) throw new ForbiddenError("User is not authorized");
    const role: Role = user.role;
    const context = await caseSuggestionContextService.build(patientId);
    const candidateDataByCategory = new Map<
      CaseSuggestionCategory,
      Promise<CandidateDataSnapshot>
    >();

    for (const submitted of submittedItems) {
      const category = submitted.reference.category;
      const definition = getSuggestionCategoryDefinition(category);
      if (!definition.enabled || !definition.allowedRoles.includes(role)) {
        throw new ForbiddenError("אין הרשאה לשמור הצעה עבור קטגוריה זו");
      }
      if (
        submitted.reference.patientDataVersion !== context.patientDataVersion
      ) {
        throw new CaseSuggestionStaleError();
      }

      const handler = getSuggestionHandler(category);
      if (!handler) throw new CaseSuggestionStaleError();
      let candidateDataPromise = candidateDataByCategory.get(category);
      if (!candidateDataPromise) {
        candidateDataPromise = Promise.all([
          caseSuggestionCandidateDataRepository.getVersion(category),
          handler.loadCandidates(),
        ]).then(([candidateDataVersion, candidates]) => ({
          candidateDataVersion,
          candidates,
        }));
        candidateDataByCategory.set(category, candidateDataPromise);
      }
      const { candidateDataVersion, candidates } = await candidateDataPromise;
      const candidate = candidates.find(
        (item) => item.itemId === submitted.itemId,
      );
      if (
        !candidate ||
        candidateDataVersion !== submitted.reference.candidateDataVersion
      ) {
        throw new CaseSuggestionStaleError();
      }

      const validation = await handler.validateCandidate(candidate, context);
      if (validation.blockingIssues.length > 0) {
        throw new CaseSuggestionStaleError();
      }
      const recalculatedValues = await handler.calculateDetails(
        candidate,
        context,
      );
      assertSubmittedValuesMatch(submitted, recalculatedValues);
    }
  }
}

export const caseSuggestionSaveValidationService =
  new CaseSuggestionSaveValidationService();
